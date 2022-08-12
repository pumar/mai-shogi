import { Board } from "../types/Board";

export {
	drawBoard,
}

function drawBoard(
	board: Board,
	targetCanvas: HTMLCanvasElement,
	context: CanvasRenderingContext2D,
): void {
	//const { width: canvasWidth, height: canvasHeight } = targetCanvas;
	console.error('TODO render game state', board);
	//TODO the aspect ratio for the canvas isn't being propely set, so since the canvas's
	//aspect ratio is not 1:1, things are stretching
	context.save();
	context.fillStyle = "black";
	context.fillRect(10, 10, 10, 10);
	context.restore();
}
