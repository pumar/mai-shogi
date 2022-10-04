import { BoardLocation, /*PlacedPiece*/ } from "./Piece"

export {
	Move
}

type Move = {
	start: BoardLocation,
	end: BoardLocation,
}
