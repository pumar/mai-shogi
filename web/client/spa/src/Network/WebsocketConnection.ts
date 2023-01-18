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

function getWebsocketConnection(urlSuffix: string): WebSocket {
	const connectionString = [
		//use wss (secure version), elsewise browers will reject
		//the connection in prod
		location.hostname === "localhost" ? 'ws:/' : 'wss:/',
		//'ws:/',
		window.location.host,
		'ws',
		urlSuffix
	].join('/');
	console.log(`attempt connection with string:${connectionString}`);

	const ws = new WebSocket(connectionString);
	return ws;
}

function addEventHandler(
	websocket: WebSocket, 
	eventType: WebsocketEvent, 
	callback: (message?: any) => void
): void {
	websocket.addEventListener(eventType, callback);
}
