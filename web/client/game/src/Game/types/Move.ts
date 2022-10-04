import { BoardLocation, PieceNames, /*PlacedPiece*/ } from "./Piece"

export {
	Move
}

type Move = {
	start: BoardLocation,
	end: BoardLocation,
	heldPieceName?: PieceNames;
}
