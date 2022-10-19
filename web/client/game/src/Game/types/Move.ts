import { BoardLocation, PieceNames, /*PlacedPiece*/ } from "./Piece"

export {
	Move
}

type Move = {
	start?: BoardLocation,
	end: BoardLocation,
	heldPieceName?: PieceNames;
	promotesPiece: boolean;
	/** TODO once we get the move creation code synchronized this should become unnecessary
	* the string as it was serialized by the server
	**/
	originalString?: string;
}
