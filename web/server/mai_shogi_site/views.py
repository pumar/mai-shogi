from django.http import HttpResponse
from django.template import loader

import random
import string

from enum import Enum

class ResponseHeaderKeys(str, Enum):
    PLAYER_ONE_CODE="PLAYER_ONE_CODE"
    PLAYER_TWO_CODE="PLAYER_TWO_CODE"

# Create your views here.
def index(request):
    template = loader.get_template('load_spa.html')
    context = {}
    return HttpResponse(template.render(context, request));

def createGameCode(request):
    context = {}
    gameCode = makeRandomCode()
    senteCode = makeRandomCode()
    goteCode = makeRandomCode()

    if random.randrange(0, 2) == 0:
        playerOneCode = senteCode
        playerTwoCode = goteCode
    else:
        playerOneCode = goteCode
        playerTwoCode = senteCode

    print(f'create game code p1code:{playerOneCode} p2code:{playerTwoCode}')

    response = HttpResponse()
    response.headers[ResponseHeaderKeys.PLAYER_ONE_CODE] = playerOneCode
    response.headers[ResponseHeaderKeys.PLAYER_TWO_CODE] = playerTwoCode
    return response

#https://stackoverflow.com/questions/2257441/random-string-generation-with-upper-case-letters-and-digits
def makeRandomCode(size=16, chars=string.ascii_uppercase + string.digits):
    return ''.join(random.choice(chars) for _ in range(size))
