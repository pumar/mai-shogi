from django.urls import re_path

from .consumers import VsComputerConsumer
from .consumers import VsPlayerConsumer

websocket_urlpatterns = [
    re_path(
        r"^ws/game/computer/(?P<side>\w+)$",
        VsComputerConsumer.as_asgi(),
    ),
    re_path(
        r"^ws/game/versus/(?P<playerCode>\w+)$",
        VsPlayerConsumer.as_asgi(),
    ),
]
