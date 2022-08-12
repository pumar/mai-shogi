<script lang="ts">
import Game from "./Game.svelte";
import { getWebsocketConnection } from "../WebsocketConnection";
export let message: string = "svelte";
let gameCode: string = "";
function connectToGame() {
	console.log(`connect to game:${gameCode}`);
	const websocketConn = getWebsocketConnection(
		['game', 'gameCode'].join('/'),
		(e) => { throw new Error(`connect to game ws error:${e.message}`)},
	);
	websocketConn.addEventListener("message", (message) => {
		console.log('recieved message from server', message);
	});
	websocketConn.addEventListener("close", () => {
		console.log('websocket closed');
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
	width: 300px;
	height: 400px;
	border: 1px solid black;
}
</style>
