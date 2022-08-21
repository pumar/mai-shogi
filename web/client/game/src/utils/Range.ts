export {
	buildForRange,
}

/**
* run callback for indices start(inclusive)->start + count, returning the resulting array
* @param start begin value
* @param count # of times from start to iterate and call callback
* @param callback returns an object that is to be put in the result array
* @returns result of running callback count times
**/
function buildForRange<T>(start: number, count: number, callback: (rangeValue: number) => T): T[] {
	const returnArray: T[] = [];
	for(let c = start; c < start + count; c++) {
		returnArray.push(callback(c));
	}
	return returnArray;
}
