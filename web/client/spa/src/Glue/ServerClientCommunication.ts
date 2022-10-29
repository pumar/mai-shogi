import {
	MessageTypes,
	MessageKeys,
    CommunicationStack,
    CommunicationEvent,
	MakeMove,
	GameRunner,
} from "mai-shogi-game";

import { addEventHandler, getWebsocketConnection, WebsocketEvent } from "../Network/WebsocketConnection";

export {
	notifyGameFromServer,
	connectToGame,
	sendMove,
}

function notifyGameFromServer(message: Record<string, any>, game: GameRunner) {
	game.receiveMessage(message);
}

function getGameConnectUrl(vsComputer: boolean, isSente?: boolean): string {
	if (vsComputer) {
		const senteArg = isSente ? 'sente' : 'gote';
		return `game/computer/${senteArg}`;
	} else {
		return `game/TODO`
	}
}

function connectToGame(vsComputer: boolean, isSente?: boolean): {
	getWebsocketConn: () => WebSocket,
	game: GameRunner,
	communicationStack: CommunicationStack,
} {
	//console.log(`connect to game:${gameCode}`);
	console.log(`connect to game`);
	const getWebsocketConn = () => {
		const url = getGameConnectUrl(vsComputer, isSente);
		const conn = getWebsocketConnection(url);

		addEventHandler(conn, WebsocketEvent.Message, (message) => {
			if(message === undefined){
				console.error('error in ws message handler, message undefined')
				return;
			}


			console.log('recieved message from server', message);
			//messagesFromServer = [JSON.parse(message.data).message];
			const parsedMessage = JSON.parse(message.data);
			console.log('parsed message', parsedMessage);
			notifyGameFromServer(parsedMessage, game);
		});

		//game.setPostMoveCallback((move: string) => {
		//	conn.send(JSON.stringify({
		//		messageType: MessageTypes.MAKE_MOVE,
		//		[MessageKeys.MOVE]: move,
		//	}));
		//});

		return conn;
	}

	const game = new GameRunner();
	const communicationStack: CommunicationStack = game.prepareCommunicationStack();

	return {
		getWebsocketConn,
		game,
		communicationStack,
	}
}

function sendMove(wsConnection: WebSocket, commEvent: CommunicationEvent): void {
	const moveText = (commEvent.eventInfo as MakeMove).moveString;
	wsConnection.send(JSON.stringify({
		messageType: MessageTypes.MAKE_MOVE,
		[MessageKeys.MOVE]: moveText,
	}));
}
