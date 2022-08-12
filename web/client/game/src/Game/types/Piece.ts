type Placed = {
	rank: number;
	file: number;
}

type Promotable = {
	isPromoted?: boolean;
}

type Pawn = Promotable & { name: "pawn" };
type Lance = Promotable & { name: "lance" };
type Knight = Promotable & { name: "knight" };
type Silver = Promotable & { name: "silver" };
type Bishop = Promotable & { name: "bishop" };
type Rook = Promotable & { name: "rook" };

type Gold = { name: "gold" };
type King = { name: "king" };

type Piece = Pawn | Lance | Knight | Silver | Gold | Bishop | Rook | King;

type PlacedPiece = Piece & Placed;
