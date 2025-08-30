#!/usr/bin/env python3
"""
Test script to verify that both first chat and subsequent chats work with Upstash Redis.
This addresses the issue where first chat works but subsequent chats fail.
"""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services import redis
from utils.logger import logger

async def test_multiple_chats():
    """Test multiple consecutive Redis operations to simulate multiple chats."""
    
    print("🧪 TESTING MULTIPLE CONSECUTIVE CHATS")
    print("=" * 50)
    
    try:
        # Test 1: Initialize Redis connection
        print("1️⃣ Initializing Redis connection...")
        await redis.initialize_async()
        print("✅ Redis initialized successfully")
        
        # Test 2: First chat simulation
        print("\n2️⃣ Simulating FIRST CHAT...")
        await redis.set("test:chat:1", "first_chat_data", ex=300)
        result1 = await redis.get("test:chat:1")
        if result1 == "first_chat_data":
            print("✅ First chat: SUCCESS")
        else:
            print("❌ First chat: FAILED")
            return False
        
        # Test 3: Second chat simulation (this was failing before)
        print("\n3️⃣ Simulating SECOND CHAT...")
        await redis.set("test:chat:2", "second_chat_data", ex=300)
        result2 = await redis.get("test:chat:2")
        if result2 == "second_chat_data":
            print("✅ Second chat: SUCCESS")
        else:
            print("❌ Second chat: FAILED")
            return False
        
        # Test 4: Third chat simulation
        print("\n4️⃣ Simulating THIRD CHAT...")
        await redis.set("test:chat:3", "third_chat_data", ex=300)
        result3 = await redis.get("test:chat:3")
        if result3 == "third_chat_data":
            print("✅ Third chat: SUCCESS")
        else:
            print("❌ Third chat: FAILED")
            return False
        
        # Test 5: Concurrent chat simulation
        print("\n5️⃣ Simulating CONCURRENT CHATS...")
        tasks = []
        for i in range(3):
            tasks.append(redis.set(f"test:concurrent:{i}", f"concurrent_data_{i}", ex=300))
        
        await asyncio.gather(*tasks)
        
        # Verify concurrent results
        concurrent_results = []
        for i in range(3):
            result = await redis.get(f"test:concurrent:{i}")
            concurrent_results.append(result == f"concurrent_data_{i}")
        
        if all(concurrent_results):
            print("✅ Concurrent chats: SUCCESS")
        else:
            print("❌ Concurrent chats: FAILED")
            return False
        
        # Test 6: Connection health after multiple operations
        print("\n6️⃣ Testing connection health...")
        client = await redis.get_client()
        ping_result = await client.ping()
        if ping_result:
            print("✅ Connection health: GOOD")
        else:
            print("❌ Connection health: BAD")
            return False
        
        # Cleanup
        print("\n🧹 Cleaning up test data...")
        await redis.delete("test:chat:1", "test:chat:2", "test:chat:3")
        for i in range(3):
            await redis.delete(f"test:concurrent:{i}")
        print("✅ Cleanup completed")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Main test function."""
    print("🚀 UPSTASH REDIS SUBSEQUENT CHATS TEST")
    print("Testing fix for: 'First chat works, subsequent chats fail'")
    print("=" * 60)
    
    success = await test_multiple_chats()
    
    print("\n" + "=" * 60)
    if success:
        print("🎉 ALL TESTS PASSED! ✅")
        print("✅ First chat works")
        print("✅ Second chat works") 
        print("✅ Third chat works")
        print("✅ Concurrent chats work")
        print("✅ Connection remains healthy")
        print("\n🎯 SUBSEQUENT CHATS ISSUE SHOULD BE FIXED!")
    else:
        print("❌ TESTS FAILED!")
        print("The subsequent chats issue persists.")
    
    # Close connection
    await redis.close()

if __name__ == "__main__":
    asyncio.run(main())