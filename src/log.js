/**
 * System Log — stores and manages game log entries.
 * Types: system, action, success, error, story, loot, upgrade, tip
 */

const MAX_ENTRIES = 100;

const Log = {
    entries: [],

    add(text, type = 'system') {
        this.entries.push({ text, type, time: Date.now() });

        // Combat Design §15 — Sync to browser console for verification
        if (!__DIST) {
            const styles = {
                combat: 'color: #aaa',
                error: 'color: #f55; font-weight: bold',
                warning: 'color: #fb5',
                loot: 'color: #f5f',
                system: 'color: #0fa'
            };
            console.log(`%c[LOG:${type}] ${text}`, styles[type] || 'color: white');
        }

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
