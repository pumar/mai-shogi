from enum import Enum

class MessageKeys(str, Enum):
    MESSAGE_TYPE = "messageType"
    CLIENT_PLAYER_SIDE = "c_p_side"
    MATCH = "match"
    MOVES = "moves"
    MOVE = "move"
    ERROR_MESSAGE = "err_msg"
