export {
	getWebsocketConnection,
}

function getWebsocketConnection(urlSuffix: string, onError: (e: Error) => void): WebSocket {
	const ws = new WebSocket([
			'ws:/',
			window.location.host,
			'game',
			urlSuffix
		].join('/')
	);
	ws.addEventListener("error", onError);
	return ws;
}
