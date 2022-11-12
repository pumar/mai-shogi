import redis
from channels.generic.websocket import AsyncWebsocketConsumer
from os import environ
from pprint import pprint
from ..game import Match, HumanPlayer
import json

from enum import Enum

# TODO de-dupe these enums between consumers

# need to inherit from str to get JSON serialization to work:
# https://stackoverflow.com/questions/24481852/serialising-an-enum-member-to-json
class MessageTypes(str, Enum):
    GAME_STATE_UPDATE = "gsu"
    MAKE_MOVE = "mm"
    ERROR = "err"
    YOU_LOSE = "yl"
    YOU_WIN = "yw"


class MessageKeys(str, Enum):
    MESSAGE_TYPE = "messageType"
    CLIENT_PLAYER_SIDE = "c_p_side"
    MATCH = "match"
    MOVES = "moves"
    MOVE = "move"
    ERROR_MESSAGE = "err_msg"


class VsPlayerConsumer(AsyncWebsocketConsumer):
    """
    taking care to not have race conditions
    when accessing things like Django models
    https://channels.readthedocs.io/en/stable/tutorial/part_2.html
    """
    match = None
    playerCode = None
    isPlayerOne = False
    isSente = False
    gameGroupName = None

    async def connect(self):
        await self.accept()
        # this is how we can get URL arguments
        # in this case, I want to know whether the client is versing the
        # computer as sente or gote
        playerCode = self.scope["url_route"]["kwargs"]["playerCode"]
        self.playerCode = playerCode
        print(f'playerCode: {playerCode}')
        print(f'channel name: {self.channel_name}')
        redisHost = environ.get('REDIS_HOST')
        redisPort = environ.get('REDIS_PORT')
        redisConn = redis.Redis(
            host=redisHost,
            port=redisPort,
            # decode_responses will turn the bytes from redis into strings
            # so instead of { b'x': b'y' }, I will get { 'x': 'y' }
            decode_responses=True,
        )
        groupName = redisConn.get(playerCode)
        self.gameGroupName = groupName

        await self.channel_layer.group_add(groupName, self.channel_name)

        gameInfo = redisConn.hgetall(groupName)
        playerOneCode = gameInfo['playerOne']
        sentePlayerCode = gameInfo['sente']

        print(f'group name: {groupName}')
        print(f'sentePlayerCode:{sentePlayerCode} my code:{playerCode}')
        isPlayerOne = playerCode == playerOneCode
        self.isPlayerOne = isPlayerOne
        # player one's consumer will hold the game object
        # but we need to wait & listen for the message signaling that
        # player two connected, so that we can send them the information
        isSente = playerCode == playerOneCode
        self.isSente = isSente
        if isPlayerOne:
            me = HumanPlayer(isSente)
            opponent = HumanPlayer(not isSente)

            self.match = Match(p1=me, p2=opponent)
        else:
            await self.channel_layer.group_send(
                groupName,
                {
                    'type': 'player.connect',
                    'sender': playerCode
                }
            )

    async def player_connect(self, event):
        sender = event['sender']
        if sender == self.playerCode:
            return
        print(f'other player connected:{sender}')
        print(f'am I player one?{self.isPlayerOne}')
        matchState = self.match.serializeBoardState()
        playerMoves = self.match.getMoves()
        moves = self.match.serializeMoves(playerMoves)
        nextMovePlayer = self.match.getPlayerWhoMustMakeTheNextMove().isSente()
        await self.channel_layer.group_send(
            self.gameGroupName,
            {
                'type': 'game.update',
                'matchState': matchState,
                'moves': moves,
                'nextPlayer': nextMovePlayer,
            }
        )

    async def game_update(self, event):
        nextPlayer = event['nextPlayer']

        messageDict = {}
        messageDict[MessageKeys.MESSAGE_TYPE] = MessageTypes.GAME_STATE_UPDATE
        messageDict[MessageKeys.MATCH] = event['matchState']
        messageDict[MessageKeys.CLIENT_PLAYER_SIDE] = "SENTE" if self.isSente else "GOTE"
        # if it is our turn, we need to also send the moves to the
        # game client
        if nextPlayer == self.isSente:
            messageDict[MessageKeys.MOVES] = event['moves']

        await self.send(text_data=json.dumps(messageDict))



    async def disconnect(self, close_code):
        pass

    async def receive(self, text_data):
        pass
        # text_data_json = json.loads(text_data)
        # messageType = text_data_json[MessageKeys.MESSAGE_TYPE]
        # print((messageType, text_data_json))

# # TODO this is hacky, I need to find a better way to pre-populate
# # the group with a consumer that maintains the game logic and state
# isPlayerOne = groupName.split('_')[0] == playerCode
# as a last resort I can just staple the game engine to player one's
# websocket consumer, and have it communicate with player 2 through
# the group but, it's probably better to have a
# worker that listens in on groups for
# channel join messages, and gives them a game engine consumer
# print(f'is player one?{isPlayerOne}')
# if isPlayerOne:
#     newChannelName = self.channel_layer.new_channel
#     print(f'for game consumer: {newChannelName}')
#     self.channel_layer.group_add(groupName, newChannelName)
#     gameConsumer = GameEngineConsumer(
# pprint(self.channel_layer)
