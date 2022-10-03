import { PlayerColor } from "../Consts";
import { Turn } from "./Player";

export {
	Piece,
	PlacedPiece,
	HeldPiece,
	PlayerHeldPiece,
	PlayerPlacedPiece,
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
	mkPlacedPiece,
	mkPlayerPlacedPiece,
	mkGamePiece,
	arePiecesEqual,
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
function mkGamePiece(isPromoted: boolean, pieceName: PieceNames): GamePiece {
	return {
		isPromoted,
		name: pieceName
	}
}

/** piece on the board */
type PlacedPiece = GamePiece & Placed;

type PlayerPlacedPiece = PlacedPiece & { playerColor: PlayerColor };
function mkPlayerPlacedPiece(
	gamePiece: GamePiece,
	location: Placed,
	playerColor: PlayerColor
): PlayerPlacedPiece {
	return Object.assign(mkPlacedPiece(
			gamePiece,
			location,
		),
		{ playerColor },
	) as PlayerPlacedPiece;
}

function mkPlacedPiece(piece: GamePiece, location: Placed): PlacedPiece {
	return Object.assign({}, piece, location);
}

/** piece in the hand */
type HeldPiece = GamePiece & {
	/** it's possible to hold multiples of the same piece */
	count: number;
}

type PlayerHeldPiece = HeldPiece & {
	player: Turn;
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

//TODO unit test
function arePiecesEqual(piece1: PlayerHeldPiece | PlacedPiece, piece2: PlayerHeldPiece | PlacedPiece) {
	if(isHeldPiece(piece1) && !isHeldPiece(piece2)) return false;
	if(isPlaced(piece1) && !isPlaced(piece2)) return false;
	if(isHeldPiece(piece1)){
		//held pieces are equal if the piece names are the same,
		//and both pieces are held by the same player
		return piece1.name === piece2.name && piece1.player === (piece2 as PlayerHeldPiece).player;
	} else {
		//placed pieces are equal if they are on the same rank and file
		return piece1.rank === (piece2 as PlacedPiece).rank && piece1.file === (piece2 as PlacedPiece).file;
	}
}

type Piece = PlacedPiece | HeldPiece;
