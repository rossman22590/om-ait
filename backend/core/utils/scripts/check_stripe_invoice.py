"""
Quick script to check Stripe invoice and find subscription
"""
import sys
from pathlib import Path

backend_dir = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(backend_dir))

import stripe
from core.utils.config import config

stripe.api_key = config.STRIPE_SECRET_KEY

# Check the invoice
invoice_id = "in_1SGJLgG23sSyONuFtvV9Esi1"
print(f"Checking invoice: {invoice_id}")

invoice = stripe.Invoice.retrieve(invoice_id)
print(f"\nInvoice Details:")
print(f"  Customer: {invoice.customer}")
print(f"  Subscription: {invoice.subscription}")
print(f"  Amount: ${invoice.amount_paid / 100}")
print(f"  Status: {invoice.status}")

if invoice.subscription:
    sub = stripe.Subscription.retrieve(invoice.subscription, expand=['items.data.price'])
    print(f"\nSubscription Details:")
    print(f"  ID: {sub.id}")
    print(f"  Status: {sub.status}")
    if sub.items and sub.items.data:
        price = sub.items.data[0].price
        print(f"  Price: ${price.unit_amount / 100} {price.currency.upper()}")
        print(f"  Price ID: {price.id}")
