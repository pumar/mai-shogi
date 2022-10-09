import { PlayerColor } from "../Game/Consts";
import { createHeldPieces } from "../Game/GameCreator";
import { Game } from "../Game/types/Game";
import { HeldPiece, PieceNames, PlacedPiece, PlayerPlacedPiece } from "../Game/types/Piece";

export {
	sfenToGame,
	getHands,
	letterToPiece,
	getPiecesFromRank,
}

enum Splits {
	Meta = " ",
	Rank = "/",
}

/**
* turn the SFEN encoded game to a Game state object
* does not do the moves available per player
* does not know the viewpoint of the player of this client (white or black)
**/
function sfenToGame(sfen: string): Partial<Game> {
	const [board, toPlay, hands] = sfen.split(Splits.Meta);

	const nextMovePlayer: PlayerColor = toPlay === 'b'
		? PlayerColor.Black
		: PlayerColor.White;

	const placedPiecesPerPlayer = getPlacedPieces(board);

	const heldPiecesPerPlayer = getHands(
		hands,
		[],
		[]
	);
	//the client side game object expects each player to have a map of
	//piece names to the # of those pieces that they are holding
	//even if there are none, there should be a mapping from
	//piece name to zero, so fill in the blanks
	const whiteHeldPieces = createHeldPieces();
	heldPiecesPerPlayer.whiteHeld.forEach(held => {
		const updatePiece = whiteHeldPieces.find(whiteHeld => whiteHeld.name === held.name)
		if (updatePiece) updatePiece.count += held.count;
	});

	const blackHeldPieces = createHeldPieces();
	heldPiecesPerPlayer.blackHeld.forEach(held => {
		const updatePiece = blackHeldPieces.find(blackHeld => blackHeld.name === held.name)
		if (updatePiece) updatePiece.count += held.count;
	});

	return {
		board: {
			ranks: 9,
			files: 9,
		},
		players: [
			{
				turn: PlayerColor.White,
				placedPieces: placedPiecesPerPlayer.whitePieces,
				heldPieces: whiteHeldPieces,
				moves: []
			},
			{
				turn: PlayerColor.Black,
				placedPieces: placedPiecesPerPlayer.blackPieces,
				heldPieces: blackHeldPieces,
				moves: [],
			}
		],
		nextMovePlayer,
	}
}

function getHands(sfenHands: string, whiteHeld: HeldPiece[], blackHeld: HeldPiece[]): {
	whiteHeld: HeldPiece[],
	blackHeld: HeldPiece[],
} {
	if(sfenHands.length === 0) {
		return {
			whiteHeld,
			blackHeld,
		}
	}
	let tookTwoCharacters = false;

	const firstChar = sfenHands[0];
	const matchResult = firstChar.match(/[0-9]/);
	let numberHeld = 1;
	let pieceLetter;
	if(matchResult !== null) {
		numberHeld = Number.parseInt(matchResult[0]);
		if(Number.isNaN(numberHeld)) throw new Error(`getHands had a NaN value for a held piece count:${numberHeld}`);
		pieceLetter = sfenHands[1];
		tookTwoCharacters = true;
	} else {
		pieceLetter = sfenHands[0]
	}

	if(pieceLetter === undefined){
		throw new Error(`getHands couldn't find the piece indication letter for a held piece:${sfenHands}`);
	}

	const [pieceName, playerColor] = letterToPiece(pieceLetter);

	const newHeldPiece = {
		name: pieceName,
		count: numberHeld
	};

	playerColor === PlayerColor.Black
		? blackHeld.push(newHeldPiece)
		: whiteHeld.push(newHeldPiece);

	return getHands(
		sfenHands.slice(tookTwoCharacters ? 2 : 1),
		whiteHeld,
		blackHeld,
	);
}

function getPlacedPieces(board: string): {
	whitePieces: PlacedPiece[],
	blackPieces: PlacedPiece[],
} {
	const whitePieces: PlacedPiece[] = [];
	const blackPieces: PlacedPiece[] = [];

	const ranks = board.split(Splits.Rank);
	
	ranks.forEach((rank: string, rankIndex: number) => {
		const pieces = getPiecesFromRank(
			rank,
			rankIndex + 1,
			1,
			[]
		);
		whitePieces.push(...pieces.filter(pce => pce.playerColor === PlayerColor.White));
		blackPieces.push(...pieces.filter(pce => pce.playerColor === PlayerColor.Black));
	});

	return {
		whitePieces,
		blackPieces
	}
}

function getPiecesFromRank(
	rankContents: string,
	rank: number,
	file: number,
	placedPieces: PlayerPlacedPiece[]
): PlayerPlacedPiece[] {
	if(rankContents === '') return placedPieces;

	let isPromoted = false;

	if(rankContents[0] === '+') {
		isPromoted = true;
	}

	const matchResult = rankContents[0].match(/[0-9]/);
	const blankSpaceCount = matchResult !== null ? Number.parseInt(matchResult[0]) : null;
	if (Number.isNaN(blankSpaceCount)) {
		throw new Error(`Sfen::getPiecesFromRank had a bad argument in rank:${rank}, badArg:${rankContents[0]}`);
	}

	if(blankSpaceCount !== null){
		return getPiecesFromRank(
			rankContents.slice(1),
			rank,
			file + blankSpaceCount,
			placedPieces
		);
	}

	const [pieceName, playerColor] = letterToPiece(rankContents[isPromoted ? 1 : 0]);

	placedPieces.push({
			name: pieceName,
			isPromoted,
			playerColor,
			rank,
			file
	});

	return getPiecesFromRank(
		rankContents.slice(isPromoted ? 2 : 1),
		rank,
		file + 1,
		placedPieces,
	);
}

function letterToPiece(letter: string): [PieceNames, PlayerColor] {
	let pieceName;
	//you can't use inequality operators to check if a character's ascii/utf-8
	//value is higher than another character, TIL
	//stacked overflow said to compare the letter to it's uppercased self
	const player = letter === letter.toUpperCase() ? PlayerColor.Black : PlayerColor.White;
	switch(letter){
		case 'p':
		case 'P':
			pieceName = PieceNames.Pawn;
			break;
		case 'b':
		case 'B':
			pieceName = PieceNames.Bishop;
			break;
		case 'l':
		case 'L':
			pieceName = PieceNames.Lance;
			break;
		case 'n':
		case 'N':
			pieceName = PieceNames.Knight;
			break;
		case 's':
		case 'S':
			pieceName = PieceNames.Silver;
			break;
		case 'g':
		case 'G':
			pieceName = PieceNames.Gold
			break;
		case 'k':
		case 'K':
			pieceName = PieceNames.King;
			break;
		case 'r':
		case 'R':
			pieceName = PieceNames.Rook;
			break;
		default:
			throw new Error(`Sfen::letterToPiece could not determine piece name from letter:${letter}`);
	}
	return [pieceName, player];
}
