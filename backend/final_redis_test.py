#!/usr/bin/env python3
"""
Final Redis test with correct SSL configuration for redis-py 5.x
"""
import asyncio
import os
from dotenv import load_dotenv
import redis.asyncio as redis

async def test_redis_connection():
    """Test Redis connection with correct SSL parameters"""
    load_dotenv()
    
    redis_url = os.getenv("REDIS_URL")
    if not redis_url:
        print("❌ REDIS_URL not found in environment variables")
        return False
    
    print(f"🔗 Testing connection to: {redis_url[:20]}...{redis_url[-20:]}")
    
    try:
        # Create Redis client with correct SSL configuration for redis-py 5.x
        client = redis.from_url(
            redis_url,
            decode_responses=True,
            ssl=True,  # Enable SSL for rediss:// URLs
            ssl_cert_reqs=None,  # Don't require certificates
            ssl_check_hostname=False,  # Don't check hostname
            socket_timeout=15.0,
            socket_connect_timeout=10.0,
            retry_on_timeout=True
        )
        
        print("🔄 Testing PING command...")
        result = await client.ping()
        print(f"✅ PING result: {result}")
        
        # Test SET/GET
        test_key = "test:final"
        test_value = "Hello from fixed Redis!"
        
        print(f"🔄 Testing SET: {test_key} = {test_value}")
        await client.set(test_key, test_value, ex=60)
        print("✅ SET successful")
        
        print(f"🔄 Testing GET: {test_key}")
        retrieved = await client.get(test_key)
        print(f"✅ GET result: {retrieved}")
        
        if retrieved == test_value:
            print("✅ Value matches! Connection is working correctly")
            success = True
        else:
            print(f"❌ Value mismatch! Expected: {test_value}, Got: {retrieved}")
            success = False
        
        # Test LIST operations
        list_key = "test:list"
        print(f"🔄 Testing LIST operations: {list_key}")
        
        await client.rpush(list_key, "item1", "item2", "item3")
        print("✅ Added items to list")
        
        list_items = await client.lrange(list_key, 0, -1)
        print(f"✅ List items: {list_items}")
        
        # Clean up
        await client.delete(test_key, list_key)
        print("✅ Cleaned up test keys")
        
        await client.aclose()
        print("✅ Connection closed")
        
        if success:
            print("\n🎉 Redis connection test PASSED!")
        
        return success
        
    except Exception as e:
        print(f"❌ Connection test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main function"""
    print("🚀 Final Redis connection test for Upstash\n")
    
    success = asyncio.run(test_redis_connection())
    
    if success:
        print("\n✅ Your Upstash Redis configuration is working correctly!")
        print("✅ The fixes applied to your Redis service should now work.")
    else:
        print("\n❌ Redis connection still failing. Please check your Upstash configuration.")

if __name__ == "__main__":
    main()