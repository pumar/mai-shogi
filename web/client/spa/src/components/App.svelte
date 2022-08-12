<script lang="ts">
import Game from "./Game.svelte";
export let message: string = "svelte";
</script>

<div id="test">hello from {message}</div>
<div class="gameContainer">
	<Game />
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
