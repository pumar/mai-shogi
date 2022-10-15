export {
	mkCommunicationStack,
	CommunicationStack,
	CommunicationEventTypes,
	CommunicationEvent,
	NotifyCallback,
	SelectMove,
	EventInfo,
	PromptSelectMove,
	Promote,
}

type NotifyCallback = (notifyEvent: CommunicationEvent) => void;

function mkCommunicationStack(): CommunicationStack {
	let callbackId = 0;
	const eventStack: CommunicationEvent[] = [];

	const notifyCallbacks: (NotifyCallback | undefined)[] = [];

	return {
		pushEvent: (event: CommunicationEvent) => {
			eventStack.push(event);
			(notifyCallbacks.filter(cb => cb !== undefined) as NotifyCallback[]).forEach(cb => cb(event));
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
	eventInfo: EventInfo;
	//senderId: number;
}

enum Promote {
	Do,
	No
};

type MoveId = number;
type SelectMove = {
	moveId: MoveId;
}

type MakeMove = {
	moveString: string;
}

type EventInfo = MakeMove | SelectMove | PromptSelectMove;

type PromptSelectMove = {
	moveOptions: {id: MoveId; promote: Promote;}[];
}

enum CommunicationEventTypes {
	MAKE_MOVE,
	PROMPT_SELECT_MOVE
}
