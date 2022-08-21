import json
from channels.generic.websocket import WebsocketConsumer

class Dummy:
    def __init__(self):
        self.options = ["1", "2", "3"]
        self.remainingGuesses = 3
    def guessIsCorrect(self, guess):
        return guess in self.options

#TODO this will need to be made asynchronous, taking care to not have race conditions
#when accessing things like Django models
#https://channels.readthedocs.io/en/stable/tutorial/part_2.html
class GameConsumer(WebsocketConsumer):
    dummyGame = None
    def connect(self):
        self.accept()
        self.setupGame()
        self.send(text_data=json.dumps({
            'message': f'I am thinking of three numbers between 1 and 10, inclusive. Guess one of them to win the game. You have {self.dummyGame.remainingGuesses} remaining'
        }))

    def setupGame(self):
        self.dummyGame = Dummy()

    def disconnect(self, close_code):
        pass

    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        #TODO will need to define the 'types' fro these json messages
        #if 'message' in text_data_json:
        #    message = text_data_json['message']
        #    self.send(text_data=json.dumps({
        #        'message': f'recieved:{message}, this is an answer from the server'
        #    }))
        #elif 'guess' in text_data_json:
        if 'guess' in text_data_json:
            guess = text_data_json['guess']
            print(f'guess:{guess}')
            isCorrect = self.dummyGame.guessIsCorrect(guess)
            if isCorrect:
                self.send(text_data=json.dumps({
                    'message': f'congratulations, {guess} was the answer!'
                }))
                self.close()
            else:
                self.dummyGame.remainingGuesses -= 1
                remainingGuesses = self.dummyGame.remainingGuesses
                if remainingGuesses < 1:
                    self.send(text_data=json.dumps({
                        'message': 'You\'re out of guesses! Game over. Nothing personnel, kid'
                    }))
                    self.close()
                else:
                    self.send(text_data=json.dumps({
                        'message': f'nope, try again! You have {self.dummyGame.remainingGuesses} guesses remaining'
                    }))
        else:
            self.send(text_data=json.dumps({
                'message': 'invalid request json key, your guesses must be of the form: { \'guess\':\'my guess\' }'
            }))
