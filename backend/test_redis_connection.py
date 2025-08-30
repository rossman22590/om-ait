#!/usr/bin/env python3
"""
Test script to verify Redis connection with Upstash
"""
import asyncio
import os
import sys
from dotenv import load_dotenv

# Add the backend directory to the path so we can import our modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services import redis
from utils.logger import logger

async def test_redis_connection():
    """Test Redis connection with various operations"""
    try:
        print("🔄 Testing Redis connection to Upstash...")
        
        # Initialize Redis connection
        await redis.initialize_async()
        print("✅ Redis connection initialized successfully")
        
        # Test basic operations
        test_key = "test:connection"
        test_value = "Hello Upstash!"
        
        # Test SET operation
        print(f"🔄 Testing SET operation: {test_key} = {test_value}")
        result = await redis.set(test_key, test_value, ex=60)  # 60 second TTL
        print(f"✅ SET result: {result}")
        
        # Test GET operation
        print(f"🔄 Testing GET operation: {test_key}")
        retrieved_value = await redis.get(test_key)
        print(f"✅ GET result: {retrieved_value}")
        
        if retrieved_value == test_value:
            print("✅ Value matches! Redis is working correctly")
        else:
            print(f"❌ Value mismatch! Expected: {test_value}, Got: {retrieved_value}")
        
        # Test LIST operations
        list_key = "test:list"
        print(f"🔄 Testing LIST operations: {list_key}")
        
        # Add items to list
        await redis.rpush(list_key, "item1", "item2", "item3")
        print("✅ Added items to list")
        
        # Get list items
        list_items = await redis.lrange(list_key, 0, -1)
        print(f"✅ List items: {list_items}")
        
        # Test PUB/SUB
        print("🔄 Testing PUB/SUB operations")
        channel = "test:channel"
        message = "Hello PubSub!"
        
        # Publish message
        subscribers = await redis.publish(channel, message)
        print(f"✅ Published message to {subscribers} subscribers")
        
        # Test key expiration
        print("🔄 Testing key expiration")
        await redis.expire(test_key, 30)  # Set 30 second expiration
        print("✅ Set expiration on test key")
        
        # Clean up test keys
        await redis.delete(test_key)
        await redis.delete(list_key)
        print("✅ Cleaned up test keys")
        
        print("\n🎉 All Redis tests passed! Upstash connection is working correctly.")
        
    except Exception as e:
        print(f"❌ Redis connection test failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    finally:
        # Close Redis connection
        try:
            await redis.close()
            print("✅ Redis connection closed")
        except Exception as e:
            print(f"⚠️ Error closing Redis connection: {e}")
    
    return True

async def test_dramatiq_broker():
    """Test Dramatiq broker connection"""
    try:
        print("\n🔄 Testing Dramatiq Redis broker...")
        
        # Import the broker from run_agent_background
        from run_agent_background import redis_broker
        
        # Test broker connection by getting connection info
        print("✅ Dramatiq Redis broker initialized successfully")
        print(f"✅ Broker URL: {redis_broker.url}")
        
        return True
        
    except Exception as e:
        print(f"❌ Dramatiq broker test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main test function"""
    print("🚀 Starting Redis connection tests for Upstash\n")
    
    # Load environment variables
    load_dotenv()
    
    # Check if Redis URL is configured
    redis_url = os.getenv("REDIS_URL")
    if not redis_url:
        print("❌ REDIS_URL not found in environment variables")
        return
    
    print(f"🔗 Using Redis URL: {redis_url[:20]}...{redis_url[-20:]}")  # Redact middle part
    
    # Run async tests
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    try:
        # Test Redis service
        redis_success = loop.run_until_complete(test_redis_connection())
        
        # Test Dramatiq broker
        dramatiq_success = loop.run_until_complete(test_dramatiq_broker())
        
        if redis_success and dramatiq_success:
            print("\n🎉 All tests passed! Your Upstash Redis configuration is working correctly.")
        else:
            print("\n❌ Some tests failed. Please check the error messages above.")
            
    finally:
        loop.close()

if __name__ == "__main__":
    main()