from enum import Enum

# need to inherit from str to get JSON serialization to work:
# https://stackoverflow.com/questions/24481852/serialising-an-enum-member-to-json
class MessageTypes(str, Enum):
    GAME_STATE_UPDATE = "gsu"
    MAKE_MOVE = "mm"
    ERROR = "err"
    YOU_LOSE = "yl"
    YOU_WIN = "yw"
