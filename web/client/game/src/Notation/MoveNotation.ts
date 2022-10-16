import { Move } from "../Game/types/Move"
import { BoardLocation } from "../Game/types/Piece"

export {
	parseMove,
	serverMovesToClientMoves,
	clientMoveToServerMove,
}

enum Splits {
	StartEndSplit = ' ',
}

//TODO how can I tell if the move is a held piece?
//this function will need to determine whether it's a held piece or not
function parseMove(moveInput: string): Move {
	const [start, end] = moveInput.split(Splits.StartEndSplit);
	//console.log({ moveInput, start, end });
	const startLoc = digitsToRanksAndFiles(start.slice(0, 2));

	const endLoc = digitsToRanksAndFiles(end.slice(0, 2));
	const [pieceWillBePromoted, remainingInput] = isPromotes(end.slice(2, 4));
	//console.log(`parseMove, moveInput:${moveInput}`, { pieceWillBePromoted, remainingInput});

	return {
		start: startLoc,
		end: endLoc,
		originalString: moveInput,
		promotesPiece: pieceWillBePromoted,
		//takesPiece: false,
	}
}

function isPromotes(moveInput: string): [boolean, string] {
	if (moveInput.length === 0) return [false, ""];
	if (moveInput[0] === '+') {
		return [true, moveInput.slice(1)];
	}

	return [false, moveInput];
}

function digitsToRanksAndFiles(digits: string): BoardLocation {
	if (digits.length !== 2) console.error(`digitsToRanksAndFiles, weird input does not have exactly 2 characters:${digits}`);
	//the python game logic module has these moves indexed starting from 0,
	//and the client is 1 indexed, so we need to add 1 when we parse the messages from the server
	return {
		rank: Number.parseInt(digits[0]) + 1,
		file: Number.parseInt(digits[1]) + 1,
	}
}

function serverMovesToClientMoves(moves: string[]): Move[] {
	const processedMoves: Move[] = moves.map(move => {
		return parseMove(move);
	});

	//server and client coordinate spaces are the opposite, flip them for now
	//9 is 1, 2 is 8... and so on
	//processedMoves.forEach((move: Move) => {
	//	move.start.rank = 10 - move.start.rank;
	//	move.start.file = 10 - move.start.file;
	//	move.end.rank = 10 - move.end.rank;
	//	move.end.file = 10 - move.end.file;
	//});

	//I'm pretty sure the server is in (file, rank) order and the client
	//is in (rank, file) order, so flip that too
	processedMoves.forEach((move: Move) => {
		const startRank = move.start.rank;
		move.start.rank = move.start.file
		move.start.file = startRank;

		const endRank = move.end.rank;
		move.end.rank = move.end.file;
		move.end.file = endRank;
	});

	return processedMoves;
}

function clientMoveToServerMove(move: Move): Move {
	const newMove = structuredClone(move);
	const startRank = newMove.start.rank;
	newMove.start.rank = newMove.start.file;
	newMove.start.file = startRank;

	const endRank = newMove.end.rank;
	newMove.end.rank = newMove.end.file;
	newMove.end.file = endRank;

	//newMove.start.rank = 10 - newMove.start.rank;
	//newMove.end.rank = 10 - newMove.start.rank;
	//newMove.start.file = 10 - newMove.start.file;
	//newMove.end.file = 10 - newMove.end.file;

	newMove.start.rank -= 1;
	newMove.start.file -= 1;
	newMove.end.rank -= 1;
	newMove.end.file -= 1;
	return newMove;
}
