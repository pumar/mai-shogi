import random
import json
from typing import List, Tuple
from channels.generic.websocket import WebsocketConsumer
from pprint import pprint

from enum import Enum

from .game import Match
from .game import ComputerPlayer
from .game import HumanPlayer
from .game import MoveNotFound
from .game import Move
#from .PythonGameEngine import HumanPlayer
#from .PythonGameEngine import ComputerPlayer

#need to inherit from str to get JSON serialization to work:
#https://stackoverflow.com/questions/24481852/serialising-an-enum-member-to-json
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

#TODO this will need to be made asynchronous, taking care to not have race conditions
#when accessing things like Django models
#https://channels.readthedocs.io/en/stable/tutorial/part_2.html
class GameConsumer(WebsocketConsumer):
    match = None
    def connect(self):
        self.accept()
        #this is how we can get URL arguments
        #in this case, I want to know whether the client is versing the computer as
        #sente or gote
        isSente = self.scope["url_route"]["kwargs"]["side"]
        print(f'isSente?: {isSente}')
        self.match, self.player = self.createMatch(isSente == "sente")
        messageDict = {}
        #TODO have AI make a move if the user is gote
        if not self.match.getPlayerWhoMustMakeTheNextMove().humanPlayer:
            self.makeAiMove()
        playerMoves = self.match.getMoves()
        messageDict[MessageKeys.MESSAGE_TYPE] = MessageTypes.GAME_STATE_UPDATE
        messageDict[MessageKeys.CLIENT_PLAYER_SIDE] = "SENTE" if self.player.isSente() else "GOTE"
        messageDict[MessageKeys.MATCH] = self.match.serializeBoardState()
        messageDict[MessageKeys.MOVES] = self.serializeMoves(playerMoves)
        self.send(text_data=json.dumps(messageDict))

    def createMatch(self, clientIsSente: bool) -> Tuple[Match, HumanPlayer]:
        if clientIsSente:
            humanPlayer = HumanPlayer(True)#sente human player
            computerPlayer = ComputerPlayer(False)#gote computer player
        else:
            humanPlayer = HumanPlayer(False)#gote human player
            computerPlayer = ComputerPlayer(True)#sente computer player
        match = Match(
            computerPlayer,
            humanPlayer
        )
        return (match, humanPlayer)

    def disconnect(self, close_code):
        pass

    def receive(self, text_data):
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
                    #you lose
                    if len(playerMoves) == 0:
                        messageDict[MessageKeys.MESSAGE_TYPE] = MessageTypes.YOU_LOSE
                        messageDict[MessageKeys.MATCH] = self.match.serializeBoardState()
                        closeConnection = True
                    else:
                        #print(f'playerMoves:{playerMoves}');
                        messageDict[MessageKeys.MESSAGE_TYPE] = MessageTypes.GAME_STATE_UPDATE
                        messageDict[MessageKeys.MATCH] = self.match.serializeBoardState()
                        messageDict[MessageKeys.MOVES] = playerMovesSerialized
                self.send(text_data=json.dumps(messageDict))
                if closeConnection:
                    self.close()

            except MoveNotFound as e:
                print("error on server receive handler for MAKE_MOVE", e)
                errorDict = {}
                errorDict[MessageKeys.MESSAGE_TYPE] = MessageTypes.ERROR
                errorDict[MessageKeys.ERROR_MESSAGE] = f'move:{moveToPost} is not valid'
                self.send(text_data=json.dumps(errorDict))
        else:
            print(f'unknown message type:{messageType}')

    def serializeMoves(self, moves: List[Move]) -> List[str]:
        return list(map(lambda x: x.serialize(), moves))

    #returns False if play continues, or True if the computer has lost
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

