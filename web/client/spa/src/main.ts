import App from "./components/App.svelte";

function setupSpa(): void {
	const envLoadingInformation = document.querySelector("input#load_root_dir") as HTMLInputElement | null;
	const assetLoadingRootDir = envLoadingInformation !== null ? envLoadingInformation.value : "";
	new App({
		target: document.querySelector("#mai-shogi-spa-app"),
		props: {
			message: "world",
			assetLoadingRootDir,
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
