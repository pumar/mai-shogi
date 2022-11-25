<script lang="ts">
import {
	getDefaultSvgLoadConfig,
	setCanvasSizeToMatchLayout,
	EventQueue,
	GameInteractionController,
	CommunicationStack,
	CommunicationEventTypes,
	CommunicationEvent,
	AnswerPrompt,
} from "mai-shogi-game";

import PlayWithFriend from "./PlayWithFriend.svelte";

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

let canvas = undefined;

export let gameInstance = undefined;

let gameCommunicationStack: CommunicationStack | undefined = undefined;

let websocketConnection = undefined;

let playerOneCode = undefined;
let playerTwoCode = undefined;
let connectCode = '';

let choices = [];

const resetState = () => {
	playerOneCode = undefined;
	playerTwoCode = undefined;
	connectCode = '';
	choices = [];
	isGameRegisteredToEventQueue = false
	gameInstance = undefined;
	gameCommunicationStack = undefined;
};

const eventQueue = new EventQueue();
eventQueue.registerCallbacks(window);

let isGameRegisteredToEventQueue = false;

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
	if (codes !== undefined) {
		playerOneCode = codes.playerOneCode
		playerTwoCode = codes.playerTwoCode
	}
	makeConn(false, undefined, playerOneCode);
}

const makeConn = async (vsComputer: boolean, isSente?: boolean, playerCode?: string) => {
	const instanceInfo = connectToGame(
		vsComputer,
		isSente,
		playerCode,
		eventQueue,
		isGameRegisteredToEventQueue,
	);

	gameInstance = instanceInfo.game;
	window.game = gameInstance;
	gameInstance.setCanvas(canvas);
	setCanvasSizeToMatchLayout(gameInstance.getCanvas());

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
		console.log("game.svelte, communicationevent from game", commEvent);
		switch(commEvent.eventType) {
			case CommunicationEventTypes.PROMPT_SELECT_MOVE:
				choices = promptSelectMove(commEvent);
				break;
			case CommunicationEventTypes.MAKE_MOVE:
				sendMove(websocketConnection, commEvent);
				//clear out the on-screen UI items related to making choices
				choices = [];
				break;
			case CommunicationEventTypes.YOU_LOSE:
				alert('YOU LOSE');
				break;
			case CommunicationEventTypes.YOU_WIN:
				alert('YOU WIN');
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
</script>

<div class="layout">
	<canvas bind:this={canvas} class="game-canvas">
	</canvas>
	{#if choices.length > 0}
		<span>Choices:</span>
		{#each choices as choice}
			<button on:click={() => { pickChoice(gameCommunicationStack, choice.id)}}>{choice.displayMessage}</button>
		{/each}
	{/if}
	{#if websocketConnection === undefined}
		<div class="connectivity">
			{#if playerOneCode === undefined && playerTwoCode === undefined}
			<div>
				<div>
					<span>Play with the computer</span>
					<button on:click={() => makeConn(true, true)}>Sente (black)</button>
					<button on:click={() => makeConn(true, false)}>Gote (white)</button>
				</div>
			</div>
			{/if}
			<div>
				<PlayWithFriend
					playerOneCode={playerOneCode}
					playerTwoCode={playerTwoCode}
					playWithFriend={playWithFriend}
					connectCode={connectCode}
					doGetGameCode={doGetGameCode}
					/>
			</div>
		</div>
	{/if}
</div>

<style>
div.layout {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: start;
	padding: 8px;
	gap: 8px;
	width: 100%;
}
div.layout > div {
}
div.connectivity {
	padding: 8px;
}
canvas.game-canvas {
	width: 100%;
	border: 1px solid black;
}
</style>
