#!/usr/bin/env python3
"""
Test script to verify configuration imports correctly.
"""

try:
    from utils.config import config
    print("✅ Configuration imported successfully!")
    print(f"Environment mode: {config.ENV_MODE.value}")
    print(f"STRIPE_FREE_TIER_ID: {config.STRIPE_FREE_TIER_ID}")
    print(f"STRIPE_TIER_2_20_ID: {config.STRIPE_TIER_2_20_ID}")
    print(f"STRIPE_TIER_2_20_YEARLY_ID: {config.STRIPE_TIER_2_20_YEARLY_ID}")
    print(f"STRIPE_TIER_2_17_YEARLY_COMMITMENT_ID: {config.STRIPE_TIER_2_17_YEARLY_COMMITMENT_ID}")
    print(f"FRONTEND_URL: {config.FRONTEND_URL}")
    print("All configuration attributes are accessible!")
except Exception as e:
    print(f"❌ Configuration import failed: {e}")
    import traceback
    traceback.print_exc()
