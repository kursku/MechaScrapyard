import { toCanonicalId } from '@/schema/idAliases';

/**
 * TechTree - Cascading unlock system.
 *
 * Evaluates `require` strings as expressions against the game state.
 * When a condition is met, the item is unlocked (locked = false).
 *
 * Follows Arcanum's pattern: require strings reference `g.xxx`
 * where g is the game state's g namespace.
 */
export default class TechTree {

    constructor(state) {
        /** @type {import('./gameState').default} */
        this.state = state;

        /** Items with require conditions */
        this.gated = [];
    }

    /**
     * Register an item with a require condition.
     */
    register(item) {
        if (item.require && typeof item.require === 'string') {
            this.gated.push(item);
        }
    }

    /**
     * Check all gated items and unlock those whose conditions are met.
     * Returns list of newly unlocked items.
     */
    check() {
        const unlocked = [];
        const g = this.state.g;

        this.gated = this.gated.filter(item => {
            if (!item.locked && item.locked !== undefined) {
                return false; // already unlocked, remove from watch list
            }

            try {
                // Evaluate require expression against game state
                const result = this._evaluate(item.require, g);
                if (result) {
                    item.locked = false;
                    unlocked.push(item);
                    return false; // remove from gated list
                }
            } catch (e) {
                // Expression failed - keep watching
                console.warn(`TechTree eval error for ${item.id}: ${e.message}`);
            }

            return true; // keep in gated list
        });

        return unlocked;
    }

    /**
     * Evaluate a require expression string.
     * @param {string} expr - Expression like "g.refinery>0&&g.scrap>=50"
     * @param {Object} g - Game state namespace
     * @returns {boolean}
     */
    _evaluate(expr, g) {
        // Normalize legacy gate ids to canonical English ids before evaluating.
        const normalizedExpr = this._normalizeExpr(expr);

        // Simple expression evaluator using Function constructor
        // g.xxx returns the item's value or owned count
        try {
            const fn = new Function('g', `return (${normalizedExpr})`);
            return !!fn(g);
        } catch {
            return false;
        }
    }

    /**
     * Normalize legacy require/hideWhen expressions to canonical English ids.
     * This keeps older content compatible with pre-English naming.
     * @param {string} expr
     * @returns {string}
     */
    _normalizeExpr(expr) {
        if (!expr || typeof expr !== 'string') return expr;

        const aliasId = (id) => toCanonicalId(id);
        let normalized = expr.trim();

        // Handle bare identifiers like "energy" from legacy content.
        // In require context, these are intended as g.energy.
        if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(normalized)) {
            normalized = `g.${aliasId(normalized)}`;
        }

        // Replace explicit g.<id> references.
        normalized = normalized.replace(/\bg\.([A-Za-z_][A-Za-z0-9_]*)\b/g, (_, id) => {
            return `g.${aliasId(id)}`;
        });

        return normalized;
    }

    /**
     * Public evaluate method for external use.
     */
    evaluate(expr) {
        if (!expr) return true;
        return this._evaluate(expr, this.state.g);
    }

    /**
     * Force re-check of all items (useful after loading a save).
     */
    recheck(allItems) {
        this.gated = allItems.filter(item =>
            item.require && typeof item.require === 'string' && item.locked !== false
        );
        return this.check();
    }
}
