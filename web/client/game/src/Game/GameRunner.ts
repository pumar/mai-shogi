import { BufferGeometry, Camera, Group, Material, Mesh, OrthographicCamera, Scene, WebGLRenderer } from "three";
import { createGame } from "./GameCreator";
import { RenderSettings } from "./Renderer/Renderer";
import { getAssetKeyForPiece } from "./types/AssetKeys";
import { Game } from "./types/Game";
import { HeldPiece, isHeldPiece, isPlaced } from "./types/Piece";
import { Player, Turn } from "./types/Player";

/**
* names of objects that are added to and removed from the scene
* as needed
**/
enum SceneGroups {
	Board = "board",
	Pieces = "pieces",
	Timers = "timers",
	Stands = "stands",
	WhiteStand = "white_stand",
	BlackStand = "black_stand",
}

type DrawPiece = Piece & {
	mesh: Mesh;
}

export class GameRunner {
	private gameStates: Game[] = [];
	private checkDefined = makeExistsGuard("GameRunner");

	private renderSettings?: RenderSettings;

	private _canvas?: HTMLCanvasElement;
	public setCanvas(newCanvas: HTMLCanvasElement) {
		this._canvas = newCanvas;
	}
	public getCanvas(): HTMLCanvasElement {
		return this.checkDefined(this._canvas, "getCanvas() canvas undefined");
	}

	private _camera?: Camera;
	public setCamera(newCamera: Camera) {
		this._camera = newCamera;
	}
	public getCamera(): Camera {
		return this.checkDefined(this._camera, "getCamera() camera undefined");
	}

	private _renderer?: WebGLRenderer;
	public setRenderer(newRenderer: WebGLRenderer) {
		this._renderer = newRenderer;
	}
	public getRenderer(): WebGLRenderer {
		return this.checkDefined(this._renderer, "getRenderer() renderer undefined");
	}

	private _scene?: Scene;
	public setScene(newScene: Scene) {
		this._scene = newScene;
	}
	public getScene(): Scene {
		return this.checkDefined(this._scene, "getScene() scene undefined");
	}

	/**
	* not sure if it's okay to just store the materials and geometries and then make the
	* meshes as they are needed, or if the meshes should also be cached
	**/
	private gameAssets: {
		geometries: {[index: string]: BufferGeometry},
		materials: {[index: string]: Material},
	} = {
		geometries: {},
		materials: {},
	};

	public initGraphics(): void {
		this.setCamera(new OrthographicCamera());
		this.setScene(new Scene());
		this.setRenderer(new WebGLRenderer({
			canvas: this.getCanvas(),
		}));
	}

	private makeNamedGroup(name: string) {
		const newGroup = new Group();
		newGroup.name = name;
		return newGroup;
	}

	private getSceneGroup(name: string): Group {
		return this.checkDefined(this.getScene().getObjectByName(name), `getSceneGroup() name:${name}`);
	}

	public setupScene() {
		const scene = this.getScene();
		const boardGroup = this.makeNamedGroup(SceneGroups.Board);
		const piecesGroup = this.makeNamedGroup(SceneGroups.Pieces);
		const timersGroup = this.makeNamedGroup(SceneGroups.Timers);
		const piecesStand = this.makeNamedGroup(SceneGroups.Stands);

		[
			boardGroup,
			piecesGroup,
			timersGroup,
			piecesStand
		].forEach(grp => scene.add(grp));
	}

	public run(initialGameState?: Game): void {
		if (initialGameState) {
			this.gameStates.push(initialGameState);
		} else {
			this.gameStates.push(createGame());
		}

		requestAnimationFrame(this.renderStep.bind(this));
	}

	private renderStep(): void {
		const gameState = this.gameStates[this.gameStates.length - 1];
		const scene = this.getScene();
		this.drawPieceStands(
			this.getSceneGroup(SceneGroups.Stands),
			gameState.viewPoint,
			gameState.players,
		);
		this.drawPlacedPieces(this.getSceneGroup(SceneGroups.Pieces), gameState);
		this.getRenderer().render(scene, this.getCamera());
	}

	private drawPieceStands(standsGroup: Group, viewpoint: Turn, players: Player[]): void {
		const blackPlayer = players.find(player => player.turn === "black");
		const whitePlayer = players.find(player => player.turn === "white");
		if(!blackPlayer || !whitePlayer) {
			throw new Error(`black or white player could not be found:${players.map(player => player.turn).join(' ')}`);
		}

		const isBlackMainViewPoint = viewpoint === "black";
		const blackPlayerHeldPieces: Mesh[] = this.getMeshesForPlayerPieces(
			blackPlayer,
		);

		const whitePlayerHeldPieces: Mesh[] = this.getMeshesForPlayerPieces(
			whitePlayer,
		);
	}

	private getMeshesForPlayerPieces(player: Player): DrawPiece[] {
		return player.pieces.map(piece => {
			const assetKey = getAssetKeyForPiece(piece);
			const geometry = this.gameAssets.geometries[assetKey];
			const material = this.gameAssets.materials[assetKey];

			return Object.assign(
				{},
				piece,
				{
					mesh: new Mesh(
						geometry,
						material,
					)
				}
			);
		});
	}

	private drawPlacedPieces(piecesGroup: Group, gameState: Game): void {
		const placedPieces = gameState.players
			.flatMap(player => player.pieces)
			.filter(piece => isPlaced(piece));
		const meshs = placedPieces.map(placedPiece => {
			const assetKey = getAssetKeyForPiece(placedPiece);
			return new Mesh(
				this.gameAssets.geometries[assetKey],
				this.gameAssets.materials[assetKey],
			);
		});
	}
}
