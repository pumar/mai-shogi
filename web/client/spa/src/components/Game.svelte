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
	getGameCode,
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

let playerOneCode = undefined;
let playerTwoCode = undefined;
let connectCode = '';

let choices = [];

const pickChoice = (commStack: CommunicationStack, choiceId: number) => {
	commStack.pushEvent({
		eventType: CommunicationEventTypes.ANSWER_PROMPT,
		eventInfo: {
			selectedChoiceId: choiceId,
		} as AnswerPrompt
	});
}

const playWithFriend = async () => {
	const code = connectCode;
	makeConn(false, undefined, code);

}

const doGetGameCode = async () => {
	const codes = await getGameCode();
	console.error('do get game code', codes);
	if (codes !== undefined) {
		playerOneCode = codes.playerOneCode
		playerTwoCode = codes.playerTwoCode
	}
}

const makeConn = async (vsComputer: boolean, isSente?: boolean, playerCode?: string) => {
	const instanceInfo = connectToGame(vsComputer, isSente, playerCode);

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
			{#if playerOneCode === undefined && playerTwoCode === undefined}
			<div>
				<label>vs Computer:</label>
				<button on:click={() => makeConn(true, true)}>Play as sente (black)</button>
				<button on:click={() => makeConn(true, false)}>Play as gote (white)</button>
			</div>
			{/if}
			<div>
				<div>
					{#if playerOneCode === undefined && playerTwoCode === undefined}
					<button on:click={() => doGetGameCode()}>Create a game to play with a friend</button>
					{:else}
					<label>Share this code with your friend:<input type="text" readonly value={playerTwoCode} /></label>
					{/if}
				</div>
				<div>
					{#if playerOneCode === undefined && playerTwoCode === undefined}
					<label>Enter a code to join a game:<input type="text" bind:value={connectCode} /></label>
					{/if}
					{#if connectCode !== ''}
					<button on:click={() => playWithFriend()}>connect to game with code</button>
					{/if}
				</div>
			</div>
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
