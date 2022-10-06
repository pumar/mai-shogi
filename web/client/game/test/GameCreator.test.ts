import { PlayerColor } from "../src/Game/Consts";
import { getPawnStartRank, makePawns } from "../src/Game/GameCreator";
import { PieceNames, PlacedPiece } from "../src/Game/types/Piece";
import { Turn } from "../src/Game/types/Player";

describe("GameCreator", () => {
	describe("getPawnStartRank", () => {
		const cases: [Turn, number][] = [
			[PlayerColor.Black, 7],
			[PlayerColor.White, 3],
		];
		test.each(cases)("player:%s pawn start rank:%s", (player: Turn, startRank: number) => {
			expect(getPawnStartRank(player)).toBe(startRank);
		});
	});
	describe("makePawns", () => {
		const cases: [{turn: Turn; files: number}, PlacedPiece[]][] = [
			[{ turn: PlayerColor.White, files: 1 }, [{ isPromoted: false, name: PieceNames.Pawn, rank: 3, file: 1 }]],
			[{ turn: PlayerColor.Black, files: 0 }, []],
			[{ turn: PlayerColor.Black, files: 9 }, [
				{ isPromoted: false, name: PieceNames.Pawn, rank: 7, file: 1 },
				{ isPromoted: false, name: PieceNames.Pawn, rank: 7, file: 2 },
				{ isPromoted: false, name: PieceNames.Pawn, rank: 7, file: 3 },
				{ isPromoted: false, name: PieceNames.Pawn, rank: 7, file: 4 },
				{ isPromoted: false, name: PieceNames.Pawn, rank: 7, file: 5 },
				{ isPromoted: false, name: PieceNames.Pawn, rank: 7, file: 6 },
				{ isPromoted: false, name: PieceNames.Pawn, rank: 7, file: 7 },
				{ isPromoted: false, name: PieceNames.Pawn, rank: 7, file: 8 },
				{ isPromoted: false, name: PieceNames.Pawn, rank: 7, file: 9 },
			]]
		];

		test.each(cases)("input:%p output:%p", (input, output) => {
			expect(makePawns(input.turn, input.files)).toStrictEqual(output);
		});
	});
	
});
