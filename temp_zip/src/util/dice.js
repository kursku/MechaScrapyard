/**
 * Dice Utility — Handles rolling systems for combat.
 * Based on Combat Design Doc §5.
 */

/**
 * Roll a d100 against a target percentage.
 * @param {number} targetPercent - Threshold for success (1-100)
 * @returns {Object} Result of the roll
 */
export function rollD100(targetPercent) {
    const roll = Math.floor(Math.random() * 100) + 1;
    return {
        roll,
        success: roll <= targetPercent,
        critical: roll <= 5,          // Success 1-5 (Combat Design §5.1)
        fumble: roll >= 96,           // Fumble 96-100
        margin: targetPercent - roll   // Positive = success, negative = failure
    };
}

/**
 * Roll a pool of d6 bonus dice.
 * Based on Mechanized Body (Combat Design §5.2).
 * @param {number} numDice - Number of d6 to roll
 * @returns {Array<number>} List of results
 */
export function rollBonusPool(numDice) {
    const results = [];
    for (let i = 0; i < numDice; i++) {
        results.push(Math.floor(Math.random() * 6) + 1);
    }
    return results;
}

/**
 * Resolve the bonus dice results.
 * 6 = Direct Hit (+1 avaria, +1 stress)
 * 3-5 = Glancing Hit (partial effect)
 * 1-2 = Miss (no bonus)
 * @param {Array<number>} results 
 * @returns {Object} Consolidated bonus effects
 */
export function resolveBonusDice(results) {
    const summary = {
        directHits: 0,
        glancingHits: 0,
        bonusAvaria: 0,
        bonusStress: 0
    };

    results.forEach(val => {
        if (val === 6) {
            summary.directHits++;
            summary.bonusAvaria += 1;
            summary.bonusStress += 1;
        } else if (val >= 3) {
            summary.glancingHits++;
            summary.bonusAvaria += 0.5;
        }
    });

    return summary;
}
