/**
 * BipolarStat — Three-Way Morality axis for Mecha Scrapyard.
 *
 * Range: [-100, +100]
 * Positive = Paragon (altruistic, constructive)
 * Negative = Shadow (opportunistic, survivalist)
 * Neutral  = Pragmatist (flexible — exclusive content, not penalty)
 *
 * Thresholds:
 *   >=+40  → Paragon (alignment classification)
 *   >=+80  → Paragon (Devoted) — deep content
 *   <=-40  → Shadow (alignment classification)
 *   <=-80  → Shadow (Entrenched) — deep content
 *   |v|<40 → Pragmatist — neutral-specific content
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

    /** Shift morality. Positive = towards Paragon, negative = towards Shadow. */
    shift(amount) {
        this.value = this._val + amount;
    }

    get alignment() {
        if (this._val >= 80) return 'paragon_devoted';
        if (this._val >= 40) return 'paragon';
        if (this._val <= -80) return 'shadow_entrenched';
        if (this._val <= -40) return 'shadow';
        return 'pragmatist';
    }

    /** Simple alignment bucket (paragon/shadow/pragmatist). */
    get alignmentBase() {
        if (this._val >= 40) return 'paragon';
        if (this._val <= -40) return 'shadow';
        return 'pragmatist';
    }

    get label() {
        const labels = {
            paragon_devoted: 'Paragon (Devoted)',
            paragon: 'Paragon',
            pragmatist: 'Pragmatist',
            shadow: 'Shadow',
            shadow_entrenched: 'Shadow (Entrenched)',
        };
        return labels[this.alignment];
    }

    toJSON() { return this._val; }

    static fromJSON(val) { return new BipolarStat(val || 0); }
}
