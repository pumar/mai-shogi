from main import *

newMatch = Match(Player(True),Player(False))

print(newMatch.serializeBoardState())

print("\n")

board = Banmen()

for i in range(0,9):
    for j in range(0,9):
        piece = board.getMasu(i,j).getKoma()
        if isinstance(piece, Koma): 
            moves = piece.legalMoves(board,board.getMasu(i,j))
            for move in moves:
                print(move.serialize())