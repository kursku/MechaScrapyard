/**
 * Timer utility — tracks elapsed time and total playtime.
 */
export default class Timer {
    constructor() {
        this._lastTick = Date.now();
        this.totalTime = 0;
        this.paused = false;
    }

    /**
     * Get elapsed time since last call (in seconds).
     * Returns 0 if paused.
     */
    elapsed() {
        const now = Date.now();
        const dt = (now - this._lastTick) / 1000;
        this._lastTick = now;

        if (this.paused) return 0;

        this.totalTime += dt;
        return dt;
    }

    pause() { this.paused = true; }
    unpause() {
        this._lastTick = Date.now();
        this.paused = false;
    }

    toJSON() {
        return { totalTime: this.totalTime };
    }

    fromJSON(data) {
        if (data?.totalTime) this.totalTime = data.totalTime;
    }
}
