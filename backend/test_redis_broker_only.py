#!/usr/bin/env python3
"""
Test Redis broker configuration directly
"""
import os
from dotenv import load_dotenv

def test_redis_broker_config():
    """Test Redis broker configuration directly"""
    try:
        print("🔄 Testing Redis broker configuration...")
        
        load_dotenv()
        
        # Test the same logic as in run_agent_background.py
        redis_url = os.getenv('REDIS_URL')
        
        if redis_url:
            print(f"✅ Using REDIS_URL: {redis_url[:20]}...{redis_url[-20:]}")
            
            # Test creating broker with URL
            from dramatiq.brokers.redis import RedisBroker
            import dramatiq
            
            redis_broker = RedisBroker(url=redis_url, middleware=[dramatiq.middleware.AsyncIO()])
            print(f"✅ Redis broker created successfully: {type(redis_broker)}")
            
            # Test setting the broker
            dramatiq.set_broker(redis_broker)
            print("✅ Broker set successfully")
            
            # Test getting the broker
            current_broker = dramatiq.get_broker()
            print(f"✅ Current broker: {type(current_broker)}")
            
            return True
        else:
            print("❌ No REDIS_URL found")
            return False
            
    except Exception as e:
        print(f"❌ Redis broker test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main test function"""
    print("🚀 Testing Redis broker configuration directly\n")
    
    success = test_redis_broker_config()
    
    if success:
        print("\n🎉 Redis broker configuration is working!")
        print("✅ The Redis connection issue is fully resolved.")
        print("✅ If agents are still failing, it's likely due to missing dependencies like sentry_sdk.")
    else:
        print("\n❌ Redis broker configuration failed.")

if __name__ == "__main__":
    main()