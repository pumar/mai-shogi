import { PlayerColor } from "../Consts";
import { findPlayer, Game } from "../types/Game";
import { Move } from "../types/Move";
import { arePiecesEqual, HeldPiece, isHeldPiece, PlacedPiece, PlayerHeldPiece, PlayerPlacedPiece } from "../types/Piece";

type ClickedSpace = {
	rank: number;
	file: number;
}

type ClickedPiece = {
	piece: HeldPiece | PlacedPiece;
	pieceOwner: PlayerColor;
}

function isClickedPiece(e: ClickedPiece | ClickedSpace): e is ClickedPiece {
	return (e as ClickedPiece).piece !== undefined && (e as ClickedPiece).pieceOwner !== undefined;
}
function isClickedSpace(e: ClickedPiece | ClickedSpace): e is ClickedSpace {
	return (e as ClickedSpace).rank !== undefined;
}
type InteractionEvent = {
	clickedEntity: ClickedPiece | ClickedSpace;
}

/**
* updates game's input-related state in response to pieces being clicked
**/
export class GameInteractionController {
	private className = "GameInteractionController";
	private selectedPiece?: PlayerHeldPiece | PlacedPiece;
	public setSelectedPiece(newSelected: PlayerHeldPiece | PlacedPiece): void {
		this.selectedPiece = newSelected;
	}

	public handleClick(event: InteractionEvent, currentGameState: Game): Move[] | PlayerHeldPiece | PlacedPiece | undefined {
		if(
			isClickedPiece(event.clickedEntity)
			 && this.selectedPiece === undefined
		  ) {
			return this.selectPiece(event, currentGameState);
		}

		if(isClickedSpace(event.clickedEntity)) {
			return this.movePiece(event.clickedEntity, currentGameState);
		} else if(isClickedPiece(event.clickedEntity)) {
			const clickedPiece = event.clickedEntity as ClickedPiece;
			//if it is a held piece, we also need to know which player
			//is holding that piece to check for their equality, so we convert
			//a HeldPiece to a PlayerHeldPiece
			const comparePiece: PlayerHeldPiece | PlacedPiece = isHeldPiece(clickedPiece.piece)
				? { ...clickedPiece.piece, player: clickedPiece.pieceOwner }
				: clickedPiece.piece;
					
			if(this.selectedPiece !== undefined && arePiecesEqual(this.selectedPiece, comparePiece)) {
				console.log("pieces were the same, so de-selecting", {
					selected: this.selectedPiece,
					clickedPiece: comparePiece
				});
				this.resetSelectedPiece();
				return undefined;
			}

			if (!isHeldPiece(event.clickedEntity.piece)) {
				return this.movePiece({
					rank: event.clickedEntity.piece.rank,
					file: event.clickedEntity.piece.file,
				},
				currentGameState);
			}
		} else {
			console.info(`${this.className} ignoring event:`, event);
		}

		return undefined;
	}

	private selectPiece(event: InteractionEvent, currentGameState: Game): PlayerHeldPiece | PlacedPiece | undefined {
		const clickedPiece = event.clickedEntity as ClickedPiece;
		if(currentGameState.viewPoint === clickedPiece.pieceOwner) {
			console.log(`${this.className}::selectPiece clicked piece`, clickedPiece);
			return isHeldPiece(clickedPiece.piece)
				? { ...clickedPiece.piece, player: clickedPiece.pieceOwner }
				: clickedPiece.piece;
		} else {
			console.log([
				`${this.className}::selectPiece cannot select piece as it is not the player's`,
				`gameViewPoint:${currentGameState.viewPoint} pieceOwner:${clickedPiece.pieceOwner}`,
			].join(' '));
			return undefined;
		}
	}

	private movePiece(clickedEntity: ClickedSpace, currentGameState: Game): Move[] {
		if(this.selectedPiece === undefined) throw new Error(`${this.className}::movePiece selectedPiece was undefined`);

		const { rank: destRank, file: destFile } = clickedEntity;

		const humanPlayerMoves = findPlayer(currentGameState, currentGameState.nextMovePlayer).moves;

		const movesForSelectedPiece = isHeldPiece(this.selectedPiece)
			? this.getMovesForHeldPiece(humanPlayerMoves, this.selectedPiece)
			: this.getMovesForPlacedPiece(humanPlayerMoves, this.selectedPiece);

		if(movesForSelectedPiece.length === 0){
			//TODO don't allow selection of a piece with no legal moves
			console.warn([
				`movePiece, no legal move found for`,
				isHeldPiece(this.selectedPiece) ? `held piece:${this.selectedPiece.name}` : `start space:(${this.selectedPiece.rank}, ${this.selectedPiece.file})`,
			].join(' '));
			return [];
		}

		let selectedPossibleMoves: Move[];
		if (isHeldPiece(this.selectedPiece)) {
			//need to ensure that the move does not have a starting square
			//elsewise we'll accidentally find some other piece's move that happens to have
			//the same destination square
			const heldPieceMove = movesForSelectedPiece.find(move =>
				move.start === undefined &&
				move.end.rank === destRank && move.end.file === destFile
			);
			if (heldPieceMove === undefined) throw new Error(`couldn't find held piece move for dest:(${destRank}, ${destFile})`);
			selectedPossibleMoves = [heldPieceMove];
		} else {
			const { file: startFile, rank: startRank } = this.selectedPiece;
			selectedPossibleMoves = movesForSelectedPiece.filter(move =>
				move.start !== undefined
				&& move.end.rank === destRank && move.end.file === destFile
				&& move.start.rank === startRank && move.start.file === startFile
			);
		}

		if (selectedPossibleMoves.length === 0){
			console.warn(`movePiece, target space:(${destRank}, ${destFile}) is not legal, you should select from these moves:`, movesForSelectedPiece );
			return [];
		}

		this.resetSelectedPiece();

		return selectedPossibleMoves;
	}

	public resetSelectedPiece(): void {
		this.selectedPiece = undefined;
	}

	public resetState(): void {
		this.resetSelectedPiece();
	}

	private getMovesForHeldPiece(playerMoves: Move[], heldPiece: HeldPiece): Move[] {
		const pieceName = heldPiece.name;
		const moves = playerMoves.filter(move => move.heldPieceName === pieceName);
		console.error('getMovesForHeldPiece', { heldPiece, moves });
		return moves;
	}

	private getMovesForPlacedPiece(playerMoves: Move[], placedPiece: PlacedPiece): Move[] {
		return playerMoves.filter(move =>
			move.start !== undefined
			&& move.start.rank === placedPiece.rank
			&& move.start.file === placedPiece.file);
	}
}
