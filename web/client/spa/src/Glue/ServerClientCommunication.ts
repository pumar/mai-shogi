import {
	MessageTypes,
	MessageKeys,
    CommunicationStack,
    CommunicationEvent,
	MakeMove,
	GameRunner,
} from "mai-shogi-game";

import { Status } from "../Network/Status";

import { addEventHandler, getWebsocketConnection, WebsocketEvent } from "../Network/WebsocketConnection";

export {
	notifyGameFromServer,
	connectToGame,
	sendMove,
}

function notifyGameFromServer(message: Record<string, any>, game: GameRunner) {
	game.receiveMessage(message);
}

type GameConnectParameters = {
	vsComputer: boolean;
	isSente?: boolean;
	connectionDetails?: {
		gameCode: string;
		playerCode: string;
	};
}
function getGameConnectUrl(vsComputer: boolean, isSente?: boolean): string {
	if (vsComputer) {
		const senteArg = isSente ? 'sente' : 'gote';
		return `game/computer/${senteArg}`;
	} else {
		//we need the game code to know what game to join
		//and the player code is a secret that the server will use to identify
		//the client as being either the sente or gote player
		return `game/join/${gameCode}/${playerCode}
	}
}

type PendingGameConnection = {
	getWebsocketConn: () => WebSocket,
	game: GameRunner,
	communicationStack: CommunicationStack,
}

async function createGameFromCode(code: string): Promise<> {
	return await fetch(
		`game/create/${code}`
	).then(response => {
		if (response.status === Status.HTTP_OK) {
			//Connect to server websocket using game code
			//receive a message from the server that says that you are waiting
			//get an event when the other person conects that begins the game
			const url = getGameConnectUrl();
		} else {
			//reset the entered game code, it was invalid
			//ask the user to pick a different code
		}
	});

}

function connectToGame(vsComputer: boolean, isSente?: boolean): PendingGameConnection {
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
