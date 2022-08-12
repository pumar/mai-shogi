export {
	getWebsocketConnection,
	WebsocketEvent,
	addEventHandler,
}

enum WebsocketEvent {
	Open = "open", 
	Message = "message",
	Close = "close",
}

function getWebsocketConnection(urlSuffix: string, onError: (e: Error) => void): WebSocket {
	const connectionString = [
		'ws:/',
		window.location.host,
		'ws',
		urlSuffix
	].join('/');
	console.log(`attempt connection with string:${connectionString}`);

	const ws = new WebSocket(connectionString);
	ws.addEventListener("error", onError);
	return ws;
}

function addEventHandler(
	websocket: WebSocket, 
	eventType: WebsocketEvent, 
	callback: () => void
): void {
	websocket.addEventListener(eventType, callback);
}
