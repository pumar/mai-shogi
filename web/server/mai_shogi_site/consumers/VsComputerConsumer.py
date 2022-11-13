import random
import json
from typing import List, Tuple
from channels.generic.websocket import AsyncWebsocketConsumer

from enum import Enum

from ..consts import MessageKeys, MessageTypes

from ..game import Match
from ..game import ComputerPlayer
from ..game import HumanPlayer
from ..game import MoveNotFound
from ..game import Move


class VsComputerConsumer(AsyncWebsocketConsumer):
    """
    taking care to not have race conditions
    when accessing things like Django models
    https://channels.readthedocs.io/en/stable/tutorial/part_2.html
    """

    match = None

    async def connect(self):
        await self.accept()
        # this is how we can get URL arguments
        # in this case, I want to know whether the client is versing the
        # computer as sente or gote
        isSente = self.scope["url_route"]["kwargs"]["side"]
        print(f'isSente?: {isSente}')
        self.match, self.player = self.createMatch(isSente == "sente")
        messageDict = {}
        if not self.match.getPlayerWhoMustMakeTheNextMove().humanPlayer:
            self.makeAiMove()
        playerMoves = self.match.getMoves()
        messageDict[MessageKeys.MESSAGE_TYPE] = MessageTypes.GAME_STATE_UPDATE
        playerSide = "SENTE" if self.player.isSente() else "GOTE"
        messageDict[MessageKeys.CLIENT_PLAYER_SIDE] = playerSide
        messageDict[MessageKeys.MATCH] = self.match.serializeBoardState()
        messageDict[MessageKeys.MOVES] = self.serializeMoves(playerMoves)
        await self.send(text_data=json.dumps(messageDict))

    def createMatch(self, clientIsSente: bool) -> Tuple[Match, HumanPlayer]:
        if clientIsSente:
            # sente human player
            humanPlayer = HumanPlayer(True)
            # gote computer player
            computerPlayer = ComputerPlayer(False)
        else:
            # gote human player
            humanPlayer = HumanPlayer(False)
            # sente computer player
            computerPlayer = ComputerPlayer(True)
        match = Match(
            computerPlayer,
            humanPlayer
        )
        return (match, humanPlayer)

    async def disconnect(self, close_code):
        pass

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        messageType = text_data_json[MessageKeys.MESSAGE_TYPE]
        print((messageType, text_data_json))
        if messageType == MessageTypes.MAKE_MOVE:
            moveToPost = text_data_json[MessageKeys.MOVE]
            print(f'need to post move to game:{moveToPost}')
            try:
                self.match.doTurn(moveToPost)
                print(f'did move:{moveToPost}')
                nextMoveIsComputer = not self.match.getPlayerWhoMustMakeTheNextMove().humanPlayer
                print(f'is next player the computer{nextMoveIsComputer}')

                computerHasLost = False
                if nextMoveIsComputer:
                    computerHasLost = self.makeAiMove()

                closeConnection = False

                messageDict = {}
                if computerHasLost:
                    messageDict[MessageKeys.MESSAGE_TYPE] = MessageTypes.YOU_WIN
                    messageDict[MessageKeys.MATCH] = self.match.serializeBoardState()
                    closeConnection = True
                else:
                    playerMoves = self.match.getMoves()
                    playerMovesSerialized = self.serializeMoves(playerMoves)
                    # you lose
                    if len(playerMoves) == 0:
                        messageDict[MessageKeys.MESSAGE_TYPE] = MessageTypes.YOU_LOSE
                        messageDict[MessageKeys.MATCH] = self.match.serializeBoardState()
                        closeConnection = True
                    else:
                        # print(f'playerMoves:{playerMoves}');
                        messageDict[MessageKeys.MESSAGE_TYPE] = \
                            MessageTypes.GAME_STATE_UPDATE
                        messageDict[MessageKeys.MATCH] = \
                            self.match.serializeBoardState()
                        messageDict[MessageKeys.MOVES] = \
                            playerMovesSerialized
                await self.send(text_data=json.dumps(messageDict))
                if closeConnection:
                    await self.close()

            except MoveNotFound as e:
                print("error on server receive handler for MAKE_MOVE", e)
                errorDict = {}
                errorDict[MessageKeys.MESSAGE_TYPE] = MessageTypes.ERROR
                errorDict[MessageKeys.ERROR_MESSAGE] = \
                    f'move:{moveToPost} is not valid'
                await self.send(text_data=json.dumps(errorDict))
        else:
            print(f'unknown message type:{messageType}')

    def serializeMoves(self, moves: List[Move]) -> List[str]:
        return list(map(lambda x: x.serialize(), moves))

    # returns False if play continues, or True if the computer has lost
    def makeAiMove(self) -> bool:
        moves = self.match.getMoves()
        if len(moves) == 1:
            print(moves[0].serialize())
        print(f'computer has {len(moves)} moves')
        if len(moves) == 0:
            return True
        stringMoves = self.serializeMoves(moves)
        randomMoveIndex = random.randrange(0, len(stringMoves), 1)
        moveToPost = stringMoves[randomMoveIndex]
        self.match.doTurn(moveToPost)
        return False
