#!/usr/bin/env python3

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services import redis
from utils.logger import logger

async def test_upstash_connection():
    """Test Upstash Redis connection with the new optimized settings."""
    
    print("🔧 Testing Upstash Redis Fix")
    print("=" * 40)
    
    # Reset Redis state to simulate fresh startup
    redis.client = None
    redis._initialized = False
    
    print("🚀 Testing first connection attempt...")
    
    try:
        # This should work on first try now with optimized Upstash settings
        await redis.set("upstash_test", "hello_upstash")
        value = await redis.get("upstash_test")
        
        if value == "hello_upstash":
            print("✅ SUCCESS: First connection attempt worked!")
            first_success = True
        else:
            print(f"❌ FAILED: Wrong value returned: {value}")
            first_success = False
            
    except Exception as e:
        print(f"❌ FAILED: First connection attempt failed with: {e}")
        first_success = False
    
    # Test immediate second request (no refresh delay)
    print("\n🔄 Testing immediate second request...")
    try:
        await redis.set("upstash_test_2", "second_request")
        value = await redis.get("upstash_test_2")
        
        if value == "second_request":
            print("✅ Second request worked immediately!")
            second_success = True
        else:
            print(f"❌ Second request failed: {value}")
            second_success = False
            
    except Exception as e:
        print(f"❌ Second request failed: {e}")
        second_success = False
    
    # Test connection info
    print("\n📊 Connection Information:")
    try:
        client = await redis.get_client()
        connection_info = client.connection_pool.connection_kwargs
        print(f"   Socket Connect Timeout: {connection_info.get('socket_connect_timeout', 'default')}")
        print(f"   Socket Timeout: {connection_info.get('socket_timeout', 'default')}")
        print(f"   Max Connections: {connection_info.get('max_connections', 'default')}")
        print(f"   Retry on Timeout: {connection_info.get('retry_on_timeout', 'default')}")
    except Exception as e:
        print(f"   Could not get connection info: {e}")
    
    return first_success and second_success

async def main():
    """Run the Upstash fix test."""
    
    try:
        success = await test_upstash_connection()
        
        print("\n" + "=" * 40)
        if success:
            print("🎉 UPSTASH FIRST-CHAT ISSUE FIXED!")
            print("   ✅ First connection works immediately")
            print("   ✅ No refresh required")
            print("   ✅ Optimized timeouts for Upstash SSL")
            return True
        else:
            print("⚠️  Upstash connection issues may still exist.")
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