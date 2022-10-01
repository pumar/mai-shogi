<script lang="ts">
import { setupGameWithDefaults, getDefaultSvgLoadConfig } from "mai-shogi-game";
import { onMount } from "svelte";

export let assetLoadingRootDir = "";
export let fontLoadingRootDir = "";

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
		const { game, initialGameState: initState } = await setupGameWithDefaults(
			canvas,
			undefined,
			assetLoadingRootDir !== "" ? Object.assign({}, defaultLoadingConfig, { rootDir: assetLoadingRootDir }) : defaultLoadingConfig,
			fontLoadingRootDir !== "" ? fontLoadingRootDir : defaultFontLoadingDir(),
		).catch(e => {
			console.error('game init failed', e);
			return null;
		});
		if (game !== null) {
			console.log("initialized game:", game);
			//add the game's reference to the window object for debugging
			window.game = game;
			game.drawStaticObjects(initState);
			game.run(initState);
		} else {
			console.error('game init failed');
		}
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
