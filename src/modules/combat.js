import { rollD100, rollBonusPool, resolveBonusDice } from '@/util/dice';
import Log from '@/log';

/**
 * CombatEngine — handles turn-based resolution for Mecha Scrapyard.
 */
export default class CombatEngine {
    constructor(gameState) {
        this.gameState = gameState;
    }

    /**
     * Calculate Target Percent for an attack.
     * Combat Design §5.1
     */
    calculateTargetPercent(attacker, defender) {
        // baseAccuracy = 50
        // targetPercent = baseAccuracy + (ATK × 2) - (DEF_alvo × 1.5)
        const baseAccuracy = 50;
        const atk = attacker.attributes.atk;
        const def = defender.attributes.def;

        return baseAccuracy + (atk * 2) - (def * 1.5);
    }

    /**
     * Resolve a single attack from one unit to another.
     * @param {Object} attacker - Frame data
     * @param {Object} defender - Frame data
     * @param {string} targetingPolicy - 'torso', 'arms', 'legs', or 'auto'
     */
    resolveAttack(attacker, defender, targetingPolicy = 'auto') {
        const targetPercent = this.calculateTargetPercent(attacker, defender);
        const result = rollD100(targetPercent);

        Log.add(`[COMBAT] ${attacker.name || 'Attacker'} rolls ${result.roll} vs ${Math.floor(targetPercent)}%`, 'combat');

        if (result.success) {
            // Select part
            const partId = this.selectTargetPart(targetingPolicy);
            const part = defender.parts[partId];

            // Basic damage calculation (Combat Design §3.2)
            // For now, 1 level of avaria (33% of maxHP per level approx)
            // Let's use 20 HP as a placeholder for "1 level" if maxHp is 100
            let damage = 20;

            if (result.critical) {
                Log.add(`[COMBAT] CRITICAL HIT!`, 'combat');
                damage *= 2;
            }

            // Bonus D6 pool (Combat Design §5.2)
            // Bonus dice could come from skills/perks, let's assume 1d6 for now as baseline
            const bonusDice = rollBonusPool(1);
            const bonusResults = resolveBonusDice(bonusDice);

            if (bonusResults.directHits > 0) {
                Log.add(`[COMBAT] DIRECT HIT!`, 'combat');
                damage += bonusResults.bonusAvaria * 10;
                defender.stress += bonusResults.bonusStress;
            }

            this.applyDamage(defender, partId, damage);
            return true;
        } else {
            Log.add(`[COMBAT] Miss!`, 'combat');
            return false;
        }
    }

    /**
     * Targeted random distribution (Combat Design §3.2)
     */
    selectTargetPart(policy) {
        const roll = Math.random();
        if (policy === 'torso') {
            return roll < 0.7 ? 'torso' : (roll < 0.8 ? 'left_arm' : (roll < 0.9 ? 'right_arm' : 'legs'));
        }
        if (policy === 'auto') {
            // 40% Torso, 20% each Arm, 20% Legs
            if (roll < 0.4) return 'torso';
            if (roll < 0.6) return 'left_arm';
            if (roll < 0.8) return 'right_arm';
            return 'legs';
        }
        // Fallback or explicit policies
        return policy || 'torso';
    }

    /**
     * Apply damage to a specific part.
     */
    applyDamage(defender, partId, amount) {
        const part = defender.parts[partId];
        part.hp = Math.max(0, part.hp - amount);

        Log.add(`[COMBAT] ${part.name} takes ${Math.floor(amount)} damage! (${Math.floor(part.hp)}/${part.maxHp})`, 'combat');

        if (part.hp <= 0 && part.status !== 'destroyed') {
            part.integrity--;
            if (part.integrity <= 0) {
                part.status = 'destroyed';
                Log.add(`[COMBAT] ALERT: ${part.name} is INOPERABLE!`, 'error');
                if (partId === 'torso') {
                    Log.add(`[COMBAT] CATASTROPHIC FAILURE: Frame destroyed!`, 'error');
                }
            } else {
                part.hp = part.maxHp; // Reset HP for next integrity layer
                Log.add(`[COMBAT] ${part.name} integrity reduced to ${part.integrity}!`, 'warning');
            }
        }
    }
}
