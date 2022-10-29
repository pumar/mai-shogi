import { Box2, Box3, Scene, Vector2, Vector3, Vector4, WebGLRenderer } from "three";
import { buildForRange } from "../utils/Range";
import { PlayerColor } from "./Consts";
import { RenderSettings } from "./Renderer/Renderer";
import { Game } from "./types/Game";
import { PieceNames } from "./types/Piece";
import { Turn } from "./types/Player";

export {
	calcRenderCoordinates,
	calcSpaceCoordinates,
	getBoardTopRightCorner,
	CalcedRenderCoords,
	zIndexes,
	HeldPiecesStand,
	getSpaceStartPoint,
	mouseToWorld,
	spaceCenterPointsToBoxes,
	SpaceBox,
	spaceCenterToBox,
}

/** set z indexes for items to ensure that they are drawn in order
* this is so that the pieces are drawn to be above the board, for example
**/
const zIndexes = {
	board: -1,
	grid: 0,
	timer: 0,
	pieces: 1,
	floating: 2,//above pieces
}

type CalcedRenderCoords = {
	spaceCenterPoints: Vector3[][],
	whiteStandCoords: HeldPiecesStand;
	blackStandCoords: HeldPiecesStand;
	blackHeldPiecesLocations: [PieceNames, Vector3][],
	whiteHeldPiecesLocations: [PieceNames, Vector3][],
	boardWidth: number;
	boardHeight: number;
	/** the start-end pair coordinates that are necessary to draw the grid lines
	* for the board. The order is probably start1, end1, start2, end2...startN, endN
	* but I'm not actually sure. It might be good to rework it so that it's
	* easier to figure which points are which
	**/
	gridCoords: Vector3[];
	/**
	* return the logical size of the game space. If you measure the threejs scene
	* itself, the scaling factors will be represented in this number, which we
	* don't want
	**/
	gameSpaceSize: [number, number];
}

/** holds the position information of where to draw the board that
* holds the pieces that the players have in their hand
**/
type HeldPiecesStand = {
	basePoint: Vector3;
	width: number;
	height: number;
}


/**
* calculate a bunch of positional information about where to draw things
* this logic should be just in game coordinates, nothing to do with screen coordinates
* or, what the coordinates would be as a result of scaling the scene
**/
function calcRenderCoordinates(
	gameState: Game,
	renderSettings: RenderSettings
): CalcedRenderCoords {
	const {files, ranks} = gameState.board;
	const {boardSpaceWidth, boardSpaceHeight} = renderSettings;

	const boardWidth = boardSpaceWidth * files;
	const boardHeight = boardSpaceHeight * ranks;
	const [boardTopRightCornerX, boardTopRightCornerY] = getBoardTopRightCorner(boardWidth, boardHeight);

	const verticalLines = buildForRange(1, gameState.board.files - 1, (index: number) => {
		const xCoord = boardTopRightCornerX - boardSpaceWidth * index 
		return [
			new Vector3(
				xCoord,
				boardTopRightCornerY,
				zIndexes.grid,
			),
			new Vector3(
				xCoord,
				boardTopRightCornerY - boardHeight,
				zIndexes.grid,

			),
		]
	}).flat();

	const horizontalLines = buildForRange(1, gameState.board.ranks - 1, (index: number) => {
		const yCoord = boardTopRightCornerY - boardSpaceHeight * index;
		return [
			new Vector3(
				boardTopRightCornerX,
				yCoord,
				zIndexes.grid,
			),
			new Vector3(
				boardTopRightCornerX - boardWidth,
				yCoord,
				zIndexes.grid,
			),
		]
	}).flat();

	const gridCoords: Vector3[] = [
		...verticalLines,
		...horizontalLines,
	];

	const {spaceStartPointX, spaceStartPointY} = getSpaceStartPoint(
		boardTopRightCornerX,
		boardTopRightCornerY,
		boardSpaceWidth,
		boardSpaceHeight,
	);

	const spaceCenterPoints: Vector3[][] = calcSpaceCoordinates(
		gameState.viewPoint,
		ranks,
		files,
		spaceStartPointX,
		spaceStartPointY,
		boardSpaceWidth,
		boardSpaceHeight
	);

	const standGap: number = 4;

	const { whitePiecesStandBasePoint, blackPiecesStandBasePoint } = getStandCenterPoints(
		gameState,
		boardWidth,
		boardHeight,
		boardSpaceWidth,
		boardSpaceHeight,
		standGap
	);

	const blackHeldPiecesLocations: [PieceNames, Vector3][] = getLocationsForHeldPieces(
		boardSpaceWidth,
		boardSpaceHeight,
		gameState.viewPoint === PlayerColor.Black,
		blackPiecesStandBasePoint,
	);

	const whiteHeldPiecesLocations = getLocationsForHeldPieces(
		boardSpaceWidth,
		boardSpaceHeight,
		gameState.viewPoint === PlayerColor.White,
		whitePiecesStandBasePoint,
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
		},
		blackHeldPiecesLocations,
		whiteHeldPiecesLocations,
		gridCoords,
		gameSpaceSize: [
			boardWidth + standWidth * 2 + standGap * 2 + renderSettings.renderPadding * 2,
			boardHeight + renderSettings.renderPadding * 2
		],
	}
}

/**
* calculates the position from which the loop that calcuales the center position
* of all of the files * ranks = N number of positions on the board
* that loop starts drawing from the top right corner, so this function returns
* the center of space 1x1
**/
function getSpaceStartPoint(
	boardTopRightCornerX: number,
	boardTopRightCornerY: number,
	boardSpaceWidth: number,
	boardSpaceHeight: number
): {spaceStartPointX: number; spaceStartPointY: number;} {
	const spaceStartPointX = boardTopRightCornerX - boardSpaceWidth / 2;
	const spaceStartPointY = boardTopRightCornerY - boardSpaceHeight / 2;
	return {
		spaceStartPointX,
		spaceStartPointY
	}
}

function getBoardTopRightCorner(boardWidth: number, boardHeight: number): [number, number] {
	return [boardWidth, boardHeight].map(num => num / 2) as [number, number];
}

function getLocationsForHeldPieces(
	boardSpaceWidth: number,
	boardSpaceHeight: number,
	isMainViewPoint: boolean,
	standCenterPoint: Vector3
): [PieceNames, Vector3][] {
	const pieceZ = zIndexes.pieces;
	const halfSpaceHeight = boardSpaceHeight * 0.5;
	const halfSpaceWidth = boardSpaceWidth * 0.5;

	const upperRowYOffset = isMainViewPoint ? halfSpaceHeight : -halfSpaceHeight;
	const upperRowY = standCenterPoint.y + upperRowYOffset;

	const lowerRowYOffset = -upperRowYOffset;
	const lowerRowY = standCenterPoint.y + lowerRowYOffset;

	//TODO ugly, find a cleaner way to adjust the x offsets based off of the viewpoint
	const locations: [PieceNames, Vector3][] = [
		[PieceNames.Pawn, new Vector3(standCenterPoint.x + (isMainViewPoint ? -1 : 1) * 1.5 * boardSpaceWidth, upperRowY, pieceZ)],
		[PieceNames.Lance, new Vector3(standCenterPoint.x + (isMainViewPoint ? -1 : 1) * halfSpaceWidth, upperRowY, pieceZ)],
		[PieceNames.Knight, new Vector3(standCenterPoint.x + (isMainViewPoint ? 1 : -1) * halfSpaceWidth, upperRowY, pieceZ)],
		[PieceNames.Silver, new Vector3(standCenterPoint.x + (isMainViewPoint ? 1 : -1) * 1.5 * boardSpaceWidth, upperRowY, pieceZ)],
		[PieceNames.Gold, new Vector3(standCenterPoint.x + (isMainViewPoint ? -1 : 1) * 1.5 * boardSpaceWidth, lowerRowY, pieceZ)],
		[PieceNames.Bishop, new Vector3(standCenterPoint.x + (isMainViewPoint ? -1 : 1) * halfSpaceWidth, lowerRowY, pieceZ)],
		[PieceNames.Rook, new Vector3(standCenterPoint.x + (isMainViewPoint ? 1 : -1) * halfSpaceWidth, lowerRowY, pieceZ)],
	];

	return locations;
}

function getStandCenterPoints(
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
		whitePiecesStandBasePoint: game.viewPoint === PlayerColor.White ? bottomRightStand : topLeftStand,
		blackPiecesStandBasePoint: game.viewPoint === PlayerColor.Black ? bottomRightStand : topLeftStand,
	}
}

function calcSpaceCoordinates(
	viewPoint: Turn,
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

	//if the user for this client is Gote, we need to restructure the file and
	//rank positions array to be from that perspective
	if (viewPoint === PlayerColor.White) {
		console.error('flip indices');
		let doneFlipping = false;
		for(let rankIndex = 0; rankIndex < ranks && !doneFlipping; rankIndex++) {
			for(let fileIndex = 0; fileIndex < files; fileIndex++) {
				const swapRank = ranks - 1 - rankIndex;
				const swapFile = files - 1 - fileIndex;
				//if the loop runs for the whole board, it will spend the last half
				//of those loops undoing what it did in the first half
				if (swapRank === rankIndex && swapFile === fileIndex) {
					doneFlipping = true;
					break;
				}
				const thisPoint = spaceCenterPoints[rankIndex][fileIndex];
				spaceCenterPoints[rankIndex][fileIndex] = spaceCenterPoints[swapRank][swapFile];
				spaceCenterPoints[swapRank][swapFile] = thisPoint;
			}
		}
	}
	console.error(`space 0,0:`, spaceCenterPoints[0][0], ` space 8, 8:`, spaceCenterPoints[8][8]);

	return spaceCenterPoints;
}

/**
* convert screen coordinates into game world coordinates
* mouse click event location information is relative to the
* top-left corner, so we need to convert them to be relative to the
* center, and consider the scene scaling
**/
function mouseToWorld(
	x: number,
	y: number,
	canvas: HTMLCanvasElement,
	scene: Scene,
) {
	const { width: canvasWidth, height: canvasHeight } = canvas;
	const canvasBoundingBox = canvas.getBoundingClientRect();
	const canvasBoundingBoxXOffset = canvasBoundingBox.left;
	const canvasBoundingBoxYOffset = canvasBoundingBox.top;

	//TODO make sure this accounts for scrolling too, https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect
	//when the game is inserted into a webpage, it is highly probable that the
	//canvas's top left hand corner's coordinates are NOT (0, 0), so we need to
	//pull back the mouse click coordinates based on the canvas's offset from
	//the windows top left hand corner
	const canvasAdjustedMouseX = x - canvasBoundingBoxXOffset;
	const canvasAdjustedMouseY = y - canvasBoundingBoxYOffset;

	const scale = scene.scale;

	const cartesianCoords = new Vector2(
		canvasAdjustedMouseX - canvasWidth / 2,
		-1 * (canvasAdjustedMouseY - canvasHeight / 2),
	);

	const scaledCartesian = new Vector2(
		cartesianCoords.x / Math.abs(scale.x),
		cartesianCoords.y / Math.abs(scale.y),
	);

	//console.log([
	//	`mouse coords:(${x}, ${y})`,
	//	`canvas size:(${canvasWidth}, ${canvasHeight})`,
	//	`viewport:(${JSON.stringify(viewport)})`,
	//	`scene scale:${vecToString(scale)}`,
	//	`cartesian coords:${vecToString(cartesianCoords)}`,
	//	`scaled cartesian:${vecToString(scaledCartesian)}`,
	//].join(' '));

	return scaledCartesian;

}

type SpaceBox = {
	box: Box2,
	rank: number,
	file: number,
}

function spaceCenterPointsToBoxes(
	spaceCenterPoints: Vector3[][],
	renderSettings: RenderSettings,
): SpaceBox[] {
	const halfSpaceWidth = renderSettings.boardSpaceWidth / 2;
	const halfSpaceHeight = renderSettings.boardSpaceHeight / 2;
	const spaceBoxes: SpaceBox[] = [];
	spaceCenterPoints.forEach((rank, rankIdx) => {
		rank.forEach((center, fileIdx) => {
			const box = spaceCenterToBox(
				center,
				halfSpaceWidth,
				halfSpaceHeight,
			);

			spaceBoxes.push({
				box,
				rank: rankIdx + 1,
				file: fileIdx + 1
			});
		});
	});

	return spaceBoxes;
}

/**
* from a space (board or held pieces) center location and the
* size of the spaces setting, determine a box2 that represents that
* area
**/
function spaceCenterToBox(
	center: Vector3,
	halfSpaceWidth: number,
	halfSpaceHeight: number,
): Box2 {
	const box = new Box2();
	box.min.x = center.x - halfSpaceWidth;
	box.max.x = center.x + halfSpaceWidth;
	box.min.y = center.y - halfSpaceHeight;
	box.max.y = center.y + halfSpaceHeight;

	return box;
}
