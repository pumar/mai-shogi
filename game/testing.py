from main import *

newMatch = Match(Player(True),Player(False))

print(newMatch.serializeBoardState())

print("\n")
next_move = ""
for move in newMatch.getMoves():
    next_move = (move.serialize())
    break

newMatch.doTurn(next_move)

print(newMatch.serializeBoardState())