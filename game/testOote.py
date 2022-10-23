import unittest
from copy import deepcopy
from pprint import pprint
from typing import List, Tuple

from . import *

def getCleanMatch(playerOne, playerTwo) -> Match:
    match = Match(playerOne, playerTwo)
    match.hand.handKoma = []
    newBanmen = Banmen()
    newBanmen.clearPieces()
    match.grid = newBanmen
    return match

#test suit that has access to two players
#and a handless, pieceless banmen
class HasCleanGame(unittest.TestCase):
    playerOne = None
    playerTwo = None
    match = None

    def setUp(self):
        print('setUp')
        self.playerOne = ComputerPlayer(True)
        self.playerTwo = ComputerPlayer(False)

        self.match = getCleanMatch(self.playerOne, self.playerTwo)

    def tearDown(self):
        print('tearDown')
        self.playerOne = None
        self.playerTwo = None
        self.match = None

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
        pieces = self.match.grid.getPieces()
        self.assertIs(len(pieces), 0)

    def testSetPiece(self):
        self.match.grid.getMasu(0, 0).setKoma(Kyousha(False))
        pieces = self.match.grid.getPieces()
        self.assertIs(len(pieces), 1)

        copyBanmen = deepcopy(self.match.grid)
        copyPieces = copyBanmen.getPieces()
        self.assertIs(len(copyPieces), 1)

        lance = self.match.grid.getMasu(0, 0).getKoma()
        self.assertIsNotNone(lance)
        self.assertFalse(lance.isSente())

    def testDeepcopyDoesNotCreatePieces(self):
        self.match.grid.getMasu(0, 0).setKoma(Kyousha(False))
        copyBanmen = deepcopy(self.match.grid)
        copyPieces = copyBanmen.getPieces()
        self.assertIs(len(copyPieces), 1)

class TestPieceMoves(HasCleanGame):
    def moveToTupleForTest(self, move: Move) -> [int, int, bool]:
        return [move.trgt_square.getX(), move.trgt_square.getY(), move.trgt_square.getKoma().isPromoted()]

    def checkMovesAgainstAnswerMoves(self, movesXYList: List[Tuple[int, int, bool]], answerXYList: List[Tuple[int, int, bool]]) -> bool:
        for x, y, promotes in answerXYList:
            moveWithSameTarget = list(filter(lambda mvLoc: mvLoc[0] == x and mvLoc[1] == y and mvLoc[2] == promotes, movesXYList))
            if len(moveWithSameTarget) != 1:
                return False

        return True

    def testLanceMoves(self):
        self.playerOne = ComputerPlayer(True)
        self.playerTwo = ComputerPlayer(False)

        self.match.current_player = self.playerOne
        lance = Kyousha(True, onHand=False)
        lanceMasu = Masu(4, 2, lance)
        self.match.grid.grid[4][2] = lanceMasu

        lanceMoves = lance.legalMoves(self.match.grid, lanceMasu, None)
        movesXYList = list(map(self.moveToTupleForTest, lanceMoves))

        answerXYList = [[4, 1, True], [4, 1, False], [4, 0, True]]
        self.assertTrue(self.checkMovesAgainstAnswerMoves(movesXYList, answerXYList))

    def testKingMoves(self):
        self.match.current_player = self.playerTwo
        king = Gyokushou(False)
        kingMasu = Masu(4, 0, king)
        self.match.grid.grid[4][0] = Masu(4, 0, king)
        answerXYList = [
            [5, 0, False], [3, 0, False],
            [5, 1, False], [4, 1, False], [3, 1, False]
        ]
        kingMoves = king.legalMoves(self.match.grid, kingMasu, None)
        movesXYList = list(map(self.moveToTupleForTest, kingMoves))
        self.assertTrue(self.checkMovesAgainstAnswerMoves(movesXYList, answerXYList))

    def testKnightMoves(self):
        self.match.current_player = self.playerTwo
        knight = Keima(False)
        knightMasu = Masu(4, 1, knight)
        self.match.grid.grid[4][1] = Masu(4, 1, knight)
        answerXYList = [
            [5, 3, False], [3, 3, False]
        ]
        knightMoves = knight.legalMoves(self.match.grid, knightMasu, None)
        movesXYList = list(map(self.moveToTupleForTest, knightMoves))
        self.assertTrue(self.checkMovesAgainstAnswerMoves(movesXYList, answerXYList))

#TODO for some god forsaken reason, in order for this test script to work the current working directory
#must be the root of the project, so not mai-shogi/game, but mai-shogi
class TestFiltersOote(HasCleanGame):
    #the keima cannot move because it would put the king in check
    def testCantPutOwnKingInCheck(self):
        self.match.current_turn = self.playerTwo

        king = Gyokushou(False)
        knight = Keima(False, onHand=False)
        lance = Kyousha(True)

        self.match.grid.grid[4][0] = Masu(4, 0, king)
        self.match.grid.grid[4][1] = Masu(4, 1, knight)
        self.match.grid.grid[4][2] = Masu(4, 2, lance)

        moves = self.match.getMoves()
        pieces = self.match.grid.getPieces()
        printMoves = list(map(lambda x: x.serialize(), self.match.getMoves()))
        knightMoves = list(filter(lambda mv: mv.src_square != None and mv.src_square.getKoma() == knight, moves))
        self.assertIs(len(knightMoves), 0)
        #TODO check the king's moves too!


if __name__ == '__main__':
    unittest.main()
