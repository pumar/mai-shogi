import { Board } from "../types/Board";

export {
	drawBoard,
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

function drawBoard(
	renderSettings: RenderSettings,
	board: Board,
	_: HTMLCanvasElement,
	context: CanvasRenderingContext2D,
): void {
	//const { width: canvasWidth, height: canvasHeight } = targetCanvas;
	console.error('TODO render game state', { board, renderSettings: renderSettings });
	//TODO the aspect ratio for the canvas isn't being propely set, so since the canvas's
	//aspect ratio is not 1:1, things are stretching
	const boardWidth = board.files * renderSettings.boardSpaceWidth;
	const boardHeight = board.ranks * renderSettings.boardSpaceHeight;
	console.log({ boardWidth, boardHeight });

	drawBoardOutline(
		context,
		renderSettings.gridStrokeColor,
		renderSettings.renderPadding,
		boardWidth,
		boardHeight
	);

	//drawGrid(
	//	board, 
	//	context, 
	//	renderSettings.boardSpaceWidth,
	//	renderSettings.boardSpaceHeight,
	//	[renderSettings.renderPadding + renderSettings.boardSpaceWidth, renderSettings.renderPadding + renderSettings.boardSpaceHeight],
	//	renderSettings.gridStrokeColor,
	//);

	drawBoardBackground(
		context,
		renderSettings.boardBackgroundColor,
		renderSettings.renderPadding,
		boardWidth,
		boardHeight,
	);
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
	board: Board, 
	context: CanvasRenderingContext2D, 
	boardSpaceWidth: number,
	boardSpaceHeight: number,
	startPoint: [number, number],
	strokeColor: string,
): void {
	renderSaveContext(context, () => {
		const startX = startPoint[0] + boardSpaceWidth;
		const startY = startPoint[1] + boardSpaceHeight;
		let x = startX;
		let y = startY;
		context.beginPath();
		context.moveTo(x, y);
		for(let rank = 0; rank < board.ranks - 1; rank++) {
			context.lineTo(x + board.files * boardSpaceWidth, y);
			y += boardSpaceHeight;
		}

		x = startX;
		y = startY;
		context.moveTo(x, y)
		for(let file = 0; file < board.files - 1; file++) {
			context.lineTo(x, y + board.ranks * boardSpaceHeight)
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
