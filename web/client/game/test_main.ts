import { createGame } from "./src/Game/GameCreator";
import { GameRunner } from "./src/Game/GameRunner";
import { debugRenderSettings, defaultRenderSettings } from "./src/Game/Renderer/Renderer";

window.addEventListener("DOMContentLoaded", async () => {
	const canvas = document.querySelector("canvas#testcanvas") as HTMLCanvasElement;

	const game = new GameRunner();
	//@ts-ignore
	window.game = game;
	game.setCanvas(canvas);
	//normal render settings
	const renderSettings = defaultRenderSettings();
	//debug render settings
	//const renderSettings = debugRenderSettings();

	game.setRenderSettings(renderSettings);
	const initialGameState = createGame();
	game.addGameState(initialGameState);
	await game.initGraphics();
	game.setGameCanvasSizeToMatchLayout();
	game.setResizeHandlers();
	game.setupScene();
	game.drawStaticObjects(initialGameState);
	game.run(initialGameState);
});
