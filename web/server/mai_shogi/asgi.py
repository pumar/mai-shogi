"""
ASGI config for mai_shogi project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/3.2/howto/deployment/asgi/
"""

import os

# from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from channels.auth import AuthMiddlewareStack
from django.core.asgi import get_asgi_application
from django.urls import re_path

import mai_shogi_site.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mai_shogi.settings')

# Initialize Django ASGI application early to ensure the AppRegistry
# is populated before importing code that may import ORM models.
django_asgi_app = get_asgi_application()

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    # Just HTTP for now. (We can add other protocols later.)
    "websocket": AllowedHostsOriginValidator(
        AuthMiddlewareStack(URLRouter(
            mai_shogi_site.routing.websocket_urlpatterns
            # re_path(
            #     r"^ws/game/computer/(?P<side>\w+)$",
            #     mai_shogi_site.consumers.GameConsumer.as_asgi(),
            # ),
        ))
    )
})
