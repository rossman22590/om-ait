#!/usr/bin/env python3
"""
Test upstash-redis with correct API
"""
import os
from dotenv import load_dotenv

def test_upstash_redis():
    """Test using the upstash-redis library with correct API"""
    try:
        from upstash_redis import Redis
        
        load_dotenv()
        redis_url = os.getenv("REDIS_URL")
        
        print("🔄 Testing with upstash-redis library (correct API)...")
        print(f"🔗 URL: {redis_url[:20]}...{redis_url[-20:]}")
        
        # Parse URL components for upstash-redis
        from urllib.parse import urlparse
        parsed = urlparse(redis_url)
        
        # Create Redis client using upstash-redis with individual parameters
        redis_client = Redis(
            url=redis_url,
            token=parsed.password  # Upstash uses token instead of password
        )
        
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
            
            # Clean up
            redis_client.delete(test_key)
            print("✅ Cleaned up test key")
            
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

def test_alternative_approach():
    """Test alternative approach using environment variables"""
    try:
        from upstash_redis import Redis
        
        load_dotenv()
        
        # Try using environment variables approach
        redis_client = Redis(
            url=os.getenv("REDIS_URL"),
            token=os.getenv("REDIS_PASSWORD")  # Use password as token
        )
        
        print("🔄 Testing alternative approach...")
        result = redis_client.ping()
        print(f"✅ Alternative PING result: {result}")
        return True
        
    except Exception as e:
        print(f"❌ Alternative approach failed: {e}")
        return False

def main():
    """Main test function"""
    print("🚀 Testing Upstash Redis with correct API\n")
    
    success1 = test_upstash_redis()
    
    if not success1:
        print("\n" + "="*50 + "\n")
        success2 = test_alternative_approach()
        success1 = success2
    
    if success1:
        print("\n✅ Upstash Redis works with the correct API!")
    else:
        print("\n❌ Both approaches failed. Let's try a simpler approach.")

if __name__ == "__main__":
    main()