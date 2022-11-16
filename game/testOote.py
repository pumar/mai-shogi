import unittest
from copy import deepcopy
from pprint import pprint
from typing import List, Tuple

from . import *

#for some god forsaken reason, in order for this test script to work the current working directory
#must be the root of the project, so not mai-shogi/game, but mai-shogi

def getCleanMatch(playerOne, playerTwo) -> Match:
    match = Match(playerOne, playerTwo)
    match.hand.handKoma = []
    newBanmen = Banmen()
    newBanmen.clearPieces()
    match.grid = newBanmen
    return match

#TODO need to debug the king not reacting to checks from dropped pieces, I saw it happen
#with a knight

#test suit that has access to two players
#and a handless, pieceless banmen
class HasCleanGame(unittest.TestCase):
    playerOne = None
    playerTwo = None
    match = None

    def setUp(self):
        self.playerOne = ComputerPlayer(True)
        self.playerTwo = ComputerPlayer(False)

        self.match = getCleanMatch(self.playerOne, self.playerTwo)

    def tearDown(self):
        self.playerOne = None
        self.playerTwo = None
        self.match = None

    def moveToTupleForTest(self, move: Move) -> [int, int, bool]:
        return [move.trgt_square.getX(), move.trgt_square.getY(), move.trgt_square.getKoma().isPromoted()]

    def checkMovesAgainstAnswerMoves(self, movesXYList: List[Tuple[int, int, bool]], answerXYList: List[Tuple[int, int, bool]]) -> bool:
        if len(movesXYList) != len(answerXYList):
            print(f'checkMovesAgainstAnswerMoves failed, list lengths do not match actual#:{len(movesXYList)} expected#:{len(answerXYList)}')
            return False

        for x, y, promotes in answerXYList:
            moveWithSameTarget = list(filter(lambda mvLoc: mvLoc[0] == x and mvLoc[1] == y and mvLoc[2] == promotes, movesXYList))
            if len(moveWithSameTarget) != 1:
                print('checkMovesAgainstAnswerMoves failed actual moves:')
                pprint(movesXYList)
                print('expected moves:')
                pprint(answerXYList)
                return False

        return True

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
        self.match.grid.grid[0][0] = Masu(0, 0, Kakugyou(True))
        piecesKakugyou = self.match.grid.getPieces()
        self.assertIs(len(piecesKakugyou), 1)
        koma, masu = piecesKakugyou[0]
        self.assertIs(masu.getX(), 0)
        self.assertIs(masu.getY(), 0)
        self.assertIs(koma.isSente(), True)

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

    def testFuhyouMoves(self):
        self.match.current_player = self.playerTwo
        fuhyou = Fuhyou(False)
        fuhyouMasu = Masu(0, 3, fuhyou)
        self.match.grid.grid[0][3] = fuhyouMasu

        fuhyouMoves = fuhyou.legalMoves(self.match.grid, fuhyouMasu)
        movesXYList = list(map(self.moveToTupleForTest, fuhyouMoves))
        answerList = [
            [0, 4, False]
        ]
        #print('actual moves:', movesXYList, ' expected moves:', answerList)
        self.assertTrue(self.checkMovesAgainstAnswerMoves(movesXYList, answerList))

        self.match.grid.grid[0][3] = None
        fuhyouMasu = Masu(0, 5, fuhyou)
        self.match.grid.grid[0][5] = fuhyouMasu
        #both promotion and non-promotion are possible
        movesXYList = list(map(self.moveToTupleForTest, fuhyou.legalMoves(self.match.grid, fuhyouMasu)))
        answerList = [
            [0, 6, False],
            [0, 6, True]
        ]
        self.assertTrue(self.checkMovesAgainstAnswerMoves(movesXYList, answerList))

        self.match.grid.grid[0][5] = None
        fuhyouMasu = Masu(0, 7, fuhyou)
        self.match.grid.grid[0][7] = fuhyouMasu
        movesXYList = list(map(self.moveToTupleForTest, fuhyou.legalMoves(self.match.grid, fuhyouMasu)))
        answerList = [
            [0, 8, True]
        ]
        self.assertTrue(self.checkMovesAgainstAnswerMoves(movesXYList, answerList))

        senteFuhyou = Fuhyou(True)
        senteMasu = Masu(8, 3, senteFuhyou)
        self.match.grid.grid[8][3] = senteMasu
        movesXYList = list(map(self.moveToTupleForTest, senteFuhyou.legalMoves(self.match.grid, senteMasu)))
        answerList = [ [8, 2, True], [8, 2, False] ]
        self.assertTrue(self.checkMovesAgainstAnswerMoves(movesXYList, answerList))

    def testGinshouMoves(self):
        ginshou = Ginshou(True)
        ginshouMasu = Masu(4, 4, ginshou)
        self.match.grid.grid[4][4] = ginshouMasu
        ginshouMoves = ginshou.legalMoves(self.match.grid, ginshouMasu)
        movesXYList = list(map(self.moveToTupleForTest, ginshouMoves))
        answerList = [
            [5, 3, False], [4,3, False], [3, 3, False],
            [5, 5, False], [3, 5, False],
        ]
        self.assertTrue(self.checkMovesAgainstAnswerMoves(movesXYList, answerList))

        self.match.current_player = self.match.player_two
        goteGinshou = Ginshou(False)
        goteMasu = Masu(4, 4, goteGinshou)
        self.match.grid.grid[4][4] = goteMasu
        ginshouMoves = goteGinshou.legalMoves(self.match.grid, goteMasu)
        movesXYList = list(map(self.moveToTupleForTest, ginshouMoves))
        pprint(movesXYList)
        answerList = [
            [5, 3, False], [3, 3, False],
            [5, 5, False], [4, 5, False], [3, 5, False],
        ]
        self.assertTrue(self.checkMovesAgainstAnswerMoves(movesXYList, answerList))

class TestCheck(HasCleanGame):
    def testKingsNotInCheck(self):
        senteKing = Gyokushou(True)
        goteKing = Gyokushou(False)

        board = self.match.grid

        board.grid[0][4] = Masu(0, 4, goteKing)
        board.grid[8][4] = Masu(8, 4, senteKing)
        # sente king is not in check
        self.assertFalse(board.kingIsInCheck(True))

        # hisha attacks sente king
        board.grid[7][4] = Masu(7, 4, Hisha(False))
        # sente king is in check
        self.assertTrue(board.kingIsInCheck(True))
        # remove rook
        board.grid[7][4].koma = None

        # add kakugyou on the diagonal
        board.grid[7][3] = Masu(7, 3, Kakugyou(False))
        # sente king is in check
        self.assertTrue(board.kingIsInCheck(True))
        # gote king is not
        self.assertFalse(board.kingIsInCheck(False))
        # king moves one spot to the right
        board.grid[8][4].koma = None
        board.grid[8][3] = Masu(8, 3, senteKing)
        # sente king is no longer in check
        self.assertFalse(board.kingIsInCheck(True))

        # place sente hisha on the first rank, with the gote king
        board.grid[0][0] = Masu(0, 0, Hisha(True))
        # Gote king is in check
        self.assertTrue(board.kingIsInCheck(False))
        board.grid[0][4].koma = None
        # gote king moves to rank 2, out of check
        board.grid[1][4].koma = goteKing
        # gote king is not in check
        self.assertFalse(board.kingIsInCheck(False))


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
        print('looking at moves:' + " ".join(self.match.serializeMoves(moves)))
        pieces = self.match.grid.getPieces()
        knightMoves = list(filter(lambda mv: mv.src_square != None and mv.src_square.getKoma() == knight, moves))
        self.assertIs(len(knightMoves), 0)

    def testKingCannotGoIntoCheck(self):
        self.match.current_turn = self.playerTwo
        king = Gyokushou(False)

        kingMasu = Masu(4, 0, king)
        self.match.grid.grid[4][0] = kingMasu
        moves = self.match.getMoves()
        movesXYList = list(map(self.moveToTupleForTest, king.legalMoves(self.match.grid, kingMasu)))
        answerList = [
            [5, 0, False], [3, 0, False],
            [5, 1, False], [4, 1, False], [3, 1, False]
        ]
        self.assertTrue(self.checkMovesAgainstAnswerMoves(movesXYList, answerList))

        kakugyou = Kakugyou(True)
        self.match.grid.grid[2][3] = Masu(2, 3, kakugyou)
        moves = self.match.getMoves()
        movesXYList = list(map(self.moveToTupleForTest, moves))
        # 4,1 and 5,0 moves should now be impossible because they are being checked by the kakugyou
        answerList = [
            [3, 0, False],
            [5, 1, False], [3, 1, False]
        ]
        self.assertTrue(self.checkMovesAgainstAnswerMoves(movesXYList, answerList))

class TestHeldPieceMoves(HasCleanGame):
    def testPlaceKakugyou(self):
        kakugyou = Kakugyou(True, onHand=True)
        self.match.hand.handKoma.append([kakugyou, 1])
        self.match.grid.grid[2][4] = Masu(2, 4, Fuhyou(False))
        heldKakuMoves = kakugyou.legalMoves(self.match.grid, None, self.match.hand)
        self.assertIs(len(heldKakuMoves), 80)
        self.match.grid.grid[2][5] = Masu(2, 5, Fuhyou(False))
        heldKakuMoves = kakugyou.legalMoves(self.match.grid, None, self.match.hand)
        self.assertIs(len(heldKakuMoves), 79)

        moves = self.match.getMoves()
        self.assertIs(len(moves), 79)

    def testPlaceKnight(self):
        knight = Keima(True, onHand=True)
        self.match.hand.handKoma.append(knight)
        #the knight cannot be placed such that it is near the end of the board and therefore
        #cannot move
        #remove the first two ranks from the list of available masu from an empty board 81 - (9 files * 2 ranks) = 63 squares
        #correct squares
        knightDropOkSquares = list(filter(lambda x: x.getY() > 1, self.match.grid.getOpenSpaces()))
        #squares that the application calculated
        knightPlaceSquares = list(map(lambda x: x.trgt_square, knight.legalMoves(self.match.grid, None, self.match.hand)))
        self.assertIs(len(knightDropOkSquares), len(knightPlaceSquares), "# of knight drop squares on an empty board should be exactly 63")
        #now, we need to make sure that the x and y coords for both lists are the same
        #count the # of times the square appears in the answer list or the result list
        #each space in the answer list should be counted there exactly twice
        #and spaces not in that list should be counted 0 times
        squareCountMap = self.getSpaceCountsAtZero()
        self.checkPlaceableSpaceCounts(squareCountMap, knightPlaceSquares, knightDropOkSquares, True)

        #test gote
        squareCountMap = self.getSpaceCountsAtZero()
        knightDropOkSquares = list(filter(lambda x: x.getY() < 7, self.match.grid.getOpenSpaces()))
        goteKnight = Keima(False,onHand=True)
        #squares that the application calculated
        knightPlaceSquares = list(map(lambda x: x.trgt_square, goteKnight.legalMoves(self.match.grid, None, self.match.hand)))
        self.assertIs(len(knightDropOkSquares), len(knightPlaceSquares), "# of knight drop squares on an empty board should be exactly 63")
        self.checkPlaceableSpaceCounts(squareCountMap, knightPlaceSquares, knightDropOkSquares, False)

    #count every time a square (x, y) appears in the two lists
    #the squares that should be placeable for the held piece should be counted exactly twice,
    #once in the answer list and again in the result list from the application
    def checkPlaceableSpaceCounts(
            self,
            squareCountMap: List[List[int]],
            answerSquares: List[List[Masu]],
            resultSquares: List[List[Masu]],
            isSente: bool
        ):

        for x in range(0, len(answerSquares)):
            resultSquare = resultSquares[x]
            answerSquare = answerSquares[x]
            squareCountMap[resultSquare.getX()][resultSquare.getY()] += 1
            squareCountMap[answerSquare.getX()][answerSquare.getY()] += 1

        if isSente:
            yIndexCheck = lambda yIdx: yIdx > 1
        else:
            yIndexCheck = lambda yIdx: yIdx < 7

        for xIndex, xList in enumerate(squareCountMap):
            for yIndex, y in enumerate(xList):
                if yIndexCheck(yIndex):
                    countShouldBe = 2
                else:
                    countShouldBe = 0
                self.assertIs(y, countShouldBe, f'space ({xIndex}, {yIndex}) should have been counted exactly {countShouldBe} times, but was counted:{y} times')

    def getSpaceCountsAtZero(self):
        squareCountMap = []
        for x in range(0, 9):
            squareCountMap.append([])
            for y in range(0, 9):
                squareCountMap[x].append(0)
        return squareCountMap

class TestMates(HasCleanGame):
    def testLadderMate(self):
        #Gote's turn
        kingKoma = Gyokushou(False)
        kingMasu = Masu(7, 0, kingKoma)
        self.match.current_turn = self.playerTwo
        self.match.grid.grid[8][0] = kingMasu

        rookKoma1 = Hisha(True)
        rookKoma2 = Hisha(True)
        self.match.grid.grid[0][8] = Masu(0, 8, rookKoma1)
        self.match.grid.grid[1][8] = Masu(1, 8, rookKoma2)
        moves = self.match.getMoves()
        self.assertTrue(len(moves) > 0)

        #move rook 1 to the 2nd rank
        self.match.grid.grid[0][7] = Masu(0, 7, None)
        self.match.grid.grid[0][1] = Masu(0, 1, rookKoma1)
        #king still has moves
        moves = self.match.getMoves()
        self.assertTrue(len(moves) > 0)

        #move rook 2 to the 1st rank
        self.match.grid.grid[1][8] = Masu(1, 8, None)
        self.match.grid.grid[1][0] = Masu(1, 0, rookKoma2)

        #king has no moves
        moves = self.match.getMoves()
        self.assertIs(len(moves), 0)
        #remove rook 2
        self.match.grid.grid[1][0] = Masu(1, 0)
        #king should have moves
        moves = self.match.getMoves()
        self.assertTrue(len(moves) > 0)

        #place promoted rook on last rank
        promotedRook = Hisha(True)
        promotedRook.Promote()
        self.match.grid.grid[1][0] = Masu(1, 0, promotedRook)
        #king should have no moves
        moves = self.match.getMoves()
        self.assertIs(len(moves), 0)


if __name__ == '__main__':
    unittest.main()
