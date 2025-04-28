import logging
import jwt  # Ensure PyJWT is installed: pip install PyJWT
from django.conf import settings
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser

logger = logging.getLogger(__name__)
User = get_user_model()

@database_sync_to_async
def get_user_from_jwt(token_key):
    logger.info(f"JWT token received: {token_key}")
    try:
        # Decode the JWT using your project's SECRET_KEY and expected algorithm (e.g. HS256)
        payload = jwt.decode(token_key, settings.SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("user_id")
        if user_id is None:
            logger.warning("JWT payload does not include 'user_id'.")
            return AnonymousUser()
        try:
            user = User.objects.get(id=user_id)
            logger.info(f"User {user.username} authenticated with JWT token.")
            return user
        except User.DoesNotExist:
            logger.warning("User not found for given user_id in JWT payload.")
            return AnonymousUser()
    except jwt.ExpiredSignatureError:
        logger.warning("JWT token has expired.")
        return AnonymousUser()
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid JWT token: {e}")
        return AnonymousUser()

class TokenAuthMiddleware(BaseMiddleware):
    """
    Middleware that takes the token from the query string of the WebSocket connection,
    decodes it as a JWT, and attaches the corresponding user to the scope.
    """
    def __init__(self, inner):
        super().__init__(inner)

    async def __call__(self, scope, receive, send):
        query_string = scope.get('query_string', b'').decode()
        token_key = None
        
        for param in query_string.split('&'):
            if param.startswith('token='):
                # Decode the token (ensure URL encoding is handled on the client side)
                token_key = param.split('=')[1]
                break

        if token_key:
            scope['user'] = await get_user_from_jwt(token_key)
        else:
            logger.warning("No token provided in WebSocket query string. Setting user to AnonymousUser.")
            scope['user'] = AnonymousUser()

        return await super().__call__(scope, receive, send)