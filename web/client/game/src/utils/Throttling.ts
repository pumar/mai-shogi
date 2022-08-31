export {
	debounce,
}

function debounce(work: Function, waitTime: number): () => void {
	let setTimeoutId: ReturnType<typeof setTimeout> | undefined = undefined;

	return (...args) => {
		if(setTimeoutId !== undefined) {
			clearTimeout(setTimeoutId);
		}

		setTimeoutId = setTimeout(() => {
			setTimeoutId = undefined;
			work(...args);
		}, waitTime);
	}
}
