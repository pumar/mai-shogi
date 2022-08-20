import { buildForRange } from "../utils/Range";
import { Game } from "./types/Game";
import { PlacedPiece } from "./types/Piece";
import { Player, Turn } from "./types/Player";

export {
	createGame,
	makePawns,
	getPawnStartRank,
}

/** make an initial game state */
function createGame(): Game {
	const board = {
		ranks: 9,
		files: 9,
	};

	const players: Player[] = (["black", "white"] as Turn[]).map(makePlayer);

	return {
		board,
		players,
	}
}

function makePlayer(turn: Turn): Player {
	const pieces = [];
	pieces.push(...makePawns(turn, 9));
	return {
		pieces,
		turn,
		moves: [],
	}
}

/** TODO is there a way to specify that this returns 
* a placed pawn, like PlacedPiece<Pawn>???
**/
function makePawns(turn: Turn, files: number): PlacedPiece[] {
	const rank = getPawnStartRank(turn);
	return buildForRange<PlacedPiece>(1, files, (rangeValue: number) => {
		return {
			isPromoted: false,
			name: "pawn",
			rank,
			file: rangeValue,
		}
	});
}

function getPawnStartRank(turn: Turn): number {
	return turn === "black" ? 7 : 3;
}
