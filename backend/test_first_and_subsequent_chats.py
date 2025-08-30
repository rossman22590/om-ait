#!/usr/bin/env python3
"""
Comprehensive test to verify both first chat and subsequent chats work with Upstash Redis.
This addresses the current issue where first chat fails but second chat works.
"""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services import redis
from utils.logger import logger

async def test_fresh_connection():
    """Test with a completely fresh connection."""
    
    print("🔄 TESTING WITH FRESH CONNECTION")
    print("=" * 40)
    
    try:
        # Force close any existing connections
        await redis.close()
        
        # Test 1: First operation after fresh start
        print("1️⃣ First operation after fresh connection...")
        await redis.set("test:fresh:1", "fresh_data_1", ex=300)
        result1 = await redis.get("test:fresh:1")
        if result1 == "fresh_data_1":
            print("✅ First operation: SUCCESS")
        else:
            print("❌ First operation: FAILED")
            return False
        
        # Test 2: Second operation (should work)
        print("2️⃣ Second operation...")
        await redis.set("test:fresh:2", "fresh_data_2", ex=300)
        result2 = await redis.get("test:fresh:2")
        if result2 == "fresh_data_2":
            print("✅ Second operation: SUCCESS")
        else:
            print("❌ Second operation: FAILED")
            return False
        
        # Test 3: Third operation
        print("3️⃣ Third operation...")
        await redis.set("test:fresh:3", "fresh_data_3", ex=300)
        result3 = await redis.get("test:fresh:3")
        if result3 == "fresh_data_3":
            print("✅ Third operation: SUCCESS")
        else:
            print("❌ Third operation: FAILED")
            return False
        
        # Cleanup
        await redis.delete("test:fresh:1", "test:fresh:2", "test:fresh:3")
        return True
        
    except Exception as e:
        print(f"❌ Fresh connection test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_connection_health():
    """Test connection health and recovery."""
    
    print("\n🏥 TESTING CONNECTION HEALTH")
    print("=" * 40)
    
    try:
        # Test connection health
        client = await redis.get_client()
        ping_result = await client.ping()
        if ping_result:
            print("✅ Connection health: GOOD")
        else:
            print("❌ Connection health: BAD")
            return False
        
        # Test multiple rapid operations
        print("⚡ Testing rapid operations...")
        for i in range(5):
            await redis.set(f"test:rapid:{i}", f"rapid_data_{i}", ex=300)
            result = await redis.get(f"test:rapid:{i}")
            if result != f"rapid_data_{i}":
                print(f"❌ Rapid operation {i}: FAILED")
                return False
        
        print("✅ Rapid operations: SUCCESS")
        
        # Cleanup
        for i in range(5):
            await redis.delete(f"test:rapid:{i}")
        
        return True
        
    except Exception as e:
        print(f"❌ Connection health test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_startup_simulation():
    """Simulate application startup scenario."""
    
    print("\n🚀 TESTING STARTUP SIMULATION")
    print("=" * 40)
    
    try:
        # Simulate app startup - close everything first
        await redis.close()
        
        # Simulate first request after startup
        print("1️⃣ Simulating first request after startup...")
        await redis.initialize_async()
        
        # This should work on first try
        await redis.set("test:startup:first", "startup_first_data", ex=300)
        result = await redis.get("test:startup:first")
        if result == "startup_first_data":
            print("✅ First request after startup: SUCCESS")
        else:
            print("❌ First request after startup: FAILED")
            return False
        
        # Simulate second request
        print("2️⃣ Simulating second request...")
        await redis.set("test:startup:second", "startup_second_data", ex=300)
        result = await redis.get("test:startup:second")
        if result == "startup_second_data":
            print("✅ Second request: SUCCESS")
        else:
            print("❌ Second request: FAILED")
            return False
        
        # Cleanup
        await redis.delete("test:startup:first", "test:startup:second")
        return True
        
    except Exception as e:
        print(f"❌ Startup simulation failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Main test function."""
    print("🧪 COMPREHENSIVE FIRST & SUBSEQUENT CHATS TEST")
    print("Testing fix for: 'First chat fails, second chat works'")
    print("=" * 60)
    
    tests = [
        ("Fresh Connection Test", test_fresh_connection),
        ("Connection Health Test", test_connection_health),
        ("Startup Simulation Test", test_startup_simulation)
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n🔍 Running {test_name}...")
        success = await test_func()
        results.append((test_name, success))
        if success:
            print(f"✅ {test_name}: PASSED")
        else:
            print(f"❌ {test_name}: FAILED")
    
    print("\n" + "=" * 60)
    print("📊 TEST RESULTS SUMMARY:")
    print("=" * 60)
    
    all_passed = True
    for test_name, success in results:
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{test_name}: {status}")
        if not success:
            all_passed = False
    
    print("\n" + "=" * 60)
    if all_passed:
        print("🎉 ALL TESTS PASSED! ✅")
        print("✅ First chat works immediately")
        print("✅ Second chat works") 
        print("✅ Subsequent chats work")
        print("✅ Connection health is maintained")
        print("✅ Startup scenario works")
        print("\n🎯 BOTH FIRST AND SUBSEQUENT CHATS SHOULD NOW WORK!")
    else:
        print("❌ SOME TESTS FAILED!")
        print("Issues still exist with Redis connection handling.")
    
    # Close connection
    await redis.close()

if __name__ == "__main__":
    asyncio.run(main())