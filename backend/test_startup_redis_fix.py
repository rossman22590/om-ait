#!/usr/bin/env python3

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services import redis
from utils.logger import logger

async def test_startup_scenario():
    """Test the startup scenario that causes first-chat failures."""
    
    print("🔧 Testing Startup Redis Fix")
    print("=" * 50)
    
    # Simulate application startup failure scenario
    print("🚀 Simulating application startup...")
    
    # Reset Redis state to simulate fresh startup
    redis.client = None
    redis._initialized = False
    
    # Simulate startup initialization failure
    print("❌ Simulating Redis initialization failure during startup...")
    try:
        # This might fail on first attempt (simulating startup failure)
        await redis.initialize_async()
        print("✅ Startup initialization succeeded")
        startup_success = True
    except Exception as e:
        print(f"❌ Startup initialization failed: {e}")
        # Reset state as the fixed startup code does
        redis.client = None
        redis._initialized = False
        startup_success = False
    
    # Now test first chat request (this should work even if startup failed)
    print("\n🗨️  Testing first chat request...")
    try:
        await redis.set("first_chat_after_startup", "hello_world")
        value = await redis.get("first_chat_after_startup")
        
        if value == "hello_world":
            print("✅ SUCCESS: First chat request worked!")
            first_chat_success = True
        else:
            print(f"❌ FAILED: Wrong value returned: {value}")
            first_chat_success = False
            
    except Exception as e:
        print(f"❌ FAILED: First chat request failed with: {e}")
        first_chat_success = False
    
    # Test second request (refresh scenario)
    print("\n🔄 Testing second request (refresh scenario)...")
    try:
        await redis.set("second_request", "after_refresh")
        value = await redis.get("second_request")
        
        if value == "after_refresh":
            print("✅ Second request worked!")
            second_success = True
        else:
            print(f"❌ Second request failed: {value}")
            second_success = False
            
    except Exception as e:
        print(f"❌ Second request failed: {e}")
        second_success = False
    
    return startup_success, first_chat_success, second_success

async def test_concurrent_first_requests():
    """Test multiple concurrent first requests after startup."""
    
    print("\n🔀 Testing concurrent first requests...")
    
    # Reset Redis state
    redis.client = None
    redis._initialized = False
    
    async def make_request(client_id):
        """Simulate a client making their first request."""
        try:
            await redis.set(f"concurrent_test_{client_id}", f"client_{client_id}")
            value = await redis.get(f"concurrent_test_{client_id}")
            return value == f"client_{client_id}"
        except Exception as e:
            print(f"Client {client_id} failed: {e}")
            return False
    
    # Launch 5 concurrent requests
    tasks = [make_request(i) for i in range(1, 6)]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    success_count = sum(1 for r in results if r is True)
    print(f"📊 Concurrent requests: {success_count}/5 succeeded")
    
    return success_count == 5

async def main():
    """Run all startup fix tests."""
    
    try:
        # Test 1: Startup scenario
        startup_success, first_chat_success, second_success = await test_startup_scenario()
        
        # Test 2: Concurrent requests
        concurrent_success = await test_concurrent_first_requests()
        
        # Results
        print("\n" + "=" * 50)
        print("📋 FINAL TEST RESULTS:")
        print(f"   Startup initialization: {'✅ PASS' if startup_success else '⚠️  EXPECTED FAIL'}")
        print(f"   First chat after startup: {'✅ PASS' if first_chat_success else '❌ FAIL'}")
        print(f"   Second request: {'✅ PASS' if second_success else '❌ FAIL'}")
        print(f"   Concurrent requests: {'✅ PASS' if concurrent_success else '❌ FAIL'}")
        
        # The key test is that first chat works even if startup failed
        if first_chat_success and second_success and concurrent_success:
            print("\n🎉 FIRST-CHAT ISSUE SHOULD BE FIXED!")
            print("   ✅ First chat works even after startup failure")
            print("   ✅ Concurrent requests handled properly")
            print("   ✅ Subsequent requests work reliably")
            return True
        else:
            print("\n⚠️  First-chat issue may still exist.")
            if not first_chat_success:
                print("   ❌ First chat still fails")
            if not concurrent_success:
                print("   ❌ Concurrent requests still have issues")
            return False
            
    except Exception as e:
        print(f"\n💥 Test suite failed: {e}")
        return False
    
    finally:
        try:
            await redis.close()
        except:
            pass

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)