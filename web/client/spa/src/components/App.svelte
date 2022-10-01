<script lang="ts">
import Game from "./Game.svelte";
import { getWebsocketConnection, addEventHandler, WebsocketEvent } from "../Network/WebsocketConnection";

export let message: string = "svelte";

export let assetLoadingRootDir: string = "";

let messagesFromServer = [];
let websocketConn: WebSocket | undefined = undefined;
let gameCode: string = "";

function connectToGame() {
	console.log(`connect to game:${gameCode}`);
	websocketConn = getWebsocketConnection(
		['game', gameCode].join('/'),
		(e) => { throw new Error(`connect to game ws error:${e.message}`)},
	);
	gameCode = "";
	addEventHandler(websocketConn, WebsocketEvent.Open, () => {
		console.log("connected to ws, trying to send a message");
		messagesFromServer = [];
		//websocketConn.send(JSON.stringify({
		//	message: "hello from typescript",
		//}));
	});
	addEventHandler(websocketConn, WebsocketEvent.Message, (message) => {
		console.log('recieved message from server', message);
		messagesFromServer = [JSON.parse(message.data).message];
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
		websocketConn.send(JSON.stringify({ guess: messageToSend }));
		messageToSend = "";
	}
}
let messageToSend: string = "";
</script>

<div id="test">hello from {message}</div>
<div class="gameContainer">
	<Game assetLoadingRootDir={assetLoadingRootDir}/>
	<div class="flexcol">
	{#if websocketConn === undefined}
		<div>
			<form on:submit|preventDefault={connectToGame}>
				<label>Game code:<input type="text" bind:value={gameCode}/></label>
				{#if gameCode !== ""}
				<button on:click={connectToGame}>Connect to game</button>
				{/if}
			</form>
		</div>
	{:else}
		<div>
			<form on:submit|preventDefault={sendMessage}>
				<label>Message Entry:<input type="text" bind:value={messageToSend} /></label>
				<button disabled={messageToSend === ""}>Send Message</button>
			</form>
		</div>
	{/if}
	<div>
	{#each messagesFromServer as message}
	<div>{message}</div>
	{/each}
	</div>
	</div>
</div>

<style>
div.flexcol{
	display: flex;
	flex-direction: column;
}
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
