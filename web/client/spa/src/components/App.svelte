<script lang="ts">
import Game from "./Game.svelte";
import { notifyGameFromGameServer } from "../Glue/ServerClientCommunication";

export let assetLoadingRootDir: string = "";
export let fontLoadingRootDir: string = "";
</script>

<div class="layout fill">
	<Game
		assetLoadingRootDir={assetLoadingRootDir}
		fontLoadingRootDir={fontLoadingRootDir}
		/>
</div>

<style>
div.layout {
	display: flex;
	flex-direction: row;
	justify-content: center;
}
.fill {
	width: 100%;
	height: 100%;
}
</style>
