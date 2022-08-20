import { Board } from "../types/Board";
import { Game } from "../types/Game";
import { isPlaced, isPromotable, PlacedPiece } from "../types/Piece";

export {
	drawGame,
	defaultRenderSettings,
	clearCanvas
}

export type RenderSettings = {
	gridStrokeColor: string;
	boardBackgroundColor: string;
	renderPadding: number;
	boardSpaceWidth: number;
	boardSpaceHeight: number;
}

function defaultRenderSettings(): RenderSettings {
	return {
		gridStrokeColor: "black",
		boardBackgroundColor: "#ffaf4f",
		renderPadding: 10,
		boardSpaceWidth: 11,
		boardSpaceHeight: 12,
	}
}

function clearCanvas(
	canvas: HTMLCanvasElement,
	context: CanvasRenderingContext2D,
): void {
	const {width, height} = canvas;
	renderSaveContext(context, () => {
		context.fillStyle = "white";
		context.fillRect(0, 0, width, height);
	});
}

function drawGame(
	renderSettings: RenderSettings,
	game: Game,
	canvas: HTMLCanvasElement,
	context: CanvasRenderingContext2D,
): void {
	const { clientHeight: height, clientWidth: width } = canvas;
	canvas.width = width;
	canvas.height = height;

	const canvasRatio = width / height;
	const boardHeight = height * 0.75;

	const logicalBoardHeight = renderSettings.boardSpaceHeight * game.board.files;

	//const scaleFactorX = boardWidth / logicalBoardWidth;
	const scaleFactorY = boardHeight / logicalBoardHeight;
	//scale the logical game board up to the size of the canvas
	context.scale(scaleFactorY, scaleFactorY);

	console.log({
		//boardRatio,
		canvasRatio,
		//scaleFactorX,
		scaleFactorY,
	});

	drawBoard(
		context,
		renderSettings,
		game.board
	);

	drawPieces(
		context,
		renderSettings,
		game.players.flatMap((player) => player.pieces.filter(piece => isPlaced(piece)) as PlacedPiece[]),
		game.board.ranks,
		game.board.files,
	);
}

function drawBoard(
	context: CanvasRenderingContext2D,
	renderSettings: RenderSettings,
	board: Board,
) {
	const boardWidth = board.files * renderSettings.boardSpaceWidth;
	const boardHeight = board.ranks * renderSettings.boardSpaceHeight;

	drawBoardOutline(
		context,
		renderSettings.gridStrokeColor,
		renderSettings.renderPadding,
		boardWidth,
		boardHeight
	);

	drawBoardBackground(
		context,
		renderSettings.boardBackgroundColor,
		renderSettings.renderPadding,
		boardWidth,
		boardHeight,
	);

	drawGrid(
		board.ranks, 
		board.files,
		context, 
		renderSettings.boardSpaceWidth,
		renderSettings.boardSpaceHeight,
		renderSettings.renderPadding,
		renderSettings.gridStrokeColor,
	);
}

function drawPieces(
	context: CanvasRenderingContext2D,
	renderSettings: RenderSettings,
	placedPieces: PlacedPiece[],
	ranks: number,
	files: number,
): void {
	const boardRightEdge = renderSettings.renderPadding + files * renderSettings.boardSpaceWidth;
	const halfSpaceWidth = renderSettings.boardSpaceWidth / 2;
	const halfSpaceHeight = renderSettings.boardSpaceHeight / 2;
	//TODO actually use a svg or something to represent the piece
	//TODO calculate the width of the piece image and use it to center it on the space
	//adjust the letters so that they are kinda in the center of their square
	const letterAdjust = 3;
	console.log({ halfSpaceWidth, halfSpaceHeight });
	//const boardRightEdge = renderSettings.renderPadding + ranks * renderSettings.boardSpaceHeight;
	renderSaveContext(context, () => {
		//TODO configurable
		context.fillStyle = "red";
		context.strokeStyle = "red";
		//TODO the font size is being ignored - in Firefox
		context.font = 'normal 0.5em Noto Sans JP';
		placedPieces.forEach((placedPiece) => {
			console.log('drawing piece:', placedPiece);
			const pieceX = boardRightEdge - halfSpaceWidth - renderSettings.boardSpaceWidth * (placedPiece.file - 1) - letterAdjust;
			const pieceY = renderSettings.renderPadding + halfSpaceHeight + (renderSettings.boardSpaceHeight * (placedPiece.rank - 1)) + letterAdjust;
			const glyphs = pieceCodeToGlyphs(placedPiece.name);
			let glyph: string;
			if (isPromotable(placedPiece) && placedPiece.isPromoted) {
				const promotedGlyph = glyphs[1];
				if (promotedGlyph === undefined) throw new Error(`promoted piece (${placedPiece.name} should map to a glyph, but a glyph was not found`);
				glyph = promotedGlyph;
			} else glyph = glyphs[0];
			//console.log(`canvas font:${context.font}`);
			context.fillText(glyph, pieceX, pieceY);
			//context.strokeText(glyph, pieceX, pieceY);
		});
	});
}

/** peice name -> [non-promoted name, promoted name] */
const pieceGlyphMap: Record<string, [string, string?]> = {
	pawn: ["歩", "と"],
	bishop: ["角", "馬"],
	silver: ["銀", "全"],
	gold: ["金"],
	rook: ["飛", "竜"],
	king: ["王"],
	lance: ["香", "杏"],
	knight: ["桂", "圭"],
}

function pieceCodeToGlyphs(pieceCode: string): [string, string?] {
	const glyphs = pieceGlyphMap[pieceCode];
	if (glyphs === undefined) throw new Error(`pieceCodeToGlyph failed to get a glyph for piece of type:${pieceCode}`);
	return glyphs;
}

function drawBoardOutline(
	context: CanvasRenderingContext2D,
	gridStrokeColor: string,
	padding: number,
	boardWidth: number,
	boardHeight: number,
): void {
	renderSaveContext(context, () => {
		context.strokeStyle = gridStrokeColor;
		context.strokeRect(
			padding,
			padding,
			boardWidth,
			boardHeight,
		);
	});
}

function drawBoardBackground(
	context: CanvasRenderingContext2D,
	boardBackgroundColor: string,
	padding: number,
	boardWidth: number,
	boardHeight: number,
): void {
	renderSaveContext(context, () => {
		context.fillStyle = boardBackgroundColor;
		context.fillRect(
			padding,
			padding,
			boardWidth,
			boardHeight,
		);
	});
}


function drawGrid(
	ranks: number,
	files: number,
	context: CanvasRenderingContext2D, 
	boardSpaceWidth: number,
	boardSpaceHeight: number,
	renderPadding: number,
	strokeColor: string,
): void {
	renderSaveContext(context, () => {
		const startX = renderPadding;
		const startY = renderPadding;
		let x = startX;
		let y = startY + boardSpaceHeight;
		context.beginPath();
		for(let rank = 0; rank < ranks - 1; rank++) {
			context.moveTo(x, y);
			context.lineTo(x + files * boardSpaceWidth, y);
			y += boardSpaceHeight;
		}

		x = startX + boardSpaceWidth;
		y = startY;
		for(let file = 0; file < files - 1; file++) {
			context.moveTo(x, y)
			context.lineTo(x, y + ranks * boardSpaceHeight)
			x += boardSpaceWidth;
		}
		context.strokeStyle = strokeColor;
		context.stroke();
	});
}

function renderSaveContext(context: CanvasRenderingContext2D, callback: Function): void {
	context.save();
	callback(context);
	context.restore();
}
