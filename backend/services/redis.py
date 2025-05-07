import redis.asyncio as redis
import os
from dotenv import load_dotenv
import asyncio
import certifi
import ssl
from utils.logger import logger
from utils.config import config
import random
from functools import wraps
from typing import List, Any

# Redis client
client = None
REDIS_KEY_TTL = 3600 * 24  # 24 hour TTL as safety mechanism
_initialized = False
_init_lock = asyncio.Lock()

# Retry configuration
MAX_RETRIES = 5
BASE_RETRY_DELAY = 0.5  # Start with 500ms delay
MAX_RETRY_DELAY = 10.0  # Maximum delay of 10 seconds
RETRY_JITTER = 0.1  # Add 10% random jitter to retry delay

async def with_retry(func, *args, **kwargs):
    """Execute a Redis operation with exponential backoff retry."""
    retries = 0
    last_exception = None
    func_name = getattr(func, "__name__", str(func))
    
    while retries < MAX_RETRIES:
        try:
            return await func(*args, **kwargs)
        except (redis.ConnectionError, redis.TimeoutError, ConnectionResetError) as e:
            retries += 1
            last_exception = e
            
            if retries >= MAX_RETRIES:
                logger.error(f"Redis operation {func_name} failed after {MAX_RETRIES} retries: {str(e)}")
                raise
            
            # Calculate backoff with jitter
            delay = min(BASE_RETRY_DELAY * (2 ** (retries - 1)), MAX_RETRY_DELAY)
            jitter = delay * RETRY_JITTER * random.uniform(-1, 1)
            wait_time = delay + jitter
            
            logger.warning(f"Redis {func_name} error (attempt {retries}/{MAX_RETRIES}): {str(e)}. Retrying in {wait_time:.2f}s")
            await asyncio.sleep(wait_time)
            
            # Try to reconnect if needed
            if client and hasattr(client, 'connection_pool'):
                try:
                    logger.debug(f"Trying to reconnect to Redis before retry {retries}...")
                    await client.ping()
                    logger.debug("Redis reconnection successful")
                except Exception as reconnect_error:
                    logger.warning(f"Redis reconnection failed: {str(reconnect_error)}")
                    # Force reinitialization on next attempt
                    global _initialized
                    _initialized = False
                    
    # This should never be reached due to the raise above, but just in case
    logger.error(f"Redis operation {func_name} failed with unhandled condition")
    raise last_exception if last_exception else RuntimeError("Redis operation failed without specific error")

def initialize():
    """Initialize Redis connection using environment variables (synchronous)."""
    global client
    
    # Load environment variables if not already loaded
    load_dotenv()
    
    # Create Redis client with more robust retry configuration
    client = redis.Redis(
        host=config.REDIS_HOST,
        port=config.REDIS_PORT,
        password=config.REDIS_PASSWORD,
        ssl=config.REDIS_SSL,
        ssl_ca_certs=certifi.where(),
        decode_responses=True,
        socket_timeout=5.0,        
        socket_connect_timeout=5.0,  # Connection timeout
        retry_on_timeout=True,       # Auto-retry on timeout
        health_check_interval=30,    # Check connection health every 30 seconds
        max_connections=200           # Limit connections to prevent overloading
    )
    
    return client

async def initialize_async(test_connection: bool = False):
    """Initialize Redis connection asynchronously."""
    global client, _initialized
    
    async with _init_lock:
        if not _initialized:
            logger.info("Initializing Redis connection")
            # Initialize the client
            initialize()
            
            # Test the connection if requested
            if test_connection:
                retry_count = 0
                max_init_retries = 3
                while retry_count < max_init_retries:
                    try:
                        await client.ping()
                        logger.info("Successfully connected to Redis")
                        break
                    except Exception as e:
                        retry_count += 1
                        if retry_count >= max_init_retries:
                            logger.error(f"Failed to connect to Redis after {max_init_retries} attempts: {e}")
                            client = None
                            raise e
                        wait_time = BASE_RETRY_DELAY * (2 ** (retry_count - 1))
                        jitter = wait_time * RETRY_JITTER * random.uniform(-1, 1)
                        total_wait = wait_time + jitter
                        logger.warning(f"Redis connection attempt {retry_count} failed: {e}. Retrying in {total_wait:.2f}s...")
                        await asyncio.sleep(total_wait)
            
            _initialized = True
            logger.info("Redis connection initialized successfully")
    
    return client

async def close():
    """Close Redis connection."""
    global client, _initialized
    if client:
        logger.info("Closing Redis connection")
        await client.aclose()
        client = None
        _initialized = False
        logger.info("Redis connection closed")

async def get_client():
    """Get the Redis client, initializing if necessary."""
    global client, _initialized
    if client is None or not _initialized:
        logger.debug("Redis client not initialized, initializing now")
        await initialize_async(test_connection=True)
    return client

# Centralized Redis operation functions with built-in retry logic
async def set(key, value, ex=None):
    """Set a Redis key with automatic retry."""
    redis_client = await get_client()
    return await with_retry(redis_client.set, key, value, ex=ex)

async def get(key, default=None):
    """Get a Redis key with automatic retry."""
    redis_client = await get_client()
    result = await with_retry(redis_client.get, key)
    return result if result is not None else default

async def delete(key):
    """Delete a Redis key with automatic retry."""
    redis_client = await get_client()
    return await with_retry(redis_client.delete, key)

async def publish(channel, message):
    """Publish a message to a Redis channel with automatic retry."""
    redis_client = await get_client()
    return await with_retry(redis_client.publish, channel, message)

async def create_pubsub():
    """Create a Redis pubsub object."""
    redis_client = await get_client()
    # decode_responses=True in client init applies to pubsub messages too
    pubsub = redis_client.pubsub()
    
    # Patch the listen method to handle SSL connection closes
    original_listen = pubsub.listen
    
    async def patched_listen():
        reconnect_attempts = 0
        max_reconnect_attempts = 5
        generator_closed = False
        
        while reconnect_attempts <= max_reconnect_attempts and not generator_closed:
            _gen = None
            try:
                if reconnect_attempts > 0:
                    # Only log if this is a reconnection attempt
                    logger.info(f"PubSub reconnection attempt {reconnect_attempts}/{max_reconnect_attempts}")
                    # Add a delay with exponential backoff before reconnecting
                    delay = min(0.5 * (2 ** (reconnect_attempts - 1)), 10.0)
                    await asyncio.sleep(delay)
                
                _gen = original_listen()
                
                # Reset reconnection counter on successful connection
                if reconnect_attempts > 0:
                    logger.info("PubSub reconnection successful")
                    reconnect_attempts = 0
                
                async for message in _gen:
                    yield message
                    
                # If we get here, the generator completed normally
                break
                
            except (redis.ConnectionError, redis.TimeoutError, ssl.SSLError, ConnectionResetError) as e:
                reconnect_attempts += 1
                
                if "[SSL: APPLICATION_DATA_AFTER_CLOSE_NOTIFY]" in str(e):
                    logger.warning(f"Redis SSL connection closed. Attempt {reconnect_attempts}/{max_reconnect_attempts}")
                elif "Connection closed by server" in str(e):
                    logger.warning(f"Redis server closed connection. Attempt {reconnect_attempts}/{max_reconnect_attempts}")
                else:
                    logger.warning(f"Redis connection error: {str(e)}. Attempt {reconnect_attempts}/{max_reconnect_attempts}")
                
                # Clean up the generator if it exists
                if _gen:
                    try:
                        await _gen.aclose()
                    except Exception as close_err:
                        logger.debug(f"Error closing Redis pubsub generator: {close_err}")
                
                if reconnect_attempts > max_reconnect_attempts:
                    logger.error(f"Failed to reconnect PubSub after {max_reconnect_attempts} attempts")
                    break
                    
                # Continue to retry
                continue
                
            except redis.ResponseError as e:
                # Handle Upstash Redis compatibility issues
                if "Command is not available:" in str(e):
                    logger.warning(f"Upstash Redis compatibility issue (handled): {str(e)}")
                else:
                    logger.warning(f"Redis response error: {str(e)}")
                # Don't reconnect for response errors
                break
                
            except GeneratorExit:
                # This is the critical part - must clean up the inner generator
                logger.debug("Redis pubsub generator being cleaned up by GeneratorExit")
                generator_closed = True
                if _gen:
                    try:
                        await _gen.aclose()
                    except Exception as e:
                        # Swallow any errors during cleanup to avoid 'generator ignored GeneratorExit'
                        logger.warning(f"Error during generator cleanup: {e}")
                # Important: return instead of raise to properly handle GeneratorExit
                return
                
            except Exception as e:
                # Catch any other unexpected errors
                logger.error(f"Unexpected error in Redis pubsub stream: {str(e)}")
                # Don't reconnect for unexpected errors
                break
            
        # Ensure we clean up if we exit the loop
        if _gen and not generator_closed:
            try:
                await _gen.aclose()
            except Exception as e:
                logger.debug(f"Cleanup error after loop: {e}")
    
    pubsub.listen = patched_listen
    return pubsub

async def rpush(key, *values):
    """Append one or more values to a list with automatic retry."""
    redis_client = await get_client()
    return await with_retry(redis_client.rpush, key, *values)

async def lrange(key, start, end):
    """Get a range of elements from a list with automatic retry."""
    redis_client = await get_client()
    # Note: lrange returns bytes if decode_responses=False, but we set it to True
    # Ensure the return type is List[str]
    result: List[str] = await with_retry(redis_client.lrange, key, start, end)
    return result

async def llen(key):
    """Get the length of a list with automatic retry."""
    redis_client = await get_client()
    return await with_retry(redis_client.llen, key)

async def expire(key, time):
    """Set a key's time to live in seconds with automatic retry."""
    redis_client = await get_client()
    return await with_retry(redis_client.expire, key, time)

async def keys(pattern):
    """Get keys matching a pattern with automatic retry."""
    redis_client = await get_client()
    return await with_retry(redis_client.keys, pattern)