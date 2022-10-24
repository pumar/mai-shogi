export {
	MessageTypes,
	MessageKeys
}

enum MessageTypes {
	GAME_STATE_UPDATE = "gsu",
	MAKE_MOVE = "mm",
	ERROR = "err",
	YOU_LOSE = "yl",
	YOU_WIN = "yw"
}

enum MessageKeys {
	MESSAGE_TYPE = "messageType",
	MATCH = "match",
	MOVES = "moves",
	MOVE = "move",
	ERROR_MESSAGE = "err_msg",
}
