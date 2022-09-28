import { createGame } from "./src/Game/GameCreator";
import { GameRunner } from "./src/Game/GameRunner";
import { defaultRenderSettings, setCanvasSizeToMatchLayout } from "./src/Game/Renderer/Renderer";
import { EventQueue } from "./src/Game/Input/EventQueue";
import { DoubleSide, MeshBasicMaterial, Texture } from "three";

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
	setCanvasSizeToMatchLayout(game.getCanvas());
	game.setResizeHandlers();
	game.setupScene();

	const eventQueue = new EventQueue();
	eventQueue.registerCallbacks(window);
	eventQueue.addListener(game);

	game.drawStaticObjects(initialGameState);
	game.run(initialGameState);
	//trying to figure out why the tile texture is not working
	//seeing if it was a timing issue by re-setting the
	//texture after the fact from the browser console
	//no luck
	//window.getTex = (imageElem) => {
	//	return new MeshBasicMaterial({
	//		map: new Texture(imageElem),
	//		side: DoubleSide,
	//	});
	//};
});
