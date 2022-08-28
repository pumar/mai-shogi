import { Board } from "./Board";
import { Player, Turn } from "./Player";

export {
	Game,
}

type Game = {
	board: Board;
	players: Player[];
	/** which player is driving this client
	* if the user is playing the black pieces, this value will be "black"
	* if the user is playing the white pieces, this will be "white"
	**/
	viewPoint: Turn;
}
