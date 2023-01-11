export {
	mkCommunicationStack,
	CommunicationStack,
	CommunicationEventTypes,
	CommunicationEvent,
	NotifyCallback,
	SelectMove,
	EventInfo,
	Promote,
	MakeMove,
	PromptSelectMove,
	AnswerPrompt,
}

type NotifyCallback = (notifyEvent: CommunicationEvent, callbackId: number) => void;

function mkCommunicationStack(): CommunicationStack {
	let callbackId = 0;
	const eventStack: CommunicationEvent[] = [];

	const notifyCallbacks: (NotifyCallback | undefined)[] = [];

	return {
		pushEvent: (event: CommunicationEvent) => {
			eventStack.push(event);
			console.debug(`mkCommunicationStack::pushEvent, event was pushed`, { event });
			(notifyCallbacks.filter(cb => cb !== undefined) as NotifyCallback[]).forEach((cb, id: number) => cb(event, id));
		},
		pushNotifyCallback: (newCb: NotifyCallback) => {
			notifyCallbacks.push(newCb);
			const returnCallbackId = callbackId;
			callbackId += 1;
			return returnCallbackId;
		},
		removeNotifyCallback: (callbackId: number) => {
			notifyCallbacks[callbackId] = undefined;
		}
	};
}

type CommunicationStack = {
	pushEvent: (event: CommunicationEvent) => void;
	pushNotifyCallback: (notifyCallback: NotifyCallback) => number;
	removeNotifyCallback: (callbackId: number) => void;
}

/** events that will be posted to a callback, that allows
* the game client to communicate with the web page that is hosting it
* which right now means the svelte single page application
**/
type CommunicationEvent = {
	eventType: CommunicationEventTypes,
	eventInfo?: EventInfo;
	//senderId: number;
}

enum Promote {
	Do,
	No
};

type SelectMove = {
	moveId: number;
}

type MakeMove = {
	moveString: string;
}

type EventInfo = MakeMove | SelectMove | PromptSelectMove | AnswerPrompt;

type Option = {
	id: number;
	displayMessage: string;
}

type MoveOption = Option & {
	promote: Promote;
}

type AnswerPrompt = {
	selectedChoiceId: number;
}

type PromptSelectMove = Option & {
	moveOptions: MoveOption[];
}

enum CommunicationEventTypes {
	MAKE_MOVE = "MAKE_MOVE",
	PROMPT_SELECT_MOVE = "PROMPT_SELECT_MOVE",
	ANSWER_PROMPT = "ANSWER_PROMPT",
	YOU_WIN = "YOU_WIN",
	YOU_LOSE = "YOU_LOSE",
	GAME_STARTED = "GAME_STARTED",
}
