<script lang="ts">
import Game from "./Game.svelte";
import { notifyGameFromGameServer } from "../Glue/ServerClientCommunication";

export let assetLoadingRootDir: string = "";
export let fontLoadingRootDir: string = "";

//let messageToSend: string = "";
</script>

<!--<div id="test">hello from {message}</div>-->
<div class="gameContainer">
	<Game
		assetLoadingRootDir={assetLoadingRootDir}
		fontLoadingRootDir={fontLoadingRootDir}
		/>
	<!--
	{#if websocketConn === undefined}>
		<div>
			<form on:submit|preventDefault={connectToGame}>
				<label>Game code:<input type="text" bind:value={gameCode}/></label>
				{#if gameCode !== ""}
				<button on:click={connectToGame}>Connect to game</button>
			</form>
		</div>
	-->
	<!--{:else}
		<div>
			<form on:submit|preventDefault={sendMessage}>
				<label>Message Entry:<input type="text" bind:value={messageToSend} /></label>
				<button disabled={messageToSend === ""}>Send Message</button>
			</form>
		</div>-->
	<!--{/if}-->
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
