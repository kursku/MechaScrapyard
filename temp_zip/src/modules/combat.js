import { rollD100, rollBonusPool, resolveBonusDice } from '@/util/dice';
import Log from '@/log';

/**
 * Combat Utilities — pure functions for combat resolution.
 */

/**
 * Calculate Target Percent for an attack.
 * Combat Design §5.1
 */
export function calculateTargetPercent(attacker, defender, activeModifiers = { accuracyBonus: 0 }) {
    let baseAccuracy = 50 + (activeModifiers.accuracyBonus || 0);
    const atk = attacker.attributes.atk;
    const def = defender.attributes.def;

    // Heat Penalties (§7.1)
    if (attacker.heat >= 76) {
        baseAccuracy -= 15;
    }

    // Stress Penalties (§7.2)
    if (attacker.stress >= 51) {
        baseAccuracy -= 10;
    }

    return baseAccuracy + (atk * 2) - (def * 1.5);
}

/**
 * Select a target part based on policy.
 * Combat Design §3.2
 */
export function selectTargetPart(policy) {
    const roll = Math.random();
    if (policy === 'torso') {
        return roll < 0.7 ? 'torso' : (roll < 0.8 ? 'left_arm' : (roll < 0.9 ? 'right_arm' : 'legs'));
    }
    if (policy === 'auto') {
        if (roll < 0.4) return 'torso';
        if (roll < 0.6) return 'left_arm';
        if (roll < 0.8) return 'right_arm';
        return 'legs';
    }
    return policy || 'torso';
}

/**
 * Apply damage to a frame's part.
 * Combat Design §3.1, §3.2
 */
export function applyDamage(defender, partId, amount, isCounter = false) {
    const part = defender.parts[partId];
    if (!part || part.status === 'destroyed') return { destroyed: false, integrityLoss: false };

    let finalAmount = amount;

    // Legacy BREACH check removed; handled in CombatRunner


    part.hp = Math.max(0, part.hp - finalAmount);

    let result = {
        damageDealt: finalAmount,
        partId,
        destroyed: false,
        integrityLoss: false,
        stressGained: 0
    };

    if (part.hp < part.maxHp * 0.25) {
        result.stressGained = 1;
    }

    if (part.hp <= 0) {
        part.integrity--;
        result.integrityLoss = true;
        if (part.integrity <= 0) {
            part.status = 'destroyed';
            result.destroyed = true;
        } else {
            part.hp = part.maxHp;
        }
    }

    return result;
}

/**
 * Check if a frame's torso is destroyed.
 */
export function isFrameDestroyed(frame) {
    return frame.parts.torso.status === 'destroyed';
}

/**
 * Get all operational parts of a frame.
 */
export function getOperationalParts(frame) {
    return Object.values(frame.parts).filter(p => p.status === 'operational');
}
