import redis.asyncio as redis
import os
from dotenv import load_dotenv
import asyncio
from utils.logger import logger
from typing import List, Any
from utils.retry import retry

# Redis client and connection pool
client: redis.Redis | None = None
pool: redis.ConnectionPool | None = None
_initialized = False
_init_lock = asyncio.Lock()

# Constants
REDIS_KEY_TTL = 3600 * 24  # 24 hour TTL as safety mechanism


def _build_redis_url() -> tuple[str, bool]:
    """Build a Redis URL from environment variables and return (url, ssl_on).

    Priority:
    1) REDIS_URL if provided
    2) REDIS_HOST/REDIS_PASSWORD/REDIS_PORT with REDIS_SSL
    """
    # Load environment variables if not already loaded
    load_dotenv()

    url = os.getenv("REDIS_URL")
    if url:
        ssl_on = url.startswith("rediss://")
        return url, ssl_on

    host = os.getenv("REDIS_HOST", "redis")
    port = os.getenv("REDIS_PORT", "6379")
    password = os.getenv("REDIS_PASSWORD", "")
    use_ssl = os.getenv("REDIS_SSL", "true").lower() == "true"
    scheme = "rediss" if use_ssl else "redis"

    # Upstash requires password in URL format ":password@host"
    auth = f":{password}@" if password else ""
    built = f"{scheme}://{auth}{host}:{port}"
    return built, use_ssl


def initialize():
    """Initialize Redis client using a single asyncio connection from URL with proper TLS."""
    global client, pool

    # Connection options - optimized for production and Upstash
    max_connections = 128            # Reasonable limit for production
    socket_timeout = 15.0            # 15 seconds socket timeout
    connect_timeout = 10.0           # 10 seconds connection timeout
    retry_on_timeout = not (os.getenv("REDIS_RETRY_ON_TIMEOUT", "True").lower() != "true")

    redis_url, ssl_on = _build_redis_url()

    try:
        # Prefer from_url with ssl flag and keepalives
        logger.info(
            f"Initializing Redis client via URL host={redis_url.split('@')[-1].split(':')[0]} ssl={ssl_on} max={max_connections}"
        )
        client_kwargs = dict(
            decode_responses=True,
            socket_timeout=socket_timeout,
            socket_connect_timeout=connect_timeout,
            socket_keepalive=True,
            health_check_interval=30,
            retry_on_timeout=retry_on_timeout,
            ssl=ssl_on,
            max_connections=max_connections,
        )

        # Use a connection pool under the hood via from_url; keep a reference for graceful close
        pool_obj = redis.ConnectionPool.from_url(redis_url, **client_kwargs)
        client_obj = redis.Redis(connection_pool=pool_obj)

        # Assign to globals
        client = client_obj
        pool = pool_obj
        return client
    except Exception as e:
        logger.error(f"Failed to initialize Redis client: {e}")
        raise


async def initialize_async():
    """Initialize Redis connection asynchronously."""
    global client, _initialized

    async with _init_lock:
        if not _initialized:
            logger.info("Initializing Redis connection")
            initialize()

        try:
            # Test connection with timeout
            await asyncio.wait_for(client.ping(), timeout=5.0)
            logger.info("Successfully connected to Redis")
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
        logger.info("Closing Redis connection")
        try:
            await asyncio.wait_for(client.aclose(), timeout=5.0)
        except asyncio.TimeoutError:
            logger.warning("Redis close timeout, forcing close")
        except Exception as e:
            logger.warning(f"Error closing Redis client: {e}")
        finally:
            client = None
    
    if pool:
        logger.info("Closing Redis connection pool")
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
    redis_client = await get_client()
    return await redis_client.keys(pattern)


async def expire(key: str, seconds: int):
    redis_client = await get_client()
    return await redis_client.expire(key, seconds)
# import redis.asyncio as redis
# import os
# from dotenv import load_dotenv
# import asyncio
# from utils.logger import logger

# from typing import List, Any
# from utils.retry import retry

# # Redis client and connection pool
# client: redis.Redis | None = None
# pool: redis.ConnectionPool | None = None
# _initialized = False
# _init_lock = asyncio.Lock()

# # Constants
# REDIS_KEY_TTL = 3600 * 24  # 24 hour TTL as safety mechanism


# def initialize():
#     """Initialize Redis connection pool and client using environment variables."""
#     global client, pool

#     # Load environment variables if not already loaded
#     load_dotenv()

#     # Primary configuration
#     redis_url = os.getenv("REDIS_URL")
#     redis_host = os.getenv("REDIS_HOST", "redis")
#     redis_port = int(os.getenv("REDIS_PORT", 6379))
#     redis_password = os.getenv("REDIS_PASSWORD", "")
#     redis_username = os.getenv("REDIS_USERNAME", "")
#     redis_ssl = os.getenv("REDIS_SSL", "false").lower() == "true"

#     # Auto-detect local Docker Redis (no TLS) when no URL is provided
#     # This avoids trying TLS against the default redis:6379 container
#     if not redis_url and redis_host in {"redis", "localhost", "127.0.0.1"} and redis_port == 6379:
#         if redis_ssl:
#             logger.warning("REDIS_SSL=true detected but local Redis at %s:%s is likely plaintext. Forcing REDIS_SSL=False for local connection.", redis_host, redis_port)
#         redis_ssl = False

#     # Connection pool configuration - optimized for production
#     max_connections = 128            # Reasonable limit for production
#     socket_timeout = 15.0            # 15 seconds socket timeout
#     connect_timeout = 10.0           # 10 seconds connection timeout
#     retry_on_timeout = not (os.getenv("REDIS_RETRY_ON_TIMEOUT", "True").lower() != "true")

#     # URL handling (preferred)
#     if redis_url:
#         if redis_ssl and redis_url.startswith("redis://"):
#             redis_url = "rediss://" + redis_url.split("://", 1)[1]
#         logger.info("Initializing Redis client via URL (ssl=%s)" % redis_ssl)
#         client_kwargs = {
#             "decode_responses": True,
#             "socket_timeout": socket_timeout,
#             "socket_connect_timeout": connect_timeout,
#             "socket_keepalive": True,
#             "health_check_interval": 30,
#             "retry_on_timeout": retry_on_timeout,
#         }
#         # If TLS is requested but URL isn't rediss, some providers still allow ssl flag
#         # Keep this only when explicitly requested to avoid incompatibilities
#         if redis_ssl and redis_url.startswith("redis://"):
#             client_kwargs["ssl"] = True
#         if redis_username:
#             client_kwargs["username"] = redis_username
#         if redis_password and ("@" not in redis_url):
#             client_kwargs["password"] = redis_password

#         # Create client directly from URL
#         pool = None
#         client_url = redis_url
#         client_obj = redis.from_url(client_url, **client_kwargs)
#         # Assign to globals
#         client = client_obj
#         return client

#     # Host/port handling
#     logger.info(f"Initializing Redis connection pool to {redis_host}:{redis_port} ssl={redis_ssl} with max {max_connections} connections")

#     # Create connection pool with production-optimized settings
#     pool = redis.ConnectionPool(
#         host=redis_host,
#         port=redis_port,
#         username=(redis_username or None),
#         password=(redis_password or None),
#         decode_responses=True,
#         socket_timeout=socket_timeout,
#         socket_connect_timeout=connect_timeout,
#         socket_keepalive=True,
#         retry_on_timeout=retry_on_timeout,
#         health_check_interval=30,
#         max_connections=max_connections,
#         # Important: only pass ssl when we truly want TLS
#         **({"ssl": True} if redis_ssl else {})
#     )

#     # Create Redis client from connection pool
#     client = redis.Redis(connection_pool=pool)

#     return client


# async def initialize_async():
#     """Initialize Redis connection asynchronously."""
#     global client, _initialized

#     async with _init_lock:
#         if not _initialized:
#             logger.info("Initializing Redis connection")
#             initialize()

#         try:
#             # Test connection with timeout
#             await asyncio.wait_for(client.ping(), timeout=5.0)
#             logger.info("Successfully connected to Redis")
#             _initialized = True

#         except asyncio.TimeoutError:
#             logger.error("Redis connection timeout during initialization")
#             client = None
#             _initialized = False
#             raise ConnectionError("Redis connection timeout")

#         except Exception as e:
#             logger.error(f"Failed to connect to Redis: {e}")
#             client = None
#             _initialized = False
#             raise

#     return client


# async def close():
#     """Close Redis connection and connection pool."""
#     global client, pool, _initialized
#     if client:
#         logger.info("Closing Redis connection")
#         try:
#             await asyncio.wait_for(client.aclose(), timeout=5.0)
#         except asyncio.TimeoutError:
#             logger.warning("Redis close timeout, forcing close")
#         except Exception as e:
#             logger.warning(f"Error closing Redis client: {e}")
#         finally:
#             client = None
    
#     if pool:
#         logger.info("Closing Redis connection pool")
#         try:
#             await asyncio.wait_for(pool.aclose(), timeout=5.0)
#         except asyncio.TimeoutError:
#             logger.warning("Redis pool close timeout, forcing close")
#         except Exception as e:
#             logger.warning(f"Error closing Redis pool: {e}")
#         finally:
#             pool = None
    
#     _initialized = False
#     logger.info("Redis connection and pool closed")


# async def get_client():
#     """Get the Redis client, initializing if necessary."""
#     global client, _initialized
#     if client is None or not _initialized:
#         await retry(lambda: initialize_async())
#     return client


# # Basic Redis operations
# async def set(key: str, value: str, ex: int = None, nx: bool = False):
#     """Set a Redis key."""
#     redis_client = await get_client()
#     return await redis_client.set(key, value, ex=ex, nx=nx)


# async def get(key: str, default: str = None):
#     """Get a Redis key."""
#     redis_client = await get_client()
#     result = await redis_client.get(key)
#     return result if result is not None else default


# async def delete(key: str):
#     """Delete a Redis key."""
#     redis_client = await get_client()
#     return await redis_client.delete(key)


# async def publish(channel: str, message: str):
#     """Publish a message to a Redis channel."""
#     redis_client = await get_client()
#     return await redis_client.publish(channel, message)


# async def create_pubsub():
#     """Create a Redis pubsub object."""
#     redis_client = await get_client()
#     return redis_client.pubsub()


# # List operations
# async def rpush(key: str, *values: Any):
#     """Append one or more values to a list."""
#     redis_client = await get_client()
#     return await redis_client.rpush(key, *values)


# async def lrange(key: str, start: int, end: int) -> List[str]:
#     """Get a range of elements from a list."""
#     redis_client = await get_client()
#     return await redis_client.lrange(key, start, end)


# # Key management


# async def keys(pattern: str) -> List[str]:
#     redis_client = await get_client()
#     return await redis_client.keys(pattern)


# async def expire(key: str, seconds: int):
#     redis_client = await get_client()
#     return await redis_client.expire(key, seconds)