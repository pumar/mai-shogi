import json
from channels.generic.websocket import WebsocketConsumer

from enum import Enum

from .game import Match
from .game import ComputerPlayer
from .game import HumanPlayer
#from .PythonGameEngine import HumanPlayer
#from .PythonGameEngine import ComputerPlayer

#need to inherit from str to get JSON serialization to work:
#https://stackoverflow.com/questions/24481852/serialising-an-enum-member-to-json
class MessageTypes(str, Enum):
    GAME_STATE_UPDATE = "gsu"
    MAKE_MOVE = "mm"

class MessageKeys(str, Enum):
    MESSAGE_TYPE = "messageType"
    MATCH = "match"
    MOVES = "moves"

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
            ComputerPlayer(True),#computer player with the white pieces
            HumanPlayer(False),#human player with the black pieces
        )

    def disconnect(self, close_code):
        pass

    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        messageType = text_data_json[MessageTypes.MAKE_MOVE]
        print((messageType, text_data_json))
