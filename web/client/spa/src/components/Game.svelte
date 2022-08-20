<script lang="ts">
import { drawGame, defaultRenderSettings, createGame } from "mai-shogi-game";
import { onMount } from "svelte";

let canvas = undefined;

onMount(() => {
	console.log("canvas reference:", canvas);
	const context = canvas.getContext("2d");
	drawGame(
		defaultRenderSettings(),
		createGame(),
		canvas,
		context,
	);
});
</script>

<!--<canvas bind:this={canvas} class="game-canvas" width=600 height=600>-->
<canvas bind:this={canvas} class="game-canvas">
</canvas>

<style>
canvas.game-canvas {
	width: 100%;
	height: 100%;
}
</style>
