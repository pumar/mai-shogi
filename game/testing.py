from main import *

newMatch = Match(Player(True),Player(False))

print(newMatch.serializeBoardState())

print("\n\n")

board = Banmen()

for i in range(0,9):
    for j in range(0,9):
        piece = board.getMasu(i,j).getKoma()
        if isinstance(piece, Hisha): 
            moves = piece.legalMoves(board,board.getMasu(i,j))
            for move in moves:
                print("The {0} piece can move to: ({1},{2}). Promoted? {3}".format("White" if move.trgt_square.getKoma().isWhite() else "Black",move.trgt_square.getX(), move.trgt_square.getY(), str(move.trgt_square.getKoma().isPromoted())))