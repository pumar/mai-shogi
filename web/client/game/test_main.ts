import { setupGameWithDefaults } from "./src/GameInitializerHelper";

window.addEventListener("DOMContentLoaded", async () => {
	const canvas = document.querySelector("canvas#testcanvas") as HTMLCanvasElement;

	const { game } = await setupGameWithDefaults(canvas);


	const initState = game.getCurrentGameState();
	game.drawStaticObjects(initState);
	game.run(initState);
	//trying to figure out why the tile texture is not working
	//seeing if it was a timing issue by re-setting the
	//texture after the fact from the browser console
	//no luck
	//window.getTex = (imageElem) => {
	//	return new MeshBasicMaterial({
	//		map: new Texture(imageElem),
	//		side: DoubleSide,
	//	});
	//};
});
