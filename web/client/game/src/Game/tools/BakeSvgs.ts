import { BufferGeometry, Color, DoubleSide, Group, Mesh, MeshBasicMaterial, Object3D, ShapeGeometry } from "three";
import { SVGLoader, SVGResult, SVGResultPaths } from "three/examples/jsm/loaders/SVGLoader.js";
import { mergeBufferGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import * as Path from 'path';
import * as FS from 'node:fs/promises';

import { JSDOM } from "jsdom";

//this is necessary so that threejs code can find the DOMParser object
//which is needed to parse the svgs and turn them into threejs objects
global.DOMParser = new JSDOM().window.DOMParser;

function loadSvgs(paths: string[]): Promise<[string, string | undefined]>[] {
	const svgFilePromises: Promise<[string, string | undefined]>[] = paths.map<Promise<[string, string | undefined]>>(svgPath => {
		return new Promise((res, rej) => {
			FS.readFile(svgPath, { encoding: 'utf-8' })
				.then(fileContents => res([svgPath, fileContents]))
				.catch((e) => {
					console.error(e);
					rej([svgPath, undefined])
				});
		});
	});
	return svgFilePromises;
}

//these material cache is used by several pieces
const materialCache: Map<number, MeshBasicMaterial> = new Map();
function getPathMaterial(pathColor: Color): MeshBasicMaterial {
	if (materialCache.has(pathColor.getHex())) {
		return materialCache.get(pathColor.getHex()) as MeshBasicMaterial;
	} else {
		const newMaterial = new MeshBasicMaterial({
			color: pathColor,
			side: DoubleSide,
			depthWrite: true
		});
		materialCache.set(pathColor.getHex(), newMaterial);
		return newMaterial;
	}
}

/** Ideas to make the JSON smaller:
* re-use the MeshBasicMaterials, cache them based on the color attribute 
* load all of the piece Object3Ds into one group (give them names or ids)
* then turn that group into JSON, so that only one JSON file needs to be pulled from the server
* and they can share materials & geometries better
**/
type ObjectCreationInfo = { material: MeshBasicMaterial; geoms: BufferGeometry[]; };
/**
* this is really slow in the browser and turning the piece svgs into 
* threesj objects takes like 3 seconds per game load
* the idea is to make the meshes, and then save them to a file and just
* load those files into the browser
* so that they can be cached, and we don't have a slow loop running in
* the browser
**/
function prepareSvgGraphicsObjects(
	paths: SVGResultPaths[]
): string {
	let jsonResults: string = "";
	const group = new Group();

	const objectCreationMap: Map<number, ObjectCreationInfo> = new Map();
	//copy pasted this from the threejs svgloader example
	//and then modified it to reuse materials and to join geometries
	//const pathColorGeometryMap: Map<number, BufferGeometry[]> = new Map();
	for (let i = 0; i < paths.length; i++) {

		const path = paths[ i ];

		const material = getPathMaterial(path.color);

		const shapes = SVGLoader.createShapes( path );
		const geometries = [];

		for (let j = 0;j < shapes.length;j++) {
			const shape = shapes[ j ];
			const geometry = new ShapeGeometry( shape );
			geometries.push(geometry);
		}

		const pathColorKey = path.color.getHex();
		if (objectCreationMap.has(pathColorKey)) {
			(objectCreationMap.get(pathColorKey) as ObjectCreationInfo).geoms.push(...geometries);
		} else {
			objectCreationMap.set(pathColorKey, {
				material,
				geoms: geometries,
			});
		}
	}
	const mergedMeshes: Mesh[] = [...objectCreationMap.values()].map((info: ObjectCreationInfo) => {
		const material = info.material;
		const mergedMesh = new Mesh(mergeBufferGeometries(info.geoms), material);
		return mergedMesh;
	});
	const failedMeshes = mergedMeshes.filter(x => x === null || x === undefined);
	if (failedMeshes.length > 0) {
		console.error(`undefined threejs objs:${failedMeshes.length}`);
	}
	group.add(...mergedMeshes);
	jsonResults = JSON.stringify(group.toJSON());
	return jsonResults;
}

function doSvgLoaderParsing(svgFileResults: [string, string][]): [string, SVGResult][] {
	const svgLoader = new SVGLoader();
	return svgFileResults.map(svgFileTuple => {
		return [svgFileTuple[0], svgLoader.parse(svgFileTuple[1])];
	});
}

async function main(args: string[]): Promise<void> {
	if (args.length < 3) {
		console.error('must specify target directory at command line');
		return;
	}
	//const scriptDirectory = __dirname;
	//const scriptPath = args[1];
	const svgBasePath = args[2];
	const targetDirectoryAbsPath = Path.resolve(svgBasePath);
	console.log({ svgBasePath, targetDirectoryAbsPath });
	const svgPath = targetDirectoryAbsPath;
	const svgFileNames: string[] = await FS.readdir(svgPath);
	const svgFilePaths = svgFileNames.map(fn => Path.resolve(svgPath, fn));
	const svgRequestResults: [string, string | undefined][] = await Promise.all(loadSvgs(svgFilePaths)).catch(e => {
		console.error(`svg loading promise error:`, e)
		return [];
	});
	const svgRequestResultsSuccess = svgRequestResults.filter(x => x[1] !== undefined) as [string, string][];

	const svgLoaderParseResults: [string, SVGResult][] = doSvgLoaderParsing(svgRequestResultsSuccess);

	const jsonResults: [string, string][] = svgLoaderParseResults.map(reqResult =>
		[reqResult[0], prepareSvgGraphicsObjects(reqResult[1].paths)]);
	//console.log(jsonResults);
	jsonResults.forEach(async (res) => {
		const saveJsonPath = res[0].replace('.svg', '.json');
		//console.log({ saveJsonPath });
		await FS.writeFile(saveJsonPath, res[1]);
	});
}

main(process.argv);
