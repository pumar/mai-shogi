import { PlayerColor } from "../Consts";
import { Game } from "../types/Game";
import { HeldPiece, PlacedPiece } from "../types/Piece";

type ClickedSpace = {
	rank: number;
	file: number;
}

type ClickedPiece = {
	piece: HeldPiece | PlacedPiece;
	pieceOwner: PlayerColor;
}

function isClickedPieceEvent(e: InteractionEvent) {
	return (e.clickedEntity as ClickedPiece).piece !== undefined;
}
function isClickedSpaceEvent(e: InteractionEvent) {
	return (e.clickedEntity as ClickedSpace).rank !== undefined;
}
type InteractionEvent = {
	clickedEntity: ClickedPiece | ClickedSpace;
}

/**
* updates game's input-related state in response to pieces being clicked
**/
export class GameInteractionController {
	private className = "GameInteractionController";
	private selectedPiece?: HeldPiece | PlacedPiece;

	public handleClick(event: InteractionEvent, currentGameState: Game): Game {
		if(isClickedSpaceEvent(event)) {
			if(this.selectedPiece !== undefined) {
				return this.movePiece(event, currentGameState);
			}
		} else if(isClickedPieceEvent(event)) {
			if(this.selectedPiece === undefined) {
				return this.selectPiece(event, currentGameState);
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
			this.selectedPiece = clickedPiece.piece;
		} else {
			console.log(`${this.className}::selectPiece cannot select piece as it is not the player's`);
		}

		return currentGameState;
	}

	private movePiece(event: InteractionEvent, currentGameState: Game): Game {
		const newGameState = structuredClone(currentGameState);
		console.log("TODO movePiece", { event, currentGameState });
		return newGameState;
	}
}
