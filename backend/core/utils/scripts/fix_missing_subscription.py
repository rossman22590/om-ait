#!/usr/bin/env python3

import asyncio
import sys
import argparse
from pathlib import Path
from datetime import datetime, timezone, timedelta
from decimal import Decimal

backend_dir = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(backend_dir))

import stripe
from core.services.supabase import DBConnection
from core.utils.config import config
from core.utils.logger import logger
from core.billing.shared.config import (
    get_tier_by_price_id,
    get_tier_by_name,
    is_commitment_price_id,
    get_commitment_duration_months,
)
from core.billing.credits.manager import credit_manager

stripe.api_key = config.STRIPE_SECRET_KEY

async def _resolve_subscription_period(subscription, stripe_customer_id: str):
    """Return (current_period_start, current_period_end) as UNIX timestamps with robust fallbacks."""
    try:
        cps = getattr(subscription, 'current_period_start', None)
        cpe = getattr(subscription, 'current_period_end', None)
        if cps and cpe:
            return cps, cpe
    except Exception:
        pass

    # Fallback 1: latest invoice for this subscription
    try:
        invoices = await stripe.Invoice.list_async(subscription=subscription.id, limit=1)
        if invoices and getattr(invoices, 'data', None):
            inv = invoices.data[0]
            ps = getattr(inv, 'period_start', None) or (inv.get('period_start') if isinstance(inv, dict) else None)
            pe = getattr(inv, 'period_end', None) or (inv.get('period_end') if isinstance(inv, dict) else None)
            if ps and pe:
                return ps, pe
    except Exception as e:
        logger.warning(f"[PERIOD FALLBACK] Unable to use latest invoice: {e}")

    # Fallback 2: subscription schedule phases
    try:
        sched_id = getattr(subscription, 'schedule', None)
        if sched_id:
            sched = await stripe.SubscriptionSchedule.retrieve_async(sched_id, expand=['phases'])
            phases = getattr(sched, 'phases', None) or (sched.get('phases') if isinstance(sched, dict) else None)
            if phases:
                now_ts = int(datetime.now(timezone.utc).timestamp())
                for ph in phases:
                    s = ph.get('start_date')
                    e = ph.get('end_date')
                    if s and ((e and s <= now_ts <= e) or (not e and s <= now_ts)):
                        return s, e or (s + 30 * 24 * 3600)
    except Exception as e:
        logger.warning(f"[PERIOD FALLBACK] Unable to use schedule phases: {e}")

    # Fallback 3: approximate from created + interval
    try:
        created = getattr(subscription, 'created', None)
        if created:
            interval = 'month'
            interval_count = 1
            try:
                items = subscription.items.data if hasattr(subscription.items, 'data') else []
                if items:
                    pr = items[0].price
                    rec = getattr(pr, 'recurring', None)
                    if rec:
                        interval = getattr(rec, 'interval', interval) or interval
                        interval_count = getattr(rec, 'interval_count', interval_count) or interval_count
            except Exception:
                pass
            if interval == 'year':
                delta_days = 365 * interval_count
            elif interval == 'week':
                delta_days = 7 * interval_count
            else:
                delta_days = 30 * interval_count
            return created, created + delta_days * 24 * 3600
    except Exception:
        pass

    return None, None

async def fix_missing_subscription(
    user_email: str,
    dry_run: bool = False,
    override_price_id: str | None = None,
    override_tier: str | None = None,
    override_subscription_id: str | None = None,
    grant_initial_balance: bool = False,
    force_monthly: bool = False,
):
    logger.info("="*80)
    logger.info(f"FIXING SUBSCRIPTION FOR {user_email}")
    logger.info("="*80)
    
    db = DBConnection()
    await db.initialize()
    client = await db.client
    
    result = await client.rpc('get_user_account_by_email', {
        'email_input': user_email.lower()
    }).execute()
    
    if not result.data:
        logger.error(f"❌ User {user_email} not found in database")
        return
    
    account_id = result.data['id']
    logger.info(f"✅ Found user: {user_email}")
    logger.info(f"   Account ID: {account_id}")
    logger.info(f"   Account name: {result.data.get('name', 'N/A')}")
    
    billing_customer_result = await client.schema('basejump').from_('billing_customers').select('id, account_id').eq('account_id', account_id).execute()

    stripe_customer_id = None

    # If a subscription override is provided, prefer its customer for linking
    sub_override_customer_id = None
    if override_subscription_id:
        try:
            sub_min = await stripe.Subscription.retrieve_async(override_subscription_id)
            cust = getattr(sub_min, 'customer', None)
            if isinstance(cust, str):
                sub_override_customer_id = cust
            elif getattr(cust, 'id', None):
                sub_override_customer_id = cust.id
        except Exception as e:
            logger.warning(f"Failed to retrieve subscription {override_subscription_id} to resolve customer: {e}")

    if billing_customer_result.data:
        existing_link_id = billing_customer_result.data[0]['id']
        if sub_override_customer_id and existing_link_id != sub_override_customer_id:
            logger.warning(f"⚠️ Billing link points to {existing_link_id}, but subscription {override_subscription_id} belongs to {sub_override_customer_id}")
            if not dry_run:
                try:
                    await client.schema('basejump').from_('billing_customers').update({
                        'id': sub_override_customer_id,
                        'email': user_email.lower()
                    }).eq('account_id', account_id).execute()
                    logger.info(f"✅ Updated billing_customers link to {sub_override_customer_id}")
                    stripe_customer_id = sub_override_customer_id
                except Exception as e:
                    logger.warning(f"Update failed; trying delete+insert for billing_customers: {e}")
                    try:
                        await client.schema('basejump').from_('billing_customers').delete().eq('account_id', account_id).execute()
                        await client.schema('basejump').from_('billing_customers').insert({
                            'id': sub_override_customer_id,
                            'account_id': account_id,
                            'email': user_email.lower()
                        }).execute()
                        logger.info(f"✅ Replaced billing_customers link with {sub_override_customer_id}")
                        stripe_customer_id = sub_override_customer_id
                    except Exception as e2:
                        logger.error(f"❌ Failed to replace billing_customers link: {e2}")
        else:
            stripe_customer_id = existing_link_id
            logger.info(f"✅ Found Stripe customer link: {stripe_customer_id}")
    else:
        if sub_override_customer_id:
            logger.info(f"Linking subscription's customer {sub_override_customer_id} to account {account_id}")
            if not dry_run:
                await client.schema('basejump').from_('billing_customers').insert({
                    'id': sub_override_customer_id,
                    'account_id': account_id,
                    'email': user_email.lower()
                }).execute()
            stripe_customer_id = sub_override_customer_id
        else:
            logger.warning(f"⚠️ No billing customer link found for account {account_id}. Searching Stripe by email {user_email}...")
            try:
                candidates = await stripe.Customer.list_async(email=user_email.lower(), limit=10)
            except Exception as e:
                logger.error(f"Error searching Stripe customers by email: {e}")
                candidates = None

            chosen_customer = None
            if candidates and getattr(candidates, 'data', None):
                for cust in candidates.data:
                    try:
                        subs = await stripe.Subscription.list_async(customer=cust.id, status='all', limit=10)
                        if any(s.status in ['active', 'trialing'] for s in subs.data or []):
                            chosen_customer = cust
                            break
                    except Exception:
                        continue
                if not chosen_customer:
                    chosen_customer = sorted(candidates.data, key=lambda c: getattr(c, 'created', 0), reverse=True)[0]

            if chosen_customer:
                stripe_customer_id = chosen_customer.id
                logger.info(f"✅ Will link existing Stripe customer {stripe_customer_id} to account {account_id}")
                if not dry_run:
                    await client.schema('basejump').from_('billing_customers').insert({
                        'id': stripe_customer_id,
                        'account_id': account_id,
                        'email': user_email.lower()
                    }).execute()
            else:
                logger.info("No existing Stripe customer found; creating a new one…")
                if dry_run:
                    logger.info("[DRY RUN] Would create Stripe customer and insert billing_customers link")
                    return
                new_customer = await stripe.Customer.create_async(email=user_email.lower(), metadata={'account_id': account_id})
                stripe_customer_id = new_customer.id
                await client.schema('basejump').from_('billing_customers').insert({
                    'id': stripe_customer_id,
                    'account_id': account_id,
                    'email': user_email.lower()
                }).execute()
                logger.info(f"✅ Created and linked Stripe customer: {stripe_customer_id}")
    
    logger.info("\n" + "="*80)
    logger.info("FETCHING STRIPE SUBSCRIPTION & SCHEDULES")
    logger.info("="*80)
    
    if override_subscription_id:
        logger.info(f"Using override subscription id: {override_subscription_id}")
        full = await stripe.Subscription.retrieve_async(
            override_subscription_id,
            expand=['items.data.price', 'schedule']
        )
        subscriptions = type('obj', (), {'data': [full]})
    else:
        subscriptions = await stripe.Subscription.list_async(
            customer=stripe_customer_id,
            status='all',
            limit=10
        )
    
    if not subscriptions.data:
        logger.error(f"❌ No subscriptions found in Stripe for customer {stripe_customer_id}")
        return
    
    logger.info(f"Found {len(subscriptions.data)} subscription(s) in Stripe")
    
    active_sub = None
    for sub in subscriptions.data:
        if sub.status in ['active', 'trialing']:
            full_sub = await stripe.Subscription.retrieve_async(
                sub.id,
                expand=['items.data.price', 'schedule']
            )
            active_sub = full_sub
            break
    
    if not active_sub:
        logger.error("❌ No active or trialing subscription found")
        logger.info("\nAll subscriptions:")
        for sub in subscriptions.data:
            logger.info(f"  - {sub.id}: {sub.status}")
        return
    
    subscription = active_sub
    
    logger.info(f"\nActive subscription found:")
    logger.info(f"  ID: {subscription.id}")
    logger.info(f"  Status: {subscription.status}")
    logger.info(f"  Created: {datetime.fromtimestamp(subscription.created).isoformat()}")
    cps, cpe = await _resolve_subscription_period(subscription, stripe_customer_id)
    if cps and cpe:
        logger.info(f"  Current period: {datetime.fromtimestamp(cps).isoformat()} to {datetime.fromtimestamp(cpe).isoformat()}")
    else:
        logger.warning("  Current period: unavailable from Stripe; will approximate where needed")
    
    if hasattr(subscription, 'schedule') and subscription.schedule:
        logger.info(f"  Has schedule: {subscription.schedule}")
        try:
            schedule = await stripe.SubscriptionSchedule.retrieve_async(
                subscription.schedule,
                expand=['phases.items.price']
            )
            logger.info(f"\n  Schedule details:")
            logger.info(f"    Status: {schedule.status}")
            logger.info(f"    Phases: {len(schedule.phases)}")
            for idx, phase in enumerate(schedule.phases):
                logger.info(f"    Phase {idx + 1}:")
                logger.info(f"      Start: {datetime.fromtimestamp(phase['start_date']).isoformat()}")
                logger.info(f"      End: {datetime.fromtimestamp(phase['end_date']).isoformat() if phase.get('end_date') else 'ongoing'}")
                if phase.get('items'):
                    for item in phase['items']:
                        price = item.get('price')
                        if isinstance(price, str):
                            price_obj = await stripe.Price.retrieve_async(price)
                            logger.info(f"      Price ID: {price}")
                            logger.info(f"      Amount: ${price_obj.unit_amount / 100:.2f}")
                        elif hasattr(price, 'id'):
                            logger.info(f"      Price ID: {price.id}")
                            logger.info(f"      Amount: ${price.unit_amount / 100:.2f}")
        except Exception as e:
            logger.error(f"  Failed to retrieve schedule: {e}")
    
    logger.info("\n" + "="*80)
    logger.info("PROCESSING SUBSCRIPTION ITEMS")
    logger.info("="*80)
    
    price_id = None
    price = None
    
    # Overrides take precedence over Stripe detection
    price_id = None
    price = None
    if override_price_id:
        logger.info(f"Override price_id provided: {override_price_id}")
        price_id = override_price_id
        try:
            price = await stripe.Price.retrieve_async(price_id)
        except Exception:
            price = None
    try:
        items_data = subscription.items.data if hasattr(subscription.items, 'data') else []
    except Exception:
        items_data = []

    if not price_id and items_data:
        # Prefer first item with a priced plan and non-zero amount
        chosen = None
        for it in items_data:
            pr = getattr(it, 'price', None)
            amt = getattr(pr, 'unit_amount', None) if pr else None
            if pr and (amt is None or amt > 0):
                chosen = it
                break
        if not chosen:
            chosen = items_data[0]
        price_id = chosen.price.id
        price = chosen.price
        logger.info(f"✅ Found price from subscription items: {price_id}")
    elif not price_id:
        logger.warning("⚠️ Subscription retrieve returned no items; trying SubscriptionItem.list…")
        try:
            sub_items = await stripe.SubscriptionItem.list_async(
                subscription=subscription.id,
                limit=10,
                expand=['data.price']
            )
            if sub_items and getattr(sub_items, 'data', None):
                chosen = None
                for it in sub_items.data:
                    pr = getattr(it, 'price', None)
                    amt = getattr(pr, 'unit_amount', None) if pr else None
                    if pr and (amt is None or amt > 0):
                        chosen = it
                        break
                if not chosen:
                    chosen = sub_items.data[0]
                price = chosen.price
                price_id = price.id
                logger.info(f"✅ Found price via SubscriptionItem.list: {price_id}")
            else:
                logger.info("No subscription items found via API; checking invoices for price…")
                raise Exception("no_subscription_items")
        except Exception:
            logger.info("\n⚠️  Attempting to extract price from recent invoices…")
            try:
                invoices = await stripe.Invoice.list_async(
                    subscription=subscription.id,
                    limit=10
                )
                if invoices and getattr(invoices, 'data', None):
                    picked_line = None
                    picked_invoice = None
                    # Prefer paid invoices with >0 amount and a line with price
                    for inv in invoices.data:
                        lines = getattr(inv, 'lines', None)
                        data = getattr(lines, 'data', []) if lines else []
                        for ln in data:
                            pr = getattr(ln, 'price', None)
                            amt = getattr(pr, 'unit_amount', None) if pr else None
                            if pr and (amt is None or amt > 0) and getattr(inv, 'amount_paid', 0) > 0:
                                picked_line = ln
                                picked_invoice = inv
                                break
                        if picked_line:
                            break
                    # Fallback to any line with a price
                    if not picked_line:
                        for inv in invoices.data:
                            lines = getattr(inv, 'lines', None)
                            data = getattr(lines, 'data', []) if lines else []
                            for ln in data:
                                pr = getattr(ln, 'price', None)
                                if pr:
                                    picked_line = ln
                                    picked_invoice = inv
                                    break
                            if picked_line:
                                break
                    if picked_line and getattr(picked_line, 'price', None):
                        price = picked_line.price
                        price_id = price.id
                        logger.info(f"✅ Found price from invoice {picked_invoice.id}: {price_id}")
                    else:
                        logger.error("❌ Could not find a price on recent invoice lines")
                        return
                else:
                    logger.error("❌ No invoices found for subscription")
                    return
            except Exception as e:
                logger.error(f"Failed to extract price from invoices: {e}")
                return
    
    if not price_id or not price:
        logger.error("❌ Could not determine price ID")
        return
    
    logger.info(f"\nSubscription details:")
    logger.info(f"  Price ID: {price_id}")
    try:
        unit_amount = getattr(price, 'unit_amount', None)
        logger.info(f"  Amount: ${ (unit_amount or 0) / 100:.2f}")
    except Exception:
        logger.info("  Amount: N/A")
    try:
        currency = getattr(price, 'currency', None)
        logger.info(f"  Currency: {currency or 'N/A'}")
    except Exception:
        logger.info("  Currency: N/A")
    try:
        rec = getattr(price, 'recurring', None)
        interval = getattr(rec, 'interval', None) if rec else None
        logger.info(f"  Interval: {interval or 'N/A'}")
    except Exception:
        logger.info("  Interval: N/A")
    
    # Try to compute recent MRR from invoices for diagnostics and fallback
    recent_mrr = 0
    try:
        invs = await stripe.Invoice.list_async(subscription=subscription.id, limit=5)
        if invs and getattr(invs, 'data', None):
            recent_mrr = max([(getattr(i, 'amount_paid', 0) or getattr(i, 'amount_due', 0) or 0) for i in invs.data] or [0])
    except Exception:
        pass

    # Determine target tier (overrides > mapping)
    tier = None
    if override_tier:
        tier = get_tier_by_name(override_tier)
        if not tier:
            logger.error(f"❌ Unknown override tier '{override_tier}' — aborting")
            return
        logger.info(f"Using override tier: {tier.name}")
    if not tier:
        tier = get_tier_by_price_id(price_id) if price_id else None
    
    # If Stripe returns a $0 price or maps to free but invoices show paid MRR, try schedule price
    try:
        unit_amount = getattr(price, 'unit_amount', None)
    except Exception:
        unit_amount = None
    if not override_tier and (tier is None or tier.name == 'free') and (recent_mrr and recent_mrr > 0):
        try:
            sched_id = getattr(subscription, 'schedule', None)
            if sched_id:
                sched = await stripe.SubscriptionSchedule.retrieve_async(sched_id, expand=['phases.items.price'])
                phases = getattr(sched, 'phases', None) or (sched.get('phases') if isinstance(sched, dict) else None)
                if phases:
                    picked = None
                    for ph in phases:
                        for it in ph.get('items', []) or []:
                            pr = it.get('price') if isinstance(it, dict) else getattr(it, 'price', None)
                            amt = (pr.get('unit_amount') if isinstance(pr, dict) else getattr(pr, 'unit_amount', None)) if pr else None
                            if pr and amt and amt > 0:
                                picked = pr
                                break
                        if picked:
                            break
                    if picked:
                        new_price_id = picked.get('id') if isinstance(picked, dict) else getattr(picked, 'id', None)
                        if new_price_id:
                            logger.info(f"✅ Using schedule price as authoritative: {new_price_id}")
                            price_id = new_price_id
                            price = picked
                            tier = get_tier_by_price_id(price_id)
        except Exception as e:
            logger.warning(f"[SCHEDULE FALLBACK] Failed to resolve from schedule: {e}")
    if not tier:
        logger.error(f"❌ Price ID {price_id} doesn't match any known tier")
        logger.info("\nKnown yearly commitment price IDs:")
        logger.info(f"  Prod $17/mo: {config.STRIPE_TIER_2_17_YEARLY_COMMITMENT_ID}")
        logger.info(f"  Prod $42.50/mo: {config.STRIPE_TIER_6_42_YEARLY_COMMITMENT_ID}")
        logger.info(f"  Prod $170/mo: {config.STRIPE_TIER_25_170_YEARLY_COMMITMENT_ID}")
        # Try to infer tier from MRR on invoices if price mapping changed
        if recent_mrr and recent_mrr > 0:
            logger.error(
                "❌ Paid invoices detected (MRR ${:.2f}) but no tier mapping found. "
                "Pass --tier <tier_name> or add the Stripe price ID to core.billing.config TIERS.".format(recent_mrr/100)
            )
        return
    
    logger.info(f"\n✅ Matched to tier: {tier.name} ({tier.display_name})")
    logger.info(f"   Monthly credits: ${tier.monthly_credits}")
    if recent_mrr and recent_mrr > 0 and tier.name == 'free':
        logger.warning(f"[DIAG] Stripe invoices show paid MRR ${recent_mrr/100:.2f} but mapped tier is 'free' — likely using wrong price. Consider updating core.billing.config price_ids.")
    
    is_commitment = is_commitment_price_id(price_id)
    commitment_duration = get_commitment_duration_months(price_id)

    # If operator explicitly requests to treat this subscription as monthly, clear commitment
    if force_monthly:
        logger.info("Operator requested force-monthly: clearing commitment detection")
        is_commitment = False
        commitment_duration = 0
    
    logger.info(f"   Is commitment: {is_commitment}")
    logger.info(f"   Commitment duration: {commitment_duration} months")
    
    logger.info("\n" + "="*80)
    logger.info("CHECKING CURRENT DATABASE STATE")
    logger.info("="*80)
    
    credit_account = await client.from_('credit_accounts').select('*').eq('account_id', account_id).execute()
    
    if credit_account.data:
        acc = credit_account.data[0]
        logger.info(f"Current credit account state:")
        logger.info(f"  Tier: {acc.get('tier', 'none')}")
        logger.info(f"  Balance: ${acc.get('balance', 0)}")
        logger.info(f"  Subscription ID: {acc.get('stripe_subscription_id', 'None')}")
        logger.info(f"  Commitment type: {acc.get('commitment_type', 'None')}")
        logger.info(f"  Commitment start: {acc.get('commitment_start_date', 'None')}")
        logger.info(f"  Commitment end: {acc.get('commitment_end_date', 'None')}")
    else:
        logger.info("No credit account found - will be created")
    
    logger.info("\n" + "="*80)
    logger.info("UPDATING DATABASE")
    logger.info("="*80)
    
    if cps and cpe:
        start_date = datetime.fromtimestamp(cps, tz=timezone.utc)
        next_grant = datetime.fromtimestamp(cpe, tz=timezone.utc)
    else:
        created_ts = getattr(subscription, 'created', None)
        start_date = datetime.fromtimestamp(created_ts, tz=timezone.utc) if created_ts else datetime.now(timezone.utc)
        # Approximate next grant using price interval if available
        try:
            interval = 'month'
            interval_count = 1
            if price:
                rec = getattr(price, 'recurring', None)
                if rec:
                    interval = getattr(rec, 'interval', interval) or interval
                    interval_count = getattr(rec, 'interval_count', interval_count) or interval_count
            delta_days = 365 * interval_count if interval == 'year' else (7 * interval_count if interval == 'week' else 30 * interval_count)
            next_grant = start_date + timedelta(days=delta_days)
        except Exception:
            next_grant = start_date + timedelta(days=30)
    
    update_data = {
        'tier': tier.name,
        'stripe_subscription_id': subscription.id,
        'billing_cycle_anchor': start_date.isoformat(),
        'next_credit_grant': next_grant.isoformat(),
        'updated_at': datetime.now(timezone.utc).isoformat(),
        'trial_status': 'none'
    }
    
    if is_commitment and commitment_duration > 0:
        end_date = start_date + timedelta(days=365)
        
        update_data.update({
            'commitment_type': 'yearly_commitment',
            'commitment_start_date': start_date.isoformat(),
            'commitment_end_date': end_date.isoformat(),
            'commitment_price_id': price_id,
            'can_cancel_after': end_date.isoformat()
        })
        
        logger.info(f"Setting up yearly commitment:")
        logger.info(f"  Start date: {start_date.date()}")
        logger.info(f"  End date: {end_date.date()}")
        logger.info(f"  Duration: 12 months")
    else:
        update_data.update({
            'commitment_type': None,
            'commitment_start_date': None,
            'commitment_end_date': None,
            'commitment_price_id': None,
            'can_cancel_after': None
        })
        
        logger.info(f"Clearing commitment data (this is a regular monthly subscription)")
    
    if dry_run:
        logger.info("[DRY RUN] Would upsert into credit_accounts: %s", update_data)
    else:
        await client.from_('credit_accounts').upsert(
            {**update_data, 'account_id': account_id},
            on_conflict='account_id'
        ).execute()
    
    logger.info("✅ Updated credit_accounts table" + (" (dry run)" if dry_run else ""))
    
    if not dry_run and is_commitment and commitment_duration > 0:
        existing_commitment = await client.from_('commitment_history').select('id').eq('stripe_subscription_id', subscription.id).execute()
        
        if not existing_commitment.data:
            end_date = start_date + timedelta(days=365)
            
            await client.from_('commitment_history').insert({
                'account_id': account_id,
                'commitment_type': 'yearly_commitment',
                'price_id': price_id,
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'stripe_subscription_id': subscription.id
            }).execute()
            
            logger.info("✅ Created commitment_history record")
        else:
            logger.info("✅ Commitment_history record already exists")
    
    logger.info("\n" + "="*80)
    logger.info("GRANTING INITIAL CREDITS")
    logger.info("="*80)
    
    current_balance = await client.from_('credit_accounts').select('balance').eq('account_id', account_id).execute()
    balance = Decimal(str(current_balance.data[0]['balance'])) if current_balance.data else Decimal('0')
    
    logger.info(f"Current balance: ${balance}")
    
    # Grant initial credits behavior:
    # - Default: only auto-grant when balance < $1 (preserves existing balances)
    # - If `grant_initial_balance` is True: force add tier.monthly_credits to existing balance
    if dry_run:
        if grant_initial_balance:
            logger.info(f"[DRY RUN] Would add ${tier.monthly_credits} to existing balance ${balance} (force add)")
        elif balance < Decimal('1.0'):
            logger.info(f"[DRY RUN] Would grant ${tier.monthly_credits} initial credits (balance is ${balance})")
        else:
            logger.info(f"[DRY RUN] User already has ${balance} credits, skipping initial grant")
    else:
        if grant_initial_balance:
            credits_to_grant = tier.monthly_credits
            logger.info(f"Adding ${credits_to_grant} to existing balance ${balance} (force add)")
            result = await credit_manager.add_credits(
                account_id=account_id,
                amount=credits_to_grant,
                is_expiring=True,
                description=(
                    f"Forced initial credits add for {tier.display_name} (via admin script)"
                )
            )
            if result.get('success'):
                logger.info(f"✅ Added ${credits_to_grant} credits")
                logger.info(f"   New balance: ${result.get('new_total', 0)}")
            else:
                logger.error(f"❌ Failed to add credits: {result.get('error', 'Unknown error')}")
        elif balance < Decimal('1.0'):
            credits_to_grant = tier.monthly_credits
            logger.info(f"Granting ${credits_to_grant} initial credits...")
            result = await credit_manager.add_credits(
                account_id=account_id,
                amount=credits_to_grant,
                is_expiring=True,
                description=(
                    f"Initial credits for {tier.display_name} (yearly commitment)" if is_commitment else
                    f"Initial credits for {tier.display_name}"
                )
            )
            if result.get('success'):
                logger.info(f"✅ Granted ${credits_to_grant} credits")
                logger.info(f"   New balance: ${result.get('new_total', 0)}")
            else:
                logger.error(f"❌ Failed to grant credits: {result.get('error', 'Unknown error')}")
        else:
            logger.info(f"User already has ${balance} credits, skipping initial grant")
    
    logger.info("\n" + "="*80)
    logger.info("VERIFICATION")
    logger.info("="*80)
    
    final_account = await client.from_('credit_accounts').select('*').eq('account_id', account_id).execute()
    
    if final_account.data:
        acc = final_account.data[0]
        logger.info(f"Final credit account state:")
        logger.info(f"  ✅ Tier: {acc.get('tier')}")
        logger.info(f"  ✅ Balance: ${acc.get('balance')}")
        logger.info(f"  ✅ Subscription ID: {acc.get('stripe_subscription_id')}")
        logger.info(f"  ✅ Commitment type: {acc.get('commitment_type')}")
        logger.info(f"  ✅ Commitment start: {acc.get('commitment_start_date')}")
        logger.info(f"  ✅ Commitment end: {acc.get('commitment_end_date')}")
        logger.info(f"  ✅ Next credit grant: {acc.get('next_credit_grant')}")
    
    if is_commitment:
        commitment_history = await client.from_('commitment_history').select('*').eq('account_id', account_id).execute()
        
        if commitment_history.data:
            logger.info(f"\n  ✅ Commitment history records: {len(commitment_history.data)}")
            for record in commitment_history.data:
                logger.info(f"     - Type: {record.get('commitment_type')}, ends: {record.get('end_date')}")
    
    # Invalidate caches so UI reflects changes immediately
    try:
        await Cache.invalidate(f"subscription_tier:{account_id}")
        await Cache.invalidate(f"credit_balance:{account_id}")
        await Cache.invalidate(f"credit_summary:{account_id}")
        logger.info("🧹 Cache invalidated for subscription_tier/credit_balance/credit_summary")
    except Exception as e:
        logger.warning(f"Failed to invalidate cache: {e}")

    logger.info("\n" + "="*80)
    logger.info("✅ SUBSCRIPTION SETUP COMPLETE" + (" (dry run)" if dry_run else ""))
    logger.info("="*80)

def main():
    parser = argparse.ArgumentParser(
        description='Fix missing subscription for a user by syncing Stripe subscription data to database'
    )
    parser.add_argument(
        'email',
        type=str,
        help='Email address of the user to fix subscription for'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Run without writing changes'
    )
    parser.add_argument(
        '--price-id',
        type=str,
        help='Override Stripe price ID to map tier when Stripe data is ambiguous'
    )
    parser.add_argument(
        '--tier',
        type=str,
        help='Override tier name directly (e.g., tier_6_50); bypasses price mapping'
    )
    parser.add_argument(
        '--subscription-id',
        type=str,
        help='Override Stripe subscription ID if customer has multiple'
    )
    parser.add_argument(
        '--grant-initial-balance',
        action='store_true',
        help='Force-add the tier monthly credits to the existing balance (use with care)'
    )
    parser.add_argument(
        '--force-monthly',
        action='store_true',
        help='Treat this subscription as a regular monthly plan; clear any detected yearly commitment'
    )
    
    args = parser.parse_args()
    asyncio.run(
        fix_missing_subscription(
            args.email,
            dry_run=args.dry_run,
            override_price_id=args.price_id,
            override_tier=args.tier,
            override_subscription_id=args.subscription_id,
            grant_initial_balance=args.grant_initial_balance,
            force_monthly=args.force_monthly,
        )
    )

if __name__ == "__main__":
    main()

