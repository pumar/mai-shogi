import { DoubleSide, Mesh, MeshBasicMaterial, ShapeGeometry } from "three";
import { SVGLoader, SVGResult, SVGResultPaths } from "three/examples/jsm/loaders/SVGLoader.js";
import { mergeBufferGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
//import { measureTime } from "../../utils/Performance";
import * as Path from 'path';
import * as FS from 'node:fs/promises';

function loadSvgs(paths: string[]): Promise<[string, string | undefined]>[] {
	//const svgLoader = new SVGLoader();
	console.log('pieces paths:', paths);

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
	//const svgFiles: [string, string | undefined][] = await Promise.all(svgFilePromises)
	//const svgResults: [string, SVGResult][] = svgFiles
	//	.filter(x => x[1] !== undefined)
	//	.map(fileTuple => [fileTuple[0], svgLoader.parse(fileTuple[1] as string)]);
	////console.log({ svgFiles });

	//return svgResults;

	//const svgs: [string, SVGElement[]] = await paths.map(svgPath => {
	//	const prms = new Promise((resolve, _) => {
	//		const fileData = FS.readFile(svgPath, undefined, (err, res) => {
	//		});
	//	})
	//})
	//const svgLoadPromises = paths.map(svgPath => new Promise<SVGResult>((resolve, _) => {
	//	svgLoader.load(
	//		svgPath[1],
	//		(data) => {
	//			//resolve(data)
	//		}
	//	);
	//})) as Promise<SVGResult>[];

	//return svgLoadPromises;
}

/**
* this is really slow in the browser and turning the piece svgs into 
* threesj objects takes like 3 seconds per game load
* the idea is to make the meshes, and then save them to a file and just
* load those files into the browser
* so that they can be cast, and we don't have a slow loop running in
* the browser
**/
function prepareSvgGraphicsObjects(
	paths: SVGResultPaths[]
) {
	const jsonResults = [];
	//copy pasted this from the threejs svgloader example
	for (let i = 0; i < paths.length; i++) {

		const path = paths[ i ];

		const material = new MeshBasicMaterial( {
			color: path.color,
			side: DoubleSide,
			//I was debugging why the pieces were drawn behind the board,
			//and it was because this code that I pasted from the example
			//was setting depthWrite to false...
			depthWrite: true
		} );

		const shapes = SVGLoader.createShapes( path );
		const geometries = [];

		for (let j = 0;j < shapes.length;j++) {
			const shape = shapes[ j ];
			const geometry = new ShapeGeometry( shape );
			geometries.push(geometry);
			//const mesh = new Mesh( geometry, material );
			//group.add( mesh );
		}
		//merge the geometries into one geometry, and then
		//make one mesh instead of several hundred for HUGE
		//performance boost when the object needs to be cloned
		//it drastically reduces # of sub objects
		const mergedGeometry = mergeBufferGeometries(
			geometries
		);
		const mergedMesh = new Mesh(mergedGeometry, material);
		const json = mergedMesh.toJSON();
		jsonResults.push(json);
	}
	return jsonResults;
}

function doSvgLoaderParsing(svgFileResults: [string, string][]): [string, SVGResult][] {
	const svgLoader = new SVGLoader();
	return svgFileResults.map(svgFileTuple => {
		return [svgFileTuple[0], svgLoader.parse(svgFileTuple[1])];
	});
}

async function main(args: string[]): Promise<void> {
	const scriptDirectory = __dirname;
	const scriptPath = args[1];
	const svgBasePath = args[2];
	//const targetFiles = getTargetSvgs(args);
	const svgPath = Path.resolve(
		scriptDirectory,
		'shogi-pieces',
		'kanji_red_wood',
	);
	console.log({ scriptDirectory, scriptPath, svgBasePath, svgPath });
	const svgFileNames: string[] = await FS.readdir(svgPath);
	const svgFilePaths = svgFileNames.map(fn => Path.resolve(svgPath, fn));
	//processSvgs(svgBasePath);
	const svgRequestResults: [string, string | undefined][] = await Promise.all(loadSvgs(svgFilePaths)).catch(e => {
		console.error(`svg loading promise error:`, e)
		return [];
	});
	const svgRequestResultsSuccess = svgRequestResults.filter(x => x[1] !== undefined) as [string, string][];

	const svgLoaderParseResults: [string, SVGResult][] = doSvgLoaderParsing(svgRequestResultsSuccess);

	//const svgFiles: [string, string | undefined][] = await Promise.all(svgFilePromises)
	//const svgResults: [string, SVGResult][] = svgFiles
	//	.filter(x => x[1] !== undefined)
	//	.map(fileTuple => [fileTuple[0], svgLoader.parse(fileTuple[1] as string)]);
	////console.log({ svgFiles });
	//console.log(svgRequestResults);

	const jsonResults = svgLoaderParseResults.map(reqResult =>
		[reqResult[0], prepareSvgGraphicsObjects(reqResult[1].paths)]);
	console.log(jsonResults);
}

main(process.argv);
