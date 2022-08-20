import { buildForRange } from "../utils/Range";
import { Game } from "./types/Game";
import { Placed, PlacedPiece } from "./types/Piece";
import { Player, Turn } from "./types/Player";

export {
	createGame,
	makePawns,
	makeLances,
	getPawnStartRank,
}

/** make an initial game state */
function createGame(): Game {
	const board = {
		ranks: 9,
		files: 9,
	};

	const players: Player[] = (["black", "white"] as Turn[]).map(makePlayer);
	console.log({players});

	return {
		board,
		players,
	}
}

function makePlayer(turn: Turn): Player {
	const pieces: PlacedPiece[] = [];

	pieces.push(...makePawns(turn, 9));
	pieces.push(...makeLances(turn));
	pieces.push(...makeKnights(turn));
	pieces.push(...makeSilvers(turn));
	pieces.push(...makeGolds(turn));
	pieces.push(...makeKing(turn));
	pieces.push(...makeBishop(turn));
	pieces.push(...makeRook(turn));

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
	const locations = buildForRange<Placed>(1, files, (rangeValue: number) => {
		return {
			rank,
			file: rangeValue,
		}
	});
	return makePlacedPieces(
		"pawn",
		locations,
		{
			isPromoted: false,
		},
	);
}

function getPawnStartRank(turn: Turn): number {
	return turn === "black" ? 7 : 3;
}

function makeLances(turn: Turn): PlacedPiece[] {
	const name = "lance";
	const pieceLocations = turn === "black" ?
		[{rank: 9, file: 9}, {rank: 9, file: 1}] :
		[{rank: 1, file: 9}, {rank: 1, file: 1}];
	return makePlacedPieces(
		name,
		pieceLocations,
		{
			isPromoted: false,
		}
	);
}

function makeKnights(turn: Turn): PlacedPiece[] {
	const name = "knight";
	const locations = turn === "black" ?
		[{rank: 9, file: 8}, {rank: 9, file: 2}] :
		[{rank: 1, file: 8}, {rank: 1, file: 2}];
	return makePlacedPieces(
		name,
		locations,
		{
			isPromoted: false,
		}
	);
}

function makeSilvers(turn: Turn): PlacedPiece[] {
	const name = "gold";
	const locations = turn === "black" ?
		[{rank: 9, file: 7}, {rank: 9, file: 2}] :
		[{rank: 1, file: 7}, {rank: 1, file: 3}];
	return makePlacedPieces(name, locations, { isPromoted: false });
}

function makeGolds(turn: Turn): PlacedPiece[] {
	const name = "silver";
	const locations = turn === "black" ?
		[{rank: 9, file: 6}, {rank: 9, file: 4}] :
		[{rank: 1, file: 6}, {rank: 1, file: 4}];
	return makePlacedPieces(name, locations, {});
}

function makePlacedPieces(name: string, locations: Placed[], attributes: Partial<PlacedPiece>): PlacedPiece[] {
	return locations.map(location => Object.assign(
		{
			name,
		},
		attributes,
		location
	));
}

function makeKing(turn: Turn): PlacedPiece[] {
	const name = "king";
	const [rank, file] = turn === "black" ? [9, 5] : [1, 5];
	return makePlacedPieces(name, [{rank, file}], {});
}

function makeRook(turn: Turn): PlacedPiece[] {
	const name = "rook";
	const [rank, file] = turn === "black" ? [8, 2] : [2, 8];
	return makePlacedPieces(name, [{rank, file}], { isPromoted: false });
}

function makeBishop(turn: Turn): PlacedPiece[] {
	const name = "bishop";
	const [rank, file] = turn === "black" ? [8, 8] : [2, 2];
	return makePlacedPieces(name, [{rank, file}], {isPromoted: false});
}
