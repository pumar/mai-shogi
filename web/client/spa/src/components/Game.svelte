<script lang="ts">
import { drawGame, defaultRenderSettings } from "mai-shogi-game";
import { onMount } from "svelte";

let canvas = undefined;

onMount(() => {
	console.log("canvas reference:", canvas);
	const context = canvas.getContext("2d");
	drawGame(
		defaultRenderSettings(),
		{
			board: {
				ranks: 9,
				files: 9,
				placedPieces: [
					{
						name: "pawn",
						isPromoted: false,
						rank: 3,
						file: 3,
					},
				],
			},
			heldPieces: [],
		},
		canvas,
		context,
	);
});
</script>

<canvas bind:this={canvas} class="game-canvas">
</canvas>

<style>
canvas.game-canvas {
	width: 100%;
	height: 100%;
}
</style>
