#!/usr/bin/env python3
"""
Test using only the upstash-redis library
"""
import os
from dotenv import load_dotenv

def test_upstash_redis():
    """Test using the upstash-redis library"""
    try:
        from upstash_redis import Redis
        
        load_dotenv()
        redis_url = os.getenv("REDIS_URL")
        
        print("🔄 Testing with upstash-redis library...")
        print(f"🔗 URL: {redis_url[:20]}...{redis_url[-20:]}")
        
        # Create Redis client using upstash-redis
        redis_client = Redis.from_url(redis_url)
        
        # Test PING
        print("🔄 Testing PING...")
        result = redis_client.ping()
        print(f"✅ PING result: {result}")
        
        # Test SET/GET
        test_key = "test:upstash"
        test_value = "Hello from upstash-redis!"
        
        print(f"🔄 Testing SET: {test_key} = {test_value}")
        redis_client.set(test_key, test_value, ex=60)
        print("✅ SET successful")
        
        print(f"🔄 Testing GET: {test_key}")
        retrieved = redis_client.get(test_key)
        print(f"✅ GET result: {retrieved}")
        
        if retrieved == test_value:
            print("✅ upstash-redis library works perfectly!")
            
            # Test more operations
            print("🔄 Testing LIST operations...")
            list_key = "test:list"
            redis_client.rpush(list_key, "item1", "item2", "item3")
            list_items = redis_client.lrange(list_key, 0, -1)
            print(f"✅ List items: {list_items}")
            
            # Clean up
            redis_client.delete(test_key, list_key)
            print("✅ Cleaned up test keys")
            
            print("\n🎉 Upstash Redis connection works perfectly!")
            return True
        else:
            print(f"❌ Value mismatch with upstash-redis")
            return False
            
    except Exception as e:
        print(f"❌ upstash-redis test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main test function"""
    print("🚀 Testing Upstash Redis with upstash-redis library\n")
    
    success = test_upstash_redis()
    
    if success:
        print("\n✅ Your Upstash Redis configuration works with upstash-redis library!")
        print("💡 Consider using upstash-redis instead of redis-py for better Upstash compatibility.")
    else:
        print("\n❌ Even upstash-redis library failed. Please check your Upstash configuration.")

if __name__ == "__main__":
    main()