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
    GAME_STATE_UPDATE = "gsu",
    MAKE_MOVE = "mm"

#TODO this will need to be made asynchronous, taking care to not have race conditions
#when accessing things like Django models
#https://channels.readthedocs.io/en/stable/tutorial/part_2.html
class GameConsumer(WebsocketConsumer):
    #dummyGame = None
    match = None
    def connect(self):
        self.accept()
        self.match = self.createMatch()
        self.send(text_data=json.dumps({
            'messageType': MessageTypes.GAME_STATE_UPDATE,
            'match': self.match.serializeBoardState(),
            'moves': list(map(lambda x: x.serialize(), self.match.getMoves()))
        }))

    def createMatch(self) -> Match:
        return Match(
            HumanPlayer(False),#human player with the black pieces
            ComputerPlayer(True),#computer player with the white pieces
        )

    def disconnect(self, close_code):
        pass

    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        messageType = text_data_json[MessageTypes.MAKE_MOVE]
        print((messageType, text_data_json))
