<script lang="ts">
export let playerOneCode;
export let playerTwoCode;
export let connectCode;
export let doGetGameCode = () => console.warn('default doGetGameCode()');
export let playWithFriend = () => console.warn('default playWithFriend()');
</script>

<div class="flexcol">
	<div>
		<span>Play with a friend</span>
		{#if playerOneCode === undefined && playerTwoCode === undefined}
		<button on:click={() => doGetGameCode()} disabled={connectCode !== ''}>Create Game</button>
		{/if}
	</div>
	{#if playerTwoCode !== undefined}
	<span>Share this code with your friend</span>
	<input type="text" readonly value={playerTwoCode} />
	{/if}
	{#if playerOneCode === undefined && playerTwoCode === undefined}
	<div>
		<span>Join with game code</span>
		<input type="text" bind:value={connectCode} />
	</div>
	<div style="width:100%">
		<div class="centeritem">
			<button on:click={() => playWithFriend()} disabled={connectCode === ''}>Connect</button>
		</div>
	</div>
	{/if}
</div>

<style>
div.centeritem {
	display: flex;
	justify-content: center;
	align-items: center;
	width: 100%;
}
.inline {
	display: inline-block;
}
.flexcol {
	display: flex;
	flex-direction: column;
	gap: 4px;
	align-items: start;
}
.flexcol > div {
	flex-grow: 1;
	min-height: 30px;
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 8px;
}
</style>
