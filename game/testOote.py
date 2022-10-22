import unittest

from . import *

#TODO for some god forsaken reason, in order for this test script to work the current working directory
#must be the root of the project, so not mai-shogi/game, but mai-shogi
class TestFiltersOote(unittest.TestCase):
    #the keima cannot move because it would put the king in check
    def testCantPutOwnKingInCheck(self):
        match = Match(ComputerPlayer(True), ComputerPlayer(False))
        match.current_turn = match.player_two
        match.hand.handKoma = []
        match.handKoma = []
        newBanmen = Banmen()
        newBanmen.clearPieces()

        king = Gyokushou(False)
        knight = Keima(False, onHand=False)
        lance = Kyousha(True)

        newBanmen.grid[4][0] = Masu(4, 0, king)
        newBanmen.grid[4][1] = Masu(4, 1, knight)
        newBanmen.grid[4][2] = Masu(4, 2, lance)
        match.grid = newBanmen

        moves = match.getMoves()
        printMoves = list(map(lambda x: x.serialize(), match.getMoves()))
        print(printMoves)
        knightMoves = list(filter(lambda mv: mv.src_square != None and mv.src_square.getKoma() == knight, moves))
        self.assertIs(len(knightMoves), 0)


if __name__ == '__main__':
    unittest.main()
