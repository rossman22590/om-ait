from ..protocols import ConnectionStatusService, ConnectionRepository, ConnectionTokenService, Logger
from ..domain.entities import Profile


class ConnectionStatusService:
    def __init__(self, connection_repo: ConnectionRepository, connection_token_service: ConnectionTokenService, logger: Logger):
        self._connection_repo = connection_repo
        self._connection_token_service = connection_token_service
        self._logger = logger

    async def check_connection_status(self, profile: Profile) -> bool:
        try:
            # First try to get connections
            connections = await self._connection_repo.get_by_external_user_id(profile.external_user_id)
            
            # Check if we have an active connection for this app
            for connection in connections:
                if connection.app.slug == profile.app_slug and connection.is_active:
                    return True
            
            # If no active connection, try to refresh the token silently
            try:
                await self._connection_token_service.create(profile.external_user_id, profile.app_slug)
                # Check connections again after refresh
                connections = await self._connection_repo.get_by_external_user_id(profile.external_user_id)
                for connection in connections:
                    if connection.app.slug == profile.app_slug and connection.is_active:
                        return True
            except Exception as e:
                self._logger.warning(f"Failed to refresh connection for profile {profile.profile_id}: {str(e)}")
            
            return False
        except Exception as e:
            self._logger.warning(f"Error checking connection status for profile {profile.profile_id}: {str(e)}")
            return False

    async def update_connection_status(self, profile: Profile) -> Profile:
        is_connected = await self.check_connection_status(profile)
        profile.update_connection_status(is_connected)
        
        if is_connected and profile.last_used_at is None:
            profile.update_last_used()
        
        return profile 