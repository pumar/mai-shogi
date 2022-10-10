import { createGame } from "./Game/GameCreator";
import { GameRunner, getDefaultSvgLoadConfig, SvgLoadConfig, getDefaultFontLoadingDir } from "./Game/GameRunner";
import { EventQueue } from "./Game/Input/EventQueue";
import { GameInteractionController } from "./Game/Input/UserInteraction";
import { defaultRenderSettings, setCanvasSizeToMatchLayout } from "./Game/Renderer/Renderer";
import { Game } from "./Game/types/Game";

export {
	setupGameWithDefaults,
}

async function setupGameWithDefaults(
	canvas: HTMLCanvasElement,
	//initialGameState: Game = createGame(),
	svgLoadSettings: SvgLoadConfig = getDefaultSvgLoadConfig(),
	fontLoadingDir: string = getDefaultFontLoadingDir(),
): Promise<{
	game: GameRunner,
	eventQueue: EventQueue,
	//initialGameState: Game,
}> {
	console.log("loading game with settings:", {
		canvas,
		//initialGameState,
		svgLoadSettings,
		fontLoadingDir
	});
	const game = new GameRunner();
	game.setCanvas(canvas);
	//normal render settings
	const renderSettings = defaultRenderSettings();
	//debug render settings
	//const renderSettings = debugRenderSettings();

	game.setRenderSettings(renderSettings);
	//const initialGameState = createGame();
	//game.addGameState(initialGameState);
	await game.initGraphics(svgLoadSettings, fontLoadingDir);
	setCanvasSizeToMatchLayout(game.getCanvas());
	game.setResizeHandlers();
	game.setupScene();

	const eventQueue = new EventQueue();
	eventQueue.registerCallbacks(window);
	eventQueue.addListener(game);

	const interactionController = new GameInteractionController();
	game.setInteractionController(interactionController);

	//game.drawStaticObjects(initialGameState);
	//game.run(initialGameState);
	
	return {
		game,
		eventQueue,
	//	initialGameState,
	}
}
