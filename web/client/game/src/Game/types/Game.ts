import { Board } from "./Board";
import { Piece } from "./Piece";

export {
	Game,
}

type Game = {
	board: Board;
	heldPieces: {
		player1: Piece[],
		player2: Piece[],
	};
}
