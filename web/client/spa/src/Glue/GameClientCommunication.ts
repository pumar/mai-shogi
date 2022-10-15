import {
	CommunicationEvent,
	PromptSelectMove
} from "mai-shogi-game";

export {
	promptSelectMove
}

function promptSelectMove(
	commEvent: CommunicationEvent,
): any[] {
	const moves = (commEvent.eventInfo as PromptSelectMove).moveOptions;
	return moves;
}
