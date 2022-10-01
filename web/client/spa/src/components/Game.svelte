<script lang="ts">
import { setupGameWithDefaults, getDefaultSvgLoadConfig } from "mai-shogi-game";
import { onMount } from "svelte";

export let assetLoadingRootDir = "";

let context = undefined;
let canvas = undefined;

//const redrawGame = () => {
//	clearCanvas(canvas, context);
//	drawGame(
//		defaultRenderSettings(),
//		createGame(),
//		canvas,
//		context,
//	);
//}
onMount(() => {
	console.log('mounted the game component, initializing game');
	//console.log("canvas reference:", canvas);
	//context = canvas.getContext("2d");
	//window.context = context;
	//window.canvas = canvas;
	(async function(){
		const defaultLoadingConfig = getDefaultSvgLoadConfig();
		const { game } = await setupGameWithDefaults(
			canvas,
			undefined,
			assetLoadingRootDir !== "" ? Object.assign({}, defaultLoadingConfig, { rootDir: assetLoadingRootDir }) : defaultLoadingConfig,
		);
		console.log("initialized game:", game);
		game.drawStaticObjects(initState);
		game.run(initState);
	})()
});
</script>

<!--<canvas bind:this={canvas} class="game-canvas" width=600 height=600>-->
<canvas bind:this={canvas} class="game-canvas">
</canvas>
<!--<button on:click|preventDefault={redrawGame}>(Debug) Redraw Game</button>-->

<style>
canvas.game-canvas {
	width: 100%;
	height: 100%;
}
</style>
