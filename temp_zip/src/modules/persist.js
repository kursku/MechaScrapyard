/**
 * Persist — Save/Load system using localStorage.
 */

const SAVE_KEY = 'mecha_scrapyard_save';
const AUTOSAVE_INTERVAL = 30000; // 30 seconds

export default {

    save(game) {
        try {
            const data = game.serialize();
            localStorage.setItem(SAVE_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Save failed:', e);
            return false;
        }
    },

    load() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            console.error('Load failed:', e);
            return null;
        }
    },

    clear() {
        localStorage.removeItem(SAVE_KEY);
    },

    hasSave() {
        return !!localStorage.getItem(SAVE_KEY);
    },

    AUTOSAVE_INTERVAL,
};
