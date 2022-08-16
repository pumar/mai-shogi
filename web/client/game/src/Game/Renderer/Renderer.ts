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
	canvas: HTMLCanvasElement,
	context: CanvasRenderingContext2D,
): void {
	//const { width: canvasWidth, height: canvasHeight } = targetCanvas;
	console.error('TODO render game state', { game, renderSettings: renderSettings });
	//scale the board so that it takes up 75% of the available space from the canvas
	//TODO the aspect ratio for the canvas isn't being propely set, so since the canvas's
	//aspect ratio is not 1:1, things are stretching
	//const { width, height } = canvas;
	const { clientHeight: height, clientWidth: width } = canvas;
	canvas.width = width;
	canvas.height = height;

	const canvasRatio = width / height;
	//const boardWidth = width * 0.75;
	const boardHeight = height * 0.75;
	//const boardRatio = boardWidth / boardHeight;

	//const boardSpaceWidth = boardWidth / 9;
	//const boardSpaceHeight = boardHeight / 9;
	//const logicalBoardWidth = renderSettings.boardSpaceWidth * game.board.files;
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
		board.ranks,
		board.files,
	);
}

function drawPieces(
	context: CanvasRenderingContext2D,
	renderSettings: RenderSettings,
	placedPieces: PlacedPiece[],
	ranks: number,
	files: number,
): void {
	const boardLeftEdge = renderSettings.renderPadding + files * renderSettings.boardSpaceWidth;
	const halfSpaceWidth = renderSettings.boardSpaceWidth / 2;
	const halfSpaceHeight = renderSettings.boardSpaceHeight / 2;
	//const boardRightEdge = renderSettings.renderPadding + ranks * renderSettings.boardSpaceHeight;
	renderSaveContext(context, () => {
		//TODO configurable
		context.fillStyle = "red";
		//TODO 1,1 is the top left corner, this logic is calculating it as the top right corner
		placedPieces.forEach((placedPiece) => {
			const pieceX = boardLeftEdge - placedPiece.file * halfSpaceWidth;
			const pieceY = renderSettings.renderPadding + placedPiece.rank * halfSpaceHeight;
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
