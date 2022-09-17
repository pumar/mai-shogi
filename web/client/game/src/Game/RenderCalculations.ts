import { Vector3 } from "three";
import { buildForRange } from "../utils/Range";
import { RenderSettings } from "./Renderer/Renderer";
import { Game } from "./types/Game";
import { PieceNames } from "./types/Piece";

export {
	calcRenderCoordinates,
	calcSpaceCoordinates,
	getBoardTopRightCorner,
	CalcedRenderCoords,
	zIndexes,
	HeldPiecesStand,
	getSpaceStartPoint,
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
	blackHeldPiecesLocations: Map<PieceNames, Vector3>,
	whiteHeldPiecesLocations: Map<PieceNames, Vector3>,
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

type HeldPiecesStand = {
	basePoint: Vector3;
	width: number;
	height: number;
}


/**
* TODO draw the move clock
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

	const blackHeldPiecesLocations: Map<PieceNames, Vector3> = getLocationsForHeldPieces(
		boardSpaceWidth,
		boardSpaceHeight,
		gameState.viewPoint === "black",
		blackPiecesStandBasePoint,
	);

	const whiteHeldPiecesLocations = getLocationsForHeldPieces(
		boardSpaceWidth,
		boardSpaceHeight,
		gameState.viewPoint === "white",
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
): Map<PieceNames, Vector3> {
	const pieceZ = zIndexes.pieces;
	const halfSpaceHeight = boardSpaceHeight * 0.5;
	const halfSpaceWidth = boardSpaceWidth * 0.5;

	const upperRowYOffset = isMainViewPoint ? halfSpaceHeight : -halfSpaceHeight;
	const upperRowY = standCenterPoint.y + upperRowYOffset;

	const lowerRowYOffset = -upperRowYOffset;
	const lowerRowY = standCenterPoint.y + lowerRowYOffset;

	//TODO ugly, find a cleaner way to adjust the x offsets based off of the viewpoint
	const map = new Map<PieceNames, Vector3>();
	map.set(PieceNames.Pawn, new Vector3(standCenterPoint.x + (isMainViewPoint ? -1 : 1) * 1.5 * boardSpaceWidth, upperRowY, pieceZ));
	map.set(PieceNames.Lance, new Vector3(standCenterPoint.x + (isMainViewPoint ? -1 : 1) * halfSpaceWidth, upperRowY, pieceZ));
	map.set(PieceNames.Knight, new Vector3(standCenterPoint.x + (isMainViewPoint ? 1 : -1) * halfSpaceWidth, upperRowY, pieceZ));
	map.set(PieceNames.Silver, new Vector3(standCenterPoint.x + (isMainViewPoint ? 1 : -1) * 1.5 * boardSpaceWidth, upperRowY, pieceZ));
	map.set(PieceNames.Gold, new Vector3(standCenterPoint.x + (isMainViewPoint ? -1 : 1) * 1.5 * boardSpaceWidth, lowerRowY, pieceZ));
	map.set(PieceNames.Bishop, new Vector3(standCenterPoint.x + (isMainViewPoint ? -1 : 1) * halfSpaceWidth, lowerRowY, pieceZ));
	map.set(PieceNames.Rook, new Vector3(standCenterPoint.x + (isMainViewPoint ? 1 : -1) * halfSpaceWidth, lowerRowY, pieceZ));

	return map;
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
		whitePiecesStandBasePoint: game.viewPoint === "white" ? bottomRightStand : topLeftStand,
		blackPiecesStandBasePoint: game.viewPoint === "black" ? bottomRightStand : topLeftStand,
	}
}

function calcSpaceCoordinates(
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
