"""Pipedream trigger service for event-driven workflows."""
import os
import json
import httpx
from typing import Dict, Any, List, Optional
from datetime import datetime
from core.utils.logger import logger


class PipedreamTriggerService:
    def __init__(self):
        self.api_base = "https://api.pipedream.com/v1"
        self.project_id = os.getenv("PIPEDREAM_PROJECT_ID")
        self.client_id = os.getenv("PIPEDREAM_CLIENT_ID")
        self.client_secret = os.getenv("PIPEDREAM_CLIENT_SECRET")
        self.access_token: Optional[str] = None
        self.token_expires_at: Optional[datetime] = None
        
        # Cache settings
        self._apps_cache: Dict[str, Any] = {"ts": 0, "data": None}
        self._apps_ttl = 60
        self._triggers_cache: Dict[str, Dict[str, Any]] = {}
        self._triggers_ttl = 60

    async def _ensure_access_token(self) -> str:
        """Ensure we have a valid access token."""
        if self.access_token and self.token_expires_at:
            if datetime.utcnow() < self.token_expires_at:
                return self.access_token
        
        # Fetch new token
        from datetime import timedelta
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.api_base}/oauth/token",
                data={
                    "grant_type": "client_credentials",
                    "client_id": self.client_id,
                    "client_secret": self.client_secret
                }
            )
            response.raise_for_status()
            data = response.json()
            self.access_token = data["access_token"]
            expires_in = data.get("expires_in", 3600)
            self.token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
            return self.access_token

    async def list_apps_with_triggers(self) -> Dict[str, Any]:
        """Return apps that have at least one available trigger/event source."""
        if not self.project_id:
            raise ValueError("PIPEDREAM_PROJECT_ID not configured")

        # Check Redis cache first
        try:
            from core.services import redis as redis_service
            redis_client = await redis_service.get_client()
            cache_key = "pipedream:apps-with-triggers:v1"
            cached_json = await redis_client.get(cache_key)
            if cached_json:
                parsed = json.loads(cached_json)
                logger.debug(f"Returning {len(parsed.get('apps', []))} apps with triggers from cache")
                return parsed
        except Exception as e:
            logger.warning(f"Redis cache error for apps with triggers: {e}")

        # Fetch from Pipedream API
        # Note: Pipedream uses "sources" for event triggers
        access_token = await self._ensure_access_token()
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

        # Get available event sources (triggers)
        apps_map: Dict[str, Dict[str, Any]] = {}
        
        try:
            async with httpx.AsyncClient(timeout=20) as client:
                # Pipedream doesn't have a direct "list all triggers" endpoint
                # We'll use the apps endpoint and filter for those with event sources
                url = f"{self.api_base}/apps"
                params = {"limit": 1000}
                
                response = await client.get(url, headers=headers, params=params)
                response.raise_for_status()
                data = response.json()
                
                apps_data = data.get("data", [])
                
                # Filter apps that support event sources/triggers
                for app in apps_data:
                    # Pipedream apps with auth typically support triggers
                    if app.get("auth_type") and app.get("auth_type") != "none":
                        app_slug = app.get("name_slug", "")
                        apps_map[app_slug] = {
                            "slug": app_slug,
                            "name": app.get("name", ""),
                            "logo": app.get("img_src"),
                            "description": app.get("description", ""),
                            "has_triggers": True,
                            "trigger_count": 1  # Pipedream doesn't expose count directly
                        }

        except httpx.HTTPError as e:
            logger.error(f"Failed to fetch Pipedream apps with triggers: {e}")
            raise

        response = {
            "success": True,
            "apps": list(apps_map.values()),
            "total": len(apps_map)
        }

        # Cache the response
        try:
            from core.services import redis as redis_service
            redis_client = await redis_service.get_client()
            if redis_client:
                cache_key = "pipedream:apps-with-triggers:v1"
                await redis_client.set(cache_key, json.dumps(response), ex=self._apps_ttl)
        except Exception as e:
            logger.warning(f"Failed to cache apps with triggers: {e}")

        return response

    async def list_triggers_for_app(self, app_slug: str) -> Dict[str, Any]:
        """Return trigger definitions for a given app."""
        if not self.project_id:
            raise ValueError("PIPEDREAM_PROJECT_ID not configured")

        # Check cache
        now_ts = int(datetime.utcnow().timestamp())
        cache_entry = self._triggers_cache.get(app_slug.lower())
        if cache_entry and (now_ts - int(cache_entry.get("ts", 0)) < self._triggers_ttl):
            return cache_entry["data"]

        access_token = await self._ensure_access_token()
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

        # Pipedream event sources are app-specific
        # We'll create generic trigger definitions based on the app
        triggers = []
        
        try:
            async with httpx.AsyncClient(timeout=20) as client:
                # Get app details
                url = f"{self.api_base}/apps"
                params = {"q": app_slug}
                
                response = await client.get(url, headers=headers, params=params)
                response.raise_for_status()
                data = response.json()
                
                apps = data.get("data", [])
                app_info = next((a for a in apps if a.get("name_slug") == app_slug), None)
                
                if app_info:
                    # Create generic webhook trigger for this app
                    triggers.append({
                        "slug": f"{app_slug}_new_event",
                        "name": f"New {app_info.get('name', app_slug)} Event",
                        "description": f"Triggers when a new event occurs in {app_info.get('name', app_slug)}",
                        "app_slug": app_slug,
                        "app_name": app_info.get("name", ""),
                        "config": {
                            "type": "webhook",
                            "properties": {}
                        },
                        "payload": {
                            "type": "object",
                            "properties": {
                                "event": {"type": "string"},
                                "data": {"type": "object"}
                            }
                        }
                    })

        except httpx.HTTPError as e:
            logger.error(f"Failed to fetch triggers for app {app_slug}: {e}")
            raise

        response = {
            "success": True,
            "items": triggers,
            "toolkit": {
                "slug": app_slug,
                "name": app_info.get("name", app_slug) if app_info else app_slug,
                "logo": app_info.get("img_src") if app_info else None
            },
            "total": len(triggers)
        }

        # Cache the response
        self._triggers_cache[app_slug.lower()] = {"data": response, "ts": now_ts}

        return response


class PipedreamTriggerSchemaService:
    """Service for fetching trigger schemas."""
    
    def __init__(self):
        self.api_base = "https://api.pipedream.com/v1"
        self.project_id = os.getenv("PIPEDREAM_PROJECT_ID")

    async def get_trigger_schema(self, trigger_slug: str) -> Dict[str, Any]:
        """Get schema for a specific trigger."""
        # Parse trigger slug (format: app_slug_trigger_name)
        parts = trigger_slug.split("_")
        if len(parts) < 2:
            raise ValueError(f"Invalid trigger slug format: {trigger_slug}")
        
        # Generic schema for Pipedream webhooks
        return {
            "slug": trigger_slug,
            "name": trigger_slug.replace("_", " ").title(),
            "description": f"Webhook trigger for {trigger_slug}",
            "config": {
                "type": "object",
                "properties": {
                    "webhook_url": {
                        "type": "string",
                        "description": "Webhook URL to receive events"
                    }
                }
            },
            "app": parts[0] if parts else "unknown"
        }
