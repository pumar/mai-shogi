<script lang="ts">
import { setupGameWithDefaults, getDefaultSvgLoadConfig } from "mai-shogi-game";
import { onMount } from "svelte";

import {
	connectToGame,
} from "../Glue/ServerClientCommunication";

import {
	addEventHandler,
	WebsocketEvent,
} from "../Network/WebsocketConnection"

export let assetLoadingRootDir = "";
export let fontLoadingRootDir = "";

let context = undefined;
let canvas = undefined;

export let gameInstance = undefined;

let websocketConnection = undefined;

const makeConn = () => {
	const instanceInfo = connectToGame();
	gameInstance = instanceInfo.game;
	websocketConnection = instanceInfo.websocketConn;
	addEventHandler(websocketConnection, WebsocketEvent.Close, (event: CloseEvent) => {
		console.log('websocket closed', event);
		websocketConnection = undefined;
	});
	addEventHandler(websocketConnection, WebsocketEvent.Error, (event: Event) => {
		console.error(`websocket connection closed, do to an error`, event);
		websocketConnection = undefined;
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
		<button on:click={makeConn}>Connect to game</button>
	<!--</form>-->
</div>

<style>
canvas.game-canvas {
	width: 100%;
	height: 100%;
}
</style>
