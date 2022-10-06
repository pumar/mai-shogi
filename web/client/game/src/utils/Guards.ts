export {
	makeExistsGuard
}

function makeExistsGuard(errorPrefix?: string): (a?: any, errorHint?: string) => any {
	return (a?: any, errorHint?: string) => {
		if (a === undefined) {
			throw new Error(`${errorPrefix ? errorPrefix : "makeExistsGuard"}::${errorHint || ""}`);
		}

		return a;
	}
}
