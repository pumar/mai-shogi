import { setupGameWithDefaults } from "mai-shogi-game";
import { GameRunner, SvgLoadConfig } from "mai-shogi-game/Game/GameRunner";

import { addEventHandler, getWebsocketConnection, WebsocketEvent } from "../Network/WebsocketConnection";

export {
	notifyGameFromServer,
	postMessageToGame,
	connectToGame,
}

function notifyGameFromServer(message: Record<string, any>, game: Game) {
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
	websocketConn: WebSocket,
	game: GameRunner,
} {
	//console.log(`connect to game:${gameCode}`);
	console.log(`connect to game`);
	const websocketConn = getWebsocketConnection(
		[
			'game',
			//gameCode
		].join('/')
	);

	const game = new GameRunner();

	////gameCode = "";
	addEventHandler(websocketConn, WebsocketEvent.Message, (message) => {
		if(message === undefined){
			console.error('error in ws message handler, message undefined')
			return;
		}

		console.log('recieved message from server', message);
		//messagesFromServer = [JSON.parse(message.data).message];
		const parsedMessage = JSON.parse(message.data).message;
		notifyGameFromServer(parsedMessage, game);
	});

	return {
		websocketConn,
		game
	}
}
