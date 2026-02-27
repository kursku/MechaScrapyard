import { rollD100, rollBonusPool, resolveBonusDice } from '@/util/dice';
import Log from '@/log';
import Events from '@/events';
import * as CombatUtils from './combat';

// ─── Stance Definitions (§4.3) ───────────────────────────────────────────────
export const STANCES = {
    offensive: {
        id: 'offensive',
        name: 'Offensive',
        desc: 'Focus on maximum damage. Defense compromised.',
        icon: '⚔',
        atkMod: 0.15,
        defMod: -0.10,
        heatDissipMod: 0,
    },
    balanced: {
        id: 'balanced',
        name: 'Balanced',
        desc: 'No modifiers. Standard.',
        icon: '⚖',
        atkMod: 0,
        defMod: 0,
        heatDissipMod: 0,
    },
    defensive: {
        id: 'defensive',
        name: 'Defensive',
        desc: 'Prioritizes survival. Reduced damage.',
        icon: '🛡',
        atkMod: -0.10,
        defMod: 0.15,
        heatDissipMod: 0,
    },
    cautious: {
        id: 'cautious',
        name: 'Cautious',
        desc: 'Prolongs combat, less risk, better Heat dissipation.',
        icon: '❄',
        atkMod: -0.20,
        defMod: 0.10,
        heatDissipMod: 0.25,
    },
};

// ─── Targeting Policy Definitions (§3.2) ─────────────────────────────────────
export const TARGETING_POLICIES = {
    auto: {
        id: 'auto',
        name: 'Auto',
        desc: 'Weighted standard distribution.',
        icon: '◎',
        weights: { torso: 40, left_arm: 20, right_arm: 20, legs: 20 },
    },
    aggressive: {
        id: 'aggressive',
        name: 'Aggressive',
        desc: 'Prioritizes Torso — quick kill, but risky.',
        icon: '☠',
        weights: { torso: 60, left_arm: 10, right_arm: 10, legs: 20 },
    },
    tactical: {
        id: 'tactical',
        name: 'Tactical',
        desc: 'Prioritizes Arms — disarm the enemy.',
        icon: '✂',
        weights: { torso: 10, left_arm: 35, right_arm: 35, legs: 20 },
    },
    defensive: {
        id: 'defensive',
        name: 'Defensive',
        desc: 'Prioritizes Legs — prevent escape and advance.',
        icon: '⊘',
        weights: { torso: 15, left_arm: 15, right_arm: 15, legs: 55 },
    },
};

// ─── Token Definitions (Sprint 2B) ───────────────────────────────────────────
export const TOKEN_DEFS = {
    BREACH: {
        id: 'BREACH',
        name: 'Breach',
        icon: '🔓',
        color: '#f55',
        desc: 'Compromised armor. +1 damage taken per stack.',
        maxStacks: 5,
    },
    BURN: {
        id: 'BURN',
        name: 'Burn',
        icon: '🔥',
        color: '#f80',
        desc: 'On fire. Start of turn: d6 per stack; 4+ = 1 damage.',
        maxStacks: 4,
    },
    ERROR: {
        id: 'ERROR',
        name: 'Error',
        icon: '⚡',
        color: '#ff0',
        desc: 'System unstable. 50% chance to lose turn & take Stress.',
        maxStacks: 3,
    },
    SLOW: {
        id: 'SLOW',
        name: 'Slow',
        icon: '🐢',
        color: '#88f',
        desc: 'Locomotion impaired. -10 Accuracy/Evasion per stack.',
        maxStacks: 3,
    },
    TARGET_LOCK: {
        id: 'TARGET_LOCK',
        name: 'Target Lock',
        icon: '🎯',
        color: '#f0f',
        desc: 'Target painted. Attacker gains +1 Bonus Die.',
        maxStacks: 1,
    },
    SUPPRESS: {
        id: 'SUPPRESS',
        name: 'Suppressed',
        icon: '🛡️',
        color: '#888',
        desc: 'Under fire. -1 Damage Dealt per stack.',
        maxStacks: 3,
    },
};

// Default turn duration for each token type (turns remaining when applied/refreshed)
const TOKEN_DURATION = {
    BREACH: 3,
    BURN: 4,
    ERROR: 3,
    SLOW: 3,
    TARGET_LOCK: 1,
    SUPPRESS: 2,
};

// ─── Weapon Constants (§3.3) ──────────────────────────────────────────────────
export const DICE_VALUES = {
    d4: { sides: 4, supplyPerUse: 0.33 },
    d6: { sides: 6, supplyPerUse: 0.5 },
    d8: { sides: 8, supplyPerUse: 1 },
    d10: { sides: 10, supplyPerUse: 2 },
    d12: { sides: 12, supplyPerUse: 3 },
};

export const CATEGORY_ATTR = {
    fight: 'mus', // Muscle -> melee
    short: 'ref', // Reflexes -> firearms
    long: 'foc',  // Focus -> artillery
};

// ─── Part display names for log ───────────────────────────────────────────────
const PART_NAMES = {
    torso: 'TORSO',
    left_arm: 'LEFT ARM',
    right_arm: 'RIGHT ARM',
    legs: 'LEGS',
};

/**
 * Weighted random part selection respecting destroyed parts.
 * @param {Object} targetFrame
 * @param {string} policyId
 * @returns {string} partId
 */
function selectTargetPartWeighted(targetFrame, policyId = 'auto') {
    const policy = TARGETING_POLICIES[policyId] || TARGETING_POLICIES.auto;
    const weights = policy.weights;

    // Filter out destroyed parts, redistribute weight
    const available = {};
    let totalWeight = 0;

    for (const [partId, weight] of Object.entries(weights)) {
        const part = targetFrame.parts[partId];
        if (part && part.status !== 'destroyed') {
            available[partId] = weight;
            totalWeight += weight;
        }
    }

    // All parts destroyed except torso fallback
    if (totalWeight === 0) return 'torso';

    // Weighted random selection
    let roll = Math.random() * totalWeight;
    for (const [partId, weight] of Object.entries(available)) {
        roll -= weight;
        if (roll <= 0) return partId;
    }

    return 'torso'; // fallback
}

/**
 * CombatRunner — manages the active combat encounter.
 * Follows the Runner pattern from the implementation plan.
 */
export default class CombatRunner {
    constructor(state, game = null) {
        this.state = state;
        /** @type {import('@/game').default|null} Reference to Game for skill bonus queries */
        this.game = game;

        // Active encounter state
        this.active = false;
        this.mission = null;
        this.enemies = [];
        this.turnNumber = 0;
        this.turnTimer = 0;
        this.combatLog = [];
        this.result = null;

        // Maneuver loadout
        this.equippedManeuvers = []; // IDs
        this.position = 'fighter';   // 'fighter' | 'scout' | 'gunner'

        // Configuration (locked during combat)
        this.stance = 'balanced';
        this.targeting = 'auto';

        this.activeModifiers = { damageMult: 1, accuracyBonus: 0 };
        // Per-turn defense modifier (set by instincts like Berserker, reset each turn)
        this.turnDefMod = 0;
    }

    // ─── Token Management (§8) ────────────────────────────────────────────────

    applyToken(frame, tokenType, stacks = 1) {
        const def = TOKEN_DEFS[tokenType];
        if (!def) return 0;

        if (!frame.tokens) frame.tokens = [];

        const duration = TOKEN_DURATION[tokenType];
        const existing = frame.tokens.find(t => t.type === tokenType);
        if (existing) {
            const before = existing.stacks;
            existing.stacks = Math.min(existing.stacks + stacks, def.maxStacks);
            // Refresh duration on reapply
            if (duration !== undefined) existing.turns = duration;
            return existing.stacks - before;
        }

        // Limit 6 different token types per unit
        if (frame.tokens.length >= 6) return 0;

        const applied = Math.min(stacks, def.maxStacks);
        const token = { type: tokenType, stacks: applied };
        if (duration !== undefined) token.turns = duration;
        frame.tokens.push(token);
        return applied;
    }

    removeToken(frame, tokenType, stacks = 1) {
        if (!frame.tokens) return 0;

        const existing = frame.tokens.find(t => t.type === tokenType);
        if (!existing) return 0;

        const removed = Math.min(stacks, existing.stacks);
        existing.stacks -= removed;

        if (existing.stacks <= 0) {
            frame.tokens = frame.tokens.filter(t => t.type !== tokenType);
        }

        return removed;
    }

    getTokenStacks(frame, tokenType) {
        if (!frame || !frame.tokens || !Array.isArray(frame.tokens)) return 0;
        const token = frame.tokens.find(t => t.type === tokenType);
        return token ? token.stacks : 0;
    }

    clearTokens(frame) {
        frame.tokens = [];
    }

    processTokenEffects(frame, frameName) {
        if (!frame || !frame.tokens || !Array.isArray(frame.tokens) || frame.tokens.length === 0) return;

        // --- BURN ---
        const burnToken = frame.tokens.find(t => t.type === 'BURN');
        if (burnToken) {
            let totalBurnDamage = 0;
            let stacksRemoved = 0;

            // Roll d6 PER STACK
            for (let i = burnToken.stacks; i > 0; i--) {
                const roll = Math.floor(Math.random() * 6) + 1;
                if (roll >= 4) {
                    totalBurnDamage += 1;
                } else {
                    // Roll <= 3: this stack extinguishes
                    stacksRemoved++;
                }
            }

            // Apply BURN damage
            if (totalBurnDamage > 0) {
                // BURN damage hits random part (auto weighted)
                const targetPart = selectTargetPartWeighted(frame, 'auto');

                // Check for BREACH interaction: BURN damage is amplified by BREACH
                const breachStacks = this.getTokenStacks(frame, 'BREACH');
                const finalBurnDamage = totalBurnDamage + breachStacks;

                CombatUtils.applyDamage(frame, targetPart, finalBurnDamage);

                let logMsg = `  🔥 ${frameName} burns! ${totalBurnDamage} dmg`;
                if (breachStacks > 0) logMsg += ` (+${breachStacks} BREACH)`;
                logMsg += ` → ${PART_NAMES[targetPart] || targetPart}`;

                this.combatLog.push(logMsg); // Add to visible log
                // Assuming we want a specific log type/color, we might push to a structured log if UI supports it, 
                // but here we mainly push to combatLog array which is strings. 
                // If Log.add supports types, we use that too.
            }

            // Remove extinguished stacks
            if (stacksRemoved > 0) {
                this.removeToken(frame, 'BURN', stacksRemoved);
                const remaining = this.getTokenStacks(frame, 'BURN');
                if (remaining === 0) {
                    this.combatLog.push(`  🔥 ${frameName}: flames extinguished.`);
                } else {
                    this.combatLog.push(`  🔥 ${frameName}: ${stacksRemoved} BURN stacks extinguished. [${remaining} remaining]`);
                }
            }
        }

        // Decay turns for all tokens (deterministic per-turn lifetime)
        for (const token of frame.tokens) {
            if (token.turns !== undefined) {
                token.turns--;
            }
        }

        // Log expired tokens before removing
        const expired = frame.tokens.filter(t => t.turns !== undefined && t.turns <= 0);
        if (expired.length > 0) {
            this.combatLog.push(`  ⏱ ${frameName}: ${expired.map(t => TOKEN_DEFS[t.type]?.name || t.type).join(', ')} expired.`);
        }

        // Clean up 0 stacks or expired turns
        frame.tokens = frame.tokens.filter(t => t.stacks > 0 && (t.turns === undefined || t.turns > 0));
    }

    // ─── Stance & Targeting setters (locked during combat) ───────────────────

    setStance(stanceId) {
        if (this.active) return; // Locked during combat
        if (!STANCES[stanceId]) return;
        this.stance = stanceId;
    }

    setTargeting(policyId) {
        if (this.active) return; // Locked during combat
        if (!TARGETING_POLICIES[policyId]) return;
        this.targeting = policyId;
    }

    setPosition(pos) {
        if (this.active) return; // Locked during combat
        if (!['fighter', 'scout', 'gunner'].includes(pos)) return;
        this.position = pos;
    }

    // ─── Enemy cloning ────────────────────────────────────────────────────────

    _cloneEnemy(template) {
        const e = JSON.parse(JSON.stringify(template));

        // Ensure parts exist and each part has an id (UI relies on part.id for :key)
        if (e.parts && typeof e.parts === 'object') {
            for (const [pid, part] of Object.entries(e.parts)) {
                part.id = part.id || pid;
                part.status = part.status || 'operational';
                part.maxHp = part.maxHp ?? part.hp ?? 1;
                part.hp = part.hp ?? part.maxHp;
                part.integrity = part.integrity ?? 1;
            }
        }

        // Normalize combat fields
        e.heat = e.heat ?? 0;
        e.stress = e.stress ?? 0;
        e.tokens = e.tokens ?? [];

        return e;
    }

    // ─── Mission start ────────────────────────────────────────────────────────

    /**
     * Start a combat mission.
     */
    startMission(mission, enemies) {
        this.mission = mission;

        // Deep clone enemies so templates in GameState never get mutated by combat
        this.enemies = (enemies || []).map((t) => this._cloneEnemy(t));

        this.active = true;
        this.turnNumber = 1;
        this.turnTimer = 0;
        this.combatLog = [];
        this.result = null;

        // Reset player frame combat state (but keep structural damage persistent)
        const playerFrame = this.state.player.frame;
        playerFrame.heat = 0;
        playerFrame.stress = playerFrame.stress ?? 0;
        playerFrame.tokens = [];

        // Initialize tokens for enemies if not already
        for (const enemy of this.enemies) {
            enemy.tokens = enemy.tokens || [];
        }

        // Log mission start with active stance
        const stanceDef = STANCES[this.stance] || STANCES.balanced;
        const targetDef = TARGETING_POLICIES[this.targeting] || TARGETING_POLICIES.auto;
        const atkSign = stanceDef.atkMod >= 0 ? '+' : '';
        const defSign = stanceDef.defMod >= 0 ? '+' : '';

        const posIcons = { fighter: '⚔', scout: '👁', gunner: '🎯' };
        const posIcon = posIcons[this.position] || '◈';
        const equippedNames = this.equippedManeuvers
            .map(id => this.state.items[id]?.name).filter(Boolean).join(', ') || 'none';

        this.combatLog.push(`Deploying frame... Mission: ${mission.name}`);
        this.combatLog.push(`▶ Stance: ${stanceDef.name} (ATK ${atkSign}${Math.round(stanceDef.atkMod * 100)}% / DEF ${defSign}${Math.round(stanceDef.defMod * 100)}%)`);
        this.combatLog.push(`◎ Targeting: ${targetDef.name}`);
        this.combatLog.push(`${posIcon} Position: ${this.position.toUpperCase()} | Maneuvers: ${equippedNames}`);

        Log.add(`[COMBAT] Deploying frame... Mission: ${mission.name}`, 'combat');
        Log.add(`[COMBAT] ${stanceDef.icon} ${stanceDef.name} | ${targetDef.icon} ${targetDef.name} | ${posIcon} ${this.position.toUpperCase()}`, 'combat');

        Events.emit('COMBAT_START', { mission: mission.id });
    }

    // ─── Game loop ────────────────────────────────────────────────────────────

    /**
     * Update combat for one tick.
     */
    update(dt) {
        if (!this.active || this.result) return;

        const TURN_INTERVAL = 2.5; // Seconds per turn
        this.turnTimer += dt;

        if (this.turnTimer >= TURN_INTERVAL) {
            this.resolveTurn();
            this.turnTimer = 0;
        }
    }

    // ─── Turn resolution ──────────────────────────────────────────────────────

    /**
     * Resolve a single logical turn.
     */
    resolveTurn() {
        if (!this.active || this.result) return;

        const playerFrame = this.state.player.frame;

        // Reset per-turn maneuver modifiers (Berserker defMod etc.)
        this.turnDefMod = 0;

        // Instincts Phase
        this.processManeuvers('turn_start', { unit: playerFrame });

        // Action Phase — action_replace maneuvers take priority over standard attack
        if (this.canAct(playerFrame, 'Your Frame')) {
            const actionTarget = this.enemies.find(e => !CombatUtils.isFrameDestroyed(e));
            const maneuverUsed = this.processManeuvers('action', { unit: playerFrame, target: actionTarget });
            if (!maneuverUsed) {
                this.resolvePlayerAttack();
            }
        }

        // Each enemy attacks
        for (const enemy of this.enemies) {
            if (!CombatUtils.isFrameDestroyed(enemy)) {
                if (enemy.isBoss && enemy.bossPhases) {
                    this._checkBossPhases(enemy);
                }

                if (this.canAct(enemy, enemy.name)) {
                    this.resolveEnemyAttack(enemy);
                }
            }
        }

        // Maintenance Phase
        this.maintenancePhase(playerFrame, true); // true = is player (apply stance heat dissip)
        for (const enemy of this.enemies) this.maintenancePhase(enemy, false);

        // Check End Conditions
        this.checkEndConditions();

        this.turnNumber++;
    }

    resolvePlayerAttack() {
        const playerFrame = this.state.player.frame;

        // Player attacks the first operational enemy
        const target = this.enemies.find((e) => !CombatUtils.isFrameDestroyed(e));
        if (!target) return;

        const hit = this._executeAttack(playerFrame, target, this.targeting, true);
        if (!hit) {
            this.combatLog.push(`YOU missed ${target.name}.`);
        }
    }

    resolveEnemyAttack(enemy) {
        const playerFrame = this.state.player.frame;
        const hit = this._executeAttack(enemy, playerFrame, 'auto', false);
        if (!hit) {
            this.combatLog.push(`${enemy.name} missed YOU.`);
        }
    }

    _checkBossPhases(enemy) {
        if (!enemy.bossPhases) return;

        const currentPhaseIdx = enemy.currentPhase || 1;
        const nextPhase = enemy.bossPhases.find(p => p.phase === currentPhaseIdx + 1);

        if (!nextPhase) return; // No more phases

        let triggered = false;

        // Evaluate trigger conditions
        if (nextPhase.trigger === 'combat_start' && this.turnNumber === 1) triggered = true;

        // HP triggers
        if (nextPhase.trigger.startsWith('hp_below_')) {
            const threshold = parseInt(nextPhase.trigger.split('_')[2], 10) / 100;
            const totalHp = Object.values(enemy.parts || {}).reduce((sum, p) => sum + (p.hp || 0), 0);
            const totalMaxHp = Object.values(enemy.parts || {}).reduce((sum, p) => sum + (p.maxHp || 0), 0);
            if (totalMaxHp > 0 && totalHp / totalMaxHp <= threshold) triggered = true;
        }

        // Torso HP triggers
        if (nextPhase.trigger.startsWith('torso_hp_below_')) {
            const threshold = parseInt(nextPhase.trigger.split('_')[3], 10) / 100;
            const torso = enemy.parts?.torso;
            if (torso && torso.hp / torso.maxHp <= threshold) triggered = true;
        }

        // Heat triggers
        if (nextPhase.trigger.startsWith('heat_above_')) {
            const threshold = parseInt(nextPhase.trigger.split('_')[2], 10);
            if ((enemy.heat || 0) >= threshold) triggered = true;
        }

        if (triggered) {
            enemy.currentPhase = nextPhase.phase;

            // Log phase transition
            this.combatLog.push(`\n⚠ WARNING: ${enemy.name.toUpperCase()} HAS ENTERED PHASE ${nextPhase.phase}: ${nextPhase.name.toUpperCase()} ⚠`);

            // Check for dialogue
            if (enemy.narrative && enemy.narrative.dialogue) {
                const diag = enemy.narrative.dialogue.find(d => d.trigger === nextPhase.trigger);
                if (diag) {
                    this.combatLog.push(`${enemy.name}: "${diag.text}"`);
                }
            }

            // Apply phase modifiers (stack permanently onto attributes)
            if (!enemy.attributes) enemy.attributes = { atk: 0, def: 0 };
            enemy.phaseMods = enemy.phaseMods || { atkMod: 0, evasion: 0, damageMult: 1 };

            if (nextPhase.atkMod) enemy.phaseMods.atkMod += nextPhase.atkMod;
            if (nextPhase.evasion) enemy.phaseMods.evasion += nextPhase.evasion;
            if (nextPhase.damageMult) enemy.phaseMods.damageMult *= nextPhase.damageMult;
        }
    }

    /**
     * Check if a unit can act this turn (handles ERROR token).
     */
    canAct(unit, name) {
        const errorStacks = this.getTokenStacks(unit, 'ERROR');
        if (errorStacks > 0) {
            const roll = Math.floor(Math.random() * 6) + 1;
            // 4+ = Glitch triggers
            if (roll >= 4) {
                const stressDmg = 1;
                unit.stress = (unit.stress || 0) + stressDmg;

                this.removeToken(unit, 'ERROR', 1);

                this.combatLog.push(`⚡ ${name} [ERROR] System Malfunction! Action lost. (+${stressDmg} Stress)`);
                return false;
            }
        }
        return true;
    }

    // ─── Weapon Resolution (Frente A Polish) ───────────────────────────────────

    getActiveWeapon(frame) {
        const EQUIP_SLOTS = {
            left_hand: { accepts: 'hand', linkedPart: 'left_arm' },
            right_hand: { accepts: 'hand', linkedPart: 'right_arm' },
            left_shoulder: { accepts: 'shoulder', linkedPart: 'torso' },
            right_shoulder: { accepts: 'shoulder', linkedPart: 'torso' },
        };

        let bestWeapon = null;
        let bestDamage = -1;

        const equipped = frame.installedEquip || frame.equip || {};
        for (const [slotId, weaponId] of Object.entries(equipped)) {
            if (!weaponId) continue;
            const slot = EQUIP_SLOTS[slotId];
            if (!slot) continue;
            const part = frame.parts?.[slot.linkedPart];
            if (part && part.status === 'destroyed') continue;

            const weapon = this.state.items[weaponId];
            if (!weapon) continue;

            if (weapon.supplyCost > 0) {
                const supply = this.state.items['supply'];
                if (!supply || supply.val < weapon.supplyCost) continue;
            }

            if ((weapon.baseDamage || 0) > bestDamage) {
                bestDamage = weapon.baseDamage || 0;
                bestWeapon = weapon;
            }
        }
        return bestWeapon;
    }

    getEnemyWeapon(enemy) {
        if (!enemy.weapons || enemy.weapons.length === 0) return null;
        for (const wid of enemy.weapons) {
            const w = this.state.items[wid];
            if (w) return w;
        }
        return null; // Fallback
    }

    rollWeaponDice(diceStr) {
        if (!diceStr) return 0;
        const sides = parseInt(diceStr.replace('d', ''), 10);
        if (!sides || isNaN(sides)) return 0;
        return Math.floor(Math.random() * sides) + 1;
    }

    /**
     * Execute one attack.
     * @param {Object} attacker
     * @param {Object} defender
     * @param {string} policy - targeting policy id
     * @param {boolean} isPlayer - true if attacker is the player
     */
    _executeAttack(attacker, defender, policy, isPlayer) {
        const modifiers = { ...this.activeModifiers };
        const stanceDef = STANCES[this.stance] || STANCES.balanced;

        // 1. Resolve Weapon
        let weapon = null;
        if (isPlayer) {
            weapon = this.getActiveWeapon(attacker);
        } else {
            weapon = this.getEnemyWeapon(attacker);
        }

        // Weapon properties fallback
        const wpnName = weapon ? weapon.name : 'Unarmed Strike';
        const wpnAcc = weapon ? (weapon.accuracyMod || 0) : 0;
        const wpnDmg = weapon ? (weapon.baseDamage || 1) : 1;
        const wpnHeat = weapon ? (weapon.heatGen || 5) : 5;
        const wpnSupply = weapon ? (weapon.supplyCost || 0) : 0;

        // ── Stance modifiers ──────────────────────────────────────────────────
        if (isPlayer) {
            modifiers.accuracyBonus = (modifiers.accuracyBonus || 0) + Math.round(stanceDef.atkMod * 100);
        } else {
            modifiers.accuracyBonus = (modifiers.accuracyBonus || 0) - Math.round(stanceDef.defMod * 100);
            // Maneuver defMod: negative = player more vulnerable (enemy gets higher accuracy)
            modifiers.accuracyBonus -= Math.round((this.turnDefMod || 0) * 100);
        }

        modifiers.accuracyBonus += wpnAcc;

        // ── Boss Phase Modifiers ──────────────────────────────────────────────
        if (attacker.phaseMods) {
            modifiers.accuracyBonus = (modifiers.accuracyBonus || 0) + Math.round((attacker.phaseMods.atkMod || 0) * 100);
            modifiers.damageMult = (modifiers.damageMult || 1) * (attacker.phaseMods.damageMult || 1);
        }
        if (defender.phaseMods) {
            modifiers.accuracyBonus = (modifiers.accuracyBonus || 0) - Math.round((defender.phaseMods.evasion || 0) * 100);
        }

        // ── Heat & Stress penalties (§7.1, §7.2) ─────────────────────────────
        const chassis = isPlayer ? this.state.items[attacker.chassisId] : null;
        const heatCap = chassis ? chassis.heatCap : 100;

        if ((attacker.heat || 0) >= heatCap * 0.76) {
            modifiers.accuracyBonus = (modifiers.accuracyBonus || 0) - 15;
        }
        if ((attacker.stress || 0) >= 51) {
            modifiers.accuracyBonus = (modifiers.accuracyBonus || 0) - 10;
        }

        // ── Token Effects: SLOW ───────────────────────────────────────────────
        const attackerSlow = this.getTokenStacks(attacker, 'SLOW');
        const defenderSlow = this.getTokenStacks(defender, 'SLOW');
        if (attackerSlow > 0) modifiers.accuracyBonus -= (10 * attackerSlow);
        if (defenderSlow > 0) modifiers.accuracyBonus += (10 * defenderSlow);

        const targetPercent = Math.max(5, Math.min(95,
            CombatUtils.calculateTargetPercent(attacker, defender, modifiers)
        ));
        const result = rollD100(targetPercent);

        if (result.success) {
            const partId = selectTargetPartWeighted(defender, isPlayer ? policy : 'auto');
            const partName = PART_NAMES[partId] || partId.toUpperCase();

            // ── Damage Calculation ─────────────────────────────────────────────
            let damage = wpnDmg;
            if (weapon && weapon.dice) damage += this.rollWeaponDice(weapon.dice);
            if (result.critical) damage *= 2;

            // ── Token Effects: TARGET_LOCK (Bonus Dice — consumed on use) ────
            let bonusDiceCount = 1;
            if (this.getTokenStacks(defender, 'TARGET_LOCK') > 0) {
                bonusDiceCount += 1;
                this.combatLog.push(`${TOKEN_DEFS.TARGET_LOCK.icon} Target Locked! +1 Bonus Die`);
                this.removeToken(defender, 'TARGET_LOCK', 1); // consume on use
            }

            const bonusDice = rollBonusPool(bonusDiceCount);
            const bonusResults = resolveBonusDice(bonusDice);
            if (bonusResults.directHits > 0) {
                damage += bonusResults.bonusAvaria * 10;
                defender.stress = (defender.stress || 0) + bonusResults.bonusStress;
            }

            if (isPlayer) damage = Math.round(damage * (1 + stanceDef.atkMod));
            damage *= modifiers.damageMult || 1;

            // Sub-skill: First Blood — +% damage on first attack of the fight
            if (isPlayer && this.turnNumber === 1 && this.game) {
                const firstBlood = this.game.getSkillBonus('combat_first_dmg_bonus');
                if (firstBlood > 0) damage = Math.round(damage * (1 + firstBlood));
            }

            const breachStacks = this.getTokenStacks(defender, 'BREACH');
            if (breachStacks > 0) damage += breachStacks;

            const suppressStacks = this.getTokenStacks(attacker, 'SUPPRESS');
            if (suppressStacks > 0) damage = Math.max(1, damage - suppressStacks);

            // ── Pre-hit Dodge Check (evasive reactions fire BEFORE damage lands) ─
            if (!isPlayer) {
                for (const id of this.equippedManeuvers) {
                    const m = this.state.items[id];
                    if (!m || !m.owned || m.trigger !== 'on_hit_received') continue;
                    if (!m.effect?.dodgeChance) continue;
                    if (m.position && m.position !== this.position && m.position !== 'any') continue;
                    if (Math.random() < m.effect.dodgeChance) {
                        this.combatLog.push(`↩ ${m.name}: ${m.trigger_desc || 'Attack evaded!'}`);
                        this.activeModifiers = { damageMult: 1, accuracyBonus: 0 };
                        return false; // treated as miss — damage never lands
                    }
                }
            }

            const dmgResult = CombatUtils.applyDamage(defender, partId, damage);

            // ── Build log line ─────────────────────────────────────────────────
            const critTag = result.critical ? ' [CRITICAL!]' : '';
            const breachTag = breachStacks > 0 ? ` (+${breachStacks} 🔓)` : '';
            const destroyTag = dmgResult.destroyed ? ` ⚠ ${partName} DESTROYED!` : (dmgResult.integrityLoss ? ` ↓ ${partName} integrity lost!` : '');
            const attName = isPlayer ? 'YOU' : attacker.name;
            const defName = isPlayer ? defender.name : 'YOU';

            this.combatLog.push(
                `${attName} fired [${wpnName}] → ${partName} on ${defName} [${Math.round(damage)} dmg]${critTag}${breachTag}${destroyTag}`
            );

            // ── Apply Tokens (Weapon / BREACH) ────────────────────────────────
            if (isPlayer && result.critical) {
                if (this.applyToken(defender, 'BREACH', 1) > 0) {
                    this.combatLog.push(`🔓 BREACH! Armor compromised.`);
                }
            }

            if (weapon && weapon.tokenOnHit) {
                for (const { type, chance, stacks } of weapon.tokenOnHit) {
                    if (Math.random() < chance) {
                        if (this.applyToken(defender, type, stacks || 1) > 0) {
                            const def = TOKEN_DEFS[type];
                            this.combatLog.push(`${def.icon} ${wpnName} applied ${def.name}!`);
                        }
                    }
                }
            }

            // Enemy faction token-on-hit (combat identity pass)
            if (!isPlayer && attacker.tokenOnHit) {
                for (const { type, chance, stacks } of attacker.tokenOnHit) {
                    if (Math.random() < chance) {
                        if (this.applyToken(defender, type, stacks || 1) > 0) {
                            const tokenDef = TOKEN_DEFS[type];
                            this.combatLog.push(`${tokenDef.icon} ${attacker.name} applied ${tokenDef.name}!`);
                        }
                    }
                }
            }

            if (dmgResult.integrityLoss || dmgResult.destroyed) {
                this.processManeuvers('on_hit_received', { unit: defender, attacker });
            }

            // Supply Consumption
            if (isPlayer && wpnSupply > 0) {
                const supply = this.state.items['supply'];
                if (supply) supply.val = Math.max(0, supply.val - wpnSupply);
            }

            // Sub-skill: Heat Mgmt — reduce heat generation
            let heatMult = chassis ? chassis.heatGenMod : 1;
            if (isPlayer && this.game) {
                const heatRed = this.game.getSkillBonus('heat_gen_reduction');
                if (heatRed > 0) heatMult *= (1 - heatRed);
            }
            attacker.heat = Math.min(heatCap, (attacker.heat || 0) + wpnHeat * heatMult);
            this.activeModifiers = { damageMult: 1, accuracyBonus: 0 };
            return true;
        }

        // Supply Consumption on MISS
        if (isPlayer && wpnSupply > 0) {
            const supply = this.state.items['supply'];
            if (supply) supply.val = Math.max(0, supply.val - wpnSupply);
        }

        const chassisMiss = isPlayer ? this.state.items[attacker.chassisId] : null;
        const heatCapMiss = chassisMiss ? chassisMiss.heatCap : 100;
        let heatMultMiss = chassisMiss ? chassisMiss.heatGenMod : 1;
        if (isPlayer && this.game) {
            const heatRed = this.game.getSkillBonus('heat_gen_reduction');
            if (heatRed > 0) heatMultMiss *= (1 - heatRed);
        }

        attacker.heat = Math.min(heatCapMiss, (attacker.heat || 0) + Math.ceil(wpnHeat / 2) * heatMultMiss);
        this.activeModifiers = { damageMult: 1, accuracyBonus: 0 };
        return false;
    }

    // ─── Maintenance phase ────────────────────────────────────────────────────

    /**
     * @param {Object} unit
     * @param {boolean} isPlayer - if true, apply stance heatDissipMod
     */
    maintenancePhase(unit, isPlayer = false) {
        // Process Tokens (BURN, etc) BEFORE heat processing
        const name = isPlayer ? 'Your Frame' : unit.name;
        this.processTokenEffects(unit, name);

        const BASE_HEAT_DISSIP = 15;
        const enr = isPlayer ? (this.state.player.frame.attributes?.enr || 0) : 50;
        const enrMod = 1 + (enr / 100);

        let stanceMod = 1;
        let chassisDissipMod = 1;
        let stressInc = 0.5;

        if (isPlayer) {
            const stanceDef = STANCES[this.stance] || STANCES.balanced;
            stanceMod = 1 + (stanceDef.heatDissipMod || 0);

            const chassis = this.state.items[this.state.player.frame.chassisId];
            if (chassis) {
                chassisDissipMod = chassis.heatDissipMod || 1;
                stressInc = chassis.stressPerTurn || 0.5;
            }
        }

        const finalHeatDissip = Math.round(BASE_HEAT_DISSIP * enrMod * stanceMod * chassisDissipMod);
        unit.heat = Math.max(0, (unit.heat || 0) - finalHeatDissip);

        // Stress increases slightly every turn unless specialized recovery exists
        unit.stress = (unit.stress || 0) + stressInc;

        if (unit.maneuvers) {
            unit.maneuvers.forEach((m) => {
                if (m.cooldown > 0) m.cooldown--;
            });
        }
    }

    // ─── End conditions ───────────────────────────────────────────────────────

    checkEndConditions() {
        const playerFrame = this.state.player.frame;

        // --- DEFEAT CHECK ---
        const structuralFailure = CombatUtils.isFrameDestroyed(playerFrame);
        const chassis = this.state.items[playerFrame.chassisId];
        const heatCap = chassis ? chassis.heatCap : 100;

        const heatShutdown = (playerFrame.heat || 0) >= heatCap;
        const stressCollapse = (playerFrame.stress || 0) >= 100;

        if (structuralFailure || heatShutdown || stressCollapse) {
            let reason = 'DEFEAT';
            if (heatShutdown) {
                reason = 'HEAT SHUTDOWN';
                this.combatLog.push('⚠ CRITICAL: Reactor emergency shutdown! Cooling system failed.');
            } else if (stressCollapse) {
                reason = 'STRESS COLLAPSE';
                this.combatLog.push('⚠ CRITICAL: Neural link severed! Pilot feedback saturation.');
            }

            this.clearTokens(playerFrame);
            this.endCombat('defeat', reason);
            return;
        }

        // --- VICTORY CHECK ---
        const allEnemiesDestroyed = this.enemies.every((e) => {
            const structural = CombatUtils.isFrameDestroyed(e);
            const thermal = (e.heat || 0) >= 100;
            const neural = (e.stress || 0) >= 100;
            return structural || thermal || neural;
        });

        if (allEnemiesDestroyed) {
            // Find specific reason for last enemy destroyed? Or just victory
            this.clearTokens(playerFrame);
            this.endCombat('victory');
        }
    }

    endCombat(result, reason = null) {
        if (this.result) return; // prevent double-end

        this.result = result;
        this.active = false;

        this.combatLog.push(`── Combat Ended: ${result.toUpperCase()} ${reason ? `(${reason})` : ''} ──`);
        Log.add(`[COMBAT] Combat Ended: ${result.toUpperCase()}${reason ? ` - ${reason}` : ''}`, 'combat');

        if (result === 'victory') {
            const rewards = this.mission.rewards || { glory: 1, scrap: 10 };
            this._awardRewards(rewards, `mission:${this.mission.id}:rewards`);

            if ((this.mission.completed || 0) === 0 && this.mission.firstClearBonus) {
                this._awardRewards(this.mission.firstClearBonus, `mission:${this.mission.id}:first_clear`);
            }
            this.mission.completed = (this.mission.completed || 0) + 1;

            // Phase 4: Salvage & Degradation
            this._processSalvage();
            this._degradePlayerParts();
        } else {
            const failRewards = this.mission.failRewards || { scrap: 2 };
            this._awardRewards(failRewards, `mission:${this.mission.id}:fail`);
        }

        Events.emit('COMBAT_END', { result, reason, mission: this.mission.id });
    }

    _awardRewards(rewards, source = 'combat') {
        if (!rewards) return;
        const standard = {};
        for (const [key, value] of Object.entries(rewards)) {
            if (key.startsWith('rep_')) {
                Events.emit('FACTION_REP_AWARD_REQUEST', { repId: key, amount: value, source });
            } else {
                standard[key] = value;
            }
        }
        if (Object.keys(standard).length > 0) {
            this.state.award(standard);
        }
    }

    _processSalvage() {
        const salvaged = [];
        this.enemies.forEach(enemy => {
            if (CombatUtils.isFrameDestroyed(enemy) || (enemy.heat || 0) >= 100 || (enemy.stress || 0) >= 100) {
                if (enemy.drops) {
                    enemy.drops.forEach(drop => {
                        if (Math.random() < drop.chance) {
                            const partTemplate = this.state.items[drop.id];
                            if (partTemplate) {
                                const newPart = {
                                    id: `${drop.id}_salvage_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                                    templateId: drop.id,
                                    name: partTemplate.name,
                                    type: 'frame_part',
                                    slot: partTemplate.slot,
                                    condition: Math.round((0.3 + Math.random() * 0.4) * 100) / 100,
                                    hp: partTemplate.hp,
                                    maxHp: partTemplate.maxHp,
                                    integrity: partTemplate.integrity,
                                    armor: partTemplate.armor,
                                    origin: partTemplate.origin
                                };
                                this.state.player.partsInventory.push(newPart);
                                salvaged.push(partTemplate.name);
                            }
                        }
                    });
                }
            }
        });

        if (salvaged.length > 0) {
            this.combatLog.push(`🛠 SALVAGE RECOVERED: ${salvaged.join(', ')}`);
        }
    }

    _degradePlayerParts() {
        const frame = this.state.player.frame;
        for (const slot in frame.parts) {
            const part = frame.parts[slot];
            if (part && part.status !== 'destroyed') {
                part.condition = Math.max(0, Math.round(((part.condition || 1.0) - 0.05) * 100) / 100);
            }
        }
        // Force stat recalculation in game logic if needed
    }

    // ─── Serialization ────────────────────────────────────────────────────────

    toJSON() {
        return {
            active: this.active,
            missionId: this.mission?.id || null,
            enemies: this.enemies,
            turnNumber: this.turnNumber,
            turnTimer: this.turnTimer,
            combatLog: this.combatLog,
            result: this.result,
            stance: this.stance,
            targeting: this.targeting,
            position: this.position,
            equippedManeuvers: this.equippedManeuvers,
            playerTokens: this.state.player.frame.tokens || [],
        };
    }

    fromJSON(data) {
        if (!data) return;
        this.active = !!data.active;
        this.mission = this.state.get(data.missionId);
        this.enemies = (data.enemies || []).map((e) => this._cloneEnemy(e));
        this.turnNumber = data.turnNumber || 1;
        this.turnTimer = data.turnTimer || 0;
        this.combatLog = data.combatLog || [];
        this.result = data.result || null;
        this.stance = data.stance || 'balanced';
        this.targeting = data.targeting || 'auto';
        this.position = data.position || 'fighter';
        this.equippedManeuvers = data.equippedManeuvers || [];

        if (data.playerTokens) {
            this.state.player.frame.tokens = data.playerTokens;
        }
        // Enemies tokens are restored via this.enemies map (since tokens are part of enemy object)
    }

    // ─── Maneuver system ──────────────────────────────────────────────────────

    setManeuvers(ids) {
        this.equippedManeuvers = (ids || []).slice(0, 3);
    }

    processManeuvers(phase, context) {
        // Safe check for items map
        if (!this.state.items) return false;

        for (const id of this.equippedManeuvers) {
            const mnvr = this.state.items[id];
            if (!mnvr || mnvr.owned === 0) continue;

            // Position gate: maneuver must match current position or be universal
            if (mnvr.position && mnvr.position !== this.position && mnvr.position !== 'any') continue;

            if (phase === 'turn_start' && mnvr.trigger === 'turn_start') {
                this._executeInstinct(mnvr, context);
            }
            // on_hit_received: only counter-attack reactions (dodge is checked pre-damage)
            if (phase === 'on_hit_received' && mnvr.trigger === 'on_hit_received' && !mnvr.effect?.dodgeChance) {
                this._executeReaction(mnvr, context);
            }
            if (phase === 'action' && mnvr.trigger === 'action_replace') {
                return this._executeManeuver(mnvr, context);
            }
        }
        return false;
    }

    _executeInstinct(mnvr, { unit }) {
        if (mnvr.triggerCondition === 'stress>60' && (unit.stress || 0) < 60) return;

        const desc = mnvr.trigger_desc ? ` — ${mnvr.trigger_desc}` : '';
        this.combatLog.push(`◈ ${mnvr.name}${desc}`);

        // ATK boost: adds to damageMult (applied to player damage this turn)
        if (mnvr.effect?.atkMod) this.activeModifiers.damageMult += mnvr.effect.atkMod;
        // Accuracy boost (e.g. Lock & Load)
        if (mnvr.effect?.accuracyMod) this.activeModifiers.accuracyBonus += mnvr.effect.accuracyMod * 100;
        // DEF penalty: stored separately, applied to enemy accuracy in _executeAttack
        if (mnvr.effect?.defMod) this.turnDefMod = (this.turnDefMod || 0) + mnvr.effect.defMod;
    }

    _executeReaction(mnvr, { unit, attacker }) {
        const desc = mnvr.trigger_desc ? ` — ${mnvr.trigger_desc}` : '';
        this.combatLog.push(`↩ ${mnvr.name}${desc}`);

        if (mnvr.effect?.counterAttack && attacker) {
            // Scale counter damage off player's current weapon
            const weapon = this.getActiveWeapon(unit);
            const baseDmg = weapon ? (weapon.baseDamage || 5) : 5;
            const dmg = Math.max(1, Math.round(baseDmg * (mnvr.effect.damageMod || 0.5)));
            CombatUtils.applyDamage(attacker, 'torso', dmg);
            this.combatLog.push(`  ↩ Counter-strike: ${dmg} dmg → ${attacker.name}`);

            // Heat cost from counter-attack
            if (mnvr.effect?.heatGen) {
                const chassis = this.state.items[unit.chassisId];
                const heatCap = chassis ? chassis.heatCap : 100;
                unit.heat = Math.min(heatCap, (unit.heat || 0) + mnvr.effect.heatGen);
            }
        }
    }

    _executeManeuver(mnvr, { unit, target }) {
        const desc = mnvr.trigger_desc ? ` — ${mnvr.trigger_desc}` : '';
        this.combatLog.push(`▶ ${mnvr.name}${desc}`);

        if (!target) return true; // consumed the action even if no target

        if (mnvr.effect?.replaceAttack) {
            const weapon = this.getActiveWeapon(unit);
            const baseDmg = weapon ? (weapon.baseDamage || 5) : 5;
            // damageMod of 1.0 → 2× weapon damage
            const damage = Math.round(baseDmg * (1 + (mnvr.effect.damageMod || 1)));

            const partId = selectTargetPartWeighted(target, this.targeting);
            const partName = PART_NAMES[partId] || partId.toUpperCase();
            const dmgResult = CombatUtils.applyDamage(target, partId, damage);

            const destroyTag = dmgResult.destroyed ? ` ⚠ ${partName} DESTROYED!` : '';
            this.combatLog.push(`▶ STRIKE → ${partName} on ${target.name} [${damage} dmg]${destroyTag}`);

            // Heat cost
            if (mnvr.effect?.heatGen) {
                const chassis = this.state.items[unit.chassisId];
                const heatCap = chassis ? chassis.heatCap : 100;
                unit.heat = Math.min(heatCap, (unit.heat || 0) + mnvr.effect.heatGen);
            }
        }

        return true; // action was consumed by maneuver
    }
}
