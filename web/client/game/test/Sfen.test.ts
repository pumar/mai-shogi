import { getHands, letterToPiece } from "../src/Notation/Sfen";
import { HeldPiece, mkHeldPiece, PieceNames } from "../src/Game/types/Piece";
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

	describe("get held pieces from SFEN", () => {
	});

	describe("get placed pieces from SFEN", () => {
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
