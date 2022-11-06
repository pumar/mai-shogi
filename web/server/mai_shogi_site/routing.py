from django.urls import re_path

from . import consumers

websocket_urlpatterns = [
    re_path(
        r"^ws/game/computer/(?P<side>\w+)$",
        consumers.GameConsumer.as_asgi(),
    ),
]
