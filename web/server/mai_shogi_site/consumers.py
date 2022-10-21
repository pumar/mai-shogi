import random
import json
from typing import List
from channels.generic.websocket import WebsocketConsumer

from enum import Enum

from .game import Match
from .game import ComputerPlayer
from .game import HumanPlayer
from .game import MoveNotFound
#from .PythonGameEngine import HumanPlayer
#from .PythonGameEngine import ComputerPlayer

#need to inherit from str to get JSON serialization to work:
#https://stackoverflow.com/questions/24481852/serialising-an-enum-member-to-json
class MessageTypes(str, Enum):
    GAME_STATE_UPDATE = "gsu"
    MAKE_MOVE = "mm"
    ERROR = "err"

class MessageKeys(str, Enum):
    MESSAGE_TYPE = "messageType"
    MATCH = "match"
    MOVES = "moves"
    MOVE = "move"
    ERROR_MESSAGE = "err_msg"

#TODO this will need to be made asynchronous, taking care to not have race conditions
#when accessing things like Django models
#https://channels.readthedocs.io/en/stable/tutorial/part_2.html
class GameConsumer(WebsocketConsumer):
    #dummyGame = None
    match = None
    def connect(self):
        self.accept()
        self.match = self.createMatch()
        messageDict = {}
        messageDict[MessageKeys.MESSAGE_TYPE] = MessageTypes.GAME_STATE_UPDATE
        messageDict[MessageKeys.MATCH] = self.match.serializeBoardState()
        messageDict[MessageKeys.MOVES] = list(map(lambda x: x.serialize(), self.match.getMoves()))
        self.send(text_data=json.dumps(messageDict))

    def createMatch(self) -> Match:
        return Match(
            ComputerPlayer(False),#gote computer player
            HumanPlayer(True),#sente human player
        )

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
                if nextMoveIsComputer:
                    self.makeAiMove()

                playerMoves = self.serializeMoves(self.match)

                #print(f'playerMoves:{playerMoves}');

                #TODO de-duplicate this, it's also in the connect handler of this class
                messageDict = {}
                messageDict[MessageKeys.MESSAGE_TYPE] = MessageTypes.GAME_STATE_UPDATE
                messageDict[MessageKeys.MATCH] = self.match.serializeBoardState()
                messageDict[MessageKeys.MOVES] = playerMoves
                self.send(text_data=json.dumps(messageDict))
            except MoveNotFound as e:
                print("error on server receive handler for MAKE_MOVE", e)
                errorDict = {}
                errorDict[MessageKeys.MESSAGE_TYPE] = MessageTypes.ERROR
                errorDict[MessageKeys.ERROR_MESSAGE] = f'move:{moveToPost} is not valid'
                self.send(text_data=json.dumps(errorDict))
        else:
            print(f'unknown message type:{messageType}')

    def serializeMoves(self, match: Match) -> List[str]:
        return list(map(lambda x: x.serialize(), match.getMoves()))

    def makeAiMove(self):
        stringMoves = self.serializeMoves(self.match)
        randomMoveIndex = random.randrange(0, len(stringMoves) - 1, 1)
        moveToPost = stringMoves[randomMoveIndex]
        self.match.doTurn(moveToPost)

