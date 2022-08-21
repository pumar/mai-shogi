import { Board } from "./Board";
import { Player } from "./Player";

export {
	Game,
}

type Game = {
	board: Board;
	players: Player[];
}
