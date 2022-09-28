import { PlayerColor } from "../Consts";
import { findPlacedPieceAndPlayer, findPlayer, Game } from "../types/Game";
import { arePiecesEqual, HeldPiece, isHeldPiece, PlacedPiece, PlayerHeldPiece } from "../types/Piece";
import { removePlacedPiece } from "../types/Player";

type ClickedSpace = {
	rank: number;
	file: number;
}

type ClickedPiece = {
	piece: HeldPiece | PlacedPiece;
	pieceOwner: PlayerColor;
}

function isClickedPiece(e: ClickedPiece | ClickedSpace): e is ClickedPiece {
	return (e as ClickedPiece).piece !== undefined;
}
function isClickedSpace(e: ClickedPiece | ClickedSpace): e is ClickedSpace {
	return (e as ClickedSpace).rank !== undefined;
}
type InteractionEvent = {
	clickedEntity: ClickedPiece | ClickedSpace;
}

/**
* updates game's input-related state in response to pieces being clicked
* TODO this is moving the pieces locally without confirming the validity of the move with the server
* this can be simplified down to just telling the server what piece or space was clicked,
* and then waiting for the server to send the new game state
**/
export class GameInteractionController {
	private className = "GameInteractionController";
	private selectedPiece?: PlayerHeldPiece | PlacedPiece;

	public handleClick(event: InteractionEvent, currentGameState: Game): Game {
		if(isClickedSpace(event.clickedEntity)) {
			if(this.selectedPiece !== undefined) {
				return this.movePiece(event.clickedEntity, currentGameState);
			} else {
				return this.selectPiece(event, currentGameState);
			}
		} else if(isClickedPiece(event.clickedEntity)) {
			const clickedPiece = event.clickedEntity as ClickedPiece;
			if(this.selectedPiece === undefined) {
				return this.selectPiece(event, currentGameState);
			} else {
				//if it is a held piece, we also need to know which player
				//is holding that piece to check for their equality, so we convert
				//a HeldPiece to a PlayerHeldPiece
				const comparePiece: PlayerHeldPiece | PlacedPiece = isHeldPiece(clickedPiece.piece)
					? { ...clickedPiece.piece, player: clickedPiece.pieceOwner }
					: clickedPiece.piece;
						
				if(arePiecesEqual(this.selectedPiece, comparePiece)) {
					console.log("pieces were the same, so de-selecting", {
						selected: this.selectedPiece,
						clickedPiece: comparePiece
					});
					this.selectedPiece = undefined;
				}
			}
		} else {
			console.info(`${this.className} ignoring event:`, event);
		}

		return currentGameState;
	}

	private selectPiece(event: InteractionEvent, currentGameState: Game): Game {
		const clickedPiece = event.clickedEntity as ClickedPiece;
		if(currentGameState.viewPoint === clickedPiece.pieceOwner) {
			console.log(`${this.className}::selectPiece clicked piece`, clickedPiece);
			this.selectedPiece = isHeldPiece(clickedPiece.piece)
				? { ...clickedPiece.piece, player: clickedPiece.pieceOwner }
				: clickedPiece.piece;
		} else {
			console.log(`${this.className}::selectPiece cannot select piece as it is not the player's`);
		}

		return currentGameState;
	}

	private movePiece(clickedEntity: ClickedSpace, currentGameState: Game): Game {
		if(this.selectedPiece === undefined) throw new Error(`${this.className}::movePiece selectedPiece was undefined`);
		//TODO be careful not to accidentally modify the current game state,
		//you should modify the new one. Ideally, I will refactor this to work
		//in an immutable fashion
		const newGameState = structuredClone(currentGameState);
		const pieceName = this.selectedPiece.name;

		if(isHeldPiece(this.selectedPiece)){
			const playerColor = this.selectedPiece.player;
			const player = findPlayer(newGameState, playerColor);
			//the piece was placed on the board, so decrement the counter for that kind
			//of held piece, for that player
			const heldPiece = player.heldPieces.find(heldPiece => heldPiece.name === pieceName);
			if(heldPiece === undefined) throw new Error(`${this.className}::movePiece , couldn't find held piece:${pieceName} for player:${playerColor} to decrement`);
			heldPiece.count -= 1;

			//create a placed piece for the player
			player.placedPieces.push({
				rank: clickedEntity.rank,
				file: clickedEntity.file,
				name: pieceName
			});
		} else {
			const selectedPiecePlayer = findPlacedPieceAndPlayer(
				newGameState,
				this.selectedPiece.rank,
				this.selectedPiece.file,
			);
			if(selectedPiecePlayer === undefined) throw new Error(`${this.className}::movePiece could not find the current selected piece in the game state`);
			const targetPiecePlayer = findPlacedPieceAndPlayer(
				newGameState,
				clickedEntity.rank,
				clickedEntity.file,
			);

			//delete the piece in the target space
			if(targetPiecePlayer !== undefined) {
				removePlacedPiece(
					findPlayer(newGameState, targetPiecePlayer.player),
					targetPiecePlayer.piece
				);
			}

			//move the placed piece to the target destination
			selectedPiecePlayer.piece.rank = clickedEntity.rank;
			selectedPiecePlayer.piece.file = clickedEntity.file;
		}

		//reset the piece selection state, action is finished
		this.selectedPiece = undefined;
		return newGameState;
	}
}
