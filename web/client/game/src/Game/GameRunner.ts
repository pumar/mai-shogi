import { Box2, Box3, BoxBufferGeometry, BufferGeometry, Camera, Color, DoubleSide, Group, LineSegments, Material, Mesh, MeshBasicMaterial, Object3D, ObjectLoader, OrthographicCamera, PlaneGeometry, RepeatWrapping, Scene, ShapeGeometry,  Texture,  Vector3, WebGLRenderer } from "three";
import { mergeBufferGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { SVGLoader, SVGResult, SVGResultPaths } from "three/examples/jsm/loaders/SVGLoader.js";
import { Font, FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { makeExistsGuard } from "../utils/Guards";
import { measureTime } from "../utils/Performance";
import { debounce } from "../utils/Throttling";

import { defaultRenderSettings, RenderSettings, setCanvasSizeToMatchLayout } from "./Renderer/Renderer";
import { getAssetKeyForPiece } from "./types/AssetKeys";
import { findPlacedPieceAndPlayer, findPlayer, Game } from "./types/Game";
import { Bishop, BoardLocation, Gold, HeldPiece, isHeldPiece, isPlaced, Knight, Lance, Pawn, Piece, PieceNames, PlacedPiece, PlayerHeldPiece, Rook, Silver } from "./types/Piece";
import { Player } from "./types/Player";
import { CalcedRenderCoords, calcRenderCoordinates, calcSpaceCoordinates, getBoardTopRightCorner, getSpaceStartPoint, HeldPiecesStand, mouseToWorld, spaceCenterPointsToBoxes, spaceCenterToBox, zIndexes } from "./RenderCalculations";
import { makeLocationDebugSquare, makeSvgDebugMesh } from "./Entities";
import { EventType, EventWrapper, IEventQueueListener } from "./Input/EventQueue";
import { GameInteractionController } from "./Input/UserInteraction";
import { PlayerColor } from "./Consts";
import { Move } from "./types/Move";
import { MessageKeys, MessageTypes } from "./CommunicationConsts";
import { pieceToLetter, sfenToGame } from "../Notation/Sfen";
import { serverMovesToClientMoves } from "../Notation/MoveNotation";
import { AnswerPrompt, CommunicationEvent, CommunicationEventTypes, CommunicationStack, MakeMove, mkCommunicationStack, Promote, PromptSelectMove } from "./Input/UserInputEvents";
import { buildForRange } from "../utils/Range";


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
	PieceCenters = "piece_centers",
	Debug = "Debug",
	Grid = "grid",
}


type DrawPiece = PlacedPiece & {
	graphicsObject: Object3D;

}

type PieceGraphicsObject = {
	name: PieceNames;
	graphicsObject: Object3D;
	location: Vector3;
};

export const getDefaultSvgLoadConfig: () => SvgLoadConfig = () => {
	return {
		rootDir: "game_assets",
		board: {
			tileTextureFilename: "tile_wood1.png",
		}
	}
}

export const getDefaultFontLoadingDir: () => string = () => {
	return 'fonts';
}

const defaultFontFileName = 'helvetiker_regular.typeface.json';

export type SvgLoadConfig = {
	rootDir: string;
	board: {
		tileTextureFilename: string;
	};
}

export class GameRunner implements IEventQueueListener {
	private className = "GameRunner";
	private gameStates: Game[] = [];
	private checkDefined = makeExistsGuard("GameRunner");

	private communicationStack?: CommunicationStack;
	private getCommunicationStack(): CommunicationStack {
		return this.checkDefined(this.communicationStack, "getCommunicationStack undefined");
	}

	public prepareCommunicationStack(): CommunicationStack {
		this.communicationStack = mkCommunicationStack();
		return this.communicationStack;
	}

	private _postMoveCallback?: (move: string) => void;
	public setPostMoveCallback(cback: (move: string) => void) {
		this._postMoveCallback = cback;
	}
	private getPostMoveCallback() {
		return this.checkDefined(this._postMoveCallback, "getPostMoveCallback");
	}

	public fontLoadingPath?: string;
	public getFontLoadingPath(): string {
		return this.checkDefined(this.fontLoadingPath, "getFontLoadingPath");
	}

	private interactionController?: GameInteractionController;
	public setInteractionController(controller: GameInteractionController): void {
		this.interactionController = controller;
	}
	private getInteractionController(): GameInteractionController {
		return this.checkDefined(this.interactionController, "interaction controller");
	}

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

	private images: {[index: string]: HTMLImageElement;} = {};

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
		fontLoadingPath: string = getDefaultFontLoadingDir(),
	): Promise<void> {
		this.initCamera();
		this.setScene(new Scene());
		this.initRenderer();

		this.fontLoadingPath = fontLoadingPath;

		const renderSettings = this.renderSettingsOrDefault();

		const textureRequestInfo: [string, string][] = [
			[
				"tile_texture",
				this.formImagePath([
					boardAndPiecesSvgSetting.rootDir,
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
		//console.log('texture loading over');

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

		//TODO the texture is black. If the image is appended to the DOM, it looks fine
		//can't tell if it's an asynchronous issue, or a problem with the way
		//the texture is setup
		const textureAssignPromises = fileReaderResults.map((result: [string, string | ArrayBuffer | null]) => {
			if (typeof result[1] !== "string") {
				throw new Error('could not convert png file to an image tag src');
			}
			const imageTag = document.createElement("img");
			const srcAssignPromise = new Promise<void>((resolve, reject) => {
				imageTag.src = result[1] as string;
				imageTag.onload = () => {
					console.log("image src assignment is over");
					//for debugging
					//document.body.appendChild(imageTag);
					resolve();
				};
				imageTag.onerror = (e) => {
					console.error(`error loading tile texture`, e);
					reject();
				}
			}).then(() => {
				this.images[result[0]] = imageTag;
			});
			return srcAssignPromise;
		});
		await Promise.all(textureAssignPromises);

		const fontLoader = new FontLoader();
		const loadFontFullPath = [fontLoadingPath, defaultFontFileName].join('/');
		const fontPromise: Promise<Font> = new Promise((resolve, reject) => {
			fontLoader.load(
				loadFontFullPath,
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

		const svgRequestResults: [string, Object3D][] = await Promise.all(this.loadSvgs(boardAndPiecesSvgSetting)).catch(e => {
		//const svgRequestResults: [string, SVGResult][] = await Promise.all(this.loadSvgs(boardAndPiecesSvgSetting)).catch(e => {
			console.error(`svg loading promise error:`, e);
			return [];
		});
		const measurePieceSizeVector = new Vector3();

		const svgObjects: [string, Group][] = measureTime(() => {
			return svgRequestResults.map(filenameSvgResult => {
				const svgName = filenameSvgResult[0];
				const prebakedObject = filenameSvgResult[1];
				//const data = filenameSvgResult[1];
				//const paths = data.paths;
				const group = new Group();
				group.name = "svg_piece_group";
				group.add(prebakedObject);

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
				group.updateMatrix();

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

		//resize the pieces
		Object.values(this.gameAssets.pieces).forEach((piece: Group) => {
			const pieceSize = new Vector3();
			const pieceBox = new Box3().setFromObject(piece);
			pieceBox.getSize(pieceSize);
			const sizeRatioX = pieceSize.x / renderSettings.boardSpaceWidth;
			const sizeRatioY = pieceSize.y / renderSettings.boardSpaceHeight;

			piece.scale.set(1 / sizeRatioX, 1 / sizeRatioY, 1);
			piece.updateMatrixWorld();
		});

		const font = await fontPromise;
		this.gameAssets.fonts[fontLoadingPath] = font;
	}
	
	/**
	* TODO this is really really slow
	* need to turn the svgs into serialized threejs meshes somehow that can be
	* cached by the browser
	* I "baked" the svgs into JSON-serialized threejs objects
	* so that this processing no longer needs to occur in the browser
	* look at BakeSvgs.ts
	* you will need to copy the json files into the django static folder
	* and run collect statick in the docker container for the client to be able to find
	* the serialized pieces
	**/
	//private prepareSvgGraphicsObjects(
	//	insertGroup: Group,
	//	paths: SVGResultPaths[]
	//) {
	//	//copy pasted this from the threejs svgloader example
	//	for (let i = 0; i < paths.length; i++) {

	//		const path = paths[ i ];

	//		const material = new MeshBasicMaterial( {
	//			color: path.color,
	//			side: DoubleSide,
	//			//I was debugging why the pieces were drawn behind the board,
	//			//and it was because this code that I pasted from the example
	//			//was setting depthWrite to false...
	//			depthWrite: true
	//		} );

	//		const shapes = SVGLoader.createShapes( path );
	//		const geometries = [];

	//		for (let j = 0;j < shapes.length;j++) {
	//			const shape = shapes[ j ];
	//			const geometry = new ShapeGeometry( shape );
	//			geometries.push(geometry);
	//			//const mesh = new Mesh( geometry, material );
	//			//group.add( mesh );
	//		}
	//		//merge the geometries into one geometry, and then
	//		//make one mesh instead of several hundred for HUGE
	//		//performance boost when the object needs to be cloned
	//		//it drastically reduces # of sub objects
	//		const mergedGeometry = mergeBufferGeometries(
	//			geometries
	//		);
	//		const mergedMesh = new Mesh(mergedGeometry, material);
	//		insertGroup.add(mergedMesh);
	//	}
	//}

	public setResizeHandlers(): void {
		const gameThis = this;
		const canvasResizeObserver = new ResizeObserver(debounce((entries: ResizeObserverEntry[], _: ResizeObserver) => {
			entries.forEach((entry: ResizeObserverEntry) => {
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

	private getPiecesPaths(
		rootDir: string,
		fileExtension: string = '.svg',
	): [string, string][] {
		const piecesPaths: [string, string][] = [
			["silver", "BlackAdvisor"],
			["bishop", "BlackBishop"],
			["bishop+", "BlackCrownedBishop"],
			["rook", "BlackRook"],
			["rook+", "BlackCrownedRook"],
			["gold", "BlackGold"],
			["lance", "BlackLance"],
			["lance+", "BlackGoldLance"],
			["goldlance", "BlackGoldLance"],
			["pawn", "BlackPawn"],
			["pawn+", "BlackGoldPawn"],
			["silver+", "BlackGoldSilver"],
			["knight", "BlackKnight"],
			["knight+", "BlackGoldKnight"],
			["king", "BlackKing"],
		].map(pieceTuple => [
			pieceTuple[0],
			this.formImagePath([
				rootDir,
				pieceTuple[1] + fileExtension,
			])
		]);

		return piecesPaths;
	}

	public loadSvgs(boardAndPiecesSvgSetting: SvgLoadConfig): Promise<[string, Object3D]>[] {
		const objectLoader = new ObjectLoader();

		const piecesPaths = this.getPiecesPaths(
			boardAndPiecesSvgSetting.rootDir,
			'.json',
		);

		const svgLoadPromises = piecesPaths.map(svgPath => new Promise<[string, Object3D]>((resolve, _) => {
			const pieceName: string = svgPath[0];
			objectLoader.load(
				svgPath[1],
				(data) => resolve([pieceName, data]),
				undefined,
				(err) => {
					console.error(err);
					return [pieceName, new Object3D()];
				}
			);
		})) as Promise<[string, Object3D]>[];

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
		const pieceCentersGroup = this.makeNamedGroup(SceneGroups.PieceCenters);

		[
			boardGroup,
			piecesGroup,
			timersGroup,
			piecesStand,
			debugPieces,
			gridGroup,
			pieceCentersGroup,
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

	public run(): void {
		//if (initialGameState) {
		//	this.gameStates.push(initialGameState);
		//} else {
		//	this.gameStates.push(createGame());
		//}

		requestAnimationFrame(this.renderStep.bind(this));
	}

	/**
	* get a deep copy of the current game state
	**/
	public getCurrentGameState(): Game {
		return structuredClone(this.checkDefined(this.gameStates[this.gameStates.length - 1], this.className));
	}

	private renderStep(): void {
		const gameState = this.getCurrentGameState();
		const scene = this.getScene();

		const renderSettings = this.renderSettingsOrDefault();

		const renderCoordinates = calcRenderCoordinates(
			gameState,
			renderSettings,
		);
		//measureTime(() => {
			//measureTime(() => {
				this.drawHeldPiecesCounts(
					this.getSceneGroup(SceneGroups.Stands),
					gameState,
					renderCoordinates,
				);
			//}, time => console.log(`drawHeldPieces:${time}`));
			//measureTime(() => {
				this.drawPlacedPieces(
					this.getSceneGroup(SceneGroups.Pieces),
					gameState,
					renderCoordinates.spaceCenterPoints,
				);
			//}, time => console.log(`drawPlacedPieces:${time}`));
		//}, time => console.log(`renderStep threejs object processing time:${time}`));

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

		const blackPlayer = gameState.players.find(player => player.turn === PlayerColor.Black);
		const whitePlayer = gameState.players.find(player => player.turn === PlayerColor.White);
		if(blackPlayer === undefined || whitePlayer === undefined) throw new Error('no player');
		
		const countPiecesMapBlack = this.getCountPiecesMap(blackPlayer.heldPieces);
		this.drawCounts(blackPiecesCountsGroup, countPiecesMapBlack, calcRenderCoords.blackHeldPiecesLocations);
		const countPiecesMapWhite = this.getCountPiecesMap(whitePlayer.heldPieces);
		this.drawCounts(whitePiecesCountsGroup, countPiecesMapWhite, calcRenderCoords.whiteHeldPiecesLocations);
	}

	private drawCounts(
		group: Group,
		counts: [PieceNames, number][],
		locations: [PieceNames, Vector3][],
	): void {
		//console.log('draw counts', { counts, locations });
		const meshes: Mesh[] = [];
		const font = this.gameAssets.fonts[this.getFontLoadingPath()];
		//console.log('found font:', font);
		locations.forEach((locationInfo: [PieceNames, Vector3]) => {
			const key = locationInfo[0];
			const loc = locationInfo[1];
			const count = counts.find(count => count[0] === key);
			if(count === undefined) {
				throw new Error(`drawCounts no count for piece:${key}`);
			}
			//TODO the text for the counts is too big
			//a player can hold up to 18 pawns, so the numbers will need to be made
			//to be smaller, and have their position ajusted so that they fit nicely
			//within a corner of their square
			const countGeometry = new TextGeometry(
				count[1].toString(),
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

	/**
	* convert the held pieces array into a list of tuples
	**/
	private getCountPiecesMap(heldPieces: HeldPiece[]): [PieceNames, number][] {
		return heldPieces.map(heldPiece => {
			return [heldPiece.name, heldPiece.count];
		});
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
		//console.log({
		//	cameraWidth,
		//	cameraHeight,
		//	cameraAspectRatio: cameraWidth / cameraHeight,
		//	canvasWidth,
		//	canvasHeight,
		//	canvasAspectRatio,
		//	viewPortWidth,
		//	viewPortHeight,
		//});
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
		//console.log('update ortho', { left, right, top, bottom });
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

		this.buildCenterIndicatorsForSpaces(
			buildForRange(1, 9, idxRank => buildForRange(1, 9, idxFile =>{
					return {
						rank: idxRank,
						file: idxFile,
					}
				})
			).flat(),
			this.getSceneGroup(SceneGroups.PieceCenters),
			gameState,
			renderSettings,
		);

		if(renderSettings.debug.boardCenter) {
			const centerSquare = new Mesh(
				new BoxBufferGeometry(2, 2),
				new MeshBasicMaterial({	color: new Color(1, 1, 0) })
			);
			this.getSceneGroup(SceneGroups.Debug).add(centerSquare);
			centerSquare.position.set(0, 0, zIndexes.floating);
			centerSquare.updateMatrixWorld();
		}

		//the mouse click detection looks at the calcualed space coordinates
		//to determine if the mouse clicked in that region of the board
		//SO if you rotate the board for sente's perspective, when you click something on
		//rank 1 (the rank closest to you) it will register as a click on rank 9...
		////if the player is gote, we need to rotate the board so that it is
		////scene from the player's perspective
		////this rotation needs to only be set once
		////we could add a "flip the board" feature by changing this rotation
		//if (gameState.viewPoint === PlayerColor.White) {
		//	const placedPiecesGroup = this.getSceneGroup(SceneGroups.Pieces);
		//	placedPiecesGroup.rotateZ(Math.PI);
		//}
	}

	private drawBoard(
		boardGroup: Group,
		boardWidth: number,
		boardHeight: number
	): void {
		const boardGeometry = new PlaneGeometry(boardWidth, boardHeight);
		const boardImage = this.images["tile_texture"];
		let boardMaterial: MeshBasicMaterial;
		//if the texture doesn't exist, default the board to a red-ish color
		if (boardImage === undefined) {
			console.warn(`draw board, no space texture`);
			boardMaterial = new MeshBasicMaterial({
				color: new Color(1, 0, 0),
				transparent: true,
				opacity: 0.25,
			});
		} else {
			const texture: Texture = new Texture(boardImage);
			texture.wrapS = RepeatWrapping;
			texture.wrapT = RepeatWrapping;
			//without doing this, the texture will remain black
			texture.needsUpdate = true;
			boardMaterial = new MeshBasicMaterial({
				map: texture,
				side: DoubleSide,
				transparent: false,
			});
		}

		const boardMesh = new Mesh(boardGeometry, boardMaterial);

		boardGroup.remove(...boardGroup.children);
		boardGroup.add(boardMesh);
		boardMesh.position.setZ(zIndexes.board);
		boardMesh.updateMatrixWorld();
	}




	/**
	* draws the icons for the held pieces
	* the icons do not change, so this is only ran once
	**/
	private drawHeldPiecesIcons(
		gameState: Game,
		standsGroup: Group,
		players: Player[],
		calcedRenderCoords: CalcedRenderCoords,
	): void {
		const blackPlayer = findPlayer(gameState, PlayerColor.Black);
		const whitePlayer = findPlayer(gameState, PlayerColor.White);
		if(!blackPlayer || !whitePlayer) {
			throw new Error(`black or white player could not be found:${players.map(player => player.turn).join(' ')}`);
		}

		const blackStandPiecesGroup: Object3D | undefined = standsGroup.getObjectByName(SceneGroups.BlackStandPieces);
		const whiteStandPiecesGroup: Object3D | undefined = standsGroup.getObjectByName(SceneGroups.WhiteStandPieces);
		const foundGroup = (obj: Object3D | undefined) => obj !== undefined && (obj as Group).isGroup;
		if (!foundGroup(blackStandPiecesGroup) || !foundGroup(whiteStandPiecesGroup)) {
			throw new Error(`no stand group`);
		}

		this.placeHeldPieces(
			blackStandPiecesGroup as Group,
			calcedRenderCoords.blackHeldPiecesLocations,
			gameState.viewPoint === PlayerColor.Black,
		);

		//const whiteHeldPieces: DrawPiece[] = this.getPiecesGraphicsObjects(
		//	whitePlayer.pieces.filter(piece => isHeldPiece(piece)),
		//);

		//TODO this just draws the icons for the heldPieces, you only need to this once
		//and you need to draw a number 0~N for how many pieces of that kind you are holding
		this.placeHeldPieces(
			whiteStandPiecesGroup as Group,
			calcedRenderCoords.whiteHeldPiecesLocations,
			gameState.viewPoint === PlayerColor.White,
		);
	}

	/**
	* set the locations for the held pieces for a player's side
	* @param isNeedsRotateColor if the held piece's are the current player's, then they need to be rotated upright
	**/
	private placeHeldPieces(
		group: Group,
		pieceLocations: [PieceNames, Vector3][],
		isNeedsRotateColor: boolean,
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
			const location = pieceLocations.find(pce => pce[0] === pieceName);
			if (location === undefined) {
				throw new Error(`placeHeldPieces, pieceName:${pieceName} 's location couldn't be found`);
			}
			return location[1];
		}
		const pieceGraphicsObjects: PieceGraphicsObject[] = pieces.map(piece => {
			return {
				name: piece.name,
				graphicsObject: this.gameAssets.pieces[piece.name].clone(),
				location: findPieceLocation(piece.name)
			}
		});

		//Rotate the pieces for the side of the player, so that they are facing upright
		if(isNeedsRotateColor){
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

		//console.error({ pieces });
		group.remove(...group.children);
		group.add(...pieceGraphicsObjects.map(drawPiece => drawPiece.graphicsObject));
	}

	private drawHeldPiecesStand(
		standsGroup: Group,
		whiteStandCoords: HeldPiecesStand,
		blackStandCoords: HeldPiecesStand,
	): void {
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

		const tileImage = this.images["tile_texture"];
		let material: MeshBasicMaterial;
		if (tileImage) {
			const texture = new Texture(tileImage);
			texture.wrapT = RepeatWrapping;
			texture.wrapS = RepeatWrapping;
			texture.needsUpdate = true;

			material = new MeshBasicMaterial({
				map: texture,
				side: DoubleSide,
				transparent: false,
			});
		} else {
			material = new MeshBasicMaterial({
				color: new Color(0, 1, 0),
				transparent: true,
				opacity: 0.25,
			});
		}

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
		const placedPiecesPerPlayer = gameState.players.map(player => {
			return {
				turn: player.turn,
				pieces: this.getPiecesGraphicsObjects(
					player.placedPieces.filter(piece => isPlaced(piece))
				)
			}
		});

		const pieceGraphicsObjects = placedPiecesPerPlayer
			.flatMap(player => player.pieces.map(drawPiece => drawPiece.graphicsObject))

		piecesGroup.remove(...piecesGroup.children);
		piecesGroup.add(...pieceGraphicsObjects);

		//measureTime(() => {
		placedPiecesPerPlayer.forEach((player) => {
			player.pieces.forEach((drawPiece: DrawPiece) => {
				const graphicsObject = drawPiece.graphicsObject;

				const shouldRotate = player.turn === gameState.viewPoint;
				//console.log({ shouldRotate, playerTurn: player.turn, gameViewPoint: gameState.viewPoint });
				//console.log({
				//	playerTurn: player.turn,
				//	viewpoint: gameState.viewPoint,
				//	shouldRotate,
				//});
				if (shouldRotate) {
					graphicsObject.position.set(0, 0, 0);
					graphicsObject.rotateZ(Math.PI);
				}
				//TODO how do I tell the type system that these are placed pieces?
				//I filtered them using isPlaced
				const worldCoordinates = spaceCenterPointLookup[drawPiece.rank - 1][drawPiece.file - 1].clone();
				graphicsObject.position.copy(worldCoordinates);

				drawPiece.graphicsObject.updateMatrixWorld();
			});
		});
		//}, time => console.log(`drawPlacedPieces update piece coordinates:${time}`));
	}

	/**
	* draw small shapes on top of the center of each space on the board
	* that can be shown or hidden to convey to the user which spaces are possible moves
	* for their currently selected piece
	**/
	public buildCenterIndicatorsForSpaces(
		targetSpaces: BoardLocation[],
		targetGroup: Group,
		gameState: Game,
		renderSettings: RenderSettings = defaultRenderSettings()
	): void {
		const game = gameState !== undefined ? gameState : this.getCurrentGameState();
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
			gameState.viewPoint,
			game.board.ranks,
			game.board.files,
			spaceStartPointX,
			spaceStartPointY,
			renderSettings.boardSpaceWidth,
			renderSettings.boardSpaceHeight
		);

		//console.log({ renderCoords });

		targetGroup.remove(...targetGroup.children);
		const square = makeLocationDebugSquare();
		const placeDebugObjects = targetSpaces.map(space => {
			const insertCube = square.clone();
			insertCube.position.copy(renderCoords[space.rank - 1][space.file - 1]);
			insertCube.position.setZ(zIndexes.floating);
			insertCube.matrixWorldNeedsUpdate = true;
			//these start off hidden
			insertCube.visible = false;
			insertCube.userData["rank"] = space.rank;
			insertCube.userData["file"] = space.file;
			return insertCube;
		});

		targetGroup.add(...placeDebugObjects);
	}

	private showSpaceCenters(spaces: BoardLocation[]): void {
		const spaceCenterIndicators = this.getSceneGroup(SceneGroups.PieceCenters).children;
		//hide all of them
		spaceCenterIndicators.forEach(indicator => {
			indicator.visible = false;
		});

		//show the selected spaces
		spaces.forEach(space => {
			const spaceObject = spaceCenterIndicators.find(indicator => {
				return indicator.userData["rank"] === space.rank && indicator.userData["file"] === space.file;
			});
			if (spaceObject !== undefined) spaceObject.visible = true;
		});
	}

	private createMakeMoveEvent(move: Move): void {
		console.log(`sending move:${move.originalString !== undefined ? move.originalString : 'nil'}`);
		this.getCommunicationStack().pushEvent({
			eventType: CommunicationEventTypes.MAKE_MOVE,
			eventInfo: {
				moveString: move.originalString !== undefined ? move.originalString : "BAD CLIENT SIDE MOVE STRING",
			},
		} as CommunicationEvent);
	}

	private handleUserInputResult(
		userInputResult: Move[] | PlayerHeldPiece | PlacedPiece | undefined | null
	): boolean {
		//TODO instead of using 'undefined' to mean "a piece needs deselected/no piece found"
		//and 'null' to mean "event was ignored for a non-game logic reason",
		//actually make a type that represents that information
		if (userInputResult === null) {
			return false;
		}
		if (userInputResult === undefined) {
			//deselect piece
			this.getInteractionController().resetSelectedPiece();
			//hide the move indicator icons, and set the flag to redraw
			this.showSpaceCenters([]);
			return true;
		}

		if (Array.isArray(userInputResult)) {
			const moves = userInputResult as Move[];
			//if a move has no possible moves, reject trying to
			//select it
			if (moves.length === 0) {
				return false;
			}

			//send the only possible move
			if (moves.length === 1) {
				const move = moves[0];
				this.createMakeMoveEvent(move);
				this.showSpaceCenters([]);
				return true;
			//prompt the user to choose from amongst many moves
			} else {
				//multiple moves are possible, so the UI needs to prompt the user to
				//disambiguate them (to promote or not to promote),
				//so we post an event to the UI layer asking the user to make a selection
				this.getCommunicationStack().pushEvent({
					eventType: CommunicationEventTypes.PROMPT_SELECT_MOVE,
					eventInfo: {
						moveOptions: moves.map((move: Move, id: number) => {
							return {
								id,
								promote: move.promotesPiece ? Promote.Do : Promote.No,
								displayMessage: move.promotesPiece ? "Promote" : "No Promote",
							}
						}),

					} as PromptSelectMove
				});
				//add a callback to handle the answer event
				this.getCommunicationStack().pushNotifyCallback((event: CommunicationEvent, callbackId: number) => {
					if (event.eventType !== CommunicationEventTypes.ANSWER_PROMPT) {
						return;
					}

					const userSelectedMoveId = (event.eventInfo as AnswerPrompt).selectedChoiceId;

					const selectedMove = moves[userSelectedMoveId];
					this.createMakeMoveEvent(selectedMove);
					//callback unregisters itself when it is finished
					this.getCommunicationStack().removeNotifyCallback(callbackId);
				});
			}

			return false;
		}

		//need to select a piece
		if (isPlaced(
			userInputResult as PlacedPiece | PlayerHeldPiece)
			|| isHeldPiece(userInputResult as PlacedPiece | PlayerHeldPiece)) {
			this.getInteractionController().setSelectedPiece(userInputResult);

			let playerColor;
			if (isPlaced(userInputResult)) {
				const pieceAndPlayer = findPlacedPieceAndPlayer(
					this.getCurrentGameState(),
					userInputResult.rank,
					userInputResult.file,
				);
				if (pieceAndPlayer === undefined) throw new Error(`findPlacedPieceAndPlayer failed to find info for piece`);
				playerColor = pieceAndPlayer.player;
			} else {
				playerColor = userInputResult.player;
			}

			let movesForSelectedPiece: Move[];

			const player = findPlayer(this.getCurrentGameState(), playerColor);
			if(isHeldPiece(userInputResult)){
				console.log({ userInputResult, moves: player.moves });
				movesForSelectedPiece = player.moves.filter((mv: Move) => {
					return mv.start === undefined
						&& mv.heldPieceName === userInputResult.name;
				});
			} else {
				const moves = player.moves;
				movesForSelectedPiece = moves.filter((mv: Move) => {
					return mv.start !== undefined && mv.start.rank === userInputResult.rank
						&& mv.start.file === userInputResult.file;
				});
			}
			console.error(`need to highlight spaces:`, { movesForSelectedPiece });
			const squaresToShow = movesForSelectedPiece.map((mv: Move) => {
				return {
					rank: mv.end.rank,
					file: mv.end.file,
				} as BoardLocation;
			});

			this.showSpaceCenters(squaresToShow);
			return true;
		}

		return false;
	}

	public newEventNotification(event: EventWrapper) {
		console.log("game notified of event:", event);
		switch(event.type) {
			case EventType.Mouse:
				const userInputResult = this.handleMouseEvent(event);
				const shouldRerender = this.handleUserInputResult(userInputResult);
				if (shouldRerender) this.renderStep();
				break;
			case EventType.Keyboard:
				this.handleKeyboardEvent(event);
				break;
			default:
				return;
		}
	}

	/**
	* TODO need to use mouse down and mouse up to implement drag an drop
	* @returns list of moves of length > 1 if the user must select a move,
	* list of length 1 if only one move is possible
	* undefined if piece-deselection is necessary 
	* null if the event was ignored for some reason (like mousedown vs mouseup)
	**/
	private handleMouseEvent(event: EventWrapper): Move[] | PlayerHeldPiece | PlacedPiece | undefined | null {
		if (event.event.type !== "mouseup") {
			return null;
		}
		const interactionController = this.getInteractionController();
		const currentGameState = this.getCurrentGameState();
		const { x, y } = event.event as MouseEvent;
		console.log(`click @ (${x}, ${y})`);
		const renderCoords = calcRenderCoordinates(
			this.getCurrentGameState(),
			this.renderSettingsOrDefault(),
		);

		const renderSettings = this.renderSettingsOrDefault();
		const halfSpaceWidth = renderSettings.boardSpaceWidth / 2;
		const halfSpaceHeight = renderSettings.boardSpaceHeight / 2;

		const mouseCoords = mouseToWorld(
			x,
			y,
			this.getCanvas(),
			//this.getRenderer(),
			this.getScene(),
		);

		const spaceBoxes = spaceCenterPointsToBoxes(
			renderCoords.spaceCenterPoints,
			renderSettings,
		);

		const hitSpace = spaceBoxes.find(spaceBox => spaceBox.box.containsPoint(mouseCoords));
		if (hitSpace) {
			//hit a space, if there is a piece on that space we need to
			//grab it and pass that into the interaction logic
			//if not, treat it as a piece move
			console.log('clicked space:', hitSpace);
			const piecePlayer = findPlacedPieceAndPlayer(
				currentGameState,
				hitSpace.rank,
				hitSpace.file,
			);

			if(piecePlayer !== undefined) {
				const { player, piece: clickedPiece } = piecePlayer;
				const move = interactionController.handleClick({
					clickedEntity: {
						piece: clickedPiece,
						pieceOwner: player,
					}
				}, currentGameState);
				return move;
			} else {
				const move = interactionController.handleClick({
					clickedEntity: {
						rank: hitSpace.rank,
						file: hitSpace.file,
					},
				}, currentGameState);
				return move;
			}
		}

		//didn't hit a board space, need to check the held pieces
		//const clickedBlackHeldPiece = renderCoords.blackHeldPiecesLocations
		const blackPieceNameToSpaceArea = this.getBoxesForHeldPieces(
			renderCoords.blackHeldPiecesLocations,
			halfSpaceWidth,
			halfSpaceHeight
		);

		//TODO de-dupe the white and black held piece cases
		const clickedBlackPiece = blackPieceNameToSpaceArea
			.find((entry: [PieceNames, Box2]) => {
				//console.log(entry);
				return entry[1].containsPoint(mouseCoords);
			});
		if (clickedBlackPiece) {
			//console.log(`clicked black held piece:${clickedBlackPiece[0]} ${boxToString(clickedBlackPiece[1])}`);
			const blackPlayer = findPlayer(currentGameState, PlayerColor.Black)

			const heldPiece = blackPlayer.heldPieces
				.find(heldPiece => heldPiece.name === clickedBlackPiece[0]);

			if(heldPiece === undefined) throw new Error("held piece was undefined, it should always atleast be defined with a count of 0");
			const newGame = interactionController.handleClick({
				clickedEntity: {
					piece: heldPiece,
					pieceOwner: PlayerColor.Black,
				}
			}, currentGameState);
			return newGame;
		}

		const whitePieceNameToSpaceArea = this.getBoxesForHeldPieces(
			renderCoords.whiteHeldPiecesLocations,
			halfSpaceWidth,
			halfSpaceHeight,
		);
		const clickedWhitePiece = whitePieceNameToSpaceArea
			.find((entry: [PieceNames, Box2]) => entry[1].containsPoint(mouseCoords));
		if (clickedWhitePiece) {
			//console.log(`clicked white held piece:${clickedWhitePiece[0]} ${boxToString(clickedWhitePiece[1])}`);
			const whitePlayer = findPlayer(currentGameState, PlayerColor.White);
			const heldPiece = whitePlayer.heldPieces
				.find(heldPiece => heldPiece.name === clickedWhitePiece[0]);
			if(heldPiece === undefined) {
				throw new Error("held piece was undefined, it should always atleast be defined with a count of 0");
			}
			const move = interactionController.handleClick({
				clickedEntity: {
					piece: heldPiece,
					pieceOwner: PlayerColor.White,
				}
			}, currentGameState);
			return move;
		}
	}

	private getBoxesForHeldPieces(
		heldPieceLocations: [PieceNames, Vector3][],
		halfSpaceWidth: number,
		halfSpaceHeight: number,
	): [PieceNames, Box2][] {
		return heldPieceLocations.map(locationInfo => [locationInfo[0], spaceCenterToBox(
			locationInfo[1],
			halfSpaceWidth,
			halfSpaceHeight,
		)]);
	}

	private handleKeyboardEvent(event: EventWrapper): void {
		console.log({ keyboardEvent: event.event});
	}

	public receiveMessage(message: Record<string, any>): void {
		const messageType = message[MessageKeys.MESSAGE_TYPE];
		switch(messageType) {
			case MessageTypes.GAME_STATE_UPDATE:
				this.updateGameState(message);
				break;
			case MessageTypes.ERROR:
				const errorMessage = message[MessageKeys.ERROR_MESSAGE];
				console.error(`error message from server:${errorMessage}`);
				break;
			case MessageTypes.YOU_WIN:
				this.getCommunicationStack().pushEvent({
					eventType: CommunicationEventTypes.YOU_WIN,
				});
				break;
			case MessageTypes.YOU_LOSE:
				this.getCommunicationStack().pushEvent({
					eventType: CommunicationEventTypes.YOU_LOSE,
				});
			default:
				throw new Error(`receiveMessage unhandled messageType:${messageType}`);
		}
	}

	private resetGameState(): void {
		this.gameStates = [];
	}

	private updateGameState(message: Record<string, any>): void {
		const match = message[MessageKeys.MATCH];
		const newGame = sfenToGame(match);

		const isFirstUpdate = this.gameStates.length === 0;
		console.log({ newGame, message, isFirstUpdate });

		console.log({ clientPlayerSide: message[MessageKeys.CLIENT_PLAYER_SIDE] });
		const clientPlayerSideMessage = message[MessageKeys.CLIENT_PLAYER_SIDE];
		let clientPlayerColor;
		if (clientPlayerSideMessage !== undefined) {
			clientPlayerColor = clientPlayerSideMessage === "SENTE"
				? PlayerColor.Black
				: PlayerColor.White;
		} else {
			clientPlayerColor = this.getCurrentGameState().viewPoint;
		}
		//TODO this state should be separate from the actual shogi game state,
		//make it a property on the game runner
		//the client should be able to remember what side it is
		if (clientPlayerSideMessage !== undefined) {
			newGame.viewPoint = clientPlayerColor;
		} else {
			const viewpoint = this.getCurrentGameState().viewPoint;
			newGame.viewPoint = viewpoint;
		}

		const nextMovePlayerColor = (newGame as Game).nextMovePlayer;
		const isMyMove = clientPlayerColor === nextMovePlayerColor;
		const nextMovePlayer = findPlayer(
			newGame as Game,
			(newGame as Game).nextMovePlayer,
		);


		console.log({ isMyMove });
		if (isMyMove) {
			const movesFromMessage = message[MessageKeys.MOVES];
			const moves = serverMovesToClientMoves(
				movesFromMessage,
			);

			nextMovePlayer.moves = moves;
		}

		this.gameStates.push(newGame as Game);

		if (isFirstUpdate) {
			this.drawStaticObjects(this.getCurrentGameState());
		}

		console.log('run');
		this.run();
	}

	public resetState(): void {
		this.getInteractionController().resetState();
		this.resetGameState();
	}
}
