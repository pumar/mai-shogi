<script lang="ts">
import { drawGame, defaultRenderSettings, createGame, clearCanvas } from "mai-shogi-game";
import { onMount } from "svelte";

let context = undefined;
let canvas = undefined;

const redrawGame = () => {
	clearCanvas(canvas, context);
	drawGame(
		defaultRenderSettings(),
		createGame(),
		canvas,
		context,
	);
}
onMount(() => {
	console.log("canvas reference:", canvas);
	context = canvas.getContext("2d");
	window.context = context;
	window.canvas = canvas;
	drawGame(
		defaultRenderSettings(),
		createGame(),
		canvas,
		context,
	);
	//TODO figure out why the font loading is either failing or,
	//the code isn't properly waiting until fonts are loaded on Firefox
	//the takes 100~300ms to load if it's not cached... the application
	//doesn't start until the document is loaded so why does this issue exist
	//if the font is cached it gets drawn properly
	//setTimeout(() => {
	//	drawGame(
	//		defaultRenderSettings(),
	//		createGame(),
	//		canvas,
	//		context,
	//	);
	//}, 1000);
});
</script>

<!--<canvas bind:this={canvas} class="game-canvas" width=600 height=600>-->
<canvas bind:this={canvas} class="game-canvas">
</canvas>
<button on:click|preventDefault={redrawGame}>(Debug) Redraw Game</button>

<style>
canvas.game-canvas {
	width: 100%;
	height: 100%;
}
</style>