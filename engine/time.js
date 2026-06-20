class Timer {
    constructor(durationMs) {
        this._durationMs = durationMs ?? 0;
        this._oldDuration = this._durationMs;
    }

    restart(duration) {
        this._durationMs = duration ?? this._oldDuration;
    }

    update(timeDelta) {
        this._durationMs = Math.max(this._durationMs - timeDelta, 0);
    }

    stop() {
        this._durationMs = 0;
    }

    msRemaining() {return this._durationMs;}
    framesRemaining() {return msToFrames(this._durationMs);}

    finished() {return this._durationMs <= 0;}
    running() {return this._durationMs > 0;}
}

class Time {
    constructor() {
        this.start = window.performance.now();
        this.scale = 1;
        this.delta = 0;
        
        this._lastTime = 0;
        // this.time = window.performance.now();

        this.timers = [];
    }

    tick() {
		const now = window.performance.now() + 1;
		this.delta = (now - this._lastTime) * this.scale;
		this._lastTime = now;
        // this.time += this.delta;
	}

    newTimer(_durationMs) {
        const ret = new Timer(_durationMs);
        this.timers.push(ret);
        return ret;
    }
}

function msToFrames(time) {
    return Math.floor(time * 0.06);
}

export {Time, Timer, msToFrames};