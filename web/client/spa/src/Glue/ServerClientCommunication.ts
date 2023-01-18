import {
	MessageTypes,
	MessageKeys,
    CommunicationStack,
    CommunicationEvent,
	MakeMove,
	GameRunner,
    EventQueue,
} from "mai-shogi-game";
import { PlayerColor } from "mai-shogi-game/Game/Consts";

import { Status } from "../Network/Status";

import { addEventHandler, getWebsocketConnection, WebsocketEvent } from "../Network/WebsocketConnection";

export {
	notifyGameFromServer,
	connectToGame,
	sendMove,
	getGameCode,
}

function notifyGameFromServer(message: Record<string, any>, game: GameRunner) {
	game.receiveMessage(message);
}

enum HeaderKeys {
	PLAYER_ONE_CODE = "PLAYER_ONE_CODE",
	PLAYER_TWO_CODE = "PLAYER_TWO_CODE"
}

type GameConnectParameters = {
	vsComputer?: {
		side: PlayerColor;
	};
	vsPlayer?: {
		side: PlayerColor;
		playerCode: string;
	};
}

function getGameConnectUrl(connectParams: GameConnectParameters): string {
	if (connectParams.vsComputer !== undefined) {
		const senteArg = connectParams.vsComputer.side === PlayerColor.Black ? 'sente' : 'gote';
		return `game/computer/${senteArg}`;
	} else if (connectParams.vsPlayer !== undefined) {
		//we need the game code to know what game to join
		//and the player code is a secret that the server will use to identify
		//the client as being either the sente or gote player
		return `game/versus/${connectParams.vsPlayer.playerCode}`;
	} else {
		console.error('getGameConnectUrl, invalid connection parameters');
		return '';
	}
}

type PendingGameConnection = {
	getWebsocketConn: () => {
		conn: WebSocket;
		/** removes the mouse and keyboard callbacks that were registered
		* to the window object
		**/
		removeCallbacks: () => void;
	},
	game: GameRunner,
	communicationStack: CommunicationStack,
}

async function getGameCode(): Promise<{playerOneCode: string; playerTwoCode: string} | undefined> {
	return await fetch(
		`game/create`
	).then(response => {
		console.log({ response, headers: response.headers });
		if (response.status === Status.HTTP_OK) {
			//Connect to server websocket using game code
			//receive a message from the server that says that you are waiting
			//get an event when the other person conects that begins the game
			//const url = getGameConnectUrl(false);
			const playerOneCode = response.headers.get(HeaderKeys.PLAYER_ONE_CODE);
			if (playerOneCode === undefined) {
				console.error(`getGameCode, player one code undefined, header key:${HeaderKeys.PLAYER_ONE_CODE}`)
				return undefined;
			}
			const playerTwoCode = response.headers.get(HeaderKeys.PLAYER_TWO_CODE);
			if (playerTwoCode === undefined) {
				console.error(`getGameCode, player one code undefined, header key:${HeaderKeys.PLAYER_TWO_CODE}`)
				return undefined;
			}
			return {
				playerOneCode,
				playerTwoCode,
			}

		} else {
			//reset the entered game code, it was invalid
			//ask the user to pick a different code
			return undefined;
		}
	});
}

function connectToGame(
	vsComputer: boolean,
	eventQueue: EventQueue,
	isGameRegisteredToEventQueue: boolean,
	isSente?: boolean,
	myConnectCode?: string,
): PendingGameConnection {
	//console.log(`connect to game:${gameCode}`);
	console.log(`connect to game`);
	const getWebsocketConn = () => {
		let connectParams: GameConnectParameters;
		const side = isSente ? PlayerColor.Black : PlayerColor.White;
		if (vsComputer) {
			connectParams = {
				vsComputer: { side }
			}
		} else {
			if (myConnectCode === undefined || myConnectCode === "") {
				console.error(`ServerClientCommunication, connect code was undefined or empty`);
				return;
			} else {
				connectParams = {
					vsPlayer: {
						side,
						playerCode: myConnectCode
					},
				}
			}
		}

		const url = getGameConnectUrl(connectParams);
		const conn = getWebsocketConnection(url);

		addEventHandler(conn, WebsocketEvent.Message, (message) => {
			if(message === undefined){
				console.error('error in ws message handler, message undefined')
				return;
			}

			if (!isGameRegisteredToEventQueue) {
				eventQueue.addListener(game);
				isGameRegisteredToEventQueue = true;
			}

			console.log('recieved message from server', message);
			//messagesFromServer = [JSON.parse(message.data).message];
			const parsedMessage = JSON.parse(message.data);
			console.log('parsed message', parsedMessage);
			notifyGameFromServer(parsedMessage, game);
		});

		const removeCallbacks = eventQueue.registerCallbacks(window);

		return {
			conn,
			removeCallbacks,
		}
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
	console.log('ServerClientCommunication::sendMove, sending move event:', commEvent);
	wsConnection.send(JSON.stringify({
		messageType: MessageTypes.MAKE_MOVE,
		[MessageKeys.MOVE]: moveText,
	}));
}
