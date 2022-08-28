import { GameRunner } from "./src/Game/GameRunner";

window.addEventListener("DOMContentLoaded", async () => {
	const canvas = document.querySelector("canvas#testcanvas") as HTMLCanvasElement;

	const game = new GameRunner();
	//@ts-ignore
	window.game = game;
	game.setCanvas(canvas);
	await game.initGraphics();
	game.setGameCanvasSizeToMatchLayout();
	game.setResizeHandlers();
	game.setupScene();
	game.run();
});
