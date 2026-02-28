<script>
import Game from "@/game";
import { fmt, pct } from '@/util/format';
import { STANCES, TARGETING_POLICIES, TOKEN_DEFS } from '@/modules/combatRunner';

export default {
    name: 'CombatPanel',
    props: ['state', 'combatRunner'],
    computed: {
        missions() {
            return Object.values(this.state.items)
                .filter(i => i.type === 'mission' && !i.locked)
                .sort((a, b) => a.difficulty - b.difficulty);
        },
        playerFrame() {
            return this.state.player.frame;
        },
        currentEnemies() {
            return this.combatRunner.enemies || [];
        },
        isInCombat() {
            return this.combatRunner.active;
        },
        combatResult() {
            return this.combatRunner.result;
        },
        showBattle() {
            return this.isInCombat || !!this.combatResult;
        },
        allManeuvers() {
            return Object.values(this.state.items).filter(i => i.type === 'maneuver');
        },
        ownedManeuvers() {
            const pos = this.combatRunner.position || 'fighter';
            return this.allManeuvers.filter(i =>
                i.owned > 0 && (!i.position || i.position === pos || i.position === 'any')
            );
        },
        shopManeuvers() {
            return this.allManeuvers.filter(i => i.owned === 0 && !i.locked);
        },
        positionOptions() {
            return [
                { id: 'fighter', icon: '⚔', label: 'FIGHTER', desc: 'High damage, counter-strike' },
                { id: 'scout',   icon: '👁', label: 'SCOUT',   desc: 'Speed, evasion, intel' },
                { id: 'gunner',  icon: '🎯', label: 'GUNNER',  desc: 'Accuracy, precision fire' },
            ];
        },
        activePosition() {
            const pos = this.combatRunner.position || 'fighter';
            const icons = { fighter: '⚔', scout: '👁', gunner: '🎯' };
            return `${icons[pos] || '◈'} ${pos.toUpperCase()}`;
        },
        equippedIds() {
            return this.combatRunner.equippedManeuvers || [];
        },
        stanceOptions() {
            return Object.values(STANCES);
        },
        targetingOptions() {
            return Object.values(TARGETING_POLICIES);
        },
        activeStance() {
            return STANCES[this.combatRunner.stance] || STANCES.balanced;
        },
        activeTargeting() {
            return TARGETING_POLICIES[this.combatRunner.targeting] || TARGETING_POLICIES.auto;
        },
        frameDamaged() {
            const parts = this.playerFrame?.parts;
            if (!parts) return false;
            return Object.values(parts).some(p => p.status === 'destroyed' || p.hp < p.maxHp);
        },
        // Full log reversed for newest-on-top; capped at 100 to avoid perf issues in long fights
        recentLog() {
            const log = this.combatRunner.combatLog || [];
            return log.slice(-100).reverse();
        },
        anyActiveTokens() {
            const playerTokens = this.playerFrame?.tokens?.length > 0;
            const enemyTokens = this.currentEnemies.some(e => e.tokens?.length > 0);
            return playerTokens || enemyTokens;
        },
        activeTokenTypes() {
            const types = new Set();
            (this.playerFrame?.tokens || []).forEach(t => types.add(t.type));
            this.currentEnemies.forEach(e => (e.tokens || []).forEach(t => types.add(t.type)));
            return Array.from(types);
        },
        playerPower() {
            const frame = this.playerFrame;
            if (!frame?.attributes) return 0;
            return (frame.attributes.atk || 0) + (frame.attributes.def || 0);
        },
    },
    methods: {
        fmt, pct,
        tokenDef(type) {
            return TOKEN_DEFS[type] || { icon: '?', color: '#fff', desc: '' };
        },
        startMission(mid) {
            Game.startMission(mid);
        },
        retreat() {
            Game.combatRunner.endCombat('defeat');
        },
        continueAfterCombat() {
            Game.combatRunner.result = null;
            Game.combatRunner.active = false;
            Game.combatRunner.combatLog = [];
        },
        buyManeuver(id) {
            Game.buyManeuver(id);
        },
        toggleEquip(id) {
            let list = [...this.equippedIds];
            if (list.includes(id)) {
                list = list.filter(i => i !== id);
            } else {
                if (list.length >= 3) return;
                list.push(id);
            }
            Game.equipManeuvers(list);
        },
        setStance(id) {
            Game.combatRunner.setStance(id);
        },
        setTargeting(id) {
            Game.combatRunner.setTargeting(id);
        },
        setPosition(id) {
            Game.setPosition(id);
        },
        repairFrame() {
            Game.repairFrame();
        },
        quickRepairGlory() {
            Game.quickRepairGlory();
        },
        repRewards(mission) {
            if (!mission.rewards) return {};
            const reps = {};
            for (const [k, v] of Object.entries(mission.rewards)) {
                if (k.startsWith('rep_')) reps[k] = v;
            }
            return reps;
        },
        formatMod(val) {
            if (!val) return '';
            return (val >= 0 ? '+' : '') + Math.round(val * 100) + '%';
        },
        renderHPBar(part) {
            const p = (part.hp / part.maxHp) * 100;
            return {
                width: p + '%',
                backgroundColor: p < 25 ? '#ff3333' : (p < 50 ? '#ffcc00' : '#00ff41')
            };
        },
        renderHeatBar() {
            const p = (this.playerFrame.heat || 0);
            return {
                width: p + '%',
                backgroundColor: p > 75 ? '#ff3333' : '#ff9900'
            };
        },
        renderStressBar() {
            const p = (this.playerFrame.stress || 0);
            const grt = this.state.items['grit']?.val || 1;
            const stressCap = 20 + (grt * 2);
            const pctVal = Math.min(100, (p / stressCap) * 100);
            return {
                width: pctVal + '%',
                backgroundColor: pctVal > 75 ? '#ff3333' : '#00afff'
            };
        },
        renderEnemyHeatBar(enemy) {
            const p = enemy.heat || 0;
            return {
                width: p + '%',
                backgroundColor: p > 75 ? '#ff3333' : '#ff9900',
            };
        },
        renderEnemyStressBar(enemy) {
            const p = Math.min(100, ((enemy.stress || 0) / 30) * 100);
            return {
                width: p + '%',
                backgroundColor: p > 75 ? '#ff3333' : '#00afff',
            };
        },
        powerClass(mission) {
            const threshold = (mission.difficulty || 1) * 8;
            if (this.playerPower >= threshold * 1.2) return 'power-safe';
            if (this.playerPower >= threshold) return 'power-ok';
            return 'power-risky';
        },
        logClass(line) {
            if (line.includes('DESTROYED')) return 'log-destroyed';
            if (line.includes('CRITICAL')) return 'log-critical';
            if (line.includes('BREACH') || line.includes('🔓')) return 'log-debuff';
            if (line.includes('BURN') || line.includes('🔥')) return 'log-burn';
            if (line.includes('ERROR') || line.includes('⚡')) return 'log-error';
            if (line.includes('SLOW') || line.includes('🐢')) return 'log-slow';
            if (line.includes('TARGET_LOCK') || line.includes('🎯')) return 'log-lock';
            if (line.includes('SUPPRESS') || line.includes('🛡️')) return 'log-suppress';
            if (line.startsWith('◈') || line.startsWith('↩')) return 'log-maneuver';
            if (line.includes('YOU →') || line.includes('YOU hit')) return 'log-player';
            if (line.includes('→') && line.includes('YOU')) return 'log-enemy';
            if (line.includes('Combat Ended')) return 'log-result';
            if (line.startsWith('▶') || line.startsWith('◎')) return 'log-system';
            return '';
        }
    }
};
</script>

<template>
    <div class="combat-panel-container">

        <!-- ══ PRE-COMBAT INTERFACE ══════════════════════════════════════════ -->
        <div v-if="!showBattle" class="pre-combat-layout">

            <!-- LEFT: Mission list -->
            <div class="column-panel mission-list">
                <div class="hud-section-title">> AVAILABLE MISSIONS</div>
                <div v-for="m in missions" :key="m.id"
                     class="mission-card"
                     :class="{ 
                        'mission-story': m.type === 'story' || m.missionType === 'story', 
                        'mission-completed': m.completed > 0,
                        'mission-narrative': m.encounter && m.encounter.mode === 'none'
                     }"
                     @click="startMission(m.id)">
                    <div class="mission-main">
                        <div class="mission-name">{{ m.name.toUpperCase() }}</div>
                        <div class="mission-difficulty" v-if="m.difficulty > 0">
                            <span v-for="i in (m.difficulty || 1)" :key="i">★</span>
                        </div>
                        <div v-else class="mission-difficulty" style="color: #8af;">◆</div>
                    </div>
                    <div class="mission-tags">
                        <span v-if="m.zone" class="zone-tag">{{ m.zone.replace(/_/g, ' ').toUpperCase() }}</span>
                        <span v-if="m.type === 'story' || m.missionType === 'story'" class="story-tag">STORY</span>
                        <span v-if="m.missionType === 'patrol'" class="patrol-tag">PATROL</span>
                        <span v-if="m.encounter && m.encounter.mode === 'none'" class="narrative-tag">NARRATIVE</span>
                        <span v-if="m.completed > 0" class="completed-tag">✓ ×{{ m.completed }}</span>
                    </div>
                    <div class="mission-desc">{{ m.desc }}</div>
                    <div v-if="m.narrative && m.narrative.briefing && m.narrative.briefing[0]" class="mission-flavor">
                        "{{ m.narrative.briefing[0].substring(0, 80) }}{{ m.narrative.briefing[0].length > 80 ? '...' : '' }}"
                    </div>
                    <div class="mission-footer">
                        <span class="cost" v-if="m.encounter && m.encounter.mode !== 'none'">COST: {{ m.cost?.energy || 0 }} ENR</span>
                        <span class="power-indicator" v-if="m.difficulty > 0" :class="powerClass(m)">
                            PWR: {{ playerPower }} vs ★×{{ m.difficulty || 1 }}
                        </span>
                        <span class="rewards">
                            <span v-if="m.rewards?.glory">{{ m.rewards.glory }} GLORY</span>
                            <span v-if="m.rewards?.creds"> · {{ m.rewards.creds }}¢</span>
                            <span v-for="(val, key) in repRewards(m)" :key="key" class="rep-reward"> · +{{ val }} {{ key.replace('rep_', '').toUpperCase() }}</span>
                        </span>
                    </div>
                </div>
                <div v-if="missions.length === 0" class="empty-msg">
                    No missions available. Continue your exploration...
                </div>
            </div>

            <!-- RIGHT: Config + Loadout -->
            <div class="column-panel config-loadout">

                <!-- ── COMBAT CONFIGURATION ─────────────────────────────── -->
                <div class="config-section">
                    <div class="hud-section-title">> COMBAT CONFIGURATION</div>

                    <!-- Stance selector -->
                    <div class="config-label">STANCE</div>
                    <div class="config-options">
                        <button
                            v-for="s in stanceOptions"
                            :key="s.id"
                            :class="['config-btn', { active: combatRunner.stance === s.id }]"
                            :title="s.desc"
                            @click="setStance(s.id)"
                        >
                            <span class="config-icon">{{ s.icon }}</span>
                            <span class="config-name">{{ s.name.toUpperCase() }}</span>
                            <span class="config-stat atk" v-if="s.atkMod !== 0">ATK {{ formatMod(s.atkMod) }}</span>
                            <span class="config-stat def" v-if="s.defMod !== 0">DEF {{ formatMod(s.defMod) }}</span>
                            <span class="config-stat heat" v-if="s.heatDissipMod !== 0">HEAT {{ formatMod(s.heatDissipMod) }}</span>
                            <span class="config-stat" v-if="s.atkMod === 0 && s.defMod === 0 && s.heatDissipMod === 0">---</span>
                        </button>
                    </div>

                    <!-- Targeting selector -->
                    <div class="config-label" style="margin-top: 10px;">TARGETING</div>
                    <div class="config-options">
                        <button
                            v-for="t in targetingOptions"
                            :key="t.id"
                            :class="['config-btn', { active: combatRunner.targeting === t.id }]"
                            :title="t.desc"
                            @click="setTargeting(t.id)"
                        >
                            <span class="config-icon">{{ t.icon }}</span>
                            <span class="config-name">{{ t.name.toUpperCase() }}</span>
                            <span class="config-desc">{{ t.desc }}</span>
                        </button>
                    </div>

                    <!-- Position selector -->
                    <div class="config-label" style="margin-top: 10px;">POSITION</div>
                    <div class="config-options">
                        <button
                            v-for="pos in positionOptions"
                            :key="pos.id"
                            :class="['config-btn', { active: combatRunner.position === pos.id }]"
                            :title="pos.desc"
                            @click="setPosition(pos.id)"
                        >
                            <span class="config-icon">{{ pos.icon }}</span>
                            <span class="config-name">{{ pos.label }}</span>
                            <span class="config-desc">{{ pos.desc }}</span>
                        </button>
                    </div>
                </div>

                <!-- ── LOADOUT ──────────────────────────────────────────── -->
                <div class="loadout-section">
                    <div class="hud-section-title">> LOADOUT [{{ equippedIds.length }}/3]</div>
                    
                    <!-- Frame Status Mini -->
                    <div class="frame-status-mini" v-if="frameDamaged">
                        <div class="damage-alert">⚠ FRAME DAMAGED</div>
                        <div class="repair-actions">
                            <button class="btn-repair" @click="repairFrame" title="15 Scrap + 2 Parts">
                                🛠️ REPAIR (15⚙ + 2⊞)
                            </button>
                            <button class="btn-repair glory" @click="quickRepairGlory" title="5 Glory — emergency repair">
                                ⚔ GLORY REPAIR (5)
                            </button>
                        </div>
                    </div>
                    <div class="maneuver-grid">
                        <div v-for="m in ownedManeuvers" :key="m.id"
                             class="maneuver-mini-card"
                             :class="{ 'equipped': equippedIds.includes(m.id) }"
                             @click="toggleEquip(m.id)">
                            <div class="mnvr-header">
                                <span class="mnvr-name">{{ m.name.toUpperCase() }}</span>
                                <span class="mnvr-type">{{ m.maneuverType?.toUpperCase() }}</span>
                            </div>
                            <div class="mnvr-desc">{{ m.desc }}</div>
                        </div>
                    </div>
                </div>

                <!-- ── SHOP ────────────────────────────────────────────── -->
                <div class="shop-section" v-if="shopManeuvers.length > 0 && (state.items.glory?.val || 0) > 0">
                    <div class="hud-section-title">> MANEUVER SHOP</div>
                    <div class="maneuver-grid">
                        <div v-for="m in shopManeuvers" :key="m.id" class="maneuver-mini-card shop-item">
                            <div class="mnvr-header">
                                <span class="mnvr-name">{{ m.name.toUpperCase() }}</span>
                                <span class="cost">{{ m.cost?.glory || 0 }} GLORY</span>
                            </div>
                            <div class="mnvr-desc">{{ m.desc }}</div>
                            <button class="btn-buy" @click="buyManeuver(m.id)">UNLOCK</button>
                        </div>
                    </div>
                </div>
                <div v-else-if="shopManeuvers.length > 0 && (state.items.glory?.val || 0) === 0"
                     class="shop-locked-msg">
                    > MANEUVER SHOP LOCKED
                    <span class="shop-locked-hint">Complete missions to earn GLORY and unlock tactical maneuvers.</span>
                </div>
            </div>
        </div>

        <!-- ══ BATTLE VIEW ═══════════════════════════════════════════════════ -->
        <div v-else class="battle-view">

            <!-- Active config indicator (read-only) -->
            <div class="active-config-bar">
                <span class="config-indicator">
                    {{ activeStance.icon }} {{ activeStance.name.toUpperCase() }}
                </span>
                <span class="config-sep">|</span>
                <span class="config-indicator">
                    {{ activeTargeting.icon }} {{ activeTargeting.name.toUpperCase() }}
                </span>
                <span class="config-sep">|</span>
                <span class="config-indicator position-badge">
                    {{ activePosition }}
                </span>
                <span class="config-sep">|</span>
                <span class="turn-badge">TURN {{ combatRunner.turnNumber }}</span>
            </div>

            <!-- Token legend — shows active token descriptions -->
            <div class="token-legend" v-if="anyActiveTokens">
                <span
                    v-for="tokenType in activeTokenTypes"
                    :key="tokenType"
                    class="token-legend-entry"
                    :style="{ borderLeftColor: tokenDef(tokenType).color }"
                >
                    <span class="tl-icon" :style="{ color: tokenDef(tokenType).color }">{{ tokenDef(tokenType).icon }}</span>
                    <span class="tl-name">{{ tokenDef(tokenType).name?.toUpperCase() }}</span>
                    <span class="tl-desc">{{ tokenDef(tokenType).desc }}</span>
                </span>
            </div>

            <!-- Frame status grid -->
            <div class="battle-grid">
                <!-- PLAYER FRAME -->
                <div class="frame-status player-side">
                    <div class="frame-header">PILOT: {{ state.player.name.toUpperCase() }}</div>
                    
                    <div class="token-bar" v-if="playerFrame.tokens && playerFrame.tokens.length > 0">
                        <span class="token-label">TOKENS:</span>
                        <span v-for="t in playerFrame.tokens" :key="t.type"
                              class="token-badge"
                              :style="{ color: tokenDef(t.type).color }"
                              :title="`${tokenDef(t.type).desc}${t.turns ? ` (${t.turns} turns)` : ''}`">
                            {{ tokenDef(t.type).icon }}×{{ t.stacks }}<small v-if="t.turns"> ({{ t.turns }}t)</small>
                        </span>
                    </div>

                    <div class="parts-list">
                        <div v-for="part in Object.values(playerFrame.parts)" :key="part.id"
                             class="part-row" :class="{ 'destroyed': part.status === 'destroyed' }">
                            <div class="part-label">{{ part.name?.toUpperCase() }}</div>
                            <div class="part-integrity">
                                <span v-for="i in part.integrity" :key="i" class="dot"></span>
                            </div>
                            <div class="part-hp-bar">
                                <div class="hp-fill" :style="renderHPBar(part)"></div>
                            </div>
                            <div class="part-val">{{ Math.floor(part.hp) }}/{{ part.maxHp }}</div>
                        </div>
                    </div>
                    <div class="vitals-row">
                        <div class="vital">
                            <label>HEAT</label>
                            <div class="vital-bar heat"><div class="vital-fill" :style="renderHeatBar()"></div></div>
                            <span>{{ Math.floor(playerFrame.heat || 0) }}%</span>
                        </div>
                        <div class="vital">
                            <label>STRESS</label>
                            <div class="vital-bar stress"><div class="vital-fill" :style="renderStressBar()"></div></div>
                            <span>{{ Math.floor(playerFrame.stress || 0) }}</span>
                        </div>
                    </div>
                </div>

                <div
                    class="frame-status enemy-side"
                    v-for="(enemy, idx) in currentEnemies"
                    :key="enemy.id || enemy.name || idx"
                >
                    <div class="frame-header">
                        TARGET: {{ (enemy.name || 'UNKNOWN').toUpperCase() }}
                        <div v-if="enemy.title" class="enemy-title">{{ enemy.title.toUpperCase() }}</div>
                    </div>
                    
                    <div class="token-bar" v-if="enemy.tokens && enemy.tokens.length > 0">
                        <span class="token-label">TOKENS:</span>
                        <span v-for="t in enemy.tokens" :key="t.type"
                              class="token-badge"
                              :style="{ color: tokenDef(t.type).color }"
                              :title="`${tokenDef(t.type).desc}${t.turns ? ` (${t.turns} turns)` : ''}`">
                            {{ tokenDef(t.type).icon }}×{{ t.stacks }}<small v-if="t.turns"> ({{ t.turns }}t)</small>
                        </span>
                    </div>

                    <div class="parts-list">
                        <div v-for="part in Object.values(enemy.parts || {})" :key="part.id"
                             class="part-row" :class="{ 'destroyed': part.status === 'destroyed' }">
                            <div class="part-label">{{ part.name?.toUpperCase() }}</div>
                            <div class="part-integrity">
                                <span v-for="i in part.integrity" :key="i" class="dot"></span>
                            </div>
                            <div class="part-hp-bar">
                                <div class="hp-fill" :style="renderHPBar(part)"></div>
                            </div>
                            <div class="part-val">{{ Math.floor(part.hp) }}/{{ part.maxHp }}</div>
                        </div>
                    </div>
                    <div class="vitals-row" v-if="enemy.heat !== undefined || enemy.stress !== undefined">
                        <div class="vital" v-if="enemy.heat !== undefined">
                            <label>HEAT</label>
                            <div class="vital-bar heat"><div class="vital-fill" :style="renderEnemyHeatBar(enemy)"></div></div>
                            <span>{{ Math.floor(enemy.heat || 0) }}%</span>
                        </div>
                        <div class="vital" v-if="enemy.stress !== undefined">
                            <label>STRESS</label>
                            <div class="vital-bar stress"><div class="vital-fill" :style="renderEnemyStressBar(enemy)"></div></div>
                            <span>{{ Math.floor(enemy.stress || 0) }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Battle log (newest on top) -->
            <div class="battle-log">
                <div v-for="(line, idx) in recentLog" :key="idx"
                     class="log-entry" :class="logClass(line)">
                    > {{ line }}
                </div>
            </div>

            <!-- Footer -->
            <div class="battle-footer">
                <div class="footer-stances">
                    <span class="footer-label">STANCE:</span>
                    <button
                        v-for="s in stanceOptions"
                        :key="s.id"
                        :class="['stance-mini-btn', { active: combatRunner.stance === s.id }]"
                        :title="s.desc"
                        :disabled="!!combatResult"
                        @click="setStance(s.id)"
                    >
                        {{ s.icon }} {{ s.name.toUpperCase() }}
                    </button>
                </div>
                <button
                    class="btn-retreat"
                    :disabled="!!combatResult"
                    @click="retreat"
                    title="Retreat: mission fails. Partial salvage and reduced glory recovered. Pilot survives."
                >
                    ⚑ RETREAT
                </button>
            </div>

            <!-- Result overlay -->
            <div v-if="combatResult" class="result-overlay" :class="combatResult">
                <div class="result-title">{{ combatResult.toUpperCase() }}</div>
                <div class="result-mission" v-if="combatRunner.mission">
                    {{ combatRunner.mission.name.toUpperCase() }}
                </div>
                <div class="result-sub">
                    <span v-if="combatResult === 'victory'">Mission objectives completed. Salvage recovered.</span>
                    <span v-else>Mission failed. Partial salvage recovered.</span>
                </div>
                <div v-if="combatResult === 'victory' && combatRunner.mission?.rewards" class="result-rewards">
                    <span v-for="(val, key) in combatRunner.mission.rewards" :key="key" class="reward-item">
                        {{ key.replace(/_/g, ' ').toUpperCase() }}: +{{ val }}
                    </span>
                </div>
                <button class="hud-btn" @click="continueAfterCombat">[ CONTINUE ]</button>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* ── Container ──────────────────────────────────────────────────────────── */
.combat-panel-container {
    padding: 10px;
    font-family: var(--font-mono);
    position: relative;
}

/* ── Pre-combat layout ──────────────────────────────────────────────────── */
.pre-combat-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
}

.column-panel {
    background: rgba(13, 17, 23, 0.4);
    border: 1px solid var(--border-dim);
    padding: 14px;
}

/* ── Mission list ───────────────────────────────────────────────────────── */
.mission-card {
    border: 1px solid var(--border-dim);
    padding: 12px;
    margin-bottom: 10px;
    cursor: pointer;
    transition: all 0.2s;
}
.mission-card:hover {
    border-color: var(--primary);
    background: rgba(0, 255, 65, 0.05);
}
.mission-main { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
.mission-name { font-weight: bold; color: var(--secondary); font-size: var(--font-size-sm); }
.mission-difficulty { color: #f5c542; letter-spacing: 2px; }
.mission-desc { font-size: var(--font-size-xs); color: var(--text-dim); margin-bottom: 8px; line-height: 1.35; }
.mission-footer { display: flex; gap: 20px; font-size: var(--font-size-xxs); font-weight: bold; }
.cost { color: var(--error); }
.rewards { color: var(--primary); }
.empty-msg { font-size: var(--font-size-xs); color: var(--text-dim); padding: 10px 0; }

.mission-tags {
    display: flex;
    gap: 6px;
    margin-bottom: 6px;
    flex-wrap: wrap;
}
.zone-tag, .story-tag, .patrol-tag, .completed-tag {
    font-size: var(--font-size-xxs);
    padding: 1px 5px;
    border: 1px solid;
    letter-spacing: 1px;
}
.zone-tag { border-color: #556; color: #8899aa; }
.story-tag { border-color: #f5c542; color: #f5c542; }
.patrol-tag { border-color: #556; color: #778; }
.completed-tag { border-color: var(--primary); color: var(--primary); }

.mission-flavor {
    font-size: var(--font-size-xxs);
    color: #6a7a8a;
    font-style: italic;
    margin-bottom: 8px;
    padding-left: 8px;
    border-left: 2px solid #334;
    line-height: 1.3;
}

.mission-story { border-left: 3px solid #f5c542; }
.mission-narrative { border-left: 3px solid #8af; background: rgba(100, 150, 255, 0.03); }
.mission-completed { opacity: 0.7; }
.mission-completed:hover { opacity: 1; }
.narrative-tag { border-color: #8af; color: #8af; }
.rep-reward { color: #8af; }

.result-mission {
    font-size: var(--font-size-xs);
    color: var(--text-dim);
    letter-spacing: 2px;
    margin-top: -8px;
}
.result-rewards {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: center;
    margin: 5px 0;
}
.reward-item {
    font-size: var(--font-size-xxs);
    color: var(--primary);
    padding: 2px 6px;
    border: 1px solid rgba(0, 255, 65, 0.2);
    letter-spacing: 1px;
}

/* ── Combat config ──────────────────────────────────────────────────────── */
.config-section { margin-bottom: 18px; }

.config-label {
    color: var(--primary);
    font-size: var(--font-size-xxs);
    letter-spacing: 2px;
    margin: 6px 0 5px;
    opacity: 0.8;
}

.config-options {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
}

.config-btn {
    background: rgba(0, 255, 170, 0.04);
    border: 1px solid rgba(0, 255, 170, 0.2);
    color: var(--primary);
    padding: 7px 9px;
    cursor: pointer;
    font-family: inherit;
    font-size: var(--font-size-xxs);
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 74px;
    gap: 2px;
    transition: border-color 0.15s, background 0.15s;
}
.config-btn:hover {
    border-color: rgba(0, 255, 170, 0.5);
    background: rgba(0, 255, 170, 0.08);
}
.config-btn.active {
    border-color: var(--primary);
    background: rgba(0, 255, 170, 0.14);
    box-shadow: 0 0 8px rgba(0, 255, 170, 0.25);
}
.config-icon { font-size: var(--font-size-sm); }
.config-name { font-weight: bold; font-size: var(--font-size-xxs); letter-spacing: 1px; }
.config-stat { font-size: var(--font-size-xxs); color: rgba(0, 255, 170, 0.55); }
.config-stat.atk { color: #f5c542; }
.config-stat.def { color: #00aaff; }
.config-stat.heat { color: #ff9900; }
.config-desc { font-size: var(--font-size-xxs); color: rgba(0, 255, 170, 0.45); text-align: center; line-height: 1.25; }

/* ── Loadout & shop ─────────────────────────────────────────────────────── */
.loadout-section { margin-bottom: 16px; }
.maneuver-grid { display: grid; grid-template-columns: 1fr; gap: 8px; }

.frame-status-mini {
    background: rgba(255, 60, 60, 0.08);
    border: 1px solid rgba(255, 60, 60, 0.3);
    padding: 8px;
    margin-bottom: 10px;
}
.damage-alert {
    font-size: var(--font-size-xxs);
    color: #f66;
    font-weight: bold;
    letter-spacing: 1px;
    margin-bottom: 6px;
    animation: blink 1.5s infinite;
}
@keyframes blink { 50% { opacity: 0.5; } }
.repair-actions { display: flex; gap: 6px; }
.btn-repair {
    flex: 1;
    background: transparent;
    border: 1px solid #4a5;
    color: #4a5;
    padding: 4px 6px;
    font-family: inherit;
    font-size: var(--font-size-xxs);
    cursor: pointer;
    letter-spacing: 0.5px;
    transition: all 0.15s;
}
.btn-repair:hover { background: rgba(68, 170, 85, 0.15); }
.btn-repair.glory { border-color: #f5c542; color: #f5c542; }
.btn-repair.glory:hover { background: rgba(245, 197, 66, 0.15); }

.maneuver-mini-card {
    border: 1px solid var(--border-dim);
    padding: 8px 12px;
    background: rgba(30, 40, 50, 0.3);
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
}
.maneuver-mini-card:hover { border-color: var(--secondary); }
.maneuver-mini-card.equipped {
    border-color: var(--primary);
    background: rgba(0, 255, 65, 0.05);
}
.maneuver-mini-card.equipped::after {
    content: "EQUIPPED";
    position: absolute;
    top: 5px; right: 8px;
    font-size: var(--font-size-xxs);
    color: var(--primary);
    font-weight: bold;
}
.mnvr-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
.mnvr-name { font-size: var(--font-size-xs); font-weight: bold; color: var(--text); }
.mnvr-type { font-size: var(--font-size-xxs); color: var(--text-dim); }
.mnvr-desc { font-size: var(--font-size-xxs); color: var(--text-dim); line-height: 1.3; }

.shop-item { border-style: dashed; }
.btn-buy {
    margin-top: 8px;
    width: 100%;
    background: transparent;
    border: 1px solid var(--primary);
    color: var(--primary);
    font-size: var(--font-size-xxs);
    padding: 4px;
    cursor: pointer;
    font-family: inherit;
}
.btn-buy:hover { background: var(--primary); color: #000; }

.shop-locked-msg {
    font-size: var(--font-size-xxs);
    color: var(--text-dim);
    padding: 10px;
    border: 1px dashed rgba(0, 255, 170, 0.15);
    letter-spacing: 1px;
}
.shop-locked-hint {
    display: block;
    margin-top: 4px;
    font-size: var(--font-size-xxs);
    opacity: 0.6;
    letter-spacing: 0;
}

/* ── Battle view ────────────────────────────────────────────────────────── */
.battle-view {
    display: flex;
    flex-direction: column;
    gap: 12px;
    position: relative;
}

/* Active config bar (read-only) */
.active-config-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 5px 10px;
    background: rgba(0, 255, 170, 0.06);
    border: 1px solid rgba(0, 255, 170, 0.2);
    font-size: var(--font-size-xs);
}
.config-indicator {
    color: var(--primary);
    font-weight: bold;
    letter-spacing: 1px;
}
.config-indicator.sm { font-size: var(--font-size-xxs); opacity: 0.7; }
.position-badge { color: #ffd; letter-spacing: 1.5px; }
.config-sep { color: var(--border-dim); }
.turn-badge {
    margin-left: auto;
    color: var(--secondary);
    font-weight: bold;
    letter-spacing: 2px;
    font-size: var(--font-size-sm);
}

/* Frame grid */
.battle-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
}

.frame-status {
    background: rgba(13, 17, 23, 0.6);
    border: 1px solid var(--border-dim);
    padding: 10px;
}
.player-side { border-color: rgba(0, 255, 170, 0.3); }
.enemy-side  { border-color: rgba(255, 60, 60, 0.3); }

.frame-header {
    font-size: var(--font-size-xs);
    color: var(--secondary);
    border-bottom: 1px solid var(--border-dim);
    padding-bottom: 5px;
    margin-bottom: 10px;
    letter-spacing: 1px;
}
.enemy-title {
    font-size: var(--font-size-xxs);
    color: var(--text-dim);
    margin-top: 2px;
    letter-spacing: 1px;
}

.token-bar {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
    font-size: var(--font-size-xxs);
    background: rgba(0,0,0,0.3);
    padding: 2px 5px;
}
.token-label {
    color: rgba(255, 255, 255, 0.4);
    font-size: var(--font-size-xxs);
    letter-spacing: 1px;
}
.token-badge {
    font-size: var(--font-size-xs);
    cursor: help;
}

.part-row { display: flex; align-items: center; gap: 8px; margin-bottom: 7px; font-size: var(--font-size-xs); }
.part-label { width: 70px; }
.part-integrity { display: flex; gap: 2px; width: 30px; }
.dot { width: 5px; height: 5px; background: var(--primary); border-radius: 50%; }
.part-hp-bar { flex: 1; height: 6px; background: #000; border: 1px solid #333; }
.hp-fill { height: 100%; transition: width 0.3s; }
.part-val { width: 50px; text-align: right; font-size: var(--font-size-xxs); color: var(--text-dim); }
.destroyed { opacity: 0.35; filter: grayscale(1); }

.vitals-row {
    margin-top: 12px;
    padding-top: 10px;
    border-top: 1px dashed var(--border-dim);
    display: flex;
    gap: 20px;
}
.vital { flex: 1; font-size: var(--font-size-xxs); }
.vital label { display: block; margin-bottom: 3px; color: var(--text-dim); font-size: var(--font-size-xxs); }
.vital-bar { height: 4px; background: #000; margin-bottom: 3px; }
.vital-fill { height: 100%; transition: width 0.3s; }

/* Battle log */
.battle-log {
    height: 170px;
    border: 1px solid var(--border-dim);
    background: #000;
    padding: 8px;
    font-size: var(--font-size-sm);
    color: var(--primary);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 3px;
}
.log-entry { line-height: 1.35; }
.log-player  { color: #00ff88; }
.log-enemy   { color: #ff6666; }
.log-critical { color: #ffcc00; font-weight: bold; }
.log-destroyed { color: #ff3333; font-weight: bold; }
.log-result  { color: var(--secondary); letter-spacing: 2px; font-weight: bold; }
.log-system  { color: rgba(0, 255, 170, 0.55); font-style: italic; }
.log-debuff  { color: #f55; }
.log-burn    { color: #f80; }
.log-error   { color: #ff0; }
.log-slow    { color: #88f; }
.log-lock    { color: #f0f; }
.log-suppress { color: #aaa; }
.log-maneuver { color: #bf9; font-style: italic; }

/* Footer */
.battle-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.footer-config { display: flex; gap: 12px; }

.btn-retreat {
    background: transparent;
    border: 1px solid var(--error);
    color: var(--error);
    padding: 5px 16px;
    font-family: inherit;
    font-size: var(--font-size-xs);
    cursor: pointer;
    letter-spacing: 1px;
    transition: all 0.15s;
}
.btn-retreat:hover { background: var(--error); color: #000; }
.btn-retreat:disabled { opacity: 0.4; cursor: not-allowed; }

/* Result overlay */
.result-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.88);
    border: 1px solid var(--border-dim);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    padding: 20px;
}
.result-overlay.victory { border-color: var(--primary); }
.result-overlay.defeat  { border-color: var(--error); }

.result-title {
    font-size: 28px;
    letter-spacing: 8px;
    font-weight: 900;
    color: var(--primary);
}
.result-overlay.defeat .result-title { color: var(--error); }

.result-sub {
    font-size: var(--font-size-sm);
    color: var(--text-dim);
    text-align: center;
    max-width: 480px;
    line-height: 1.4;
}

.hud-btn {
    background: transparent;
    border: 1px solid var(--primary);
    color: var(--primary);
    padding: 6px 20px;
    font-family: inherit;
    font-size: var(--font-size-xs);
    cursor: pointer;
    letter-spacing: 2px;
    transition: all 0.15s;
}
.hud-btn:hover { background: var(--primary); color: #000; }

/* Token legend */
.token-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 6px 8px;
    background: rgba(0,0,0,0.3);
    border: 1px solid var(--border-dim);
    font-size: var(--font-size-xxs);
}
.token-legend-entry {
    display: flex;
    align-items: center;
    gap: 5px;
    padding-left: 6px;
    border-left: 2px solid;
    line-height: 1.3;
}
.tl-icon { font-size: var(--font-size-xs); }
.tl-name { font-weight: bold; color: var(--text); letter-spacing: 0.5px; }
.tl-desc { color: var(--text-dim); }

/* Mid-combat stance switching */
.footer-stances { display: flex; align-items: center; gap: 5px; }
.footer-label { font-size: var(--font-size-xxs); color: var(--text-dim); letter-spacing: 1px; margin-right: 3px; }
.stance-mini-btn {
    background: transparent;
    border: 1px solid var(--border-dim);
    color: var(--text-dim);
    font-family: inherit;
    font-size: var(--font-size-xxs);
    padding: 3px 7px;
    cursor: pointer;
    transition: all 0.15s;
}
.stance-mini-btn:hover { border-color: var(--primary); color: var(--primary); }
.stance-mini-btn.active { border-color: var(--primary); color: var(--primary); background: rgba(0,255,170,0.08); }
.stance-mini-btn:disabled { opacity: 0.3; cursor: not-allowed; }

/* Power indicator */
.power-indicator { font-size: var(--font-size-xxs); font-weight: bold; letter-spacing: 0.5px; }
.power-safe  { color: var(--primary); }
.power-ok    { color: #f5c542; }
.power-risky { color: var(--error); }
</style>
