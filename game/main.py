from typing import Dict, List

class Player:
    whiteSide: bool
    humanPlayer: bool

    def __init__(self, whiteSide) -> None:
        self.whiteSide = whiteSide
    
    def isWhiteSide(self) -> bool:
        return self.whiteSide
    
    def isHumanPlayer(self) -> bool:
        return self.humanPlayer

class HumanPlayer(Player):
    def __init__(self, whiteSide) -> None:
        super().__init__(whiteSide)
        self.humanPlayer = True

class ComputerPlayer(Player):
    def __init__(self, whiteSide) -> None:
        super().__init__(whiteSide)
        self.humanPlayer = False


class Koma:
    onHand = False
    promoted = False
    white = False

    def __init__(self, white, onHand = False):
        self.white = white
        self.onHand = onHand

    def isWhite(self) -> bool:
        return self.white
    
    def isPromoted(self) -> bool:
        return self.promoted

    def Promote(self):
        self.promoted = True

    def setWhite(self, white):
        self.white = white

    def isOnHand(self):
        return self.onHand

    def moveToHand(self):
        self.white = not self.white
        self.promoted = False
        self.onHand = True

    def moveToBoard(self):
        self.onHand = False

class Masu:
    koma: Koma
    x: int 
    y: int

    def __init__(self, x = -1, y = -1, koma = None):
        self.koma = koma
        self.x = x
        self.y = y

    def getKoma(self):
        return self.koma

    def setKoma(self, koma:Koma):
        self.koma = koma

    def getX(self) -> int:
        return self.x
    
    def setX(self,x):
        self.x = x

    def getY(self) -> int:
        return self.y

    def setY(self,y):
        self.y = y

class Banmen:
    grid: List[List[Masu]]

    def __init__(self) -> None:
        self.grid = self.initialBanmen()

    def getMasu(self, x: int, y: int) -> Masu:
        if x < 0 or x > 8 or y < 0 or y > 8:
            raise Exception("Position ({0},{1}) is out of bounds.".format(str(x),str(y)))
        
        return self.grid[x][y]
    
    def initialBanmen(self):
        board: List[List[Masu]] = []
        for i in range(0,9):
            board.append([])
            for j in range(0,9):
                if j == 0:
                    board[i].append(Masu(i, j, Fuhyou(True)))
                if j == 8:
                    board[i].append(Masu(i, j, Fuhyou(False)))
                else:
                    board[i].append(Masu(i, j, None))
        return board

class Hand:
    handKoma: Dict[Masu, int]

    def __init__(self) -> None:
        self.handKoma = self.initialHand()

    def initialHand(self) -> None:
        handKoma = {}
        handKoma[Masu(Fuhyou(white = True, onHand= True))] = 0
        handKoma[Masu(Fuhyou(white = False, onHand = True))] = 0
        return handKoma

class Move:
    src_square: Masu
    trgt_square: Masu

    def __init__(self, src_square, trgt_square) -> None:
        self.src_square = src_square
        self.trgt_square = trgt_square

class Fuhyou(Koma):
    def __init__(self, white, onHand = False):
        super().__init__(white, onHand)

    def legalMoves(self,  board:List[List[Masu]], hand:Hand, src_square: Masu) -> List[Move]:
        moves: List[Move] = []

        iswhite = src_square.getKoma().isWhite()
        piece = src_square.getKoma()
        x = src_square.getX()
        y = src_square.getY()

        if not self.isOnHand():
            if not self.isPromoted():
                if (iswhite and y != 8) and \
                   (board[x][y + 1].getKoma() == None or board[x][y + 1].getKoma().isWhite() != iswhite):
                    if y > 4:
                        moves.append(Move(src_square, Masu(x, y + 1, piece.Promote())))
                    if y < 7:
                        moves.append(Move(src_square, Masu(x, y + 1, piece)))
                if (not iswhite and y != 0) and \
                   ( board[x][y - 1].getKoma() == None or board[x][y - 1].getKoma().isWhite() != iswhite):
                    if y < 4: 
                        moves.append(Move(src_square, Masu(x, y -1, piece.Promote())))
                    if y > 1:
                        moves.append(Move(src_square, Masu(x, y - 1, piece)))
            else:
                if (iswhite):
                    if y != 8:
                        if (board[x][y + 1].getKoma() == None or board[x][y + 1].getKoma().isWhite() != iswhite):
                            moves.append(Move(src_square, Masu(x, y + 1, piece)))
                        if (x != 0) and \
                           ( board[x - 1][y + 1].getKoma() == None or board[x - 1][y + 1].getKoma().isWhite() != iswhite):
                           moves.append(Move(src_square, Masu(x - 1, y + 1, piece)))
                        if (x != 8) and \
                           ( board[x + 1][y + 1].getKoma() == None or board[x + 1][y + 1].getKoma().isWhite() != iswhite):
                           moves.append(Move(src_square, Masu(x + 1, y + 1, piece)))
                    if y != 0:
                        if ( board[x][y - 1].getKoma() == None or board[x][y - 1].getKoma().isWhite() != iswhite):
                            moves.append(Move(src_square, Masu(x, y - 1, piece)))
                if (not iswhite):
                    if y != 0:
                        if ( board[x][y - 1].getKoma() == None or board[x][y - 1].getKoma().isWhite() != iswhite):
                            moves.append(Move(src_square, Masu(x, y - 1, piece)))
                        if (x != 8) and \
                           ( board[x + 1][y - 1].getKoma() == None or board[x + 1][y - 1].getKoma().isWhite() != iswhite):
                           moves.append(Move(src_square, Masu(x + 1, y - 1, piece)))
                        if (x != 0) and \
                           ( board[x - 1][y - 1].getKoma() == None or board[x - 1][y - 1].getKoma().isWhite() != iswhite):
                           moves.append(Move(src_square, Masu(x - 1, y - 1, piece)))
                    if y != 8:
                        if ( board[x][y + 1].getKoma() == None or board[x][y + 1].getKoma().isWhite() != iswhite):
                            moves.append(Move(src_square, Masu(x, y + 1, piece)))
                if x != 0:
                    if ( board[x - 1][y].getKoma() == None or board[x - 1][y].getKoma().isWhite() != iswhite):
                        moves.append(Move(src_square, Masu(x - 1, y, piece)))
                if x != 8:
                    if ( board[x + 1][y].getKoma() == None or board[x + 1][y].getKoma().isWhite() != iswhite):
                        moves.append(Move(src_square, Masu(x + 1, y, piece)))
        else:
            if hand[src_square] > 0:
                column: List[Masu]
                masu: Masu
                hasFuhyou = False
                for column in board:
                    for masu in column:
                        if isinstance(masu.getKoma(), Fuhyou) and not masu.getKoma().promoted and (masu.getKoma().isWhite() == iswhite):
                            hasFuhyou = True
                    if not hasFuhyou:
                        for masu in column:
                            if masu.getKoma() == None and ((iswhite and masu.getY() != 8) or (not iswhite and masu.getY() != 0)):
                                moves.append(Move(src_square, Masu(masu.getX(),masu.getY(), piece)))
        
        return moves               
                    

board = Banmen().grid
hand = Hand()
for column in board:
    for masu in column:
        if(isinstance(masu.getKoma(),Fuhyou)):
            moves =  masu.getKoma().legalMoves(board, hand, masu)
            for move in moves:
                print("Pawn from ({0},{1}) to ({2},{3}).".format(move.src_square.getX(),move.src_square.getY(),move.trgt_square.getX(),move.trgt_square.getY()))



