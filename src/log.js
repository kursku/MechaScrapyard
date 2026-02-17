/**
 * System Log — stores and manages game log entries.
 * Types: system, action, success, error, story, loot, upgrade, tip
 */

const MAX_ENTRIES = 100;

const Log = {
    entries: [],

    add(text, type = 'system') {
        this.entries.push({ text, type, time: Date.now() });
        if (this.entries.length > MAX_ENTRIES) {
            this.entries.splice(0, this.entries.length - MAX_ENTRIES);
        }
    },

    clear() {
        this.entries = [];
    },

    toJSON() {
        return this.entries.slice(-20); // save last 20
    },

    fromJSON(data) {
        if (Array.isArray(data)) {
            this.entries = data;
        }
    }
};

export default Log;
