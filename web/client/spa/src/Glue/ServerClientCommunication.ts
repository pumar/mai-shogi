import {
	setupGameWithDefaults,
	MessageTypes,
	MessageKeys,
} from "mai-shogi-game";
import { GameRunner, SvgLoadConfig } from "mai-shogi-game/Game/GameRunner";

import { addEventHandler, getWebsocketConnection, WebsocketEvent } from "../Network/WebsocketConnection";

export {
	notifyGameFromServer,
	postMessageToGame,
	connectToGame,
}

function notifyGameFromServer(message: Record<string, any>, game: GameRunner) {
	game.receiveMessage(message);
}

function initializeGameFromMessage(
	canvas: HTMLCanvasElement,
	svgLoadSettings?: SvgLoadConfig,
	fontLoadingDir?: string,
): GameRunner {
	const { game, eventQueue } = setupGameWithDefaults(
		canvas,
		svgLoadSettings,
		fontLoadingDir,
	);

	return {
		game
	}
}

function postMessageToGame(
	message: Record<string, any>,
	game: GameRunner,
): void {
}

function connectToGame(): {
	getWebsocketConn: () => WebSocket,
	game: GameRunner,
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

	return {
		getWebsocketConn,
		game
	}
}
