from django.urls import re_path

from .consumers import VsComputerConsumer

websocket_urlpatterns = [
    re_path(
        r"^ws/game/computer/(?P<side>\w+)$",
        VsComputerConsumer.as_asgi(),
    ),
    #re_path(
    #    r"^ws/game/versus/(?P<side>\w+)$",
    #    consumers.ClientConsumer.as_asgi(),
    #),
]
