<script lang="ts">
import Game from "./Game.svelte";
import { getWebsocketConnection, addEventHandler, WebsocketEvent } from "../WebsocketConnection";
export let message: string = "svelte";
let gameCode: string = "";
function connectToGame() {
	console.log(`connect to game:${gameCode}`);
	const websocketConn = getWebsocketConnection(
		['game', gameCode].join('/'),
		(e) => { throw new Error(`connect to game ws error:${e.message}`)},
	);
	addEventHandler(websocketConn, WebsocketEvent.Open, () => {
		console.log("connected to ws, trying to send a message");
		websocketConn.send(JSON.stringify({
			message: "hello from typescript",
		}));
	});
	addEventHandler(websocketConn, WebsocketEvent.Message, (message) => {
		console.log('recieved message from server', message);
	});
	addEventHandler(websocketConn, WebsocketEvent.Close, (event: CloseEvent) => {
		console.log('websocket closed', event);
	});
	addEventHandler(websocketConn, WebsocketEvent.Error, (event: Event) => {
		console.error(`websocket connection closed, do to an error`, event);
	});
}
</script>

<div id="test">hello from {message}</div>
<div class="gameContainer">
	<Game />
	<label>Game code:<input type="text" bind:value={gameCode}/></label>
	{#if gameCode !== ""}
	<button on:click={connectToGame}>Connect to game</button>
	{/if}
</div>

<style>
div#test{
	color: red;
}
/* TODO don't hardcode the height & width */
div.gameContainer {
	width: 600px;
	height: 600px;
	border: 1px solid black;
}
</style>
