import json
from channels.generic.websocket import WebsocketConsumer

from .game import Match
from .game import ComputerPlayer
from .game import HumanPlayer
#from .PythonGameEngine import HumanPlayer
#from .PythonGameEngine import ComputerPlayer

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
