import { Move } from "../Game/types/Move"
import { BoardLocation } from "../Game/types/Piece"

export {
	parseMove,
}

enum Splits {
	StartEndSplit = ' ',
}

//TODO how can I tell if the move is a held piece?
//these function will need to determine whether it's a held piece or not
function parseMove(moveInput: string): Move {
	const [start, end] = moveInput.split(Splits.StartEndSplit);
	console.log({ moveInput, start, end });
	const startLoc = digitsToRanksAndFiles(start.slice(0, 2));
	const endLoc = digitsToRanksAndFiles(end.slice(0, 2));

	return {
		start: startLoc,
		end: endLoc,
		//promotesPiece: false,
		//takesPiece: false,
	}
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
