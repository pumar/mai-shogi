
interface IEventQueueListener {
	newEventNotification: (event: EventWrapper) => void;
}

enum EventType {
	Mouse,
	Keyboard,
}

type EventWrapper = {
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

	public registerCallbacks(root: Window) {
		const pushMouseEvent = (mouseEvent: MouseEvent) => this.events.push({
			type: EventType.Mouse,
			event: mouseEvent
		});

		root.addEventListener("mousedown", pushMouseEvent);

		root.addEventListener("mouseup", pushMouseEvent);

		root.addEventListener("keydown", (keyboardEvent: KeyboardEvent) => {
			this.events.push({
				type: EventType.Keyboard,
				event: keyboardEvent,
			});
		});
	}
}
