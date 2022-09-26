import { Box3, BoxBufferGeometry, BufferGeometry, Camera, Color, DoubleSide, Group, LineSegments, Material, Mesh, MeshBasicMaterial, Object3D, OrthographicCamera, PlaneGeometry, Scene, ShapeGeometry,  Vector3, WebGLRenderer } from "three";
import { SVGLoader, SVGResult } from "three/examples/jsm/loaders/SVGLoader.js";
import { Font, FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { makeExistsGuard } from "../utils/Guards";
import { measureTime } from "../utils/Performance";
import { debounce } from "../utils/Throttling";

import { createGame } from "./GameCreator";
import { defaultRenderSettings, RenderSettings, setCanvasSizeToMatchLayout } from "./Renderer/Renderer";
import { getAssetKeyForPiece } from "./types/AssetKeys";
import { Game } from "./types/Game";
import { Bishop, Gold, HeldPiece, isPlaced, Knight, Lance, Pawn, Piece, PieceNames, PlacedPiece, Rook, Silver } from "./types/Piece";
import { Player } from "./types/Player";
import { CalcedRenderCoords, calcRenderCoordinates, calcSpaceCoordinates, getBoardTopRightCorner, getSpaceStartPoint, HeldPiecesStand, zIndexes } from "./RenderCalculations";
import { makeLocationDebugSquare, makeSvgDebugMesh } from "./Entities";
import { EventType, EventWrapper, IEventQueueListener } from "./Input/EventQueue";


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
	WhiteStandPieces = "white_stand_pieces",
	WhiteStandPiecesCounts = "white_stand_pieces_counts",
	BlackStand = "black_stand",
	BlackStandPieces = "black_stand_pieces",
	BlackStandPiecesCounts = "black_stand_pieces_counts",
	Debug = "Debug",
	Grid = "grid",
}

//TODO make this configurable - so that it can be loaded from the web server
//this will only work with the local server for this directory
const fontPath = 'fonts/helvetiker_regular.typeface.json';

type DrawPiece = PlacedPiece & {
	graphicsObject: Object3D;
}

export const getDefaultSvgLoadConfig: () => SvgLoadConfig = () => {
	return {
		rootDir: "shogi-pieces",
		board: {
			tileTextureFilename: "tile_wood1.png",
		},
		pieceSet: {
			setFolderName: "kanji_red_wood",
		}
	}
}

export type SvgLoadConfig = {
	rootDir: string;
	board: {
		tileTextureFilename: string;
	};
	pieceSet: {
		setFolderName: string;
	};
}

export class GameRunner implements IEventQueueListener {
	private gameStates: Game[] = [];
	private checkDefined = makeExistsGuard("GameRunner");

	private renderSettings?: RenderSettings;
	private renderSettingsOrDefault(): RenderSettings {
		return this.renderSettings !== undefined ? this.renderSettings : defaultRenderSettings();
	}
	public setRenderSettings(newSettings: RenderSettings): void {
		this.renderSettings = newSettings;
	}

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

	private images: {[index: string]: any;} = {};

	/**
	* not sure if it's okay to just store the materials and geometries and then make the
	* meshes as they are needed, or if the meshes should also be cached
	**/
	private gameAssets: {
		geometries: {[index: string]: BufferGeometry},
		materials: {[index: string]: Material},
		pieces: {[index: string]: Group},
		fonts: {[index: string]: Font},
	} = {
		geometries: {},
		materials: {},
		pieces: {},
		fonts: {},
	};

	public async initGraphics(
		boardAndPiecesSvgSetting: SvgLoadConfig = getDefaultSvgLoadConfig(),
	): Promise<void> {
		this.initCamera();
		this.setScene(new Scene());
		this.initRenderer();

		const renderSettings = this.renderSettingsOrDefault();

		const textureRequestInfo: [string, string][] = [
			[
				"tile_texture",
				this.formImagePath([
					boardAndPiecesSvgSetting.rootDir,
					'boards',
					boardAndPiecesSvgSetting.board.tileTextureFilename,
				])
			]
		];

		//TODO this is blocking the svg loading, need to await them at the same time
		//and then do the proper processing afterwords, depending on if the file was
		//a texture or an svg
		const textureRequests: Promise<[string, Blob]>[] = textureRequestInfo.map(requestInfo => {
			return fetch(requestInfo[1]).then(response => response.blob()).then((blob) => [requestInfo[0], blob]);
		})
		const textures: [string, Blob][] = await Promise.all(textureRequests);
		console.log('texture loading over');

		const fileReaderResults: [string, string | ArrayBuffer | null][] = await Promise.all(textures.map((textureResult) => {
			const rawBlob = textureResult[1];
			const fileReader = new FileReader();
			fileReader.readAsDataURL(rawBlob);
			const fileReaderPromise: Promise<[string, string | ArrayBuffer | null]> = new Promise((resolve, _) => {
				fileReader.onloadend = () => {
					resolve([textureResult[0], fileReader.result]);
				}
			});
			return fileReaderPromise;
		}));
		console.log('texture base64 encoding over');

		fileReaderResults.forEach((result: [string, string | ArrayBuffer | null]) => {
			if (typeof result[1] !== "string") {
				throw new Error('could not convert png file to an image tag src');
			}
			const imageTag = document.createElement("img");
			imageTag.src = result[1];
			//for debugging
			document.body.appendChild(imageTag);
			this.images[result[0]] = imageTag;
		});

		const fontLoader = new FontLoader();
		const fontPromise: Promise<Font> = new Promise((resolve, reject) => {
			fontLoader.load(
				fontPath,
				(font) => {
					resolve(font);
				},
				undefined,
				(err) => {
					console.error(`font loading error`);
					reject(err)
				}
			);
		});

		const svgRequestResults: [string, SVGResult][] = await Promise.all(this.loadSvgs(boardAndPiecesSvgSetting));
		const measurePieceSizeVector = new Vector3();
		//TODO too slow -> can you serialize the threejs objects? that way this loop doesn't need to run every game
		const svgObjects: [string, Group][] = measureTime(() => {
			return svgRequestResults.map(filenameSvgResult => {
				const svgName = filenameSvgResult[0];
				const data = filenameSvgResult[1];
				const paths = data.paths;
				const group = new Group();
				group.name = "svg_piece_group";

				//copy pasted this from the threejs svgloader example
				const start = performance.now();
				for (let i = 0; i < paths.length; i++) {

					const path = paths[ i ];

					const material = new MeshBasicMaterial( {
						color: path.color,
						side: DoubleSide,
						//I was debugging why the pieces were drawn behind the board,
						//and it was because this code that I pasted from the example
						//was setting depthWrite to false...
						depthWrite: true
					} );

					const shapes = SVGLoader.createShapes( path );

					for (let j = 0;j < shapes.length;j++) {
						const shape = shapes[ j ];
						const geometry = new ShapeGeometry( shape );
						const mesh = new Mesh( geometry, material );
						group.add( mesh );
					}
				}
				const time = performance.now() - start;
				console.log(`loop time:${time}, piece:${filenameSvgResult[0]}`);

				//we need the SVGS to have their own local space
				//so that we can convert from the svg coord space to the gl coord space
				//translations and scalings at this group object changes the object about
				//translateGroup's center point
				//so, later in the application logic, we can apply scaling and translations
				//to translateGroup, without messing up the svg's adjustments
				const translateGroup = new Group();
				translateGroup.add(group);
				//scale the y coordinates by -1 to go from SVG space to threejs world space
				group.scale.setY(-1);

				//center the contents of the svg about the center of the group object they are in
				const svgArea = new Box3().setFromObject(group);
				const svgSize = svgArea.getSize(measurePieceSizeVector);
				const svgCenterVec = new Vector3();

				const svgCenter = svgArea.getCenter(svgCenterVec);
				const diffFromCenter = new Vector3(0, 0, 0).sub(svgCenter);

				group.position.add(diffFromCenter);

				if(renderSettings.debug.svgCoordinateAdjustments) {
					const svgAreaIndicator = makeSvgDebugMesh(
						svgSize,
						new Color(0, 0, 1),
					);
					const centerVec = new Vector3();
					svgArea.getCenter(centerVec);
					svgAreaIndicator.position.copy(centerVec);
					translateGroup.add(svgAreaIndicator);
				}

				translateGroup.name = "translate_piece_svg_group";
				if(renderSettings.debug.svgCoordinateAdjustments) {
					const svgBox = new Box3().setFromObject(group);
					const center = new Vector3();
					const size = new Vector3();
					svgBox.getSize(size);
					svgBox.getCenter(center);
					const svgBoxMesh = makeSvgDebugMesh(
						size,
						new Color(0, 1, 0),
					);
					svgBoxMesh.position.copy(center);
					translateGroup.add(svgBoxMesh);
				}
				group.updateMatrixWorld();

				return [svgName, translateGroup];
			});
		}, (time) => console.log(`svg parsing time:${time}`));

		Object.assign(this.gameAssets.pieces, Object.fromEntries(svgObjects));
		console.log({ gameAssets: this.gameAssets, pieceKeys: Object.keys(this.gameAssets.pieces) });

		//resize the pieces
		Object.values(this.gameAssets.pieces).forEach((piece: Group) => {
			const pieceSize = new Vector3();
			const pieceBox = new Box3().setFromObject(piece);
			pieceBox.getSize(pieceSize);
			const sizeRatioX = pieceSize.x / renderSettings.boardSpaceWidth;
			const sizeRatioY = pieceSize.y / renderSettings.boardSpaceHeight;

			//debug svgscaling
			//console.log({
			//	px: pieceSize.x,
			//	py: pieceSize.y,
			//	bsw: renderSettings.boardSpaceWidth,
			//	bsh: renderSettings.boardSpaceHeight,
			//	sizeRatioX,
			//	sizeRatioY,
			//});

			piece.scale.set(1 / sizeRatioX, 1 / sizeRatioY, 1);
			piece.updateMatrixWorld();
		});

		const font = await fontPromise;
		this.gameAssets.fonts[fontPath] = font;
	}
	
	public setResizeHandlers(): void {
		const gameThis = this;
		const canvasResizeObserver = new ResizeObserver(debounce((entries: ResizeObserverEntry[], _: ResizeObserver) => {
			entries.forEach((entry: ResizeObserverEntry) => {
				//TODO it would be cool to keep a map of elements and what callback
				//should be called when that element is resized, and then loop over the entries
				//calling the appropriate callback
				const canvas = this.getCanvas();
				if (entry.target === canvas) {
					setCanvasSizeToMatchLayout(gameThis.getCanvas());
					gameThis.renderStep();
				}
			});
		}, 100));
		canvasResizeObserver.observe(this.getCanvas());
	}

	private initCamera(): void {
		const camera = new OrthographicCamera(
			-100,
			100,
			100,
			-100,
			0.1,
			100
		);
		this.setCamera(camera);
		camera.position.copy(new Vector3(0, 0, 7));
	}
	private initRenderer(): void {
		const renderer = new WebGLRenderer({
			canvas: this.getCanvas(),
		});
		renderer.setClearColor(new Color(0.8, 0.8, 0.8));
		this.setRenderer(renderer);
	}

	private formImagePath = (pathParts: string[]) => pathParts.join('/');

	public loadSvgs(boardAndPiecesSvgSetting: SvgLoadConfig): Promise<[string, SVGResult]>[] {
		const svgLoader = new SVGLoader();
		//append the subpaths to the root svg lookup path

		const piecesPaths: [string, string][] = [
			["silver", "BlackAdvisor.svg"],
			["bishop", "BlackBishop.svg"],
			["bishop+", "BlackCrownedBishop.svg"],
			["rook", "BlackRook.svg"],
			["rook+", "BlackCrownedRook.svg"],
			["gold", "BlackGold.svg"],
			["lance", "BlackLance.svg"],
			["goldlance", "BlackGoldLance.svg"],
			["pawn", "BlackPawn.svg"],
			["pawn+", "BlackGoldPawn.svg"],
			["silver+", "BlackGoldSilver.svg"],
			["knight", "BlackKnight.svg"],
			["knight+", "BlackGoldKnight.svg"],
			["king", "BlackKing.svg"],
		].map(pieceTuple => [
			pieceTuple[0],
			this.formImagePath([
				boardAndPiecesSvgSetting.rootDir,
				boardAndPiecesSvgSetting.pieceSet.setFolderName,
				pieceTuple[1]
			])
		]);

		//I had to run the shogi-tool.sh p2x function to change the filenames
		//into more a more readable standard (xboard)
		const svgsToLoad: [string, string][] = [
			...piecesPaths,
			//the filename for the silver is 'advisor' for some reason
		];

		const svgLoadPromises = svgsToLoad.map(svgPath => new Promise<[string, SVGResult]>((resolve, _) => {
			const pieceName: string = svgPath[0];
			svgLoader.load(
				svgPath[1],
				(data) => resolve([pieceName, data])
			);
		})) as Promise<[string, SVGResult]>[];

		return svgLoadPromises;
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
		const debugPieces = this.makeNamedGroup(SceneGroups.Debug);
		const gridGroup = this.makeNamedGroup(SceneGroups.Grid);

		[
			boardGroup,
			piecesGroup,
			timersGroup,
			piecesStand,
			debugPieces,
			gridGroup,
		].forEach(grp => scene.add(grp));
		//piecesGroup.position.setZ(zIndexes.pieces);
		piecesGroup.position.setZ(zIndexes.pieces);
		piecesGroup.updateMatrixWorld();
		boardGroup.position.setZ(zIndexes.board);
		boardGroup.updateMatrixWorld();

		const blackStandGroup = this.makeNamedGroup(SceneGroups.BlackStand);
		const blackStandPiecesGroup = this.makeNamedGroup(SceneGroups.BlackStandPieces);
		const whiteStandGroup = this.makeNamedGroup(SceneGroups.WhiteStand);
		const whiteStandPiecesGroup = this.makeNamedGroup(SceneGroups.WhiteStandPieces);
		piecesStand.add(blackStandGroup, whiteStandGroup);
		piecesStand.add(blackStandPiecesGroup, whiteStandPiecesGroup);
		piecesStand.add(
			this.makeNamedGroup(SceneGroups.BlackStandPiecesCounts),
			this.makeNamedGroup(SceneGroups.WhiteStandPiecesCounts)
		);
	}

	public addGameState(game: Game): void {
		this.gameStates.push(game);
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

		const renderSettings = this.renderSettingsOrDefault();

		const renderCoordinates = calcRenderCoordinates(
			gameState,
			renderSettings,
		);
		measureTime(() => {
			this.drawHeldPiecesCounts(
				this.getSceneGroup(SceneGroups.Stands),
				gameState,
				renderCoordinates,
			);
			this.drawPlacedPieces(
				this.getSceneGroup(SceneGroups.Pieces),
				gameState,
				renderCoordinates.spaceCenterPoints,
			);
		}, time => console.log(`renderStep threejs object processing time:${time}`));

		this.handleSceneScaling(renderCoordinates.gameSpaceSize);


		measureTime(
			() => this.getRenderer().render(scene, this.getCamera()),
			time => console.log(`threejs render time:${time}`)
		);
	}

	private drawHeldPiecesCounts(
		standsGroup: Group,
		gameState: Game,
		calcRenderCoords: CalcedRenderCoords,
	): void {
		const getGroup: (groupName: string) => Group = (groupName: string) => {
			const group = standsGroup.getObjectByName(groupName);
			if(group === undefined) {
				throw new Error(`drawHeldPiecesCounts no group for group name:${groupName}`);
			}
			if(!(group as Group).isGroup){
				throw new Error(`drawHeldPiecesCounts found object, but it isn't a group:${groupName}`);
			}
			return group as Group;
		}
		const blackPiecesCountsGroup = getGroup(SceneGroups.BlackStandPiecesCounts);
		const whitePiecesCountsGroup = getGroup(SceneGroups.WhiteStandPiecesCounts);

		const blackPlayer = gameState.players.find(player => player.turn === "black");
		const whitePlayer = gameState.players.find(player => player.turn === "white");
		if(blackPlayer === undefined || whitePlayer === undefined) throw new Error('no player');
		
		const countPiecesMapBlack = this.getCountPiecesMap(blackPlayer.heldPieces);
		this.drawCounts(blackPiecesCountsGroup, countPiecesMapBlack, calcRenderCoords.blackHeldPiecesLocations);
		const countPiecesMapWhite = this.getCountPiecesMap(whitePlayer.heldPieces);
		this.drawCounts(whitePiecesCountsGroup, countPiecesMapWhite, calcRenderCoords.whiteHeldPiecesLocations);
	}

	private drawCounts(
		group: Group,
		counts: Map<PieceNames, number>,
		locations: Map<PieceNames, Vector3>,
	): void {
		console.log('draw counts', { counts, locations });
		const meshes: Mesh[] = [];
		const font = this.gameAssets.fonts[fontPath];
		console.log('found font:', font);
		locations.forEach((loc: Vector3, key: PieceNames) => {
			const count = counts.get(key);
			if(count === undefined) {
				throw new Error(`drawCounts no count for piece:${key}`);
			}
			//TODO the text for the counts is too big
			//a player can hold up to 18 pawns, so the numbers will need to be made
			//to be smaller, and have their position ajusted so that they fit nicely
			//within a corner of their square
			const countGeometry = new TextGeometry(
				count.toString(),
				{
					font,
					size: 10,
					height: 50,
				}
			);
			const textMesh = new Mesh(
				countGeometry,
				new MeshBasicMaterial({
					color: new Color(0, 0, 1),
					side: DoubleSide
				})
			);
			const box = new Box3().setFromObject(textMesh);
			const sizeV = new Vector3();
			box.getSize(sizeV);
			//For debugging the location when you can't see the text
			//const square = new Mesh(
			//	new PlaneGeometry(5, 5),
			//	new MeshBasicMaterial({ color: new Color(1, 1, 0) }),
			//);
			//square.position.copy(loc);
			//square.position.setZ(zIndexes.floating);
			textMesh.position.copy(loc);
			textMesh.position.setX(textMesh.position.x - sizeV.x / 2);
			textMesh.position.setY(textMesh.position.y - sizeV.y / 2);
			textMesh.position.setZ(zIndexes.floating);
			//meshes.push(textMesh, square);
			meshes.push(textMesh);
		});
		group.remove(...group.children);
		group.add(...meshes);
	}

	private getCountPiecesMap(heldPieces: HeldPiece[]): Map<PieceNames, number> {
		const map = new Map<PieceNames, number>([
			[PieceNames.Pawn, 0],
			[PieceNames.Lance, 0],
			[PieceNames.Knight, 0],
			[PieceNames.Silver, 0],
			[PieceNames.Gold, 0],
			[PieceNames.Bishop, 0],
			[PieceNames.Rook, 0],
		]);
		//TODO there really is no reason to have the held pieces in the same array
		//as the placed ones, for instance, here there is no need to count the # of held
		//pawn objects because the held pieces type carries the count, this type should always
		//just be a map of piece names to the count...
		heldPieces.forEach(piece => {
			const count = map.get(piece.name) as number;
			map.set(piece.name, count + piece.count);
		});
		return map;
	}

	private handleSceneScaling(
		gameSpaceSize: [number, number],
	  ): void {
		const scene = this.getScene();
		const camera = this.getCamera();

		const canvas = this.getCanvas();
		
		const [gameWidth, gameHeight] = gameSpaceSize;

		const { width: canvasWidth, height: canvasHeight } = canvas;

		const gameAspectRatio = gameWidth / gameHeight;
		const canvasAspectRatio = canvasWidth / canvasHeight;

		//find the biggest rect within the size of the canvas's dimensions that has
		//the same aspect ratio as the game scene, so that we can set the camera's frustum size
		let cameraWidth: number;
		let cameraHeight: number;
		cameraHeight = canvasHeight;
		cameraWidth = cameraHeight * gameAspectRatio;
		//if the scene's width is very narrow, then the calculated camera width can become
		//wider than the canvas, and in that case we set the camera width to be equal to the canvas width,
		//and then calculate the camera height based on that value and the game's aspect ratio
		if (cameraWidth > canvasWidth) {
			cameraWidth = canvasWidth;
			cameraHeight = cameraWidth / gameAspectRatio;
		}

		scene.scale.set(cameraWidth / gameWidth, cameraHeight / gameHeight, 1);

		//in order to ensure that the aspect ratio matches the game logic's aspect ratio (so that the spaces aren't stretched or distorted)
		//we need to set the renderer's viewport to be the same aspect ratio as the camera. Setting it to cameraWidth and cameraHeight is
		//easy enough, but if the x and y args to setviewport are 0, then the image is NOT centered within the canvas
		//so, we gotta set the viewport's x and y to be half the difference of the canvas's dimension (width and height) and the camera's
		const viewPortWidth = (canvasWidth - cameraWidth) / 2;
		const viewPortHeight = (canvasHeight - cameraHeight) / 2;
		console.log({
			cameraWidth,
			cameraHeight,
			cameraAspectRatio: cameraWidth / cameraHeight,
			canvasWidth,
			canvasHeight,
			canvasAspectRatio,
			viewPortWidth,
			viewPortHeight,
		});
		this.getRenderer().setViewport(viewPortWidth, viewPortHeight, cameraWidth, cameraHeight);

		if (camera instanceof OrthographicCamera) {
			this.updateOrtho(
				camera,
				-(cameraWidth / 2),
				cameraWidth / 2,
				cameraHeight / 2,
				-(cameraHeight / 2),
			);
		}

	}

	private updateOrtho(
		camera: OrthographicCamera,
		left: number,
		right: number,
		top: number,
		bottom: number
	): void {
		console.log('update ortho', { left, right, top, bottom });
		camera.left = left;
		camera.right = right;
		camera.top = top;
		camera.bottom = bottom;
		camera.updateProjectionMatrix();
	}

	private drawGrid(
		group: Group,
		calcRenderCoordinates: CalcedRenderCoords,
	): void {
		const lineGeometry = new BufferGeometry();

		lineGeometry.setFromPoints(calcRenderCoordinates.gridCoords);
		const lineMaterial = new MeshBasicMaterial({
			color: new Color(0, 0, 0),
		});

		const grid = new LineSegments(lineGeometry, lineMaterial);
		group.remove(...group.children);
		group.add(grid);
	}

	public drawStaticObjects(gameState: Game, renderSettings = this.renderSettingsOrDefault()): void {
		const renderCoords = calcRenderCoordinates(gameState, renderSettings);
		this.drawBoard(
			this.getSceneGroup(SceneGroups.Board),
			renderCoords.spaceCenterPoints,
			renderCoords.boardWidth,
			renderCoords.boardHeight
		);

		this.drawGrid(
			this.getSceneGroup(SceneGroups.Grid),
			renderCoords,
		);
		this.drawHeldPiecesStand(
			this.getSceneGroup(SceneGroups.Stands),
			renderCoords.whiteStandCoords,
			renderCoords.blackStandCoords
		);
		this.drawHeldPiecesIcons(
			gameState,
			this.getSceneGroup(SceneGroups.Stands),
			gameState.players,
			renderCoords,
		);
		if(renderSettings.debug.boardLocations){
			this.debugSpaceCoords(
				this.gameStates[this.gameStates.length - 1],
				renderSettings,
			);
		}

		if(renderSettings.debug.boardCenter) {
			const centerSquare = new Mesh(
				new BoxBufferGeometry(2, 2),
				new MeshBasicMaterial({	color: new Color(1, 1, 0) })
			);
			this.getSceneGroup(SceneGroups.Debug).add(centerSquare);
			centerSquare.position.set(0, 0, zIndexes.floating);
			centerSquare.updateMatrixWorld();
		}
	}

	private drawBoard(
		boardGroup: Group,
		spaceCenterPoints: Vector3[][],
		boardWidth: number,
		boardHeight: number
	): void {
		//TODO make the tile texture properly fit into each square of the board
		const boardGeometry = new PlaneGeometry(boardWidth, boardHeight);
		const boardTexture = this.images["tile_texture"];
		if (boardTexture === undefined) {
			throw new Error(`draw board, no space texture`);
		}
		//const boardMaterial = new MeshBasicMaterial({
		//	map: new Texture(boardTexture)
		//});
		const boardMaterial = new MeshBasicMaterial({
			color: new Color(1, 0, 0),
			transparent: true,
			opacity: 0.25,
		});

		const boardMesh = new Mesh(boardGeometry, boardMaterial);

		boardGroup.remove(...boardGroup.children);
		boardGroup.add(boardMesh);
		boardMesh.position.setZ(zIndexes.board);
		boardMesh.updateMatrixWorld();
	}




	/** TODO you only need to draw this once: just draw the pieces, and then put a number next to it that
	* tells you how many of that piece you are holding */
	private drawHeldPiecesIcons(
		gameState: Game,
		standsGroup: Group,
		players: Player[],
		calcedRenderCoords: CalcedRenderCoords,
	): void {
		const blackPlayer = players.find(player => player.turn === "black");
		const whitePlayer = players.find(player => player.turn === "white");
		if(!blackPlayer || !whitePlayer) {
			throw new Error(`black or white player could not be found:${players.map(player => player.turn).join(' ')}`);
		}

		const blackStandPiecesGroup: Object3D | undefined = standsGroup.getObjectByName(SceneGroups.BlackStandPieces);
		const whiteStandPiecesGroup: Object3D | undefined = standsGroup.getObjectByName(SceneGroups.WhiteStandPieces);
		const foundGroup = (obj: Object3D | undefined) => obj !== undefined && (obj as Group).isGroup;
		if (!foundGroup(blackStandPiecesGroup) || !foundGroup(whiteStandPiecesGroup)) {
			throw new Error(`no stand group`);
		}

		//const blackHeldPieces: DrawPiece[] = this.getPiecesGraphicsObjects(
		//	blackPlayer.pieces.filter(piece => isHeldPiece(piece)),
		//);
		this.placeHeldPieces(
			blackStandPiecesGroup as Group,
			calcedRenderCoords.blackHeldPiecesLocations,
			gameState.viewPoint === "black",
		);

		//const whiteHeldPieces: DrawPiece[] = this.getPiecesGraphicsObjects(
		//	whitePlayer.pieces.filter(piece => isHeldPiece(piece)),
		//);

		//TODO this just draws the icons for the heldPieces, you only need to this once
		//and you need to draw a number 0~N for how many pieces of that kind you are holding
		this.placeHeldPieces(
			whiteStandPiecesGroup as Group,
			calcedRenderCoords.whiteHeldPiecesLocations,
			gameState.viewPoint === "white",
		);
	}

	/** set the locations for the held pieces for a player's side */
	private placeHeldPieces(
		group: Group,
		pieceLocations: Map<PieceNames, Vector3>,
		isMainViewPoint: boolean,
	): void {
		const pieces = [
			{ name: PieceNames.Pawn, isPromoted: false } as Pawn,
			{ name: PieceNames.Lance, isPromoted: false } as Lance,
			{ name: PieceNames.Knight, isPromoted: false } as Knight,
			{ name: PieceNames.Silver, isPromoted: false } as Silver,
			{ name: PieceNames.Gold, isPromoted: false } as Gold,
			{ name: PieceNames.Bishop, isPromoted: false } as Bishop,
			{ name: PieceNames.Rook, isPromoted: false } as Rook,
		];
		const findPieceLocation = (pieceName: PieceNames) => {
			const location = pieceLocations.get(pieceName);
			if (location === undefined) {
				throw new Error(`placeHeldPieces, pieceName:${pieceName} 's location couldn't be found`);
			}
			return location;
		}
		const pieceGraphicsObjects: { name: PieceNames; graphicsObject: Object3D; location: Vector3; }[] = pieces.map(piece => {
			return {
				name: piece.name,
				graphicsObject: this.gameAssets.pieces[piece.name].clone(),
				location: findPieceLocation(piece.name)
			}
		});

		//Rotate the pieces for the side of the player, so that they are facing upright
		if(isMainViewPoint){
			pieceGraphicsObjects.forEach((piece) => {
				piece.graphicsObject.position.set(0, 0, 0);
				piece.graphicsObject.rotateZ(Math.PI);
				//make the icons transparent
				//TODO instead of looping through all of the objects and copying them and then
				//adding transparency to all of their materials, put a plane in front of the entire section and make it
				//semi-transparent -> this would make the stand that the pieces are on semi-transparent as well, so consider
				//just making it a representation of what you're holding and not an actual physical, textured object
				//const material: Material | Material[] = (piece.graphicsObject as Mesh).material;
				//if (Array.isArray(material)) {
				//} else {
				//}
				//material.opacity = 0.5;
				//(piece.graphicsObject as Mesh).material = material;
			});
		}


		pieceGraphicsObjects.forEach(piece => {
			piece.graphicsObject.position.copy(piece.location);
		});

		console.error({ pieces });
		group.remove(...group.children);
		group.add(...pieceGraphicsObjects.map(drawPiece => drawPiece.graphicsObject));
	}

	private drawHeldPiecesStand(
		standsGroup: Group,
		whiteStandCoords: HeldPiecesStand,
		blackStandCoords: HeldPiecesStand,
	): void {
		//TODO this only needs to be done once
		const whiteStandGroup = standsGroup.getObjectByName(SceneGroups.WhiteStand);
		const blackStandGroup = standsGroup.getObjectByName(SceneGroups.BlackStand);
		if(whiteStandGroup === undefined || blackStandGroup === undefined) {
			throw new Error('drawHeldPiecesStand stand group not found in scene');
		}

		const whiteStandMesh = this.makeStandMesh(whiteStandCoords);
		whiteStandGroup.remove(...whiteStandGroup.children);
		whiteStandGroup.add(whiteStandMesh);

		const blackStandMesh = this.makeStandMesh(blackStandCoords);
		blackStandGroup.remove(...blackStandGroup.children);
		blackStandGroup.add(blackStandMesh);
	}

	private makeStandMesh(standCoords: HeldPiecesStand): Mesh {
		const planeGeometry = new PlaneGeometry(
			standCoords.width,
			standCoords.height,
		);

		const material = new MeshBasicMaterial({
			//map: new Texture(this.images["tile_texture"]),
			//TODO figure out why the texture is not working
			color: new Color(0, 1, 0),
			transparent: true,
			opacity: 0.25,
		});

		const mesh = new Mesh(planeGeometry, material);
		mesh.position.copy(standCoords.basePoint);

		return mesh;
	}

	private getPiecesGraphicsObjects(pieces: Piece[]): DrawPiece[] {
		return pieces.map((piece: Piece) => {
			const assetKey = getAssetKeyForPiece(piece);
			const pieceObject = this.gameAssets.pieces[assetKey];
			if (pieceObject === undefined) {
				throw new Error(`getPiecesForGraphicsObjects, piece graphics object not found, pieceName:${piece.name}, assetKey:${assetKey}, available keys:(${Object.keys(this.gameAssets.pieces).join(' ')})`);
			}

			return Object.assign(
				{},
				piece,
				{
					graphicsObject: pieceObject.clone()//don't forget to clone the mesh, you big dummy! this was a bug
				}
			) as DrawPiece;
		});
	}

	private drawPlacedPieces(
		piecesGroup: Group, 
		gameState: Game,
		spaceCenterPointLookup: Vector3[][],
	): void {
		//const placedPieces = gameState.players
		//	.flatMap(player => player.pieces)
		//	.filter(piece => isPlaced(piece));
		//const pieceObjects = placedPieces.map(placedPiece => {
		//	const assetKey = getAssetKeyForPiece(placedPiece);
		//	return new Mesh(
		//		this.gameAssets.geometries[assetKey],
		//		this.gameAssets.materials[assetKey],
		//	);
		//});
		const placedPiecesPerPlayer = gameState.players.map(player => {
			return {
				turn: player.turn,
				pieces: this.getPiecesGraphicsObjects(
					player.placedPieces.filter(piece => isPlaced(piece))
				)
			}
		});
		console.log({ placedPiecesPerPlayer });

		const pieceGraphicsObjects = placedPiecesPerPlayer
			.flatMap(player => player.pieces.map(drawPiece => drawPiece.graphicsObject))

		console.log({ pieceGraphicsObjects });

		//const numPieces = piecesGroup.children.length;
		piecesGroup.remove(...piecesGroup.children);
		piecesGroup.add(...pieceGraphicsObjects);
		//console.log({ piecesRemoved: numPieces, piecesAdded: pieceGraphicsObjects.length });
		placedPiecesPerPlayer.forEach((player) => {
			player.pieces.forEach((drawPiece: DrawPiece) => {
				const graphicsObject = drawPiece.graphicsObject;
				//console.error('draw piece', drawPiece);
				//TODO consider actually loading in the white & the black pieces,
				//instead of just loading in half of them and then rotating them
				if (player.turn === gameState.viewPoint) {
					graphicsObject.position.set(0, 0, 0);
					graphicsObject.rotateZ(Math.PI);
				}
				//TODO how do I tell the type system that these are placed pieces?
				//I filtered them using isPlaced
				const worldCoordinates = spaceCenterPointLookup[drawPiece.rank - 1][drawPiece.file - 1].clone();
				graphicsObject.position.copy(worldCoordinates);
				//const toString = (vector) => `(${vector.x}, ${vector.y}, ${vector.z})`;
				//console.log('drew piece at:', {
				//	rank: drawPiece.rank,
				//	file: drawPiece.file,
				//	coords: toString(drawPiece.graphicsObject.position)
				//});

				drawPiece.graphicsObject.updateMatrixWorld();
			});
		});
	}

	public debugSpaceCoords(gameState: Game | undefined, renderSettings: RenderSettings = defaultRenderSettings()): void {
		const game = gameState !== undefined ? gameState : this.gameStates[this.gameStates.length - 1];
		const boardWidth = renderSettings.boardSpaceWidth * game.board.files;
		const boardHeight = renderSettings.boardSpaceHeight * game.board.ranks;
		const [boardTopRightCornerX, boardTopRightCornerY] = getBoardTopRightCorner(
			boardWidth,
			boardHeight,
		);
		const { spaceStartPointX, spaceStartPointY } = getSpaceStartPoint(
			boardTopRightCornerX,
			boardTopRightCornerY,
			renderSettings.boardSpaceWidth,
			renderSettings.boardSpaceHeight,
		);
		const renderCoords = calcSpaceCoordinates(
			game.board.ranks,
			game.board.files,
			spaceStartPointX,
			spaceStartPointY,
			renderSettings.boardSpaceWidth,
			renderSettings.boardSpaceHeight
		);
		console.log({ renderCoords });
		const debugSceneGroup = this.getSceneGroup(SceneGroups.Debug);
		debugSceneGroup.remove(...debugSceneGroup.children);
		const placeDebugObjects = []
		const square = makeLocationDebugSquare();
		for(let rankIndex = 0; rankIndex < game.board.ranks; rankIndex++) {
			for(let fileIndex = 0; fileIndex < game.board.files; fileIndex++) {
				const insertCube = square.clone();
				placeDebugObjects.push(insertCube);
				insertCube.position.copy(renderCoords[rankIndex][fileIndex]);
				insertCube.position.setZ(zIndexes.floating);
				insertCube.matrixWorldNeedsUpdate = true;
			}
		}
		debugSceneGroup.add(...placeDebugObjects);
		requestAnimationFrame(this.renderStep.bind(this));
	}

	public newEventNotification(event: EventWrapper) {
		console.log("game notified of event:", event);
		switch(event.type) {
			case EventType.Mouse:
				this.handleMouseEvent(event);
				break;
			case EventType.Keyboard:
				this.handleKeyboardEvent(event);
				break;
			default:
				return;
		}
	}

	private handleMouseEvent(event: EventWrapper): void {
		const { x, y } = event.event as MouseEvent;
		console.log(`click @ (${x}, ${y})`);
	}

	private handleKeyboardEvent(event: EventWrapper): void {
		console.log({ keyboardEvent: event.event});
	}
}
