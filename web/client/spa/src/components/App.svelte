<script lang="ts">
import Game from "Game.svelte";
export let message: string = "svelte";
</script>

<div id="test">hello from {message}</div>

<style>
div#test{
	color: red;
}
</style>
