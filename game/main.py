from copy import deepcopy
from curses.ascii import isalpha, islower
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
    

    """
    def deserializeMove(self, move: str) -> Move:
        #  src: (dd)(+)a
        # trgt: dd(+)a
        def makePiece(piece_char: str):
            iswhite: bool
            iswhite = True if piece_char.islower() else False
            piece_char = piece_char.lower()

            if piece_char == "p": return Fuhyou(iswhite)
            if piece_char == "l": return Kyousha(iswhite)
            if piece_char == "n": return Keima(iswhite)
            if piece_char == "g": return Kinshou(iswhite)
            if piece_char == "k": return Gyokushou(iswhite)
            if piece_char == "s": return Ginshou(iswhite)
            if piece_char == "b": return Kakugyou(iswhite)
            if piece_char == "r": return Hisha(iswhite)
            else: raise Exception("Not a valid piece: {0}\n".format(piece_char))


        def invalMove(move_str):
            raise Exception(" Invalid move string pattern: {0}\n".format(move_str))

        pieces = ["p","l","n","g","k","s","b","r"]
        src_x: str
        src_y: str
        src_promoted = False
        src_piece: Koma
        src_square: Masu

        trgt_x: str
        trgt_y: str

        src,trgt = move.split(" ")
        if len(src) == 3 or len(src) == 4:
            if src[0].isdigit() and 0>int(src[0])<9: 
                src_x = int(src[0])
                if  src[1].isdigit() and 0>int(src[1])<9: 
                    src_y = int(src[1])
                else: invalMove(src)
                if len(src) == 4: 
                    if src[2] == "+": src_promoted = True
                    if src[-1].isalpha() and src[-1].lower() in pieces:
                        src_piece = makePiece(src[-1])
                        if src_promoted: src_piece.Promote()
            else: invalMove(src)
        elif len(src) == 1 and src.isalpha() and src.lower() in pieces: 
            src_piece = makePiece(src)
            src_x = -1
            src_y = -1
        else: invalMove(src)
        src_square = Masu(src_x,src_y,src_piece)
        
        """



            
    
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
        



        




