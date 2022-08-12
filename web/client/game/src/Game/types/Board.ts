export {
	Board,
}

type Board = {
	ranks: number;
	files: number;
	placedPieces: [PlacedPiece];
	heldPieces: {
		player1: [Piece],
		player2: [Piece],
	};
}
