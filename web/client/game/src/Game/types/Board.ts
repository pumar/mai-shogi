import { PlacedPiece } from "./Piece";

export {
	Board,
}

type Board = {
	ranks: number;
	files: number;
	placedPieces: PlacedPiece[];
}
