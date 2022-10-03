import { PlayerColor } from "../Game/Consts";
import { PieceNames, PlacedPiece } from "../Game/types/Piece";
import { Player } from "../Game/types/Player";

export {
	sfenToGame
}

enum Splits {
	Meta = " ",
	Rank = "/",
}

type PlayerPlacedPiece = PlacedPiece & { playerColor: PlayerColor };

function sfenToGame(sfen: string): Game {
	const [board, toPlay, hands] = sfen.split(Splits.Meta);

	const nextMovePlayer: Partial<Player> = toPlay === 'b'
		? { turn: PlayerColor.Black }
		: { turn: PlayerColor.White };

	const placedPiecesPerPlayer = getPlacedPieces(board);
}

function getPlacedPieces(board: string): {
	whitePieces: PlacedPiece[],
	blackPieces: PlacedPiece[],
} {
	const whitePieces: PlacedPiece[] = [];
	const blackPieces: PlacedPiece[] = [];

	const ranks = board.split(Splits.Rank);
	
	ranks.forEach((rank: string, rankIndex: number) => {
		const pieces = getPiecesFromRank(rank, []);
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

	const [pieceName, playerColor] = letterToPiece(rankContents[1]);

	return getPiecesFromRank(
		isPromoted ? rankContents.slice(2) : rankContents.slice(1),
		rank,
		file + 1,
		placedPieces.push({
			pieceName,
			playerColor,
			rank,
			file
		}),
	);
}

function letterToPiece(letter: string): [PieceNames, PlayerColor] {
	let pieceName;
	const player = letter > 'z' ? PlayerColor.Black : PlayerColor.White;
	switch(letter){
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
		default:
			throw new Error(`Sfen::letterToPiece could not determine piece name from letter:${letter}`);
	}
	return [pieceName, player];
}
