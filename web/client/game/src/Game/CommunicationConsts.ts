export {
	MessageTypes,
	MessageKeys
}

enum MessageTypes {
	GAME_STATE_UPDATE = "gsu",
	MAKE_MOVE = "mm",
}

enum MessageKeys {
	MESSAGE_TYPE = "messageType",
	MATCH = "match",
	MOVES = "moves",
}
