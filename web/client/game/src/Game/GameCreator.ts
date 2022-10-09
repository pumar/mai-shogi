import { buildForRange } from "../utils/Range";
import { PlayerColor } from "./Consts";
import { Game } from "./types/Game";
import { mkHeldPiece, PieceNames, BoardLocation, PlacedPiece, HeldPiece } from "./types/Piece";
import { Player, Turn } from "./types/Player";

export {
	createGame,
	makePawns,
	makeLances,
	getPawnStartRank,
	createHeldPieces,
}

/** make an initial game state */
function createGame(): Game {
	const board = {
		ranks: 9,
		files: 9,
	};

	const players: Player[] = ([PlayerColor.Black, PlayerColor.White] as Turn[]).map(makePlayer);
	//console.log({players});

	return {
		board,
		players,
		viewPoint: PlayerColor.Black,
		nextMovePlayer: PlayerColor.Black,
	}
}

function makePlayer(turn: Turn): Player {
	const placedPieces: PlacedPiece[] = [];

	placedPieces.push(...makePawns(turn, 9));
	placedPieces.push(...makeLances(turn));
	placedPieces.push(...makeKnights(turn));
	placedPieces.push(...makeSilvers(turn));
	placedPieces.push(...makeGolds(turn));
	placedPieces.push(...makeKing(turn));
	placedPieces.push(...makeBishop(turn));
	placedPieces.push(...makeRook(turn));

	return {
		placedPieces,
		heldPieces: [
			mkHeldPiece(PieceNames.Pawn, 0),
			mkHeldPiece(PieceNames.Lance, 0),
			mkHeldPiece(PieceNames.Knight, 0),
			mkHeldPiece(PieceNames.Silver, 0),
			mkHeldPiece(PieceNames.Bishop, 0),
			mkHeldPiece(PieceNames.Rook, 0),
			mkHeldPiece(PieceNames.Gold, 0),
		],
		turn,
		moves: [],
	}
}

function createHeldPieces(): HeldPiece[] {
	return [
		mkHeldPiece(PieceNames.Pawn, 0),
		mkHeldPiece(PieceNames.Lance, 0),
		mkHeldPiece(PieceNames.Knight, 0),
		mkHeldPiece(PieceNames.Silver, 0),
		mkHeldPiece(PieceNames.Bishop, 0),
		mkHeldPiece(PieceNames.Rook, 0),
		mkHeldPiece(PieceNames.Gold, 0),
	];
}

/** TODO is there a way to specify that this returns 
* a placed pawn, like PlacedPiece<Pawn>???
**/
function makePawns(turn: Turn, files: number): PlacedPiece[] {
	const rank = getPawnStartRank(turn);
	const locations = buildForRange<BoardLocation>(1, files, (rangeValue: number) => {
		return {
			rank,
			file: rangeValue,
		}
	});
	return makePlacedPieces(
		"pawn",
		//place a piece in the very center of the board for debugging
		//turn === PlayerColor.Black ? [...locations, { rank: 5, file: 5 }] : locations,
		locations,
		{
			isPromoted: false,
		},
	);
}

function getPawnStartRank(turn: Turn): number {
	return turn === PlayerColor.Black ? 7 : 3;
}

function makeLances(turn: Turn): PlacedPiece[] {
	const name = "lance";
	const pieceLocations = turn === PlayerColor.Black ?
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
	const locations = turn === PlayerColor.Black ?
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
	const name = "silver";
	const locations = turn === PlayerColor.Black ?
		[{rank: 9, file: 7}, {rank: 9, file: 3}] :
		[{rank: 1, file: 7}, {rank: 1, file: 3}];
	return makePlacedPieces(name, locations, { isPromoted: false });
}

function makeGolds(turn: Turn): PlacedPiece[] {
	const name = "gold";
	const locations = turn === PlayerColor.Black ?
		[{rank: 9, file: 6}, {rank: 9, file: 4}] :
		[{rank: 1, file: 6}, {rank: 1, file: 4}];
	return makePlacedPieces(name, locations, {});
}

function makePlacedPieces(name: string, locations: BoardLocation[], attributes: Partial<PlacedPiece>): PlacedPiece[] {
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
	const [rank, file] = turn === PlayerColor.Black ? [9, 5] : [1, 5];
	return makePlacedPieces(name, [{rank, file}], {});
}

function makeRook(turn: Turn): PlacedPiece[] {
	const name = "rook";
	const [rank, file] = turn === PlayerColor.Black ? [8, 2] : [2, 8];
	return makePlacedPieces(name, [{rank, file}], { isPromoted: false });
}

function makeBishop(turn: Turn): PlacedPiece[] {
	const name = "bishop";
	const [rank, file] = turn === PlayerColor.Black ? [8, 8] : [2, 2];
	return makePlacedPieces(name, [{rank, file}], {isPromoted: false});
}
