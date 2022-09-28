import { PlayerColor } from "../Consts";
import { HeldPiece, PlacedPiece } from "./Piece";
export {
	Player,
	Turn,
}

/** gote(white) or sente(black) */
type Turn = PlayerColor.Black | PlayerColor.White;

type Player = {
	turn: Turn;
	placedPieces: PlacedPiece[];
	heldPieces: HeldPiece[];
	moves: [];
}
