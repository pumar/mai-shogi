export {
	MessageTypes,
	MessageKeys
}

enum MessageTypes {
	GAME_STATE_UPDATE = "gsu",
	MAKE_MOVE = "mm",
	ERROR = "err",
	YOU_LOSE = "yl",
	YOU_WIN = "yw",
	GAME_STARTED = "gs"
}

enum MessageKeys {
	MESSAGE_TYPE = "messageType",
    CLIENT_PLAYER_SIDE = "c_p_side",
	MATCH = "match",
	MOVES = "moves",
	MOVE = "move",
	ERROR_MESSAGE = "err_msg",
}
