import { Board } from "./Board";
import { Player, Turn } from "./Player";

export {
	Game,
	findPlayer,
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

/**
* find player in player array or throw error
**/
function findPlayer(game: Game, findPlayer: Turn): Player {
	const player = game.players.find(player => player.turn === findPlayer);
	if(player === undefined) throw new Error(`findPlayer player "${findPlayer}" not found`);
	return player;
}
