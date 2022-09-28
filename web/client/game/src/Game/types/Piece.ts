export {
	Piece,
	PlacedPiece,
	HeldPiece,
	isPlaced,
	isPromotable,
	isHeldPiece,
	Placed,
	Pawn,
	Lance,
	Knight,
	Silver,
	Gold,
	Bishop,
	Rook,
	GamePiece,
	PieceNames,
	mkHeldPiece,
}

function isPlaced(obj: Piece): obj is PlacedPiece {
	return (obj as Placed).rank !== undefined && (obj as Placed).file !== undefined;
}
type Placed = {
	rank: number;
	file: number;
}

function isPromotable(obj: Record<string, any>): obj is Promotable {
	return (obj as Promotable).isPromoted !== undefined;
}
type Promotable = {
	isPromoted?: boolean;
}

enum PieceNames {
	Pawn = "pawn",
	Lance = "lance",
	Knight = "knight",
	Silver = "silver",
	Bishop = "bishop",
	Rook = "rook",
	Gold = "gold",
	King = "king",
};
type Pawn = Promotable & { name: PieceNames.Pawn };
type Lance = Promotable & { name: PieceNames.Lance };
type Knight = Promotable & { name: PieceNames.Knight };
type Silver = Promotable & { name: PieceNames.Silver };
type Bishop = Promotable & { name: PieceNames.Bishop };
type Rook = Promotable & { name: PieceNames.Rook };

type Gold = { name: PieceNames.Gold };
type King = { name: PieceNames.King };

type GamePiece = Pawn | Lance | Knight | Silver | Gold | Bishop | Rook | King;

/** piece on the board */
type PlacedPiece = GamePiece & Placed;

/** piece in the hand */
type HeldPiece = GamePiece & {
	/** it's possible to hold multiples of the same piece */
	count: number;
}
function isHeldPiece(obj: Record<string, any>): obj is HeldPiece {
	return (obj as HeldPiece).count !== undefined;
}
function mkHeldPiece(pieceName: PieceNames, count: number): HeldPiece {
	return {
		name: pieceName,
		count,
	}
}

type Piece = PlacedPiece | HeldPiece;
