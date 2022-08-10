from typing import List


class Koma:

    onHand = False
    white = False

    def __init__(self, white):
        self.white = white

    def isWhite(self):
        return self.white

    def setWhite(self, white):
        self.white = white

    def isOnHand(self):
        return self.onHand

    def moveToHand(self):
        self.white = not self.white
        self.onHand = True

    def moveToBoard(self):
        self.onHand = False


class Masu:
    koma: Koma
    x: int 
    y: int

    def __init__(self,x,y,koma):
        self.koma = koma
        self.x = x
        self.y = y

    def getKoma(self) -> Koma:
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

    def __init__(self):
        pass

    def getMasu(self, x: int, y: int) -> Masu:
        if x < 0 or x > 8 or y < 0 or y > 8:
            raise Exception("Position ({0},{1}) is out of bounds.".format(str(x),str(y)))

        return self.grid[x][y]
    
