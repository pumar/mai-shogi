import { getHands, getPiecesFromRank, letterToPiece } from "../src/Notation/Sfen";
import { HeldPiece, mkGamePiece, mkHeldPiece, mkPlacedPiece, mkPlayerPlacedPiece, PieceNames } from "../src/Game/types/Piece";
import { PlayerColor } from "../src/Game/Consts";

describe("parse SFEN into a game state object", () => {
	describe("get piece name and the pieces owner", () => {
		const cases = [
			["b", [PieceNames.Bishop, PlayerColor.White]],
			["B", [PieceNames.Bishop, PlayerColor.Black]],
			["s", [PieceNames.Silver, PlayerColor.White]],
			["S", [PieceNames.Silver, PlayerColor.Black]],
		];

		test.each(cases)("input:%s answer:%p", (input: string, answer) => {
			expect(letterToPiece(input)).toStrictEqual(answer);
		});
	});

	describe("get placed pieces from SFEN", () => {
		describe("get pieces from a rank descriptor", () => {
			const cases = [
				{ rankContents: "9", rank: 4, placedPieces: [] },
				{
					rankContents: "k8",
					rank: 1,
					placedPieces: [
						mkPlayerPlacedPiece(mkGamePiece(false, PieceNames.King), { rank: 1, file: 1 }, PlayerColor.White),
					]
				},
				{
					rankContents: "1k7",
					rank: 1,
					placedPieces: [
						mkPlayerPlacedPiece(mkGamePiece(false, PieceNames.King), { rank: 1, file: 2 }, PlayerColor.White),
					]
				},
				{
					rankContents: "1K7",
					rank: 1,
					placedPieces: [
						mkPlayerPlacedPiece(mkGamePiece(false, PieceNames.King), { rank: 1, file: 2 }, PlayerColor.Black),
					]
				},
				{
					rankContents: "ppppppppp", rank: 3, placedPieces: [
						mkPlayerPlacedPiece(mkGamePiece(false, PieceNames.Pawn), { rank: 3, file: 1}, PlayerColor.White),
						mkPlayerPlacedPiece(mkGamePiece(false, PieceNames.Pawn), { rank: 3, file: 2}, PlayerColor.White),
						mkPlayerPlacedPiece(mkGamePiece(false, PieceNames.Pawn), { rank: 3, file: 3}, PlayerColor.White),
						mkPlayerPlacedPiece(mkGamePiece(false, PieceNames.Pawn), { rank: 3, file: 4}, PlayerColor.White),
						mkPlayerPlacedPiece(mkGamePiece(false, PieceNames.Pawn), { rank: 3, file: 5}, PlayerColor.White),
						mkPlayerPlacedPiece(mkGamePiece(false, PieceNames.Pawn), { rank: 3, file: 6}, PlayerColor.White),
						mkPlayerPlacedPiece(mkGamePiece(false, PieceNames.Pawn), { rank: 3, file: 7}, PlayerColor.White),
						mkPlayerPlacedPiece(mkGamePiece(false, PieceNames.Pawn), { rank: 3, file: 8}, PlayerColor.White),
						mkPlayerPlacedPiece(mkGamePiece(false, PieceNames.Pawn), { rank: 3, file: 9}, PlayerColor.White),
					]
				},
				{
					rankContents: "ggg3GGG",
					rank: 2,
					placedPieces: [
						mkPlayerPlacedPiece(mkGamePiece(false, PieceNames.Gold), { rank: 2, file: 1}, PlayerColor.White),
						mkPlayerPlacedPiece(mkGamePiece(false, PieceNames.Gold), { rank: 2, file: 2}, PlayerColor.White),
						mkPlayerPlacedPiece(mkGamePiece(false, PieceNames.Gold), { rank: 2, file: 3}, PlayerColor.White),
						mkPlayerPlacedPiece(mkGamePiece(false, PieceNames.Gold), { rank: 2, file: 7}, PlayerColor.Black),
						mkPlayerPlacedPiece(mkGamePiece(false, PieceNames.Gold), { rank: 2, file: 8}, PlayerColor.Black),
						mkPlayerPlacedPiece(mkGamePiece(false, PieceNames.Gold), { rank: 2, file: 9}, PlayerColor.Black),
					]
				},
			];
			test.each(cases)("%p", (testCase) => {
				expect(getPiecesFromRank(
					testCase.rankContents,
					testCase.rank,
					1,
					[]
				)).toStrictEqual(testCase.placedPieces);
			});
		});
	});

	describe("get held pieces from SFEN", () => {
		const cases = [
			["", { whiteHeld: [], blackHeld: [] }],
			["b", { whiteHeld: [ mkHeldPiece(PieceNames.Bishop, 1) ], blackHeld: [] }],
			["1b", { whiteHeld: [ mkHeldPiece(PieceNames.Bishop, 1) ], blackHeld: [] }],
			["2b", { whiteHeld: [ mkHeldPiece(PieceNames.Bishop, 2) ], blackHeld: [] }],
			["2l3L", {
				whiteHeld: [ mkHeldPiece(PieceNames.Lance, 2) ],
				blackHeld: [ mkHeldPiece(PieceNames.Lance, 3) ]
			}],
			["3p9Ps4SG", {
				whiteHeld: [
					mkHeldPiece(PieceNames.Pawn, 3),
					mkHeldPiece(PieceNames.Silver, 1),
				],
				blackHeld: [
					mkHeldPiece(PieceNames.Pawn, 9),
					mkHeldPiece(PieceNames.Silver, 4),
					mkHeldPiece(PieceNames.Gold, 1),
				],
			}],

		];

		test.each(cases)("input:%s answer:%p", (input: string, answer: { whiteHeld: HeldPiece[]; blackHeld: HeldPiece[]; }) => {
			expect(getHands(input, [], [])).toStrictEqual(answer);
		});
	});

	describe("figure out which player plays next", () => {
	});
});
