import App from "./components/App.svelte";

function setupSpa(): void {
	new App({
		target: document.querySelector("#mai-shogi-spa-app"),
		props: {
			message: "world"
		}
	});
}

function main(hello: string): void {
	console.log(`hello ${hello}`);
	setupSpa();
}

window.addEventListener("load", () => {
	main('world');
});
