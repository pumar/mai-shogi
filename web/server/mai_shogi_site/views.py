from django.http import HttpResponse
from django.template import loader
from os import environ
import redis

import random
import string

# from enum import Enum

# I want to use enums for the header keys, but python says that
# headers must be strings, and that the values of this enum are not strings
# I think it will be 'fixed' in Python 3.11 with something called StrEnum
# class ResponseHeaderKeys(str, Enum):
#     PLAYER_ONE_CODE = "PLAYER_ONE_CODE"
#     PLAYER_TWO_CODE = "PLAYER_TWO_CODE"


# Create your views here.
def index(request):
    template = loader.get_template('load_spa.html')
    context = {}
    return HttpResponse(template.render(context, request))


def createGameCode(request):
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
    response.headers["PLAYER_ONE_CODE"] = playerOneCode
    response.headers["PLAYER_TWO_CODE"] = playerTwoCode

    redisHost = environ.get('REDIS_HOST')
    redisPort = environ.get('REDIS_PORT')
    redisConn = redis.Redis(
        host=redisHost,
        port=redisPort,
    )
    # the websocket connections can use their player codes to look up the
    # game code, which will allow their consumers to find out what group they
    # are in
    gameCode = f'{playerOneCode}_{playerTwoCode}'
    redisConn.set(playerOneCode, gameCode)
    redisConn.set(playerTwoCode, gameCode)
    # store the sente/gote info in redis as a dictionary
    # which can be grabbed with conn.hgetall([key])
    redisConn.hmset(gameCode, {
        "sente": senteCode,
        "gote": goteCode,
        "playerOne": playerOneCode,
        "playerTwo": playerTwoCode,
    })
    return response


# https://stackoverflow.com/questions/2257441/random-string-generation-with-upper-case-letters-and-digits
def makeRandomCode(size=16, chars=string.ascii_uppercase + string.digits):
    return ''.join(random.choice(chars) for _ in range(size))
