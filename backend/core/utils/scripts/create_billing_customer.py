#!/usr/bin/env python3

import asyncio
import sys
from pathlib import Path

backend_dir = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(backend_dir))

from core.services.supabase import DBConnection
from core.utils.logger import logger

async def create_billing_customer(account_id: str, stripe_customer_id: str, email: str):
    """Create a billing customer record in the database."""
    logger.info(f"Creating billing customer for account {account_id}")
    logger.info(f"  Stripe customer ID: {stripe_customer_id}")
    logger.info(f"  Email: {email}")

    db = DBConnection()
    await db.initialize()
    client = await db.client

    # Insert into billing_customers table
    result = await client.schema('basejump').from_('billing_customers').insert({
        'id': stripe_customer_id,
        'account_id': account_id,
        'email': email,
        'active': True,
        'provider': 'stripe'
    }).execute()

    logger.info("[OK] Billing customer record created successfully")
    return result

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: py create_billing_customer.py <account_id> <stripe_customer_id> <email>")
        sys.exit(1)

    account_id = sys.argv[1]
    stripe_customer_id = sys.argv[2]
    email = sys.argv[3]

    asyncio.run(create_billing_customer(account_id, stripe_customer_id, email))
