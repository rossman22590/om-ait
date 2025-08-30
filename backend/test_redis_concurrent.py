#!/usr/bin/env python3

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services import redis
from utils.logger import logger

async def test_concurrent_connections():
    """Test concurrent Redis connections to simulate first-chat scenario."""
    
    print("🧪 Testing concurrent Redis connections...")
    
    # Reset Redis state to simulate fresh start
    redis.client = None
    redis._initialized = False
    
    async def connect_and_test(client_id):
        """Simulate a client connecting and using Redis."""
        try:
            print(f"Client {client_id}: Starting connection...")
            
            # Test basic operations
            await redis.set(f"test_key_{client_id}", f"test_value_{client_id}")
            value = await redis.get(f"test_key_{client_id}")
            
            if value == f"test_value_{client_id}":
                print(f"✅ Client {client_id}: SUCCESS - Redis operations working")
                return True
            else:
                print(f"❌ Client {client_id}: FAILED - Wrong value returned: {value}")
                return False
                
        except Exception as e:
            print(f"❌ Client {client_id}: FAILED - Exception: {e}")
            return False
    
    # Simulate multiple concurrent first requests (like multiple browser tabs)
    print("\n🚀 Simulating 5 concurrent first-time connections...")
    tasks = [connect_and_test(i) for i in range(1, 6)]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Check results
    success_count = sum(1 for r in results if r is True)
    print(f"\n📊 Results: {success_count}/5 clients succeeded")
    
    if success_count == 5:
        print("✅ All concurrent connections succeeded!")
        return True
    else:
        print("❌ Some concurrent connections failed")
        return False

async def test_refresh_scenario():
    """Test the refresh scenario - first fails, second succeeds."""
    
    print("\n🔄 Testing refresh scenario...")
    
    # Reset Redis state
    redis.client = None
    redis._initialized = False
    
    # First attempt
    print("First attempt (simulating initial page load)...")
    try:
        await redis.set("refresh_test", "first_attempt")
        value = await redis.get("refresh_test")
        print(f"✅ First attempt succeeded: {value}")
        first_success = True
    except Exception as e:
        print(f"❌ First attempt failed: {e}")
        first_success = False
    
    # Second attempt (simulating refresh)
    print("Second attempt (simulating page refresh)...")
    try:
        await redis.set("refresh_test", "second_attempt")
        value = await redis.get("refresh_test")
        print(f"✅ Second attempt succeeded: {value}")
        second_success = True
    except Exception as e:
        print(f"❌ Second attempt failed: {e}")
        second_success = False
    
    return first_success and second_success

async def main():
    """Run all Redis connection tests."""
    
    print("🔧 Testing Redis Connection Improvements")
    print("=" * 50)
    
    try:
        # Test 1: Concurrent connections
        concurrent_success = await test_concurrent_connections()
        
        # Test 2: Refresh scenario
        refresh_success = await test_refresh_scenario()
        
        # Final results
        print("\n" + "=" * 50)
        print("📋 FINAL TEST RESULTS:")
        print(f"   Concurrent connections: {'✅ PASS' if concurrent_success else '❌ FAIL'}")
        print(f"   Refresh scenario: {'✅ PASS' if refresh_success else '❌ FAIL'}")
        
        if concurrent_success and refresh_success:
            print("\n🎉 ALL TESTS PASSED! Redis connection issues should be resolved.")
            return True
        else:
            print("\n⚠️  Some tests failed. Redis connection issues may persist.")
            return False
            
    except Exception as e:
        print(f"\n💥 Test suite failed with exception: {e}")
        return False
    
    finally:
        # Cleanup
        try:
            await redis.close()
        except:
            pass

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)