class Diagnostics {
	constructor(func) {
		this.secondInterval = 0;
		this.startTime = window.performance.now();
		
		this.frameCount = 0;

		this.secondsPerPrint = 10;

		this.fps = 0;
		this._func = func;

		this.call = this.call.bind(this)
	}

	call() {
		this._func();
		
		const t = window.performance.now();
		this.frameCount++;
		if (t - this.startTime > this.secondInterval * 1000 * this.secondsPerPrint) {
			this.fps = this.frameCount / this.secondsPerPrint
			console.log("FPS: " + this.fps);
			this.frameCount = 0;
			this.secondInterval++;
		}
	}
}

async function timeIt(functionName, f) {
    const t = window.performance.now();
    const ret = await f();
    console.log(functionName + " time: " + (window.performance.now() - t));

	return ret;
}

export {
    Diagnostics,
    timeIt
}