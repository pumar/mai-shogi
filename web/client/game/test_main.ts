import { GameRunner } from "./src/Game/GameRunner";

window.addEventListener("DOMContentLoaded", () => {
	const canvas = document.querySelector("canvas#testcanvas") as HTMLCanvasElement;

	const game = new GameRunner();
	game.setCanvas(canvas);
	game.initGraphics();
});
