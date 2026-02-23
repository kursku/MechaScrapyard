/**
 * BipolarStat — Morality axis for Mecha Scrapyard.
 *
 * Range: [-100, +100]
 * Positive = Idealist (altruistic, constructive)
 * Negative = Pragmatic (opportunistic, survivalist)
 * Neutral  = Flexible, no extreme benefits
 *
 * Thresholds:
 *   >=+30  → Idealist perks available
 *   <=-30  → Pragmatic perks available
 *   >=+70  → Deep Idealist (unique content)
 *   <=-70  → Deep Pragmatic (unique content)
 */
export default class BipolarStat {

    constructor(val = 0) {
        this._val = val;
        this._min = -100;
        this._max = 100;
    }

    get value() { return this._val; }

    set value(v) {
        this._val = Math.max(this._min, Math.min(this._max, v));
    }

    /** Shift morality. Positive = towards Idealist, negative = towards Pragmatic. */
    shift(amount) {
        this.value = this._val + amount;
    }

    get alignment() {
        if (this._val >= 70) return 'deep_idealist';
        if (this._val >= 30) return 'idealist';
        if (this._val <= -70) return 'deep_pragmatic';
        if (this._val <= -30) return 'pragmatic';
        return 'neutral';
    }

    get label() {
        const labels = {
            deep_idealist: 'Paragon',
            idealist: 'Idealist',
            neutral: 'Neutral',
            pragmatic: 'Pragmatic',
            deep_pragmatic: 'Ruthless',
        };
        return labels[this.alignment];
    }

    toJSON() { return this._val; }

    static fromJSON(val) { return new BipolarStat(val || 0); }
}
