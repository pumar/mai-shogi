<script lang="ts">
import Game from "./Game.svelte";
import { getWebsocketConnection, addEventHandler, WebsocketEvent } from "../WebsocketConnection";
export let message: string = "svelte";
let websocketConn: WebSocket | undefined = undefined;
let gameCode: string = "";
function connectToGame() {
	console.log(`connect to game:${gameCode}`);
	websocketConn = getWebsocketConnection(
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
		websocketConn = undefined;
	});
	addEventHandler(websocketConn, WebsocketEvent.Error, (event: Event) => {
		console.error(`websocket connection closed, do to an error`, event);
		websocketConn = undefined;
	});
}
function sendMessage(message: string){
	if (websocketConn) {
		websocketConn.send(JSON.stringify({ message: messageToSend }));
		messageToSend = "";
	}
}
let messageToSend: string = "";
</script>

<div id="test">hello from {message}</div>
<div class="gameContainer">
	<Game />
	<label>Game code:<input type="text" bind:value={gameCode}/></label>
	{#if gameCode !== ""}
	<button on:click={connectToGame}>Connect to game</button>
	{/if}
	{#if websocketConn !== undefined}
	<button on:click={sendMessage}>Send Message</button>
	<label>Message Entry:<input type="text" bind:value={messageToSend} /></label>
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
