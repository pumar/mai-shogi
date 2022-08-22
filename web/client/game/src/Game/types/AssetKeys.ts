import { isPromotable, Piece } from "./Piece"

export {
	getAssetKeyForPiece,
}

/**
* get a key that can be used to lookup the geometries or materials that
* correspond to a piece
**/
function getAssetKeyForPiece(piece: Piece): string {
	let promotableKeySection = undefined;
	if(isPromotable(piece)) {
		promotableKeySection = "+";
	}
	return [
		piece.name,
		promotableKeySection,
	].join();
}
