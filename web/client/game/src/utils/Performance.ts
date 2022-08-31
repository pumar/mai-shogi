export {
	measureTime,
}

/**
* measure the time that it takes for function workThunk to finish
* @param workThunk callback that does some sort of processing
* @param handleTime callback that is run and passed the elapsed time between workThunk begin and workThunk end
* @returns workThunk's return value
**/
function measureTime<T>(workThunk: () => T, handleTime: (time: number) => void): T {
	const time = performance.now();
	const returnVal = workThunk();
	const endTime = performance.now();
	handleTime(endTime - time);

	return returnVal;
}
