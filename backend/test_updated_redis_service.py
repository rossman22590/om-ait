#!/usr/bin/env python3
"""
Test the updated Redis service with upstash-redis support
"""
import asyncio
import os
import sys
from dotenv import load_dotenv

# Add the backend directory to the path so we can import our modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

async def test_redis_service():
    """Test the updated Redis service"""
    try:
        from services import redis
        from utils.logger import logger
        
        print("🔄 Testing updated Redis service...")
        
        # Initialize Redis connection
        await redis.initialize_async()
        print("✅ Redis service initialized successfully")
        
        # Test basic operations
        test_key = "test:service"
        test_value = "Hello from updated service!"
        
        # Test SET operation
        print(f"🔄 Testing SET operation: {test_key} = {test_value}")
        result = await redis.set(test_key, test_value, ex=60)
        print(f"✅ SET result: {result}")
        
        # Test GET operation
        print(f"🔄 Testing GET operation: {test_key}")
        retrieved_value = await redis.get(test_key)
        print(f"✅ GET result: {retrieved_value}")
        
        if retrieved_value == test_value:
            print("✅ Value matches! Redis service is working correctly")
        else:
            print(f"❌ Value mismatch! Expected: {test_value}, Got: {retrieved_value}")
            return False
        
        # Test LIST operations
        list_key = "test:service:list"
        print(f"🔄 Testing LIST operations: {list_key}")
        
        # Add items to list
        await redis.rpush(list_key, "item1", "item2", "item3")
        print("✅ Added items to list")
        
        # Get list items
        list_items = await redis.lrange(list_key, 0, -1)
        print(f"✅ List items: {list_items}")
        
        # Test PUBLISH (without subscriber)
        print("🔄 Testing PUBLISH operation")
        channel = "test:service:channel"
        message = "Hello PubSub!"
        
        # Publish message
        subscribers = await redis.publish(channel, message)
        print(f"✅ Published message to {subscribers} subscribers")
        
        # Test key expiration
        print("🔄 Testing key expiration")
        await redis.expire(test_key, 30)
        print("✅ Set expiration on test key")
        
        # Clean up test keys
        await redis.delete(test_key, list_key)
        print("✅ Cleaned up test keys")
        
        print("\n🎉 All Redis service tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Redis service test failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    finally:
        # Close Redis connection
        try:
            await redis.close()
            print("✅ Redis service connection closed")
        except Exception as e:
            print(f"⚠️ Error closing Redis service connection: {e}")

def main():
    """Main test function"""
    print("🚀 Testing updated Redis service with Upstash support\n")
    
    # Load environment variables
    load_dotenv()
    
    # Check if Redis URL is configured
    redis_url = os.getenv("REDIS_URL")
    if not redis_url:
        print("❌ REDIS_URL not found in environment variables")
        return
    
    print(f"🔗 Using Redis URL: {redis_url[:20]}...{redis_url[-20:]}")
    
    # Run async tests
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    try:
        success = loop.run_until_complete(test_redis_service())
        
        if success:
            print("\n🎉 Your updated Redis service is working correctly with Upstash!")
        else:
            print("\n❌ Redis service test failed. Please check the error messages above.")
            
    finally:
        loop.close()

if __name__ == "__main__":
    main()