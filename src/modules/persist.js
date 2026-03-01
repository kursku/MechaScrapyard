/**
 * Persist — Save/Load system using localStorage.
 */

const SAVE_KEY = 'mecha_scrapyard_save';
const AUTOSAVE_INTERVAL = 30000; // 30 seconds
const SAVE_VERSION = '1.0';

export default {

    /** Timestamp of last successful save, or null. */
    _lastSavedAt: null,

    /** True if the last save failed due to storage quota. */
    _quotaError: false,

    save(game) {
        try {
            const data = game.serialize();
            data._meta = {
                version: SAVE_VERSION,
                savedAt: Date.now(),
                playTime: game.timer?.totalTime || 0,
            };
            localStorage.setItem(SAVE_KEY, JSON.stringify(data));
            this._lastSavedAt = Date.now();
            this._quotaError = false;
            return true;
        } catch (e) {
            this._handleSaveError(e);
            return false;
        }
    },

    _handleSaveError(e) {
        if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
            console.error('[PERSIST] Storage quota exceeded. Save failed.');
            this._quotaError = true;
        } else {
            console.error('[PERSIST] Save failed:', e);
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
