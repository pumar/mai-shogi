
export interface IEventQueueListener {
	newEventNotification: (event: EventWrapper) => void;
}

export enum EventType {
	Mouse,
	Keyboard,
}

export type EventWrapper = {
	type: EventType;
	event: Event;
}

export class EventQueue {
	private listeners: Set<IEventQueueListener> = new Set();
	public addListener(newListener: IEventQueueListener) {
		this.listeners.add(newListener);
	}
	public removeListener(remove: IEventQueueListener) {
		this.listeners.delete(remove);
	}

	private events: EventWrapper[] = [];

	private pushMouseEvent?: (incomingEvent: MouseEvent | KeyboardEvent) => void;
	private pushKeyboardEvent?: (incomingEvent: MouseEvent | KeyboardEvent) => void;

	private mkPushEvent(eventType: EventType): (event: MouseEvent | KeyboardEvent) => void {
		return (incomingEvent: MouseEvent | KeyboardEvent) => {
			this.events.push({
				type: eventType,
				event: incomingEvent,
			});

			this.broadcast();
		}
	}

	private broadcast(): void {
		const events = this.events;
		this.listeners.forEach(lis => lis.newEventNotification(events[events.length - 1]));
	}

	public registerCallbacks(root: Window) {
		//const pushMouseEvent = (mouseEvent: MouseEvent) => this.events.push({
		//	type: EventType.Mouse,
		//	event: mouseEvent
		//});
		let pushMouseEvent: (incomingEvent: MouseEvent | KeyboardEvent) => void;
		if (this.pushMouseEvent === undefined) {
			pushMouseEvent = this.mkPushEvent(EventType.Mouse);
			this.pushMouseEvent = pushMouseEvent;
		} else {
			pushMouseEvent = this.pushMouseEvent;
		}

		let pushKeyboardEvent: (incomingEvent: MouseEvent | KeyboardEvent) => void;
		if (this.pushKeyboardEvent === undefined) {
			pushKeyboardEvent = this.mkPushEvent(EventType.Keyboard);
		} else {
			pushKeyboardEvent = this.pushKeyboardEvent;
		}

		root.addEventListener("mousedown", pushMouseEvent);
		root.addEventListener("mouseup", pushMouseEvent);
		root.addEventListener("keydown", pushKeyboardEvent);

		const removeCallbacks = () => {
			root.removeEventListener("mousedown", pushMouseEvent);
			root.removeEventListener("mouseup", pushMouseEvent);
			root.removeEventListener("keydown", pushKeyboardEvent);
		}
		return removeCallbacks;
	}
}
