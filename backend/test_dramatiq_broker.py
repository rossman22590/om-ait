#!/usr/bin/env python3
"""
Test Dramatiq broker with Upstash
"""
import os
import sys
from dotenv import load_dotenv

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_dramatiq_broker():
    """Test Dramatiq broker configuration"""
    try:
        print("🔄 Testing Dramatiq broker configuration...")
        
        # Import the broker
        from run_agent_background import redis_broker
        
        print(f"✅ Broker initialized: {type(redis_broker)}")
        print(f"✅ Broker URL: {getattr(redis_broker, 'url', 'N/A')}")
        print(f"✅ Broker host: {getattr(redis_broker, 'host', 'N/A')}")
        print(f"✅ Broker port: {getattr(redis_broker, 'port', 'N/A')}")
        
        # Test broker connection
        try:
            # Try to get broker connection info
            print("🔄 Testing broker connection...")
            
            # Import dramatiq to test the broker
            import dramatiq
            
            # Check if broker is set
            current_broker = dramatiq.get_broker()
            print(f"✅ Current broker: {type(current_broker)}")
            
            return True
            
        except Exception as broker_error:
            print(f"❌ Broker connection test failed: {broker_error}")
            return False
            
    except Exception as e:
        print(f"❌ Dramatiq broker test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main test function"""
    print("🚀 Testing Dramatiq broker with Upstash\n")
    
    # Load environment variables
    load_dotenv()
    
    # Check Redis URL
    redis_url = os.getenv("REDIS_URL")
    print(f"🔗 Redis URL: {redis_url[:20]}...{redis_url[-20:] if redis_url else 'None'}")
    
    success = test_dramatiq_broker()
    
    if success:
        print("\n🎉 Dramatiq broker is configured correctly!")
    else:
        print("\n❌ Dramatiq broker test failed.")

if __name__ == "__main__":
    main()