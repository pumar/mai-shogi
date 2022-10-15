<script lang="ts">
import {
	//setupGameWithDefaults,
	getDefaultSvgLoadConfig,
	setCanvasSizeToMatchLayout,
	EventQueue,
	GameInteractionController,
	CommunicationStack,
	CommunicationEventTypes,
	CommunicationEvent,
	AnswerPrompt,
} from "mai-shogi-game";

import {
	connectToGame,
	sendMove,
} from "../Glue/ServerClientCommunication";

import {
	promptSelectMove,
} from "../Glue/GameClientCommunication";

import {
	addEventHandler,
	WebsocketEvent,
} from "../Network/WebsocketConnection"

export let assetLoadingRootDir = "";
export let fontLoadingRootDir = "";

//let context = undefined;
let canvas = undefined;

export let gameInstance = undefined;

let gameCommunicationStack: CommunicationStack | undefined = undefined;

let websocketConnection = undefined;

let choices = [];

const pickChoice = (commStack: CommunicationStack, choiceId: number) => {
	commStack.pushEvent({
		eventType: CommunicationEventTypes.ANSWER_PROMPT,
		eventInfo: {
			selectedChoiceId: choiceId,
		} as AnswerPrompt
	});
}

const makeConn = async () => {
	const instanceInfo = connectToGame();

	gameInstance = instanceInfo.game;
	window.game = gameInstance;
	gameInstance.setCanvas(canvas);
	setCanvasSizeToMatchLayout(gameInstance.getCanvas());

	const eventQueue = new EventQueue();
	eventQueue.registerCallbacks(window);
	eventQueue.addListener(gameInstance);

	const interactionController = new GameInteractionController();
	gameInstance.setInteractionController(interactionController);

	await gameInstance.initGraphics(
		Object.assign(getDefaultSvgLoadConfig(), { rootDir: assetLoadingRootDir }),
		fontLoadingRootDir,
	);

	gameInstance.setupScene();
	console.log('init graphics done');

	websocketConnection = instanceInfo.getWebsocketConn();

	gameCommunicationStack = instanceInfo.communicationStack;
	gameCommunicationStack.pushNotifyCallback((commEvent: CommunicationEvent, _: number) => {
		switch(commEvent.eventType) {
			case CommunicationEventTypes.PROMPT_SELECT_MOVE:
				choices = promptSelectMove(commEvent);
				break;
			case CommunicationEventTypes.MAKE_MOVE:
				sendMove(websocketConnection, commEvent);
				//clear out the on-screen UI items related to making choices
				choices = [];
				break;
			default:
				console.debug(`communication event callback, unhandled event type:${commEvent.eventType}`);
		};
	});

	addEventHandler(websocketConnection, WebsocketEvent.Close, (event: CloseEvent) => {
		console.log('websocket closed', event);
		websocketConnection = undefined;
		gameInstance = undefined;
		window.game = undefined;
		gameCommunicationStack = undefined;
	});
	addEventHandler(websocketConnection, WebsocketEvent.Error, (event: Event) => {
		console.error(`websocket connection closed, do to an error`, event);
		websocketConnection = undefined;
		gameInstance = undefined;
		gameCommunicationStack = undefined;
		window.game = undefined;
	});
	addEventHandler(websocketConnection, WebsocketEvent.Open, () => {
		console.log("connected to websocket");
	});
}

//onMount(() => {
//	console.log('mounted the game component, initializing game');
	//console.log("canvas reference:", canvas);
	//context = canvas.getContext("2d");
	//window.context = context;
	//window.canvas = canvas;
	//(async function(){
	//	const defaultLoadingConfig = getDefaultSvgLoadConfig();
	//	const { game: gameInstance, initialGameState: initState } = await setupGameWithDefaults(
	//		canvas,
	//		undefined,
	//		assetLoadingRootDir !== "" ? Object.assign({}, defaultLoadingConfig, { rootDir: assetLoadingRootDir }) : defaultLoadingConfig,
	//		fontLoadingRootDir !== "" ? fontLoadingRootDir : defaultFontLoadingDir(),
	//	).catch(e => {
	//		console.error('game init failed', e);
	//		return null;
	//	});
	//	if (gameInstance !== null) {
	//		console.log("initialized game:", game);
	//		//add the game's reference to the window object for debugging
	//		window.game = game;
	//		game.drawStaticObjects(initState);
	//		game.run(initState);
	//		//assign game object to the exported game variable, so that
	//		//the app component can feed it inputs from the server
	//		game = gameInstance;
	//	} else {
	//		console.error('game init failed');
	//	}
	//})()
//});
</script>

<!--<canvas bind:this={canvas} class="game-canvas" width=600 height=600>-->
<canvas bind:this={canvas} class="game-canvas">
</canvas>
<!--<button on:click|preventDefault={redrawGame}>(Debug) Redraw Game</button>-->
<div>
	<!--<form on:submit|preventDefault={makeConn}>-->
		<!--<label>Game code:<input type="text" bind:value={gameCode}/></label>-->
		<!--{#if gameCode !== ""}-->
		{#if websocketConnection === undefined}
			<button on:click={makeConn}>Connect to game</button>
		{/if}
		{#if choices.length > 0}
			<span>Choices:</span>
			{#each choices as choice}
				<button on:click={() => { pickChoice(gameCommunicationStack, choice.id)}}>{choice.displayMessage}</button>
			{/each}
		{/if}
	<!--</form>-->
</div>

<style>
canvas.game-canvas {
	width: 100%;
	height: 100%;
}
</style>
