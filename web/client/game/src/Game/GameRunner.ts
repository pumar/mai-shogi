import { Box3, BufferGeometry, Camera, Color, DoubleSide, Group, Material, Mesh, MeshBasicMaterial, Object3D, OrthographicCamera, PlaneGeometry, Scene, ShapeGeometry, Texture, Vector3, WebGLRenderer } from "three";
import { SVGLoader, SVGResult } from "three/examples/jsm/loaders/SVGLoader.js";
import { makeExistsGuard } from "../utils/Guards";
import { buildForRange } from "../utils/Range";

import { createGame } from "./GameCreator";
import { defaultRenderSettings, RenderSettings } from "./Renderer/Renderer";
import { getAssetKeyForPiece } from "./types/AssetKeys";
import { Game } from "./types/Game";
import { HeldPiece, isHeldPiece, isPlaced, Piece } from "./types/Piece";
import { Player, Turn } from "./types/Player";

type HeldPiecesStand = {
	basePoint: Vector3;
	width: number;
	height: number;
}

const zIndexes = {
	board: -1,
	timer: 0,
	pieces: 1,
}

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
	BlackStand = "black_stand",
	BlackStandPieces = "black_stand_pieces",
}

type DrawPiece = Piece & {
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

export class GameRunner {
	private gameStates: Game[] = [];
	private checkDefined = makeExistsGuard("GameRunner");

	private renderSettings?: RenderSettings;
	private renderSettingsOrDefault(): RenderSettings {
		return this.renderSettings !== undefined ? this.renderSettings : defaultRenderSettings();
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
	} = {
		geometries: {},
		materials: {},
		pieces: {},
	};

	public async initGraphics(
		boardAndPiecesSvgSetting: SvgLoadConfig = getDefaultSvgLoadConfig(),
	): Promise<void> {
		this.initCamera();
		this.setScene(new Scene());
		this.initRenderer();

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

		console.log({ textures });

		const svgRequestResults: [string, SVGResult][] = await Promise.all(this.loadSvgs(boardAndPiecesSvgSetting));
		console.log('svg request results', { svgRequestResults });
		const svgObjects: [string, Group][] = svgRequestResults.map(filenameSvgResult => {
			const svgName = filenameSvgResult[0];
			const data = filenameSvgResult[1];
			const paths = data.paths;
			const group = new Group();

			//copy pasted this from the threejs svgloader example
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

			return [svgName, group];
		});

		//Object.assign(this.images, Object.fromEntries(textures));

		console.log('svg groups', svgObjects);
		Object.assign(this.gameAssets.pieces, Object.fromEntries(svgObjects));
		console.log({ gameAssets: this.gameAssets, pieceKeys: Object.keys(this.gameAssets.pieces) });
		//resize the pieces TODO move this to a helper function, we will need to do this on a screen
		//resize at some point
		const renderSettings = this.renderSettingsOrDefault();
		Object.values(this.gameAssets.pieces).forEach((piece: Group) => {
			const pieceSize = new Vector3();
			const pieceBox = new Box3().setFromObject(piece);
			pieceBox.getSize(pieceSize);
			const sizeRatioX = pieceSize.x / renderSettings.boardSpaceWidth;
			const sizeRatioY = pieceSize.y / renderSettings.boardSpaceHeight;
			console.log({ pieceSize, sizeRatioX, sizeRatioY });
			piece.scale.set(1 / sizeRatioX, 1 / sizeRatioY, 1);
			piece.updateMatrixWorld();
		});
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
		camera.position.copy(new Vector3(0, 0, 5));
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

		[
			boardGroup,
			piecesGroup,
			timersGroup,
			piecesStand
		].forEach(grp => scene.add(grp));
		//piecesGroup.position.setZ(zIndexes.pieces);
		piecesGroup.position.setZ(zIndexes.pieces);
		piecesGroup.updateMatrixWorld();
		boardGroup.position.setZ(zIndexes.board);
		boardGroup.updateMatrixWorld();

		const blackStandGroup = this.makeNamedGroup(SceneGroups.BlackStand);
		const whiteStandGroup = this.makeNamedGroup(SceneGroups.WhiteStand);
		piecesStand.add(blackStandGroup, whiteStandGroup);
	}

	public run(initialGameState?: Game): void {
		if (initialGameState) {
			this.gameStates.push(initialGameState);
		} else {
			this.gameStates.push(createGame());
		}
		console.log('running game');

		requestAnimationFrame(this.renderStep.bind(this));
	}

	private renderStep(): void {
		const gameState = this.gameStates[this.gameStates.length - 1];
		const scene = this.getScene();

		const renderSettings = this.renderSettingsOrDefault();

		const calcRenderCoordinates = this.calcRenderCoordinates(
			gameState,
			renderSettings,
		);
		console.log({ calcRenderCoordinates });
		this.drawHeldPiecesStand(
			this.getSceneGroup(SceneGroups.Stands),
			calcRenderCoordinates.whiteStandCoords,
			calcRenderCoordinates.blackStandCoords,
		);
		//TODO skipping this, draw the pieces on the board first
		//this.drawHeldPieces(
		//	this.getSceneGroup(SceneGroups.Stands),
		//	gameState.viewPoint,
		//	gameState.players,
		//);
		//TODO you only need to do this once, the spaces can't movee
		this.drawBoard(
			this.getSceneGroup(SceneGroups.Board),
			calcRenderCoordinates.spaceCenterPoints,
			calcRenderCoordinates.boardWidth,
			calcRenderCoordinates.boardHeight,
		);
		this.drawPlacedPieces(
			this.getSceneGroup(SceneGroups.Pieces),
			gameState,
			calcRenderCoordinates.spaceCenterPoints,
			renderSettings,
		);

		const camera = this.getCamera();
		//const {clientWidth, clientHeight} = this.getCanvas();
		//const {width, height} = this.getCanvas();
		const sceneBoundingBox = new Box3().setFromObject(this.getScene());

		const size = new Vector3();
		sceneBoundingBox.getSize(size);

		const sceneAspectRatio = size.x / size.y;
		console.log({ sceneBoundingBox, size, sceneAspectRatio });
		const cameraAreaDimension = Math.max(size.x, size.y);
		if (camera instanceof OrthographicCamera) {
			camera.left = -cameraAreaDimension / 2;
			camera.right = cameraAreaDimension / 2;
			camera.top = cameraAreaDimension / 2;
			camera.bottom = -cameraAreaDimension / 2;
			camera.updateProjectionMatrix();
		}

		this.getRenderer().render(scene, camera);
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
		});

		const boardMesh = new Mesh(boardGeometry, boardMaterial);

		boardGroup.remove(...boardGroup.children);
		boardGroup.add(boardMesh);
		boardMesh.position.setZ(zIndexes.board);
		boardMesh.updateMatrixWorld();
	}

	/**
	* TODO timers
	**/
	private calcRenderCoordinates(gameState: Game, renderSettings: RenderSettings): {
		spaceCenterPoints: Vector3[][],
		whiteStandCoords: HeldPiecesStand;
		blackStandCoords: HeldPiecesStand;
		boardWidth: number;
		boardHeight: number;
	} {
		const {files, ranks} = gameState.board;
		const {boardSpaceWidth, boardSpaceHeight} = renderSettings;

		const boardWidth = boardSpaceWidth * files;
		const boardHeight = boardSpaceHeight * ranks;
		const [boardTopRightCornerX, boardTopRightCornerY] = [boardWidth, boardHeight].map(dim => dim / 2);

		const spaceStartPointX = boardTopRightCornerX - boardSpaceWidth / 2;
		const spaceStartPointY = boardTopRightCornerY - boardSpaceHeight / 2;

		const spaceCenterPoints: Vector3[][] = this.calcSpaceCoordinates(
			ranks,
			files,
			spaceStartPointX,
			spaceStartPointY,
			boardSpaceWidth,
			boardSpaceHeight
		);

		const standGap: number = 4;

		const { whitePiecesStandBasePoint, blackPiecesStandBasePoint } = this.getStandCenterPoints(
			gameState,
			boardWidth,
			boardHeight,
			boardSpaceWidth,
			boardSpaceHeight,
			standGap
		);
		
		const standWidth = boardSpaceWidth * 4;
		const standHeight = boardSpaceHeight * 2;

		return {
			boardWidth,
			boardHeight,
			spaceCenterPoints,
			whiteStandCoords: {
				basePoint: whitePiecesStandBasePoint,
				width: standWidth,
				height: standHeight,
			},
			blackStandCoords: {
				basePoint: blackPiecesStandBasePoint,
				width: standWidth,
				height: standHeight,
			}
		}
	}

	private getStandCenterPoints(
		game: Game,
		boardWidth: number,
		boardHeight: number,
		boardSpaceWidth: number,
		boardSpaceHeight: number,
		standGap: number,
	): { whitePiecesStandBasePoint: Vector3, blackPiecesStandBasePoint: Vector3 } {
		//board center point to center point of piece holder
		const standDistFromBoardCenterPointX = boardWidth / 2 + standGap + 2 * boardSpaceWidth;
		const standDistFromBoardCenterPointY = -boardHeight / 2 + 2 * boardSpaceHeight;
		const bottomRightStand = new Vector3(
			standDistFromBoardCenterPointX,
			standDistFromBoardCenterPointY,
		);

		//invert the coordinates to get the position of the other player's hand
		const topLeftStand = bottomRightStand.clone();
		topLeftStand.x *= -1;
		topLeftStand.y *= -1;

		return {
			whitePiecesStandBasePoint: game.viewPoint === "white" ? bottomRightStand : topLeftStand,
			blackPiecesStandBasePoint: game.viewPoint === "black" ? bottomRightStand : topLeftStand,
		}
	}

	private calcSpaceCoordinates(
		ranks: number,
		files: number,
		spaceStartPointX: number,
		spaceStartPointY: number,
		boardSpaceWidth: number,
		boardSpaceHeight: number,
	): Vector3[][] {
		const spaceCenterPoints: Vector3[][] = [];
		for(let rankIndex = 0; rankIndex < ranks; rankIndex++) {
			const filePoints: Vector3[] = [];
			for(let fileIndex = 0; fileIndex < files; fileIndex++) {
				filePoints.push(new Vector3(
					spaceStartPointX - boardSpaceWidth * fileIndex,
					spaceStartPointY - boardSpaceHeight * rankIndex,
					//note, when you use these vector3s to place things, and you
					//need modify the coordinates, you need to modify a copy of the vector,
					//not the vector itself. use vector.clone
					0,
				));
			}
			spaceCenterPoints.push(filePoints);
		}

		return spaceCenterPoints;
	}

	private drawHeldPieces(standsGroup: Group, viewpoint: Turn, players: Player[]): void {
		const blackPlayer = players.find(player => player.turn === "black");
		const whitePlayer = players.find(player => player.turn === "white");
		if(!blackPlayer || !whitePlayer) {
			throw new Error(`black or white player could not be found:${players.map(player => player.turn).join(' ')}`);
		}

		const isBlackMainViewPoint = viewpoint === "black";
		const blackPlayerHeldPieces: DrawPiece[] = this.getPiecesGraphicsObjects(
			blackPlayer.pieces.filter(piece => isHeldPiece(piece)),
		);

		const whitePlayerHeldPieces: DrawPiece[] = this.getPiecesGraphicsObjects(
			whitePlayer.pieces.filter(piece => isHeldPiece(piece)),
		);

		console.log({ blackPlayerHeldPieces, whitePlayerHeldPieces });
		
		const blackStandsGroup = standsGroup.getObjectByName(SceneGroups.BlackStand);
		const whiteStandsGroup = standsGroup.getObjectByName(SceneGroups.WhiteStand);
		if (blackStandsGroup === undefined || whiteStandsGroup === undefined) {
			throw new Error(`no stand group`);
		}
		blackStandsGroup.remove(...blackStandsGroup.children);
		blackStandsGroup.add(...blackPlayerHeldPieces.map(drawPiece => drawPiece.graphicsObject));
		whiteStandsGroup.remove(...whiteStandsGroup.children);
		whiteStandsGroup.add(...whitePlayerHeldPieces.map(drawPiece => drawPiece.graphicsObject));
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
			map: new Texture(this.images["tile_texture"]),
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
					graphicsObject: pieceObject
				}
			) as DrawPiece;
		});
	}

	private drawPlacedPieces(
		piecesGroup: Group, 
		gameState: Game,
		spaceCenterPointLookup: Vector3[][],
		renderSettings: RenderSettings,
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
					player.pieces.filter(piece => isPlaced(piece))
				)
			}
		});
		console.log({ placedPiecesPerPlayer });

		const pieceGraphicsObjects = placedPiecesPerPlayer
			.flatMap(player => player.pieces.map(drawPiece => drawPiece.graphicsObject))

		console.log({ pieceGraphicsObjects });

		const numPieces = piecesGroup.children.length;
		piecesGroup.remove(...piecesGroup.children);
		piecesGroup.add(...pieceGraphicsObjects);
		console.log({ piecesRemoved: numPieces, piecesAdded: pieceGraphicsObjects.length });
		placedPiecesPerPlayer.forEach((player) => {
			player.pieces.forEach((drawPiece: DrawPiece) => {
				//@ts-ignore TODO how do I tell the type system that these are placed pieces?
				//I filtered them using isPlaced
				const worldCoordinates = spaceCenterPointLookup[drawPiece.rank - 1][drawPiece.file - 1].clone();
				drawPiece.graphicsObject.position.copy(worldCoordinates);
				drawPiece.graphicsObject.updateMatrixWorld();
			});
		});
	}
}
