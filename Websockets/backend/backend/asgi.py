"""
ASGI config for backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os
import django
from channels.routing import ProtocolTypeRouter, URLRouter
#from channels.auth import AuthMiddlewareStack
from django.core.asgi import get_asgi_application
from app.routing import websocket_urlpatterns

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from app.auth_middleware import TokenAuthMiddleware

application = ProtocolTypeRouter({
   "http": get_asgi_application(),
   "websocket": TokenAuthMiddleware(
       URLRouter(
           websocket_urlpatterns
       )
   ),
})