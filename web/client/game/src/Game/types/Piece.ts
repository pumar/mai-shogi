export {
	PlacedPiece,
	HeldPiece,
	isPlaced,
}

function isPlaced(obj: Piece): obj is PlacedPiece {
	return (obj as Placed).rank !== undefined && (obj as Placed).file !== undefined;
}
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

type GamePiece = Pawn | Lance | Knight | Silver | Gold | Bishop | Rook | King;

/** piece on the board */
type PlacedPiece = GamePiece & Placed;

/** piece in the hand */
type HeldPiece = GamePiece & {
	/** it's possible to hold multiples of the same piece */
	count: number;
}

type Piece = PlacedPiece | HeldPiece;
