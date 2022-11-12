import redis
from channels.generic.websocket import AsyncWebsocketConsumer
from os import environ


class VsPlayerConsumer(AsyncWebsocketConsumer):
    """
    taking care to not have race conditions
    when accessing things like Django models
    https://channels.readthedocs.io/en/stable/tutorial/part_2.html
    """

    async def connect(self):
        await self.accept()
        # this is how we can get URL arguments
        # in this case, I want to know whether the client is versing the
        # computer as sente or gote
        playerCode = self.scope["url_route"]["kwargs"]["playerCode"]
        print(f'playerCode: {playerCode}')
        print(f'channel name: {self.channel_name}')
        redisHost = environ.get('REDIS_HOST')
        redisPort = environ.get('REDIS_PORT')
        redisConn = redis.Redis(
            host=redisHost,
            port=redisPort,
        )
        groupName = bytes(redisConn.get(playerCode)).decode('ascii')
        print(f'group name: {groupName}')
        await self.channel_layer.group_add(groupName, self.channel_name)


    async def disconnect(self, close_code):
        pass

    async def receive(self, text_data):
        pass
        # text_data_json = json.loads(text_data)
        # messageType = text_data_json[MessageKeys.MESSAGE_TYPE]
        # print((messageType, text_data_json))
