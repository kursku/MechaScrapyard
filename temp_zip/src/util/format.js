/**
 * Format a number for display.
 * @param {number} n
 * @returns {string}
 */
export function fmt(n) {
    if (n === undefined || n === null || isNaN(n)) return '0';
    if (n >= 10000) return (n / 1000).toFixed(1) + 'k';
    if (n >= 100) return Math.floor(n).toString();
    if (n >= 10) return n.toFixed(1);
    return n.toFixed(2);
}

/**
 * Clamp a value between min and max.
 */
export function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

/**
 * Percentage 0-100.
 */
export function pct(val, max) {
    return max > 0 ? Math.min(100, (val / max) * 100) : 0;
}

/**
 * Format time in seconds to Xm Ys.
 */
export function fmtTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return m > 0 ? `${m}m${s}s` : `${s}s`;
}
