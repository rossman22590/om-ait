#!/usr/bin/env python3

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services import redis
from utils.logger import logger

async def test_first_chat_scenario():
    """Test the exact first-chat failure scenario."""
    
    print("🔧 Testing First Chat Fix")
    print("=" * 40)
    
    # Reset Redis state to simulate fresh application start
    redis.client = None
    redis._initialized = False
    
    print("🚀 Simulating first chat attempt...")
    
    try:
        # This should work on first try now
        await redis.set("first_chat_test", "hello_world")
        value = await redis.get("first_chat_test")
        
        if value == "hello_world":
            print("✅ SUCCESS: First chat attempt worked!")
            return True
        else:
            print(f"❌ FAILED: Wrong value returned: {value}")
            return False
            
    except Exception as e:
        print(f"❌ FAILED: First chat attempt failed with: {e}")
        
        # Test if refresh would work
        print("🔄 Simulating page refresh...")
        try:
            await redis.set("refresh_test", "after_refresh")
            value = await redis.get("refresh_test")
            
            if value == "after_refresh":
                print("⚠️  Refresh worked, but first attempt failed - issue not fully fixed")
                return False
            else:
                print("❌ Even refresh failed - major issue")
                return False
                
        except Exception as refresh_e:
            print(f"❌ Refresh also failed: {refresh_e}")
            return False

async def test_connection_recovery():
    """Test connection recovery after failure."""
    
    print("\n🔄 Testing connection recovery...")
    
    try:
        # Force a connection reset
        await redis._reset_connection()
        
        # This should work after reset
        await redis.set("recovery_test", "recovered")
        value = await redis.get("recovery_test")
        
        if value == "recovered":
            print("✅ Connection recovery works!")
            return True
        else:
            print(f"❌ Recovery failed: {value}")
            return False
            
    except Exception as e:
        print(f"❌ Recovery test failed: {e}")
        return False

async def main():
    """Run the first chat fix test."""
    
    try:
        # Test 1: First chat scenario
        first_chat_success = await test_first_chat_scenario()
        
        # Test 2: Connection recovery
        recovery_success = await test_connection_recovery()
        
        # Results
        print("\n" + "=" * 40)
        print("📋 TEST RESULTS:")
        print(f"   First chat: {'✅ PASS' if first_chat_success else '❌ FAIL'}")
        print(f"   Recovery: {'✅ PASS' if recovery_success else '❌ FAIL'}")
        
        if first_chat_success and recovery_success:
            print("\n🎉 First chat issue should be FIXED!")
            return True
        else:
            print("\n⚠️  First chat issue may still exist.")
            return False
            
    except Exception as e:
        print(f"\n💥 Test failed: {e}")
        return False
    
    finally:
        try:
            await redis.close()
        except:
            pass

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)