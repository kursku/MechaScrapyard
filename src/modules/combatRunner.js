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
        e.tokens = e.tokens ?? {};

        return e;
    }

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
        playerFrame.tokens = playerFrame.tokens ?? {};

        this.combatLog.push(`Deploying frame... Mission: ${mission.name}`);
        Log.add(`[COMBAT] Deploying frame... Mission: ${mission.name}`, 'combat');

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
        if (!this.active || this.result) return;

        const playerFrame = this.state.player.frame;

        // Instincts Phase
        this.processManeuvers('turn_start', { unit: playerFrame });

        // Action Phase
        this.resolvePlayerAttack();

        // Each enemy attacks
        for (const enemy of this.enemies) {
            if (!CombatUtils.isFrameDestroyed(enemy)) {
                this.resolveEnemyAttack(enemy);
            }
        }

        // Maintenance Phase
        this.maintenancePhase(playerFrame);
        for (const enemy of this.enemies) this.maintenancePhase(enemy);

        // Check End Conditions
        this.checkEndConditions();

        this.turnNumber++;
    }

    resolvePlayerAttack() {
        const playerFrame = this.state.player.frame;

        // Player attacks the first operational enemy
        const target = this.enemies.find((e) => !CombatUtils.isFrameDestroyed(e));
        if (!target) return;

        const hit = this._executeAttack(playerFrame, target, this.targeting);
        this.combatLog.push(hit ? `YOU hit ${target.name}.` : `YOU missed ${target.name}.`);
    }

    resolveEnemyAttack(enemy) {
        const playerFrame = this.state.player.frame;
        const hit = this._executeAttack(enemy, playerFrame, 'auto');
        this.combatLog.push(hit ? `${enemy.name} hit YOU.` : `${enemy.name} missed YOU.`);
    }

    _executeAttack(attacker, defender, policy) {
        const modifiers = { ...this.activeModifiers };

        // Heat penalties (§7.1)
        if ((attacker.heat || 0) >= 76) {
            modifiers.accuracyBonus -= 15;
        }

        // Stress penalties (§7.2)
        if ((attacker.stress || 0) >= 51) {
            modifiers.accuracyBonus -= 10;
        }

        const targetPercent = CombatUtils.calculateTargetPercent(attacker, defender, modifiers);
        const result = rollD100(targetPercent);

        if (result.success) {
            const partId = CombatUtils.selectTargetPart(policy);

            let damage = 20;
            if (result.critical) damage *= 2;

            const bonusDice = rollBonusPool(1);
            const bonusResults = resolveBonusDice(bonusDice);
            if (bonusResults.directHits > 0) {
                damage += bonusResults.bonusAvaria * 10;
                defender.stress = (defender.stress || 0) + bonusResults.bonusStress;
            }

            damage *= modifiers.damageMult || 1;

            const dmgResult = CombatUtils.applyDamage(defender, partId, damage);

            if (dmgResult.integrityLoss || dmgResult.destroyed) {
                this.processManeuvers('on_hit_received', { unit: defender, attacker });
            }

            attacker.heat = Math.min(100, (attacker.heat || 0) + 10);
            this.activeModifiers = { damageMult: 1, accuracyBonus: 0 };
            return true;
        }

        attacker.heat = Math.min(100, (attacker.heat || 0) + 5);
        this.activeModifiers = { damageMult: 1, accuracyBonus: 0 };
        return false;
    }

    maintenancePhase(unit) {
        unit.heat = Math.max(0, (unit.heat || 0) - 15);
        unit.stress = (unit.stress || 0) + 0.5;

        if (unit.maneuvers) {
            unit.maneuvers.forEach((m) => {
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

        const allEnemiesDestroyed = this.enemies.every((e) => CombatUtils.isFrameDestroyed(e));
        if (allEnemiesDestroyed) {
            this.endCombat('victory');
        }
    }

    endCombat(result) {
        if (this.result) return; // prevent double-end

        this.result = result;
        this.active = false;

        this.combatLog.push(`Combat Ended: ${result.toUpperCase()}`);
        Log.add(`[COMBAT] Combat Ended: ${result.toUpperCase()}`, 'combat');

        if (result === 'victory') {
            const rewards = this.mission.rewards || { glory: 1, scrap: 10 };
            this.state.award(rewards);

            if ((this.mission.completed || 0) === 0 && this.mission.firstClearBonus) {
                this.state.award(this.mission.firstClearBonus);
            }
            this.mission.completed = (this.mission.completed || 0) + 1;
        } else {
            const failRewards = this.mission.failRewards || { scrap: 2 };
            this.state.award(failRewards);
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
            equippedManeuvers: this.equippedManeuvers,
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
        this.equippedManeuvers = data.equippedManeuvers || [];
    }

    setManeuvers(ids) {
        this.equippedManeuvers = (ids || []).slice(0, 3);
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
        if (mnvr.triggerCondition === 'stress>60' && (unit.stress || 0) < 60) return;

        this.combatLog.push(`Instinct: ${mnvr.name}`);
        if (mnvr.effect?.atkMod) this.activeModifiers.damageMult += mnvr.effect.atkMod;
        if (mnvr.effect?.accuracyMod) this.activeModifiers.accuracyBonus += mnvr.effect.accuracyMod * 100;
    }

    _executeReaction(mnvr, { unit, attacker }) {
        this.combatLog.push(`Reaction: ${mnvr.name}`);

        if (mnvr.effect?.counterAttack && attacker) {
            const dmg = 10 * (mnvr.effect.damageMod || 1);
            CombatUtils.applyDamage(attacker, 'torso', dmg, true);
        }
    }

    _executeManeuver(mnvr, { unit, target }) {
        this.combatLog.push(`Maneuver: ${mnvr.name}`);
    }
}