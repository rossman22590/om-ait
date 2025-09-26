from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, List, Optional
import logging
import httpx
import json
from core.utils.auth_utils import verify_and_get_user_id_from_jwt
from core.services.supabase import DBConnection
from core.utils.config import config

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/avatars", tags=["avatars"])

ARGIL_API_BASE_URL = "https://api.argil.ai/v1"

# Manual mapping of Stripe subscription IDs to avatar and voice IDs
SUBSCRIPTION_AVATAR_MAPPING = {
    "sub_1RPIrBG23sSyONuFPBbXYR75": {
        "avatar_id": "agril_avatar_1",
        "voice_id": "voice_sarah_professional"
    },
    "sub_1RLyW4G23sSyONuFK0bSqhxK": {
        "avatar_id": "764a8a66-8798-47e0-a5f1-edec1ac6f612",
        "voice_id": "a986becb-be3f-47da-865e-bbccffc08f87"
    },
    # Add more mappings here as needed
    # "sub_ekdowfu83r389r": {
    #     "avatar_id": "agril_avatar_2", 
    #     "voice_id": "voice_john_casual"
    # }
}

async def _make_argil_request(method: str, endpoint: str, payload: Optional[Dict] = None) -> Dict:
    """Make request to Argil AI API"""
    api_key = getattr(config, 'ARGIL_API_KEY', None)
    if not api_key:
        return {"error": "ARGIL_API_KEY not configured."}
    
    url = f"{ARGIL_API_BASE_URL}{endpoint}"
    headers = {
        "x-api-key": api_key,
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            if method == "GET":
                response = await client.get(url, headers=headers)
            elif method == "POST":
                response = await client.post(url, headers=headers, json=payload)
            else:
                return {"error": f"Unsupported HTTP method: {method}"}
            
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"Argil API HTTP error for {method} {url}: {e.response.status_code} - {e.response.text}")
            return {"error": f"Argil API error: {e.response.status_code}", "details": e.response.text}
        except httpx.RequestError as e:
            logger.error(f"Argil API request error for {method} {url}: {e}")
            return {"error": f"Argil API request error: {str(e)}"}
        except json.JSONDecodeError as e:
            logger.error(f"Argil API JSON decode error for {method} {url}: {e}")
            return {"error": "Failed to decode Argil API response."}

@router.get("/my-avatars")
async def get_user_avatars(
    account_id: str = Depends(verify_and_get_user_id_from_jwt)
) -> Dict:
    """
    Get avatars and voices associated with user's Stripe subscription ID
    """
    try:
        logger.info(f"[AVATARS] Fetching avatars for account {account_id}")
        
        # Get user's credit account info including stripe_subscription_id
        db = DBConnection()
        client = await db.client
        result = await client.from_('credit_accounts').select(
            'stripe_subscription_id, tier, balance'
        ).eq('account_id', account_id).execute()
        
        if not result.data:
            logger.warning(f"[AVATARS] No credit account found for account {account_id}")
            return {
                "success": False,
                "message": "No subscription found",
                "avatars": []
            }
        
        credit_account = result.data[0]
        stripe_sub_id = credit_account.get('stripe_subscription_id')
        
        if not stripe_sub_id:
            logger.warning(f"[AVATARS] No Stripe subscription ID for account {account_id}")
            return {
                "success": False,
                "message": "No active subscription found",
                "avatars": []
            }
        
        logger.info(f"[AVATARS] Found subscription ID: {stripe_sub_id} for account {account_id}")
        
        # Check if subscription has mapped avatars
        if stripe_sub_id in SUBSCRIPTION_AVATAR_MAPPING:
            mapping = SUBSCRIPTION_AVATAR_MAPPING[stripe_sub_id]
            
            # Fetch live avatar and voice data from Argil API
            avatars_response = await _make_argil_request("GET", "/avatars")
            voices_response = await _make_argil_request("GET", "/voices")
            
            if "error" in avatars_response or "error" in voices_response:
                logger.error(f"[AVATARS] API error: avatars={avatars_response}, voices={voices_response}")
                return {
                    "success": False,
                    "message": "Failed to fetch live avatar/voice data",
                    "avatars": []
                }
            
            # Find the specific avatar and voice data
            avatar_data = None
            voice_data = None
            
            # Handle different response formats
            avatars_list = avatars_response if isinstance(avatars_response, list) else avatars_response.get('avatars', [])
            voices_list = voices_response if isinstance(voices_response, list) else voices_response.get('voices', [])
            
            # Find avatar by ID
            for avatar in avatars_list:
                if avatar.get("id") == mapping["avatar_id"]:
                    avatar_data = avatar
                    break
            
            # Find voice by ID
            for voice in voices_list:
                if voice.get("id") == mapping["voice_id"]:
                    voice_data = voice
                    break
            
            if not avatar_data or not voice_data:
                logger.warning(f"[AVATARS] Could not find avatar or voice data for {stripe_sub_id}")
                return {
                    "success": False,
                    "message": f"Avatar or voice not found (avatar: {bool(avatar_data)}, voice: {bool(voice_data)})",
                    "avatars": []
                }
            
            avatars = [{
                "avatar_id": mapping["avatar_id"],
                "voice_id": mapping["voice_id"],
                "avatar_name": avatar_data.get("name", "Unknown Avatar"),
                "avatar_thumbnail": avatar_data.get("thumbnailUrl"),
                "voice_name": voice_data.get("name", "Unknown Voice"),
                "voice_sample": voice_data.get("sampleUrl"),
                "voice_status": voice_data.get("status"),
                "subscription_id": stripe_sub_id,
                "tier": credit_account.get('tier'),
                "balance": credit_account.get('balance')
            }]
            
            logger.info(f"[AVATARS] Found {len(avatars)} avatars for subscription {stripe_sub_id}")
            
            return {
                "success": True,
                "message": f"Found {len(avatars)} avatar(s)",
                "avatars": avatars,
                "subscription_id": stripe_sub_id
            }
        else:
            logger.info(f"[AVATARS] No avatar mapping found for subscription {stripe_sub_id}")
            return {
                "success": True,
                "message": "No avatars assigned to your subscription",
                "avatars": [],
                "subscription_id": stripe_sub_id
            }
            
    except Exception as e:
        logger.error(f"[AVATARS] Error fetching avatars for account {account_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch avatars: {str(e)}")

@router.get("/mapping")
async def get_avatar_mapping(
    account_id: str = Depends(verify_and_get_user_id_from_jwt)
) -> Dict:
    """
    Get the current avatar mapping (for admin purposes)
    """
    try:
        logger.info(f"[AVATARS] Admin fetching avatar mapping for account {account_id}")
        
        return {
            "success": True,
            "mapping": SUBSCRIPTION_AVATAR_MAPPING,
            "total_mappings": len(SUBSCRIPTION_AVATAR_MAPPING)
        }
        
    except Exception as e:
        logger.error(f"[AVATARS] Error fetching mapping: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch mapping: {str(e)}")

@router.get("/all")
async def get_all_avatars_and_voices(
    account_id: str = Depends(verify_and_get_user_id_from_jwt)
) -> Dict:
    """
    Get all available avatars and voices from Argil API, excluding user's owned avatars
    """
    try:
        logger.info(f"[AVATARS] Fetching all avatars and voices for account {account_id}")
        
        # Get user's credit account info to check their subscription
        db = DBConnection()
        client = await db.client
        result = await client.from_('credit_accounts').select(
            'stripe_subscription_id'
        ).eq('account_id', account_id).execute()
        
        # Get user's owned avatar/voice IDs
        user_avatar_ids = set()
        user_voice_ids = set()
        
        if result.data:
            stripe_sub_id = result.data[0].get('stripe_subscription_id')
            if stripe_sub_id and stripe_sub_id in SUBSCRIPTION_AVATAR_MAPPING:
                mapping = SUBSCRIPTION_AVATAR_MAPPING[stripe_sub_id]
                user_avatar_ids.add(mapping["avatar_id"])
                user_voice_ids.add(mapping["voice_id"])
                logger.info(f"[AVATARS] User owns avatar {mapping['avatar_id']} and voice {mapping['voice_id']}")
        
        # Fetch all avatars and voices from Argil API
        avatars_response = await _make_argil_request("GET", "/avatars")
        voices_response = await _make_argil_request("GET", "/voices")
        
        if "error" in avatars_response or "error" in voices_response:
            logger.error(f"[AVATARS] API error: avatars={avatars_response}, voices={voices_response}")
            return {
                "success": False,
                "message": "Failed to fetch avatars/voices from Argil API",
                "avatars": [],
                "voices": []
            }
        
        # Handle different response formats
        avatars_list = avatars_response if isinstance(avatars_response, list) else avatars_response.get('avatars', [])
        voices_list = voices_response if isinstance(voices_response, list) else voices_response.get('voices', [])
        
        # Combine avatars with matching voices by name, excluding user's owned items
        combined_avatars = []
        
        for avatar in avatars_list:
            avatar_id = avatar.get("id")
            avatar_name = avatar.get("name", "").lower()
            
            # Skip if user already owns this avatar
            if avatar_id in user_avatar_ids:
                logger.info(f"[AVATARS] Excluding owned avatar {avatar_id}")
                continue
            
            # Find matching voice by name
            matching_voice = None
            for voice in voices_list:
                voice_name = voice.get("name", "").lower()
                voice_id = voice.get("id")
                
                # Skip if user already owns this voice
                if voice_id in user_voice_ids:
                    continue
                
                # Try exact match first
                if avatar_name == voice_name:
                    matching_voice = voice
                    break
                
                # Try partial match - check if avatar name contains voice name or vice versa
                avatar_base_name = avatar_name.split()[0] if ' ' in avatar_name else avatar_name
                voice_base_name = voice_name.split()[0] if ' ' in voice_name else voice_name
                
                if (avatar_base_name in voice_name or voice_base_name in avatar_name or
                    avatar_base_name == voice_base_name):
                    matching_voice = voice
                    break
            
            combined_avatar = {
                "avatar_id": avatar_id,
                "avatar_name": avatar.get("name", "Unknown Avatar"),
                "avatar_thumbnail": avatar.get("thumbnailUrl"),
                "avatar_status": avatar.get("status"),
                "voice_id": matching_voice.get("id") if matching_voice else None,
                "voice_name": matching_voice.get("name") if matching_voice else None,
                "voice_sample": matching_voice.get("sampleUrl") if matching_voice else None,
                "voice_status": matching_voice.get("status") if matching_voice else None,
                "has_voice": matching_voice is not None
            }
            combined_avatars.append(combined_avatar)
        
        # Also add voices that don't have matching avatars (and user doesn't own)
        for voice in voices_list:
            voice_id = voice.get("id")
            voice_name = voice.get("name", "").lower()
            
            # Skip if user already owns this voice
            if voice_id in user_voice_ids:
                logger.info(f"[AVATARS] Excluding owned voice {voice_id}")
                continue
            
            # Check if this voice already has a matching avatar
            has_matching_avatar = any(
                avatar.get("name", "").lower() == voice_name 
                for avatar in avatars_list
                if avatar.get("id") not in user_avatar_ids  # Only check non-owned avatars
            )
            
            if not has_matching_avatar:
                voice_only_item = {
                    "avatar_id": None,
                    "avatar_name": None,
                    "avatar_thumbnail": None,
                    "avatar_status": None,
                    "voice_id": voice_id,
                    "voice_name": voice.get("name", "Unknown Voice"),
                    "voice_sample": voice.get("sampleUrl"),
                    "voice_status": voice.get("status"),
                    "has_voice": True
                }
                combined_avatars.append(voice_only_item)
        
        logger.info(f"[AVATARS] Found {len(combined_avatars)} available items (excluding owned avatars/voices)")
        
        return {
            "success": True,
            "message": f"Found {len(combined_avatars)} available avatars and voices (excluding your owned items)",
            "items": combined_avatars,
            "total_count": len(combined_avatars),
            "excluded_owned": len(user_avatar_ids) + len(user_voice_ids) > 0
        }
        
    except Exception as e:
        logger.error(f"[AVATARS] Error fetching all avatars and voices: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch all avatars and voices: {str(e)}")

@router.post("/test-mapping")
async def test_avatar_mapping(
    test_sub_id: str,
    account_id: str = Depends(verify_and_get_user_id_from_jwt)
) -> Dict:
    """
    Test avatar mapping with a specific subscription ID (for testing purposes)
    """
    try:
        logger.info(f"[AVATARS] Testing mapping for subscription {test_sub_id}")
        
        if test_sub_id in SUBSCRIPTION_AVATAR_MAPPING:
            mapping = SUBSCRIPTION_AVATAR_MAPPING[test_sub_id]
            return {
                "success": True,
                "message": "Mapping found",
                "mapping": mapping,
                "subscription_id": test_sub_id
            }
        else:
            return {
                "success": False,
                "message": "No mapping found for this subscription ID",
                "subscription_id": test_sub_id
            }
            
    except Exception as e:
        logger.error(f"[AVATARS] Error testing mapping: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to test mapping: {str(e)}")
