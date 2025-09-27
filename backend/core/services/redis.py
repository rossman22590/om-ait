import redis.asyncio as redis
import os
from dotenv import load_dotenv
import asyncio
from core.utils.logger import logger
from typing import List, Any, Optional
from core.utils.retry import retry

# Using redis-py only for Upstash compatibility
UPSTASH_AVAILABLE = False

# Redis client and connection pool
client: redis.Redis | None = None
pool: redis.ConnectionPool | None = None
_initialized = False
_init_lock = asyncio.Lock()

# Constants
REDIS_KEY_TTL = 3600 * 24  # 24 hour TTL as safety mechanism


def _detect_upstash() -> bool:
    """Detect if we're using Upstash Redis based on environment variables."""
    redis_url = os.getenv('REDIS_URL', '')
    redis_host = os.getenv('REDIS_HOST', '')
    
    # Check for Upstash indicators
    is_upstash = (
        'upstash.io' in redis_url or 
        'upstash.io' in redis_host
    )
    
    return is_upstash

def _build_redis_url() -> str:
    """Build Redis URL for redis-py client."""
    # First try to get the full URL
    url = os.getenv('REDIS_URL')
    if url:
        # For Upstash, ensure we use rediss:// and proper auth format
        if 'upstash.io' in url:
            if url.startswith('redis://'):
                url = url.replace('redis://', 'rediss://', 1)
            # Ensure proper auth format for Upstash (no username)
            if 'default:' in url:
                url = url.replace('default:', '', 1)
        return url

    # Fallback to environment variables
    host = os.getenv('REDIS_HOST', 'redis')
    port = os.getenv('REDIS_PORT', '6379')
    password = os.getenv('REDIS_PASSWORD', '')
    use_ssl = os.getenv('REDIS_SSL', 'false').lower() == 'true'
    
    # For Upstash, use rediss:// and no username
    if 'upstash.io' in host or use_ssl:
        auth = f":{password}@" if password else ''
        return f"rediss://{auth}{host}:{port}"
    else:
        # For local/Railway Redis, use default username if needed
        auth = f"default:{password}@" if password else ''
        return f"redis://{auth}{host}:{port}"

def initialize():
    """Initialize Redis connection pool and client using environment variables."""
    global client, pool

    # Load environment variables if not already loaded
    load_dotenv()

    # Detect if we're using Upstash
    is_upstash = _detect_upstash()
    
    # Use redis-py client (works great with Upstash)
    _initialize_redis_py_client(is_upstash)

    return client

def _initialize_redis_py_client(is_upstash: bool = False):
    """Initialize the standard redis-py client."""
    global client, pool
    
    redis_url = _build_redis_url()
    
    # Connection pool configuration - optimized for production
    max_connections = 512 if is_upstash else 128  # Higher for Upstash
    socket_timeout = 30.0 if is_upstash else 15.0  # Longer for Upstash
    connect_timeout = 10.0
    retry_on_timeout = not (os.getenv("REDIS_RETRY_ON_TIMEOUT", "True").lower() != "true")

    logger.info(f"Initializing redis-py client to {redis_url.split('@')[-1] if '@' in redis_url else redis_url} with max {max_connections} connections")

    try:
        # Create Redis client from URL (handles SSL automatically)
        client = redis.from_url(
            redis_url,
            decode_responses=True,
            socket_timeout=socket_timeout,
            socket_connect_timeout=connect_timeout,
            socket_keepalive=True,
            retry_on_timeout=retry_on_timeout,
            health_check_interval=30,
            max_connections=max_connections,
        )
        
        # Store the connection pool reference
        pool = client.connection_pool
        
    except Exception as e:
        logger.error(f"Failed to initialize Redis client: {e}")
        raise


async def initialize_async():
    """Initialize Redis connection asynchronously."""
    global client, _initialized

    async with _init_lock:
        if not _initialized:
            # logger.debug("Initializing Redis connection")
            initialize()

        try:
            # Test connection with timeout
            if client:
                await asyncio.wait_for(client.ping(), timeout=10.0)
                logger.info("Successfully connected to Redis via redis-py")
            
            _initialized = True
        except asyncio.TimeoutError:
            logger.error("Redis connection timeout during initialization")
            client = None
            _initialized = False
            raise ConnectionError("Redis connection timeout")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            client = None
            _initialized = False
            raise

    return client


async def close():
    """Close Redis connection and connection pool."""
    global client, pool, _initialized
    
    if client:
        # logger.debug("Closing Redis connection")
        try:
            await asyncio.wait_for(client.aclose(), timeout=5.0)
        except asyncio.TimeoutError:
            logger.warning("Redis close timeout, forcing close")
        except Exception as e:
            logger.warning(f"Error closing Redis client: {e}")
        finally:
            client = None
    
    if pool:
        # logger.debug("Closing Redis connection pool")
        try:
            await asyncio.wait_for(pool.aclose(), timeout=5.0)
        except asyncio.TimeoutError:
            logger.warning("Redis pool close timeout, forcing close")
        except Exception as e:
            logger.warning(f"Error closing Redis pool: {e}")
        finally:
            pool = None
    
    _initialized = False
    logger.info("Redis connection and pool closed")


async def get_client():
    """Get the Redis client, initializing if necessary."""
    global client, _initialized
    if client is None or not _initialized:
        await retry(lambda: initialize_async())
    return client



# Basic Redis operations
async def set(key: str, value: str, ex: int = None, nx: bool = False):
    """Set a Redis key."""
    redis_client = await get_client()
    return await redis_client.set(key, value, ex=ex, nx=nx)


async def get(key: str, default: str = None):
    """Get a Redis key."""
    redis_client = await get_client()
    result = await redis_client.get(key)
    return result if result is not None else default


async def delete(key: str):
    """Delete a Redis key."""
    redis_client = await get_client()
    return await redis_client.delete(key)


async def publish(channel: str, message: str):
    """Publish a message to a Redis channel."""
    redis_client = await get_client()
    return await redis_client.publish(channel, message)


async def create_pubsub():
    """Create a Redis pubsub object."""
    redis_client = await get_client()
    return redis_client.pubsub()


# List operations
async def rpush(key: str, *values: Any):
    """Append one or more values to a list."""
    redis_client = await get_client()
    return await redis_client.rpush(key, *values)


async def lrange(key: str, start: int, end: int) -> List[str]:
    """Get a range of elements from a list."""
    redis_client = await get_client()
    return await redis_client.lrange(key, start, end)


# Key management
async def keys(pattern: str) -> List[str]:
    """Get keys matching a pattern."""
    redis_client = await get_client()
    return await redis_client.keys(pattern)

async def expire(key: str, seconds: int):
    """Set expiration time for a key."""
    redis_client = await get_client()
    return await redis_client.expire(key, seconds)