#!/usr/bin/env python3
"""
Simple Redis connection test for Upstash
"""
import asyncio
import os
import ssl
from dotenv import load_dotenv
import redis.asyncio as redis

async def test_upstash_connection():
    """Test direct connection to Upstash Redis"""
    load_dotenv()
    
    redis_url = os.getenv("REDIS_URL")
    if not redis_url:
        print("❌ REDIS_URL not found in environment variables")
        return False
    
    print(f"🔗 Testing connection to: {redis_url[:20]}...{redis_url[-20:]}")
    
    try:
        # Create SSL context for Upstash
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        
        # Create Redis client with SSL configuration
        client = redis.from_url(
            redis_url,
            decode_responses=True,
            ssl_context=ssl_context,
            ssl_cert_reqs=None,
            ssl_check_hostname=False,
            socket_timeout=15.0,
            socket_connect_timeout=10.0,
            retry_on_timeout=True
        )
        
        print("🔄 Testing PING command...")
        result = await client.ping()
        print(f"✅ PING result: {result}")
        
        # Test SET/GET
        test_key = "test:upstash"
        test_value = "Hello from Upstash!"
        
        print(f"🔄 Testing SET: {test_key} = {test_value}")
        await client.set(test_key, test_value, ex=60)
        print("✅ SET successful")
        
        print(f"🔄 Testing GET: {test_key}")
        retrieved = await client.get(test_key)
        print(f"✅ GET result: {retrieved}")
        
        if retrieved == test_value:
            print("✅ Value matches! Connection is working correctly")
        else:
            print(f"❌ Value mismatch! Expected: {test_value}, Got: {retrieved}")
            return False
        
        # Clean up
        await client.delete(test_key)
        print("✅ Cleaned up test key")
        
        await client.aclose()
        print("✅ Connection closed")
        
        print("\n🎉 Upstash Redis connection test PASSED!")
        return True
        
    except Exception as e:
        print(f"❌ Connection test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main function"""
    print("🚀 Testing Upstash Redis connection\n")
    
    success = asyncio.run(test_upstash_connection())
    
    if success:
        print("\n✅ Your Upstash Redis configuration is working correctly!")
    else:
        print("\n❌ Redis connection failed. Please check your configuration.")

if __name__ == "__main__":
    main()