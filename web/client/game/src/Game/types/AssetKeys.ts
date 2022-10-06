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
	//TODO the lance piece's filenames do not match up with this,
	//others may as well
	if(isPromotable(piece)) {
		promotableKeySection = piece.isPromoted ? "+" : "";
	}
	return [
		piece.name,
		promotableKeySection,
	].join('');
}
