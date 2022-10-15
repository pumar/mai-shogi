import {
	setupGameWithDefaults,
	MessageTypes,
	MessageKeys,
    CommunicationStack,
} from "mai-shogi-game";
import { GameRunner } from "mai-shogi-game/Game/GameRunner";

import { addEventHandler, getWebsocketConnection, WebsocketEvent } from "../Network/WebsocketConnection";

export {
	notifyGameFromServer,
	connectToGame,
}

function notifyGameFromServer(message: Record<string, any>, game: GameRunner) {
	game.receiveMessage(message);
}

function connectToGame(): {
	getWebsocketConn: () => WebSocket,
	game: GameRunner,
	communicationStack: CommunicationStack,
} {
	//console.log(`connect to game:${gameCode}`);
	console.log(`connect to game`);
	const getWebsocketConn = () => {
		const conn = getWebsocketConnection(
		[
			'game',
			//gameCode
		].join('/'));

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

		game.setPostMoveCallback((move: string) => {
			conn.send(JSON.stringify({
				messageType: MessageTypes.MAKE_MOVE,
				[MessageKeys.MOVE]: move,
			}));
		});

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
