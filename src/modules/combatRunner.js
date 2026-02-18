import { rollD100, rollBonusPool, resolveBonusDice } from '@/util/dice';
import Log from '@/log';
import Events from '@/events';
import * as CombatUtils from './combat';

/**
 * CombatRunner — manages the active combat encounter.
 * Follows the Runner pattern from the implementation plan.
 */
export default class CombatRunner {
    constructor(state) {
        this.state = state;

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

        // Configuration
        this.stance = 'balanced';
        this.targeting = 'auto';

        this.activeModifiers = { damageMult: 1, accuracyBonus: 0 };
    }

    /**
     * Start a combat mission.
     */
    startMission(mission, enemies) {
        this.mission = mission;
        this.enemies = enemies;
        this.active = true;
        this.turnNumber = 1;
        this.turnTimer = 0;
        this.combatLog = [];
        this.result = null;

        // Reset player frame combat state
        const playerFrame = this.state.player.frame;
        playerFrame.heat = 0;

        Log.add(`[COMBAT] Mission Started: ${mission.name}`, 'combat');
        this.combatLog.push(`Mission Started: ${mission.name}`);

        Events.emit('COMBAT_START', { mission: mission.id });
    }

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

    /**
     * Resolve a single logical turn.
     */
    resolveTurn() {
        this.turnNumber++;
        const playerFrame = this.state.player.frame;

        // Instincts Phase
        this.processManeuvers('turn_start', { unit: playerFrame });

        // Action Phase
        this.resolvePlayerAttack();

        // Each enemy attacks
        this.enemies.forEach(enemy => {
            if (enemy.parts.torso.hp > 0) {
                this.resolveEnemyAttack(enemy);
            }
        });

        // Maintenance Phase
        this.maintenancePhase(playerFrame);
        this.enemies.forEach(enemy => this.maintenancePhase(enemy));

        // Check End Conditions
        this.checkEndConditions();
    }

    resolvePlayerAttack() {
        const playerFrame = this.state.player.frame;
        // For simplicity, player attacks the first operational enemy
        const target = this.enemies.find(e => e.parts.torso.hp > 0);
        if (!target) return;

        const success = this._executeAttack(playerFrame, target, this.targeting);
        if (success) {
            this.combatLog.push(`Player hit ${target.name}.`);
        } else {
            this.combatLog.push(`Player missed ${target.name}.`);
        }
    }

    resolveEnemyAttack(enemy) {
        const playerFrame = this.state.player.frame;
        const success = this._executeAttack(enemy, playerFrame, 'auto');
        if (success) {
            this.combatLog.push(`${enemy.name} hit Player.`);
        } else {
            this.combatLog.push(`${enemy.name} missed Player.`);
        }
    }

    _executeAttack(attacker, defender, policy) {
        // Apply penalties based on current state
        const modifiers = { ...this.activeModifiers };

        // Heat penalties (§7.1)
        if (attacker.heat >= 76) {
            modifiers.accuracyBonus -= 15;
            Log.add(`[COMBAT] ${attacker.name || 'Unit'} overheating! Sensors failing.`, 'warning');
        }

        // Stress penalties (§7.2)
        if (attacker.stress >= 51) {
            modifiers.accuracyBonus -= 10;
        }

        const targetPercent = CombatUtils.calculateTargetPercent(attacker, defender, modifiers);
        const result = rollD100(targetPercent);

        if (result.success) {
            const partId = CombatUtils.selectTargetPart(policy);
            let damage = 20; // Base damage placeholder
            if (result.critical) {
                Log.add(`[COMBAT] CRITICAL HIT!`, 'combat');
                damage *= 2;
            }

            const bonusDice = rollBonusPool(1);
            const bonusResults = resolveBonusDice(bonusDice);
            if (bonusResults.directHits > 0) {
                Log.add(`[COMBAT] DIRECT HIT!`, 'combat');
                damage += bonusResults.bonusAvaria * 10;
                defender.stress = (defender.stress || 0) + bonusResults.bonusStress;
            }

            damage *= (modifiers.damageMult || 1);

            const dmgResult = CombatUtils.applyDamage(defender, partId, damage);

            // Reaction check
            if (dmgResult.integrityLoss || dmgResult.destroyed || Math.random() < 0.3) {
                this.processManeuvers('on_hit_received', { unit: defender, attacker });
            }

            // Heat Generation (§7.1)
            // 10 heat per successful attack exertion
            attacker.heat = Math.min(100, (attacker.heat || 0) + 10);

            // Reset modifiers
            this.activeModifiers = { damageMult: 1, accuracyBonus: 0 };
            return true;
        } else {
            // Heat Generation also on miss (5 heat)
            attacker.heat = Math.min(100, (attacker.heat || 0) + 5);
            this.activeModifiers = { damageMult: 1, accuracyBonus: 0 };
            return false;
        }
    }

    maintenancePhase(unit) {
        // Heat Dissipation
        const dissipation = 15;
        unit.heat = Math.max(0, (unit.heat || 0) - dissipation);

        // Stress check
        unit.stress = (unit.stress || 0) + 0.5;

        // Cooldowns
        if (unit.maneuvers) {
            unit.maneuvers.forEach(m => {
                if (m.cooldown > 0) m.cooldown--;
            });
        }
    }

    checkEndConditions() {
        const playerFrame = this.state.player.frame;
        if (CombatUtils.isFrameDestroyed(playerFrame)) {
            this.endCombat('defeat');
            return;
        }

        const allEnemiesDestroyed = this.enemies.every(e => CombatUtils.isFrameDestroyed(e));
        if (allEnemiesDestroyed) {
            this.endCombat('victory');
        }
    }

    endCombat(result) {
        this.result = result;
        this.active = false;

        Log.add(`[COMBAT] Combat Ended: ${result.toUpperCase()}`, 'combat');
        this.combatLog.push(`Combat Ended: ${result.toUpperCase()}`);

        if (result === 'victory') {
            const rewards = this.mission.rewards || { glory: 1, scrap: 10 };
            this.state.award(rewards);
            Log.add(`[COMBAT] Rewards Awarded.`, 'loot');

            // First clear check
            if ((this.mission.completed || 0) === 0 && this.mission.firstClearBonus) {
                this.state.award(this.mission.firstClearBonus);
                Log.add(`[COMBAT] First Clear Bonus!`, 'loot');
            }
            this.mission.completed = (this.mission.completed || 0) + 1;
        } else {
            const failRewards = this.mission.failRewards || { scrap: 2 };
            this.state.award(failRewards);
            Log.add(`[COMBAT] Consolation Loot Awarded.`, 'loot');
        }

        Events.emit('COMBAT_END', { result, mission: this.mission.id });
    }

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
            equippedManeuvers: this.equippedManeuvers
        };
    }

    fromJSON(data) {
        if (!data) return;
        this.active = data.active;
        this.mission = this.state.get(data.missionId);
        this.enemies = data.enemies || [];
        this.turnNumber = data.turnNumber || 0;
        this.turnTimer = data.turnTimer || 0;
        this.combatLog = data.combatLog || [];
        this.result = data.result || null;
        this.stance = data.stance || 'balanced';
        this.targeting = data.targeting || 'auto';
        this.equippedManeuvers = data.equippedManeuvers || [];
    }

    setManeuvers(ids) {
        this.equippedManeuvers = ids.slice(0, 3);
    }

    processManeuvers(phase, context) {
        for (const id of this.equippedManeuvers) {
            const mnvr = this.state.items[id];
            if (!mnvr || mnvr.owned === 0) continue;

            if (phase === 'turn_start' && mnvr.trigger === 'turn_start') {
                this._executeInstinct(mnvr, context);
            }
            if (phase === 'on_hit_received' && mnvr.trigger === 'on_hit_received') {
                this._executeReaction(mnvr, context);
            }
            if (phase === 'action' && mnvr.trigger === 'action_replace') {
                return this._executeManeuver(mnvr, context);
            }
        }
        return false;
    }

    _executeInstinct(mnvr, { unit }) {
        if (mnvr.triggerCondition === 'stress>60' && unit.stress < 60) return;

        Log.add(`[COMBAT] ⚡ INSTINCT: ${unit.name || 'Pilot'} activates ${mnvr.name}!`, 'story');
        this.combatLog.push(`Instinct: ${mnvr.name}`);

        if (mnvr.effect.atkMod) {
            this.activeModifiers.damageMult += mnvr.effect.atkMod;
        }
        if (mnvr.effect.accuracyMod) {
            this.activeModifiers.accuracyBonus += mnvr.effect.accuracyMod * 100;
        }
    }

    _executeReaction(mnvr, { unit, attacker }) {
        Log.add(`[COMBAT] ⚡ REACTION: ${unit.name || 'Pilot'} activates ${mnvr.name}!`, 'story');
        this.combatLog.push(`Reaction: ${mnvr.name}`);

        if (mnvr.effect.counterAttack && attacker) {
            const dmg = 10 * (mnvr.effect.damageMod || 1);
            CombatUtils.applyDamage(attacker, 'torso', dmg, true);
        }

        if (mnvr.effect.dodgeChance) {
            // Dodge is handled differently, usually higher up in resolveAttack
            // For now, let's just log it if it's a reaction that could haveDodged
            Log.add(`[COMBAT] ${unit.name || 'Unit'} braced for impact.`, 'combat');
        }
    }

    _executeManeuver(mnvr, { unit, target }) {
        Log.add(`[COMBAT] ✦ MANEUVER: ${unit.name || 'Pilot'} activates ${mnvr.name}!`, 'story');
        this.combatLog.push(`Maneuver: ${mnvr.name}`);
        // Implement special maneuver logic here
    }
}
