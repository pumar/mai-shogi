import unittest
from copy import deepcopy
from pprint import pprint

from . import *

def getCleanMatch(playerOne, playerTwo) -> tuple[Match, Banmen]:
    match = Match(playerOne, playerTwo)
    match.hand.handKoma = []
    match.handKoma = []
    newBanmen = Banmen()
    newBanmen.clearPieces()
    match.hand.handKoma = []

    return (match, newBanmen)

#test suit that has access to two players
#and a handless, pieceless banmen
class HasCleanGame(unittest.TestCase):
    playerOne = None
    playerTwo = None
    match = None
    banmen = None

    def setUp(self):
        self.playerOne = ComputerPlayer(True)
        self.playerTwo = ComputerPlayer(False)

        self.match, self.banmen = getCleanMatch(self.playerOne, self.playerTwo)

    def tearDown(self):
        self.playerOne = None
        self.playerTwo = None
        self.match = None
        self.banmen = None

class TestCurrentPlayerIsSente(HasCleanGame):

    #ensure that the first player gets to play first
    def testSenteGoesFirst(self):
        self.assertTrue(self.match.current_turn.isSente())

    #ensure that changing the turn lets the next player make a move
    def testCurrentPlayerIsSente(self):
        self.assertTrue(self.match.current_turn.isSente())
        self.match.changeTurn()
        self.assertFalse(self.match.current_turn.isSente())

class TestBanMen(HasCleanGame):
    def testGetPieces(self):
        pieces = self.banmen.getPieces()
        self.assertIs(len(pieces), 0)

    def testSetPiece(self):
        self.banmen.getMasu(0, 0).setKoma(Kyousha(False))
        pieces = self.banmen.getPieces()
        self.assertIs(len(pieces), 1)

        copyBanmen = deepcopy(self.banmen)
        copyPieces = copyBanmen.getPieces()
        self.assertIs(len(copyPieces), 1)

        lance = self.banmen.getMasu(0, 0).getKoma()
        self.assertIsNotNone(lance)
        self.assertFalse(lance.isSente())

    def testDeepcopyDoesNotCreatePieces(self):
        self.banmen.getMasu(0, 0).setKoma(Kyousha(False))
        copyBanmen = deepcopy(self.banmen)
        copyPieces = copyBanmen.getPieces()
        self.assertIs(len(copyPieces), 1)

class TestPieceMoves(HasCleanGame):
    def moveToTupleForTest(self, move):
        return [move.trgt_square.getX(), move.trgt_square.getY(), move.trgt_square.getKoma().isPromoted()]

    def testLanceMoves(self):
        self.playerOne = ComputerPlayer(True)
        self.playerTwo = ComputerPlayer(False)

        self.match.current_player = self.playerOne
        lance = Kyousha(True, onHand=False)
        lanceMasu = Masu(4, 2, lance)
        self.banmen.grid[4][2] = lanceMasu

        lanceMoves = lance.legalMoves(self.banmen, lanceMasu, None)
        movesXYList = list(map(self.moveToTupleForTest, lanceMoves))

        answerXYList = [[4, 1, True], [4, 1, False], [4, 0, True]]
        for x, y, promotes in answerXYList:
            moveWithSameTarget = list(filter(lambda mvLoc: mvLoc[0] == x and mvLoc[1] == y and mvLoc[2] == promotes, movesXYList))
            self.assertIs(len(moveWithSameTarget), 1)

#print("==========================")
#pprint(self.match.hand.handKoma)
#pprint(self.banmen.getPieces())
#moves = self.match.getMoves()
#printMoves = list(map(lambda x: x.serialize(), moves))

#TODO for some god forsaken reason, in order for this test script to work the current working directory
#must be the root of the project, so not mai-shogi/game, but mai-shogi
#class TestFiltersOote(unittest.TestCase):
#    #the keima cannot move because it would put the king in check
#    def testCantPutOwnKingInCheck(self):
#        playerOne = ComputerPlayer(True)
#        playerTwo = ComputerPlayer(False)
#        match, newBanmen = getCleanMatch(playerOne, playerTwo)
#        match.current_turn = deepcopy(match.player_two)
#
#        king = Gyokushou(False)
#        knight = Keima(False, onHand=False)
#        lance = Kyousha(True)
#
#        newBanmen.grid[4][0] = Masu(4, 0, king)
#        newBanmen.grid[4][1] = Masu(4, 1, knight)
#        newBanmen.grid[4][2] = Masu(4, 2, lance)
#        match.grid = newBanmen
#
#        moves = match.getMoves()
#        printMoves = list(map(lambda x: x.serialize(), match.getMoves()))
#        print(printMoves)
#        knightMoves = list(filter(lambda mv: mv.src_square != None and mv.src_square.getKoma() == knight, moves))
#        self.assertIs(len(knightMoves), 0)


if __name__ == '__main__':
    unittest.main()
