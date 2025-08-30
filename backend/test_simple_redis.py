#!/usr/bin/env python3
"""
Simple test of the fixed Redis service
"""
import asyncio
import os
import sys
from dotenv import load_dotenv

# Add the backend directory to the path so we can import our modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

async def test_simple_redis():
    """Test the simplified Redis service"""
    try:
        from services import redis
        
        print("🔄 Testing simplified Redis service...")
        
        # Initialize Redis connection
        await redis.initialize_async()
        print("✅ Redis service initialized successfully")
        
        # Test basic operations
        test_key = "test:simple"
        test_value = "Hello from simplified Redis!"
        
        # Test SET operation
        print(f"🔄 Testing SET: {test_key} = {test_value}")
        result = await redis.set(test_key, test_value, ex=60)
        print(f"✅ SET result: {result}")
        
        # Test GET operation
        print(f"🔄 Testing GET: {test_key}")
        retrieved_value = await redis.get(test_key)
        print(f"✅ GET result: {retrieved_value}")
        
        if retrieved_value == test_value:
            print("✅ Value matches! Redis service is working correctly")
            success = True
        else:
            print(f"❌ Value mismatch! Expected: {test_value}, Got: {retrieved_value}")
            success = False
        
        # Clean up
        await redis.delete(test_key)
        print("✅ Cleaned up test key")
        
        return success
        
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
    print("🚀 Testing simplified Redis service\n")
    
    # Load environment variables
    load_dotenv()
    
    # Check if Redis URL is configured
    redis_url = os.getenv("REDIS_URL")
    if not redis_url:
        print("❌ REDIS_URL not found in environment variables")
        return
    
    print(f"🔗 Using Redis URL: {redis_url[:20]}...{redis_url[-20:]}")
    
    # Run async tests
    success = asyncio.run(test_simple_redis())
    
    if success:
        print("\n🎉 Your simplified Redis service is working correctly with Upstash!")
    else:
        print("\n❌ Redis service test failed. Please check the error messages above.")

if __name__ == "__main__":
    main()