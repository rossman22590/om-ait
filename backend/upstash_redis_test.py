#!/usr/bin/env python3
"""
Test Upstash Redis using both redis-py and upstash-redis libraries
"""
import asyncio
import os
from dotenv import load_dotenv

async def test_with_upstash_redis():
    """Test using the upstash-redis library"""
    try:
        from upstash_redis import Redis
        
        load_dotenv()
        redis_url = os.getenv("REDIS_URL")
        
        print("🔄 Testing with upstash-redis library...")
        
        # Create Redis client using upstash-redis
        redis_client = Redis.from_url(redis_url)
        
        # Test PING
        result = redis_client.ping()
        print(f"✅ PING result: {result}")
        
        # Test SET/GET
        test_key = "test:upstash"
        test_value = "Hello from upstash-redis!"
        
        redis_client.set(test_key, test_value, ex=60)
        print(f"✅ SET: {test_key} = {test_value}")
        
        retrieved = redis_client.get(test_key)
        print(f"✅ GET: {retrieved}")
        
        if retrieved == test_value:
            print("✅ upstash-redis library works perfectly!")
            return True
        else:
            print(f"❌ Value mismatch with upstash-redis")
            return False
            
    except Exception as e:
        print(f"❌ upstash-redis test failed: {e}")
        return False

async def test_with_redis_py():
    """Test using redis-py with correct SSL configuration"""
    try:
        import redis.asyncio as redis
        import ssl
        
        load_dotenv()
        redis_url = os.getenv("REDIS_URL")
        
        print("🔄 Testing with redis-py library...")
        
        # For redis-py 5.x, we need to handle SSL differently
        # Parse the URL to extract components
        from urllib.parse import urlparse
        parsed = urlparse(redis_url)
        
        # Create connection with explicit SSL handling
        client = redis.Redis(
            host=parsed.hostname,
            port=parsed.port,
            password=parsed.password,
            username=parsed.username or 'default',
            ssl=True,  # Enable SSL
            ssl_cert_reqs=None,  # Don't require certificates
            decode_responses=True,
            socket_timeout=15.0,
            socket_connect_timeout=10.0,
            retry_on_timeout=True
        )
        
        # Test PING
        result = await client.ping()
        print(f"✅ PING result: {result}")
        
        # Test SET/GET
        test_key = "test:redis-py"
        test_value = "Hello from redis-py!"
        
        await client.set(test_key, test_value, ex=60)
        print(f"✅ SET: {test_key} = {test_value}")
        
        retrieved = await client.get(test_key)
        print(f"✅ GET: {retrieved}")
        
        if retrieved == test_value:
            print("✅ redis-py library works!")
            await client.aclose()
            return True
        else:
            print(f"❌ Value mismatch with redis-py")
            await client.aclose()
            return False
            
    except Exception as e:
        print(f"❌ redis-py test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main test function"""
    print("🚀 Testing Upstash Redis with different libraries\n")
    
    # Test with upstash-redis (synchronous)
    upstash_success = asyncio.run(test_with_upstash_redis())
    
    print("\n" + "="*50 + "\n")
    
    # Test with redis-py (asynchronous)
    redis_py_success = asyncio.run(test_with_redis_py())
    
    print("\n" + "="*50)
    print("📊 RESULTS:")
    print(f"upstash-redis: {'✅ PASS' if upstash_success else '❌ FAIL'}")
    print(f"redis-py:      {'✅ PASS' if redis_py_success else '❌ FAIL'}")
    
    if upstash_success or redis_py_success:
        print("\n🎉 At least one method works! Your Upstash configuration is valid.")
    else:
        print("\n❌ Both methods failed. Please check your Upstash configuration.")

if __name__ == "__main__":
    main()