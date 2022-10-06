import { PlayerColor } from "../Consts";
import { Board } from "./Board";
import { PlacedPiece } from "./Piece";
import { Player, Turn } from "./Player";

export {
	Game,
	findPlayer,
	findPlacedPieceAndPlayer,
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

function findPlacedPieceAndPlayer(gameState: Game, rank: number, file: number): {
	piece: PlacedPiece,
	player: PlayerColor,
} | undefined {
	const findPiece = (placedPieces: PlacedPiece[]) =>
		placedPieces.find(piece => piece.rank === rank && piece.file === file);
	let piece = findPiece(findPlayer(gameState, PlayerColor.Black).placedPieces);
	let player = PlayerColor.Black;
	if(piece === undefined) {
		piece = findPiece(findPlayer(gameState, PlayerColor.White).placedPieces);
		player = PlayerColor.White;
	}

	return piece !== undefined && player !== undefined ? {
		piece,
		player
	} : undefined;
}
