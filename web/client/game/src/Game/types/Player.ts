import { PlayerColor } from "../Consts";
import { HeldPiece, PlacedPiece } from "./Piece";
export {
	Player,
	Turn,
	removePlacedPiece
}

/** gote(white) or sente(black) */
type Turn = PlayerColor.Black | PlayerColor.White;

type Player = {
	turn: Turn;
	placedPieces: PlacedPiece[];
	heldPieces: HeldPiece[];
	moves: [];
}

function removePlacedPiece(player: Player, removePiece: PlacedPiece): void {
	const removePieceIndex = player.placedPieces.indexOf(removePiece);
	if(removePieceIndex === -1) {
		console.info(`not removing piece from placed pieces because it couldn't be found using an object reference comparison`);
		return;
	}

	player.placedPieces.splice(removePieceIndex, 1);
}
