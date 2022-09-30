from copy import deepcopy
from curses.ascii import isalpha, islower
from typing import Dict, List, Tuple

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
    
    def encode(self) -> str:
            serialized_piece = ""
            if self.isPromoted(): serialized_piece += "+"
            
            if type(self) is Fuhyou:
                serialized_piece = "p"
            if type(self) is Kyousha:
                serialized_piece = "l"
            if type(self) is Keima:
                serialized_piece = "n"
            if type(self) is Kinshou:
                serialized_piece = "g"
            if type(self) is Gyokushou:
                serialized_piece = "k"
            if type(self) is Ginshou:
                serialized_piece = "s"
            if type(self) is Kakugyou:
                serialized_piece = "b"
            if type(self) is Hisha:
                serialized_piece = "r"
            if not self.isWhite(): serialized_piece = serialized_piece.upper()
            return serialized_piece

class Masu:
    koma: Koma
    x: int 
    y: int
    # Probably should remove defaults for x and y and rewrite the Hand object
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
                board[i].append(Masu(i, j, None))

        board[0][0].setKoma(Kyousha(True))
        board[1][0].setKoma(Keima(True))
        board[2][0].setKoma(Ginshou(True))
        board[3][0].setKoma(Kinshou(True))
        board[4][0].setKoma(Gyokushou(True))
        board[5][0].setKoma(Kinshou(True))
        board[6][0].setKoma(Ginshou(True))
        board[7][0].setKoma(Keima(True))
        board[8][0].setKoma(Kyousha(True))

        board[1][1].setKoma(Kakugyou(True))
        board[7][1].setKoma(Hisha(True))


        board[0][8].setKoma(Kyousha(False))
        board[1][8].setKoma(Keima(False))
        board[2][8].setKoma(Ginshou(False))
        board[3][8].setKoma(Kinshou(False))
        board[4][8].setKoma(Gyokushou(False))
        board[5][8].setKoma(Kinshou(False))
        board[6][8].setKoma(Ginshou(False))
        board[7][8].setKoma(Keima(False))
        board[8][8].setKoma(Kyousha(False))

        board[1][7].setKoma(Hisha(False))
        board[7][7].setKoma(Kakugyou(False))

        for i in range(0,9):
            board[i][2].setKoma(Fuhyou(True))
            board[i][6].setKoma(Fuhyou(False))
        return board

    def getPieces(self) -> List[Koma]:
        pieces = []
        for i in range(0,9):
            for j in range(0,9):
                pieces.append(self.grid.getMasu(i, j).getKoma())
        return pieces
    
class Hand:
    handKoma: Dict[Masu, int]
    PIECES = (
        "Fuhyou",
        "Kyousha",
        "Keima",
        "Ginshou",
        "Kinshou",
        "Kakugyou",
        "Hisha"
    )

    def __init__(self) -> None:
        self.handKoma = self.initialHand()

    def initialHand(self) -> Dict[Masu, int]:
        handKoma = {}
        handKoma[Masu(koma=Fuhyou(white = True, onHand = True))] = 3
        handKoma[Masu(koma=Fuhyou(white = False, onHand = True))] = 1
        handKoma[Masu(koma=Kinshou(white = True, onHand = True))] = 1
        handKoma[Masu(koma=Kinshou(white = False, onHand = True))] = 1
        return handKoma

class Move:
    src_square: Masu
    trgt_square: Masu

    def __init__(self, src_square, trgt_square) -> None:
        self.src_square = src_square
        self.trgt_square = trgt_square

    def serialize(self) -> str:
        #  src: (dd)(+)a
        # trgt: dd(+)a

        piece = self.src_square.getKoma()
        src = ""
        if self.src_square.getX() > -1:
            src += str(self.src_square.getX())
            src += str(self.src_square.getY())
        src += piece.encode()

        piece = self.trgt_square.getKoma()
        trgt = str(self.trgt_square.getX()) + str(self.trgt_square.getY())
        trgt += piece.encode()

        return src + " " + trgt
         

class Fuhyou(Koma):
    def __init__(self, white, onHand = False):
        super().__init__(white, onHand)

    def legalMoves(self,  board:Banmen, src_square: Masu, hand = None) -> List[Move]:
        moves: List[Move] = []

        iswhite = src_square.getKoma().isWhite()
        piece = src_square.getKoma()
        x = src_square.getX()
        y = src_square.getY()

        if not self.isOnHand():
            if not self.isPromoted():
                pd = [0,1] if iswhite else [0,-1]
                tX = x + pd[0]
                tY = y + pd[1]
                if(-1 < tX < 9 and -1 < tY < 9):
                    if (board.getMasu(tX, tY).getKoma() == None or board.getMasu(tX, tY).getKoma().isWhite() != iswhite):
                        if (iswhite and y > 6) or (not iswhite and y < 2):
                            promoted_piece = deepcopy(piece)
                            promoted_piece.Promote()
                            moves.append(Move(src_square, Masu(tX, tY, promoted_piece)))
                        if not ((tY + pd[1]) > 8 or (tY + pd[1]) < 0):
                            moves.append(Move(src_square, Masu(tX, tY, piece)))
            else:
                virtual_kin = Kinshou(iswhite)
                moves.extend(virtual_kin.legalMoves(board, src_square, hand, piece))
        # Rewrite handkoma as a simpler data structure to simplify this part
        else:
            if hand == None: raise Exception("The 'Hand' object is a required argument for calculating legal moves of a piece in hand.")
            if hand[src_square] > 0:
                column: List[Masu]
                masu: Masu
                # Rewrite for loops so that the method 'GetMasu' is called instead of iterating through the inner property
                for column in board.grid:
                    hasFuhyou = False
                    for masu in column:
                        if isinstance(masu.getKoma(), Fuhyou) and not masu.getKoma().isPromoted() and (masu.getKoma().isWhite() == iswhite):
                            hasFuhyou = True
                    if not hasFuhyou:
                        for masu in column:
                            if masu.getKoma() == None and ((iswhite and masu.getY() != 8) or (not iswhite and masu.getY() != 0)):
                                moves.append(Move(src_square, Masu(masu.getX(),masu.getY(), piece)))
        
        return moves                              

class Kyousha(Koma):
    def __init__(self, white, onHand=False):
        super().__init__(white, onHand)

    def legalMoves(self,  board:Banmen, src_square: Masu, hand = None) -> List[Move]:
        moves: List[Move] = []

        iswhite = src_square.getKoma().isWhite()
        piece = src_square.getKoma()
        x = src_square.getX()
        y = src_square.getY()
        
        if not self.isOnHand():
            if not self.isPromoted():
                pd = [0,1] if iswhite else [0,-1]
                tX = x
                tY = y
                while(True):
                    tX += pd[0]
                    tY += + pd[1]
                    if(-1 < tX < 9 and -1 < tY < 9):
                        if (board.getMasu(tX, tY).getKoma() == None or board.getMasu(tX, tY).getKoma().isWhite() != iswhite):
                            if (iswhite and tY > 5) or (not iswhite and tY < 3):
                                promoted_piece = deepcopy(piece)
                                promoted_piece.Promote()
                                moves.append(Move(src_square, Masu(tX, tY, promoted_piece)))
                            if not ((tY + pd[1]) > 8 or (tY + pd[1]) < 0):
                                moves.append(Move(src_square, Masu(tX, tY, piece)))
                        if board.getMasu(tX, tY).getKoma() != None: break
                    else: break
            else:
                virtual_kin = Kinshou(iswhite)
                moves.extend(virtual_kin.legalMoves(board, src_square, hand, piece))
        else:
            if hand == None: raise Exception("The 'Hand' object is a required argument for calculating legal moves of a piece in hand.")
            if hand[src_square] > 0:
                for i in range(0,9):
                    for j in range(0,9):
                        if board.getMasu(i,j).getKoma() == None: moves.append(Move(src_square, Masu(i, j, piece)))
        return moves

class Keima(Koma):
    def __init__(self, white, onHand=False):
        super().__init__(white, onHand)
    
    def legalMoves(self,  board:Banmen, src_square: Masu, hand = None) -> List[Move]:
        moves: List[Move] = []

        iswhite = src_square.getKoma().isWhite()
        piece = src_square.getKoma()
        x = src_square.getX()
        y = src_square.getY()

        if not self.isOnHand():
            if not self.isPromoted():
                possible_deltas = [[1, 2],[-1, 2]]
                if not iswhite: possible_deltas = [[-1*delta for delta in pd] for pd in possible_deltas]
                for pd in possible_deltas:
                    tX = x + pd[0]
                    tY = y + pd[1]
                    if(-1 < tX < 9 and -1 < tY < 9):
                        if (board.getMasu(tX, tY).getKoma() == None or board.getMasu(tX, tY).getKoma().isWhite() != iswhite):
                            if (iswhite and y > 3) or (not iswhite and y < 5):
                                promoted_piece = deepcopy(piece)
                                promoted_piece.Promote()
                                moves.append(Move(src_square, Masu(tX, tY, promoted_piece)))
                            if not ((tY + pd[1]) > 8 or (tY + pd[1]) < 0):
                                moves.append(Move(src_square, Masu(tX, tY, piece)))        
            else:
                virtual_kin = Kinshou(iswhite)
                moves.extend(virtual_kin.legalMoves(board, src_square, hand, piece))
        else:
            if hand == None: raise Exception("The 'Hand' object is a required argument for calculating legal moves of a piece in hand.")
            if hand[src_square] > 0:
                for i in range(0,9):
                    for j in range(0,9):
                        if board.getMasu(i,j).getKoma() == None: moves.append(Move(src_square, Masu(i, j, piece)))
        return moves

class Ginshou(Koma):
    def __init__(self, white, onHand=False):
        super().__init__(white, onHand)

    def legalMoves(self,  board:Banmen, src_square: Masu, hand = None) -> List[Move]:
        moves: List[Move] = []

        iswhite = src_square.getKoma().isWhite()
        piece = src_square.getKoma()
        x = src_square.getX()
        y = src_square.getY()

        if not self.isOnHand():
            if not self.isPromoted():
                possible_deltas = [[0,1],[1,1],[-1,1],[-1,-1],[1,-1]]
                if not iswhite: possible_deltas = [[-1*delta for delta in pd] for pd in possible_deltas]
                for pd in possible_deltas:
                    tX = x + pd[0]
                    tY = y + pd[1]
                    if(-1 < tX < 9 and -1 < tY < 9):
                        if (board.getMasu(tX, tY).getKoma() == None or board.getMasu(tX, tY).getKoma().isWhite() != iswhite):
                            if (iswhite and (y > 5 or tY > 5)) or (not iswhite and (y < 3 or tY < 3)):
                                promoted_piece = deepcopy(piece)
                                promoted_piece.Promote()
                                moves.append(Move(src_square, Masu(tX, tY, promoted_piece)))
                            moves.append(Move(src_square, Masu(tX, tY, piece))) 
            else:
                virtual_kin = Kinshou(iswhite)
                moves.extend(virtual_kin.legalMoves(board, src_square, hand, piece))
        # Rewrite handkoma as a simpler data structure to simplify this part
        else:
            if hand == None: raise Exception("The 'Hand' object is a required argument for calculating legal moves of a piece in hand.")
            if hand[src_square] > 0:
                for i in range(0,9):
                    for j in range(0,9):
                        if board.getMasu(i,j).getKoma() == None: moves.append(Move(src_square, Masu(i, j, piece)))
        return moves

class Kinshou(Koma):
    def __init__(self, white, onHand=False):
        super().__init__(white, onHand)
    
    def Promote(self):
        raise Exception("The Golden General cannot be promoted.")

    def legalMoves(self,  board:Banmen, src_square: Masu, hand = None, virtualized_piece: Koma = None) -> List[Move]:
        moves: List[Move] = []

        iswhite = src_square.getKoma().isWhite()
        if virtualized_piece != None: piece = deepcopy(virtualized_piece)
        else: piece = src_square.getKoma()
        x = src_square.getX()
        y = src_square.getY()

        if not self.isOnHand():
            possible_deltas = [[0,1],[0,-1],[1,0],[-1,0],[1,1],[-1,1]]
            if not iswhite: possible_deltas = [[-1*delta for delta in pd] for pd in possible_deltas]
            for pd in possible_deltas:
                tX = x + pd[0]
                tY = y + pd[1]
                if(-1 < tX < 9 and -1 < tY < 9):
                    if (board.getMasu(tX, tY).getKoma() == None or board.getMasu(tX, tY).getKoma().isWhite() != iswhite):
                        moves.append(Move(src_square, Masu(tX, tY, piece)))
        elif virtualized_piece == None:
            if hand == None: raise Exception("The 'Hand' object is a required argument for calculating legal moves of a piece in hand.")
            if hand[src_square] > 0:
                for i in range(0,9):
                    for j in range(0,9):
                        if board.getMasu(i,j).getKoma() == None: moves.append(Move(src_square, Masu(i, j, piece)))
        return moves                      

class Kakugyou(Koma):
    def __init__(self, white, onHand=False):
        super().__init__(white, onHand)

    def legalMoves(self,  board:Banmen, src_square: Masu, hand = None) -> List[Move]:
        moves: List[Move] = []

        iswhite = src_square.getKoma().isWhite()
        piece = src_square.getKoma()
        x = src_square.getX()
        y = src_square.getY()
        
        if not self.isOnHand():
            possible_deltas = [[1,-1],[1,1],[-1,-1],[-1,1]]
            for pd in possible_deltas:
                tX = x
                tY = y
                while(True):
                    tX += pd[0]
                    tY += + pd[1]
                    if(-1 < tX < 9 and -1 < tY < 9):
                        if (board.getMasu(tX, tY).getKoma() == None or board.getMasu(tX, tY).getKoma().isWhite() != iswhite):
                            if (iswhite and tY > 5) or (not iswhite and tY < 3):
                                promoted_piece = deepcopy(piece)
                                promoted_piece.Promote()
                                moves.append(Move(src_square, Masu(tX, tY, promoted_piece)))
                            if not ((tY + pd[1]) > 8 or (tY + pd[1]) < 0):
                                moves.append(Move(src_square, Masu(tX, tY, piece)))
                        if board.getMasu(tX, tY).getKoma() != None: break
                    else: break
            if self.isPromoted:
                possible_deltas = [[0,1],[0,-1],[1,0],[-1,0]]
                for pd in possible_deltas:
                    tX = x + pd[0]
                    tY = y + pd[1]
                    if(-1 < tX < 9 and -1 < tY < 9):
                        if (board.getMasu(tX, tY).getKoma() == None or board.getMasu(tX, tY).getKoma().isWhite() != iswhite):
                            moves.append(Move(src_square, Masu(tX, tY, piece)))
        else:
            if hand == None: raise Exception("The 'Hand' object is a required argument for calculating legal moves of a piece in hand.")
            if hand[src_square] > 0:
                for i in range(0,9):
                    for j in range(0,9):
                        if board.getMasu(i,j).getKoma() == None: moves.append(Move(src_square, Masu(i, j, piece)))
        return moves

class Hisha(Koma):
    def __init__(self, white, onHand=False):
        super().__init__(white, onHand)

    def legalMoves(self,  board:Banmen, src_square: Masu, hand = None) -> List[Move]:
        moves: List[Move] = []

        iswhite = src_square.getKoma().isWhite()
        piece = src_square.getKoma()
        x = src_square.getX()
        y = src_square.getY()
        
        if not self.isOnHand():
            possible_deltas = [[0,1],[0,-1],[1,0],[-1,0]]
            for pd in possible_deltas:
                tX = x
                tY = y
                while(True):
                    tX += pd[0]
                    tY += + pd[1]
                    if(-1 < tX < 9 and -1 < tY < 9):
                        if (board.getMasu(tX, tY).getKoma() == None or board.getMasu(tX, tY).getKoma().isWhite() != iswhite):
                            if (iswhite and tY > 5) or (not iswhite and tY < 3):
                                promoted_piece = deepcopy(piece)
                                promoted_piece.Promote()
                                moves.append(Move(src_square, Masu(tX, tY, promoted_piece)))
                            if not ((tY + pd[1]) > 8 or (tY + pd[1]) < 0):
                                moves.append(Move(src_square, Masu(tX, tY, piece)))
                        if board.getMasu(tX, tY).getKoma() != None: break
                    else: break
            if self.isPromoted:
                possible_deltas = [[1,-1],[1,1],[-1,-1],[-1,1]]
                for pd in possible_deltas:
                    tX = x + pd[0]
                    tY = y + pd[1]
                    if(-1 < tX < 9 and -1 < tY < 9):
                        if (board.getMasu(tX, tY).getKoma() == None or board.getMasu(tX, tY).getKoma().isWhite() != iswhite):
                            moves.append(Move(src_square, Masu(tX, tY, piece)))
        else:
            if hand == None: raise Exception("The 'Hand' object is a required argument for calculating legal moves of a piece in hand.")
            if hand[src_square] > 0:
                for i in range(0,9):
                    for j in range(0,9):
                        if board.getMasu(i,j).getKoma() == None: moves.append(Move(src_square, Masu(i, j, piece)))
        return moves


class Gyokushou(Koma):
    def __init__(self, white, onHand=False):
        super().__init__(white, onHand)
        if onHand: raise Exception("The King cannot be captured and sent to hand.")
        self.onHand = False


    def Promote(self):
        raise Exception("The King cannot be promoted.")

    def legalMoves(self,  board:Banmen, src_square: Masu, hand = None) -> List[Move]:
        moves: List[Move] = []

        iswhite = src_square.getKoma().isWhite()
        piece = src_square.getKoma()
        x = src_square.getX()
        y = src_square.getY()

        possible_deltas = [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]]
        for pd in possible_deltas:
            tX = x + pd[0]
            tY = y + pd[1]
            if(-1 < tX < 9 and -1 < tY < 9):
                if (board.getMasu(tX, tY).getKoma() == None or board.getMasu(tX, tY).getKoma().isWhite() != iswhite):
                    moves.append(Move(src_square, Masu(tX, tY, piece)))
        return moves

class Match:
    player_one: Player
    player_two: Player
    grid: Banmen
    hand: Hand
    current_turn: Player

    def __init__(self, p1: Player, p2: Player):
        self.player_one = p1
        self.player_two = p2

        self.grid = Banmen()
        self.hand = Hand()
        
        if self.player_one.isWhiteSide():
            self.current_turn = deepcopy(self.player_one)
        else: self.current_turn = deepcopy(self.player_two)

    def getMoves(self):
        def filtersOote(all_moves: List[Move], iswhite: bool):
            legal_moves: List[Move] = []
            
            for move in all_moves:
                valid_move = True
                virtual_board = deepcopy(self.grid)
                virtual_board.getMasu(move.src_square.getX(), move.src_square.getY()).setKoma(None)
                virtual_board.getMasu(move.trgt_square.getX(), move.trgt_square.getY()).setKoma(move.trgt_square.getKoma())

                if not (move.src_square.getKoma() is Gyokushou):
                    king_coordinates: Tuple[int, int]
                    for i in range(0,9):
                        for j in range(0,9):
                            if type(self.grid.getMasu(i,j).getKoma()) is Gyokushou and self.grid.getMasu(i,j).getKoma().isWhite() == iswhite: 
                                king_coordinates = (i,j)
                    attacking_pieces = filter(lambda x: x != None and x.isWhite() != iswhite and \
                        (type(x) is Kakugyou or type(x) is Hisha or type(x) is Kyousha), virtual_board.getPieces())
                    for attacking_piece in attacking_pieces:
                        attacking_moves = attacking_piece.legalMoves(virtual_board, virtual_board.getMasu(i,j))
                        for attacking_move in attacking_moves:
                            if attacking_move.trgt_square.getX() == king_coordinates[0] and attacking_move.trgt_square.getY() == king_coordinates[1]:
                                valid_move = False
                else:
                    attacked_squares:List[Tuple[int, int]] = []
                    attacking_pieces = filter(lambda x: x != None and x.isWhite() != iswhite, virtual_board.getPieces())
                    for attacking_piece in attacking_pieces:
                        attacking_moves = attacking_piece.legalMoves(virtual_board, virtual_board.getMasu(i,j))
                        for attacking_move in attacking_moves:
                            attacked_square = attacking_move.trgt_square
                            attacked_squares.append(attacked_square.getX(), attacked_square.getY())
                    if (move.trgt_square.getX(),move.trgt_square.getY()) in attacked_squares:
                        valid_move = False

                if valid_move: legal_moves.append(move)

            return legal_moves

        iswhite = self.current_turn.isWhiteSide()
        moves: List[Move] = []
        for i in range(0,9):
            for j in range(0,9):
                koma = self.grid.getMasu(i,j).getKoma()
                if koma != None and koma.isWhite() == iswhite:
                    moves.extend(koma.legalMoves(self.grid, self.grid.getMasu(i,j)))
        moves = filtersOote(moves)
        return moves
    

    def deserializeBoardState(self, sfen: str) -> Banmen:
        pass

    def serializeBoardState(self) -> str:
        # The sfen notation is defined here: http://hgm.nubati.net/usi.html
        sfen: str = ""
        for j in range(0,9):
            empty_masu: int = 0
            for i in range(0,9):
                current_masu: Masu = self.grid.getMasu(i,j)
                if current_masu.getKoma() == None: empty_masu += 1
                else:
                    if empty_masu > 0:
                        sfen += str(empty_masu)
                        empty_masu = 0
                    koma = current_masu.getKoma()
                    sfen += koma.encode()
            if empty_masu > 0:
                sfen += str(empty_masu)
            sfen+= "/"
        sfen = sfen[:-1]
        sfen += " w " if self.current_turn.isWhiteSide() else " b "
        for masu, number in self.hand.handKoma.items():
            if number > 0:
                koma = masu.getKoma()
                if number == 1: sfen += koma.encode()
                else:
                    sfen += str(number) + koma.encode()
        return sfen
        



        




