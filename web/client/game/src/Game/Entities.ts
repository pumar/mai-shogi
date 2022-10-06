import { Color, Mesh, MeshBasicMaterial, PlaneGeometry, Vector2, Vector3 } from "three";

export {
	makeLocationDebugSquare,
	makeSvgDebugMesh,
}

const defaultColors = {
	debugSquare: new Color(0, 0, 1),
}

function makeLocationDebugSquare(
	color: Color = defaultColors.debugSquare,
): Mesh {
	const square = new Mesh(
		new PlaneGeometry(1, 1),
		new MeshBasicMaterial({
			color,
		})
	);

	return square;
}

function makeSvgDebugMesh(
	size: Vector2 | Vector3,
	color: Color,
): Mesh {
	const svgBoxMesh = new Mesh(
		new PlaneGeometry(size.x, size.y),
		new MeshBasicMaterial({
			color,
			transparent: true,
			opacity: 0.25,
		})
	);

	return svgBoxMesh;
}
