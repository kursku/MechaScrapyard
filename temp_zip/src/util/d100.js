/**
 * d100 Roll System for Mecha Scrapyard.
 *
 * Roll ≤ target = success.
 * 1-5 = critical success, 96-100 = critical failure.
 * Fail Forward: always returns minimum rewards on failure.
 */

/**
 * @typedef {Object} RollResult
 * @property {number} roll - The dice result (1-100)
 * @property {number} target - The target percentage
 * @property {boolean} success - Whether the roll succeeded
 * @property {boolean} critical - Whether it was a critical (success or fail)
 * @property {'crit_success'|'success'|'failure'|'crit_failure'} tier
 */

/**
 * Perform a d100 roll against a target.
 * @param {number} target - Target percentage (1-99)
 * @param {Object} [mods] - Modifiers to the roll
 * @param {number} [mods.bonus=0] - Flat bonus to target
 * @param {number} [mods.penalty=0] - Flat penalty to target
 * @returns {RollResult}
 */
export function roll(target, mods = {}) {
    const bonus = mods.bonus || 0;
    const penalty = mods.penalty || 0;
    const effectiveTarget = Math.max(1, Math.min(99, target + bonus - penalty));

    const dice = Math.floor(Math.random() * 100) + 1;

    let tier;
    if (dice <= 5 && dice <= effectiveTarget) {
        tier = 'crit_success';
    } else if (dice >= 96 && dice > effectiveTarget) {
        tier = 'crit_failure';
    } else if (dice <= effectiveTarget) {
        tier = 'success';
    } else {
        tier = 'failure';
    }

    return {
        roll: dice,
        target: effectiveTarget,
        success: tier === 'success' || tier === 'crit_success',
        critical: tier === 'crit_success' || tier === 'crit_failure',
        tier,
    };
}

/**
 * Batch roll for idle/background tasks.
 * @param {number} target - Target percentage
 * @param {number} count - Number of rolls
 * @returns {{ successes: number, critSuccesses: number, critFailures: number, total: number }}
 */
export function batchRoll(target, count) {
    let successes = 0;
    let critSuccesses = 0;
    let critFailures = 0;

    for (let i = 0; i < count; i++) {
        const r = roll(target);
        if (r.success) successes++;
        if (r.tier === 'crit_success') critSuccesses++;
        if (r.tier === 'crit_failure') critFailures++;
    }

    return { successes, critSuccesses, critFailures, total: count };
}
