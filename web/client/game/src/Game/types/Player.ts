import { HeldPiece, PlacedPiece } from "./Piece";
export {
	Player,
	Turn,
}

/** gote(white) or sente(black) */
type Turn = "black" | "white";

type Player = {
	turn: Turn;
	placedPieces: PlacedPiece[];
	heldPieces: HeldPiece[];
	moves: [];
}
