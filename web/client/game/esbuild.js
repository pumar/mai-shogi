import esbuild from "esbuild";

esbuild.build({
	entryPoints: ["test_main.ts"],
	bundle: true,
	outfile: "test_main.js",
	watch: true,
}).catch((_) => process.exit(1));
