import { Board } from "../types/Board";
import { Game } from "../types/Game";
import { PlacedPiece } from "../types/Piece";

export {
	drawGame,
	defaultRenderSettings
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

function drawGame(
	renderSettings: RenderSettings,
	game: Game,
	_: HTMLCanvasElement,
	context: CanvasRenderingContext2D,
): void {
	//const { width: canvasWidth, height: canvasHeight } = targetCanvas;
	console.error('TODO render game state', { game, renderSettings: renderSettings });
	//TODO the aspect ratio for the canvas isn't being propely set, so since the canvas's
	//aspect ratio is not 1:1, things are stretching

	drawBoard(
		context,
		renderSettings,
		game.board
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

	drawPieces(
		context,
		renderSettings,
		board.placedPieces,
	);
}

function drawPieces(
	context: CanvasRenderingContext2D,
	renderSettings: RenderSettings,
	placedPieces: PlacedPiece[]
): void {
	renderSaveContext(context, () => {
		//TODO configurable
		context.fillStyle = "red";
		//TODO 1,1 is the top left corner, this logic is calculating it as the top right corner
		placedPieces.forEach((placedPiece) => {
			const pieceX = renderSettings.renderPadding + placedPiece.file * (renderSettings.boardSpaceWidth / 2);
			const pieceY = renderSettings.renderPadding + placedPiece.rank * (renderSettings.boardSpaceHeight / 2);
			context.fillText(pieceCodeToGlyph(placedPiece.name), pieceX, pieceY);
		});
	});
}

function pieceCodeToGlyph(pieceCode: string): string {
	switch(pieceCode) {
		case "pawn":
			return "p";
		default:
			throw new Error(`pieceCodeToGlyph failed to get a glyph for piece of type:${pieceCode}`);
	}
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
	callback();
	context.restore();
}
