import json
from channels.generic.websocket import WebsocketConsumer

#TODO this will need to be made asynchronous, taking care to not have race conditions
#when accessing things like Django models
#https://channels.readthedocs.io/en/stable/tutorial/part_2.html
class GameConsumer(WebsocketConsumer):
    def connect(self):
        self.accept()
    def disconnect(self, close_code):
        pass
    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        #TODO will need to define the 'types' fro these json messages
        message = text_data_json['message']
        self.send(text_data=json.dumps({
            'message': 'answer from server'
        }))
