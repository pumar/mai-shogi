import { getPawnStartRank, makePawns } from "../src/Game/GameCreator";
import { PlacedPiece } from "../src/Game/types/Piece";
import { Turn } from "../src/Game/types/Player";

describe("GameCreator", () => {
	describe("getPawnStartRank", () => {
		const cases: [Turn, number][] = [
			["black", 7],
			["white", 3],
		];
		test.each(cases)("player:%s pawn start rank:%s", (player: Turn, startRank: number) => {
			expect(getPawnStartRank(player)).toBe(startRank);
		});
	});
	describe("makePawns", () => {
		const cases: [{turn: Turn; files: number}, PlacedPiece[]][] = [
			[{ turn: "white", files: 1 }, [{ isPromoted: false, name: "pawn", rank: 3, file: 1 }]],
			[{ turn: "black", files: 0 }, []],
			[{ turn: "black", files: 9 }, [
				{ isPromoted: false, name: "pawn", rank: 7, file: 1 },
				{ isPromoted: false, name: "pawn", rank: 7, file: 2 },
				{ isPromoted: false, name: "pawn", rank: 7, file: 3 },
				{ isPromoted: false, name: "pawn", rank: 7, file: 4 },
				{ isPromoted: false, name: "pawn", rank: 7, file: 5 },
				{ isPromoted: false, name: "pawn", rank: 7, file: 6 },
				{ isPromoted: false, name: "pawn", rank: 7, file: 7 },
				{ isPromoted: false, name: "pawn", rank: 7, file: 8 },
				{ isPromoted: false, name: "pawn", rank: 7, file: 9 },
			]]
		];

		test.each(cases)("input:%p output:%p", (input, output) => {
			expect(makePawns(input.turn, input.files)).toStrictEqual(output);
		});
	});
	
});
