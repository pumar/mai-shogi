import esbuild from "esbuild";

esbuild.build({
	entryPoints: ["src/Game/tools/BakeSvgs.ts"],
	bundle: true,
	outfile: "build_svgs.cjs",
	platform: 'node',
	sourcemap: false,
}).catch((_) => process.exit(1));
