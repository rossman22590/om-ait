#!/usr/bin/env python3
"""
Simple test to verify Redis connection works after fixing the connection_pool_kwargs error.
"""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services import redis
from utils.logger import logger

async def test_simple_connection():
    """Test basic Redis connection and operations."""
    
    print("🧪 SIMPLE CONNECTION TEST")
    print("=" * 30)
    
    try:
        # Close any existing connections
        await redis.close()
        
        print("1️⃣ Testing connection initialization...")
        await redis.initialize_async()
        print("✅ Connection initialized")
        
        print("2️⃣ Testing basic SET operation...")
        await redis.set("test:simple", "hello_world", ex=300)
        print("✅ SET operation successful")
        
        print("3️⃣ Testing basic GET operation...")
        result = await redis.get("test:simple")
        if result == "hello_world":
            print("✅ GET operation successful")
        else:
            print(f"❌ GET operation failed: expected 'hello_world', got '{result}'")
            return False
        
        print("4️⃣ Testing second operation...")
        await redis.set("test:simple2", "second_test", ex=300)
        result2 = await redis.get("test:simple2")
        if result2 == "second_test":
            print("✅ Second operation successful")
        else:
            print(f"❌ Second operation failed: expected 'second_test', got '{result2}'")
            return False
        
        print("5️⃣ Cleaning up...")
        await redis.delete("test:simple", "test:simple2")
        print("✅ Cleanup successful")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Main test function."""
    print("🚀 TESTING REDIS CONNECTION AFTER FIX")
    print("=" * 40)
    
    success = await test_simple_connection()
    
    print("\n" + "=" * 40)
    if success:
        print("🎉 CONNECTION TEST PASSED! ✅")
        print("Redis connection is working properly")
    else:
        print("❌ CONNECTION TEST FAILED!")
        print("There are still issues with the Redis connection")
    
    # Close connection
    await redis.close()

if __name__ == "__main__":
    asyncio.run(main())