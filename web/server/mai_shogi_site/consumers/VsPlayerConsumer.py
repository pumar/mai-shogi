import redis
from channels.generic.websocket import AsyncWebsocketConsumer
from os import environ
import json
from pprint import pprint

from ..game import Match, HumanPlayer, MoveNotFound
from ..consts import MessageKeys, MessageTypes


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

    # group handler
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
                'sender': self.playerCode,
                'matchState': matchState,
                'moves': moves,
                'nextPlayer': nextMovePlayer,
            }
        )

    # group handler
    async def game_update(self, event):
        nextPlayer = event['nextPlayer']

        messageDict = {}
        messageDict[MessageKeys.MESSAGE_TYPE] = MessageTypes.GAME_STATE_UPDATE
        messageDict[MessageKeys.MATCH] = event['matchState']
        messageDict[MessageKeys.CLIENT_PLAYER_SIDE] = "SENTE" if self.isSente else "GOTE"
        # if it is our turn, we need to also send the moves to the
        # game client
        print(f'nextPlayer:{nextPlayer} amISente?:{self.isSente}')
        if nextPlayer == self.isSente:
            messageDict[MessageKeys.MOVES] = event['moves']
            print('sending moves')
            pprint(event['moves'])

        await self.send(text_data=json.dumps(messageDict))

    async def make_move(self, event):
        if self.isPlayerOne:
            move = event['move']
            try: 
                self.match.doTurn(move)
                moves = self.match.getMoves()
                if len(moves) == 0:
                    # broadcast a 'player lost' event
                    print(f'TODO player {self.playerCode} has no moves, and lost')
                else:
                    # TODO de-dupe with the player_connect method
                    matchState = self.match.serializeBoardState()
                    serializedMoves = self.match.serializeMoves(moves)
                    nextMovePlayer = self.match.getPlayerWhoMustMakeTheNextMove().isSente()
                    await self.channel_layer.group_send(
                        self.gameGroupName,
                        {
                            'type': 'game.update',
                            'sender': self.playerCode,
                            'matchState': matchState,
                            'moves': serializedMoves,
                            'nextPlayer': nextMovePlayer,
                        }
                    )

            except MoveNotFound as e:
                print("error on server receive handler for MAKE_MOVE", e)
                # TODO inform the client that sent the move that their
                # move was invalid
                # errorDict = {}
                # errorDict[MessageKeys.MESSAGE_TYPE] = MessageTypes.ERROR
                # errorDict[MessageKeys.ERROR_MESSAGE] = \
                #     f'move:{moveToPost} is not valid'
                # await self.send(text_data=json.dumps(errorDict))

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        print(text_data_json)
        messageType = text_data_json[MessageKeys.MESSAGE_TYPE]
        print(messageType, text_data_json)

        if messageType == MessageTypes.MAKE_MOVE:
            move = text_data_json[MessageKeys.MOVE]
            await self.channel_layer.group_send(
                self.gameGroupName,
                {
                    'type': 'make.move',
                    'sender': self.playerCode,
                    'move': move,
                }
            )

    async def disconnect(self, close_code):
        pass

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
