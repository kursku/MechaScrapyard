/**
 * uiHelpers.js — Shared UI utility functions used across multiple panel components.
 * Extracted from TerminalUI.vue to avoid duplication during decomposition.
 */

/**
 * Render an ASCII progress bar.
 * @param {number} val  - Current value
 * @param {number} max  - Maximum value
 * @param {number} width - Bar character width
 * @returns {string}
 */
export function renderBar(val, max, width = 12) {
    if (!max) return '[' + '.'.repeat(width) + ']';
    const pct = Math.min(1, val / max);
    const filled = Math.round(pct * width);
    const empty = width - filled;
    return '[' + '|'.repeat(filled) + '.'.repeat(empty) + ']';
}

/**
 * Look up a resource icon by ID.
 * Falls back to the item's own icon/abbr, then a static map, then a dot.
 * @param {string} id
 * @param {Object} [stateItems] - state.items lookup table
 * @returns {string}
 */
const RESOURCE_ICONS = {
    energy: '\u26A1', scrap: '\u2699', creds: '\u00A2',
    ferrous_scrap: '\u26D3', polymer_scrap: 'Po', electronic_scrap: '\u2318',
    nano_infra: '\u25C8', nanofiber: '\u2248', ceramite: '\u25C6',
    fusion_cells: '\u25C9', quantum_circuits: '\u25C7',
    glory: '\u2694', parts: '\u229E', supply: '\u25B8', data_chips: '\u25C7',
    rep_police: 'RP', rep_military: 'RM', rep_underground: 'RU',
    rep_corporate: 'RC', rep_exile: 'RE',
    morality: '\u2696', prestige_points: '\u2605'
};

export function resourceIcon(id, stateItems) {
    if (stateItems) {
        const res = stateItems[id];
        if (res && res.icon) return res.icon;
        if (res && res.abbr) return res.abbr;
    }
    return RESOURCE_ICONS[id] || '\u2022';
}

/**
 * Format a per-second rate value for display.
 * @param {number} val
 * @returns {string}
 */
export function fmtRate(val) {
    if (Math.abs(val) < 0.01) return '';
    const sign = val > 0 ? '+' : '';
    if (Math.abs(val) >= 10) return sign + Math.round(val);
    if (Math.abs(val) >= 1) return sign + val.toFixed(1);
    return sign + val.toFixed(2);
}

/**
 * Format an item/mod key for display.
 * e.g. "scrap_rate.max" → "SCRAP RATE MAX"
 * @param {string} k
 * @returns {string}
 */
export function formatModKey(k) {
    return k.replace(/[_.]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Format an ID string as a human-readable name.
 * e.g. "ferrous_scrap" → "Ferrous Scrap"
 * @param {string} id
 * @returns {string}
 */
export function formatName(id) {
    return id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Get alliance label from a reputation value.
 * @param {number} repValue
 * @returns {string}
 */
export function getAllianceLabel(repValue) {
    if (repValue < 10) return 'HOSTILE';
    if (repValue < 25) return 'TENSE';
    if (repValue < 50) return 'NEUTRAL';
    if (repValue < 75) return 'FRIENDLY';
    return 'ALLIED';
}
