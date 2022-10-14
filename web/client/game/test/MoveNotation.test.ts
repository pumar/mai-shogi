import { parseMove } from "../src/Notation/MoveNotation";

describe("MoveNotation.ts - move parsing", () => {
	describe("parseMove", () => {
		const cases = [
			{
				input: "31p 41p",
				answer:{
					start: { rank: 4, file: 2 },
					end: { rank: 5, file: 2 },
					originalString: "31p 41p"
				}
			},
			{
				input: "55K 66K",
				answer:{
					start: { rank: 6, file: 6 },
					end: { rank: 7, file: 7 },
					originalString: "55K 66K"
				}
			},
			{
				input: "00g 01g",
				answer:{
					start: { rank: 1, file: 1 },
					end: { rank: 1, file: 2 },
					originalString:  "00g 01g",
				}
			},
		];
		test.each(cases)("%p", (testCase) => {
			expect(parseMove(testCase.input)).toStrictEqual(testCase.answer);
		});
	});
});
