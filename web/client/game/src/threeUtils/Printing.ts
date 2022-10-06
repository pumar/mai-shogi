import { Box2, Box3, Vector2, Vector3 } from "three";

export {
	vecToString,
	boxToString,
}

function vecToString(vec: Vector3 | Vector2): string {
	return vec instanceof Vector3 ?
		`(${vec.x}, ${vec.y}, ${vec.z})`
		: `(${vec.x}, ${vec.y}`;
}

function boxToString(box: Box2 | Box3): string {
	return box instanceof Box2 ?
		`(min (${box.min.x}, ${box.min.y}) max (${box.max.x}, ${box.max.y}))`
		: `(min (${box.min.x}, ${box.min.y}, ${box.min.z}) max (${box.max.x}, ${box.max.y}, ${box.max.z}))`;
}
