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
        storyMissions() {
            return this.missions.filter(m => m.type === 'story' || m.missionType === 'story');
        },
        operationsMissions() {
            return this.missions.filter(m =>
                (m.type !== 'story' && m.missionType !== 'story') &&
                !(m.encounter && m.encounter.mode === 'none')
            );
        },
        intelMissions() {
            return this.missions.filter(m => m.encounter && m.encounter.mode === 'none');
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

            <!-- LEFT: Mission list (grouped) -->
            <div class="column-panel mission-list">

                <!-- ─── STORY MISSIONS ─── -->
                <div v-if="storyMissions.length > 0" class="mission-group">
                    <div class="group-header group-story">◈ STORY MISSIONS</div>
                    <div v-for="m in storyMissions" :key="m.id"
                         class="mission-card mission-story"
                         :class="{ 'mission-completed': m.completed > 0 }"
                         @click="startMission(m.id)">
                        <div class="mission-main">
                            <div class="mission-name">{{ m.name.toUpperCase() }}</div>
                            <div class="mission-tags-inline">
                                <span v-if="m.zone" class="zone-tag">{{ m.zone.replace(/_/g, ' ').toUpperCase() }}</span>
                                <span v-if="m.completed > 0" class="completed-tag">✓ ×{{ m.completed }}</span>
                            </div>
                            <div class="mission-difficulty" v-if="m.difficulty > 0">
                                <span v-for="i in (m.difficulty || 1)" :key="i">★</span>
                            </div>
                        </div>
                        <div class="mission-desc">{{ m.desc }}</div>
                        <div class="mission-footer">
                            <span class="cost" v-if="m.encounter && m.encounter.mode !== 'none'">{{ m.cost?.energy || 0 }} ENR</span>
                            <span class="power-indicator" v-if="m.difficulty > 0" :class="powerClass(m)">PWR {{ playerPower }} vs ★×{{ m.difficulty || 1 }}</span>
                            <span class="rewards">
                                <span v-if="m.rewards?.glory">{{ m.rewards.glory }}⚔</span>
                                <span v-if="m.rewards?.creds">{{ m.rewards.creds }}¢</span>
                                <span v-for="(val, key) in repRewards(m)" :key="key" class="rep-reward">+{{ val }} {{ key.replace('rep_', '').toUpperCase() }}</span>
                            </span>
                        </div>
                    </div>
                </div>

                <!-- ─── COMBAT OPERATIONS ─── -->
                <div v-if="operationsMissions.length > 0" class="mission-group">
                    <div class="group-header group-ops">⚔ COMBAT OPERATIONS</div>
                    <div v-for="m in operationsMissions" :key="m.id"
                         class="mission-card"
                         :class="{ 'mission-completed': m.completed > 0 }"
                         @click="startMission(m.id)">
                        <div class="mission-main">
                            <div class="mission-name">{{ m.name.toUpperCase() }}</div>
                            <div class="mission-tags-inline">
                                <span v-if="m.zone" class="zone-tag">{{ m.zone.replace(/_/g, ' ').toUpperCase() }}</span>
                                <span v-if="m.missionType === 'patrol'" class="patrol-tag">PATROL</span>
                                <span v-if="m.completed > 0" class="completed-tag">✓ ×{{ m.completed }}</span>
                            </div>
                            <div class="mission-difficulty" v-if="m.difficulty > 0">
                                <span v-for="i in (m.difficulty || 1)" :key="i">★</span>
                            </div>
                        </div>
                        <div class="mission-desc">{{ m.desc }}</div>
                        <div class="mission-footer">
                            <span class="cost">{{ m.cost?.energy || 0 }} ENR</span>
                            <span class="power-indicator" :class="powerClass(m)">PWR {{ playerPower }} vs ★×{{ m.difficulty || 1 }}</span>
                            <span class="rewards">
                                <span v-if="m.rewards?.glory">{{ m.rewards.glory }}⚔</span>
                                <span v-if="m.rewards?.creds">{{ m.rewards.creds }}¢</span>
                                <span v-for="(val, key) in repRewards(m)" :key="key" class="rep-reward">+{{ val }} {{ key.replace('rep_', '').toUpperCase() }}</span>
                            </span>
                        </div>
                    </div>
                </div>

                <!-- ─── INTEL / NARRATIVE ─── -->
                <div v-if="intelMissions.length > 0" class="mission-group">
                    <div class="group-header group-intel">◇ INTEL / NARRATIVE</div>
                    <div v-for="m in intelMissions" :key="m.id"
                         class="mission-card mission-narrative"
                         :class="{ 'mission-completed': m.completed > 0 }"
                         @click="startMission(m.id)">
                        <div class="mission-main">
                            <div class="mission-name">{{ m.name.toUpperCase() }}</div>
                            <div class="mission-tags-inline">
                                <span v-if="m.zone" class="zone-tag">{{ m.zone.replace(/_/g, ' ').toUpperCase() }}</span>
                                <span v-if="m.completed > 0" class="completed-tag">✓ ×{{ m.completed }}</span>
                            </div>
                            <div class="mission-difficulty" style="color: #8af;">◆</div>
                        </div>
                        <div class="mission-desc">{{ m.desc }}</div>
                        <div class="mission-footer">
                            <span class="rewards">
                                <span v-if="m.rewards?.creds">{{ m.rewards.creds }}¢</span>
                                <span v-for="(val, key) in repRewards(m)" :key="key" class="rep-reward">+{{ val }} {{ key.replace('rep_', '').toUpperCase() }}</span>
                            </span>
                        </div>
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

                    <!-- Stance selector (inline row) -->
                    <div class="config-row">
                        <span class="config-label">STANCE</span>
                        <div class="config-options-inline">
                            <button
                                v-for="s in stanceOptions"
                                :key="s.id"
                                :class="['config-btn-inline', { active: combatRunner.stance === s.id }]"
                                :title="s.desc"
                                @click="setStance(s.id)"
                            >
                                {{ s.icon }} {{ s.name.toUpperCase() }}
                            </button>
                        </div>
                    </div>

                    <!-- Active stance detail -->
                    <div class="config-active-detail" v-if="activeStance">
                        <span class="config-stat atk" v-if="activeStance.atkMod !== 0">ATK {{ formatMod(activeStance.atkMod) }}</span>
                        <span class="config-stat def" v-if="activeStance.defMod !== 0">DEF {{ formatMod(activeStance.defMod) }}</span>
                        <span class="config-stat heat" v-if="activeStance.heatDissipMod !== 0">HEAT {{ formatMod(activeStance.heatDissipMod) }}</span>
                    </div>

                    <!-- Targeting selector (inline row) -->
                    <div class="config-row">
                        <span class="config-label">TARGET</span>
                        <div class="config-options-inline">
                            <button
                                v-for="t in targetingOptions"
                                :key="t.id"
                                :class="['config-btn-inline', { active: combatRunner.targeting === t.id }]"
                                :title="t.desc"
                                @click="setTargeting(t.id)"
                            >
                                {{ t.icon }} {{ t.name.toUpperCase() }}
                            </button>
                        </div>
                    </div>

                    <!-- Position selector (inline row) -->
                    <div class="config-row">
                        <span class="config-label">POSTN</span>
                        <div class="config-options-inline">
                            <button
                                v-for="pos in positionOptions"
                                :key="pos.id"
                                :class="['config-btn-inline', { active: combatRunner.position === pos.id }]"
                                :title="pos.desc"
                                @click="setPosition(pos.id)"
                            >
                                {{ pos.icon }} {{ pos.label }}
                            </button>
                        </div>
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
                    <div class="maneuver-grid-2col">
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

                <!-- ── SHOP (collapsible) ──────────────────────────────── -->
                <details v-if="shopManeuvers.length > 0" class="shop-details">
                    <summary class="shop-summary">
                        ▶ MANEUVER SHOP
                        <span class="shop-count">{{ shopManeuvers.length }} available</span>
                    </summary>
                    <div v-if="(state.items.glory?.val || 0) > 0" class="shop-content">
                        <div class="maneuver-grid-2col">
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
                    <div v-else class="shop-locked-msg">
                        Complete missions to earn GLORY and unlock tactical maneuvers.
                    </div>
                </details>
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
                    <div class="vitals-row-compact">
                        <span class="vital-inline">HEAT <span class="vital-val heat-val">{{ Math.floor(playerFrame.heat || 0) }}%</span></span>
                        <span class="vital-sep">|</span>
                        <span class="vital-inline">STRESS <span class="vital-val stress-val">{{ Math.floor(playerFrame.stress || 0) }}</span></span>
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
                    <div class="vitals-row-compact" v-if="enemy.heat !== undefined || enemy.stress !== undefined">
                        <span class="vital-inline" v-if="enemy.heat !== undefined">HEAT <span class="vital-val heat-val">{{ Math.floor(enemy.heat || 0) }}%</span></span>
                        <span class="vital-sep" v-if="enemy.heat !== undefined && enemy.stress !== undefined">|</span>
                        <span class="vital-inline" v-if="enemy.stress !== undefined">STRESS <span class="vital-val stress-val">{{ Math.floor(enemy.stress || 0) }}</span></span>
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
    grid-template-columns: 1fr minmax(260px, 320px);
    gap: 14px;
}

.column-panel {
    background: rgba(13, 17, 23, 0.4);
    border: 1px solid var(--border-dim);
    padding: 14px;
}

/* ── Mission groups ──────────────────────────────────────────────────── */
.mission-group {
    margin-bottom: 14px;
}
.group-header {
    font-size: var(--font-size-xxs);
    letter-spacing: 2px;
    padding: 4px 8px;
    margin-bottom: 6px;
    font-weight: bold;
    border-bottom: 1px solid var(--border-dim);
}
.group-story {
    color: #f5c542;
    border-bottom-color: rgba(245, 197, 66, 0.3);
}
.group-ops {
    color: var(--primary);
    border-bottom-color: rgba(0, 255, 170, 0.3);
}
.group-intel {
    color: #8af;
    border-bottom-color: rgba(136, 170, 255, 0.3);
}
/* ── Mission list ───────────────────────────────────────────────────────── */
.mission-card {
    border: 1px solid var(--border-dim);
    padding: 8px 10px;
    margin-bottom: 6px;
    cursor: pointer;
    transition: all 0.2s;
}
.mission-card:hover {
    border-color: var(--primary);
    background: rgba(0, 255, 65, 0.05);
}
.mission-main { display: flex; align-items: center; gap: 8px; margin-bottom: 3px; }
.mission-name { font-weight: bold; color: var(--secondary); font-size: var(--font-size-xs); white-space: nowrap; }
.mission-tags-inline { display: flex; gap: 4px; flex: 1; }
.mission-difficulty { color: #f5c542; letter-spacing: 2px; margin-left: auto; }
.mission-desc {
    font-size: var(--font-size-xxs); color: var(--text-dim); margin-bottom: 4px;
    line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.mission-footer { display: flex; gap: 12px; font-size: var(--font-size-xxs); font-weight: bold; }
.cost { color: var(--error); }
.rewards { color: var(--primary); display: flex; gap: 6px; }
.empty-msg { font-size: var(--font-size-xs); color: var(--text-dim); padding: 10px 0; }

.zone-tag, .story-tag, .patrol-tag, .completed-tag, .narrative-tag {
    font-size: 10px;
    padding: 0px 4px;
    border: 1px solid;
    letter-spacing: 0.5px;
}
.zone-tag { border-color: #556; color: #8899aa; }
.story-tag { border-color: #f5c542; color: #f5c542; }
.patrol-tag { border-color: #556; color: #778; }
.completed-tag { border-color: var(--primary); color: var(--primary); }
.narrative-tag { border-color: #8af; color: #8af; }

.mission-story { border-left: 3px solid #f5c542; }
.mission-narrative { border-left: 3px solid #8af; background: rgba(100, 150, 255, 0.03); }
.mission-completed { opacity: 0.7; }
.mission-completed:hover { opacity: 1; }
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

/* ── Combat config (inline rows) ──────────────────────────────────────── */
.config-section { margin-bottom: 14px; }

.config-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
}

.config-label {
    color: var(--primary);
    font-size: var(--font-size-xxs);
    letter-spacing: 1px;
    opacity: 0.7;
    width: 52px;
    flex-shrink: 0;
}

.config-options-inline {
    display: flex;
    gap: 3px;
    flex-wrap: wrap;
    flex: 1;
}

.config-btn-inline {
    background: rgba(0, 255, 170, 0.04);
    border: 1px solid rgba(0, 255, 170, 0.15);
    color: var(--text-dim);
    padding: 4px 8px;
    cursor: pointer;
    font-family: inherit;
    font-size: var(--font-size-xxs);
    letter-spacing: 0.5px;
    transition: border-color 0.15s, background 0.15s;
    white-space: nowrap;
}
.config-btn-inline:hover {
    border-color: rgba(0, 255, 170, 0.4);
    color: var(--primary);
}
.config-btn-inline.active {
    border-color: var(--primary);
    background: rgba(0, 255, 170, 0.12);
    color: var(--primary);
    font-weight: bold;
}

.config-active-detail {
    display: flex;
    gap: 10px;
    padding: 2px 0 6px 58px;
    font-size: var(--font-size-xxs);
}
.config-stat { color: rgba(0, 255, 170, 0.55); }
.config-stat.atk { color: #f5c542; }
.config-stat.def { color: #00aaff; }
.config-stat.heat { color: #ff9900; }

/* ── Loadout & shop ─────────────────────────────────────────────────────── */
.loadout-section { margin-bottom: 12px; }
.maneuver-grid-2col { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }

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

/* ── Shop (collapsible) ─────────────────────────────────── */
.shop-details {
    margin-top: 10px;
    border: 1px dashed rgba(0, 255, 170, 0.15);
}
.shop-summary {
    font-size: var(--font-size-xxs);
    font-family: var(--font-mono);
    color: var(--primary);
    letter-spacing: 1px;
    padding: 6px 8px;
    cursor: pointer;
    user-select: none;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.shop-summary:hover {
    background: rgba(0, 255, 170, 0.05);
}
.shop-count {
    font-weight: normal;
    color: var(--text-dim);
    font-size: 10px;
    letter-spacing: 0;
}
.shop-content {
    padding: 8px;
}
.shop-item { border-style: dashed; }
.btn-buy {
    margin-top: 6px;
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
    padding: 8px;
    letter-spacing: 0.5px;
    line-height: 1.4;
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

.part-row { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; font-size: var(--font-size-xxs); }
.part-label { width: 60px; font-size: var(--font-size-xxs); }
.part-integrity { display: flex; gap: 2px; width: 24px; }
.dot { width: 4px; height: 4px; background: var(--primary); border-radius: 50%; }
.part-hp-bar { flex: 1; height: 5px; background: #000; border: 1px solid #333; }
.hp-fill { height: 100%; transition: width 0.3s; }
.part-val { width: 45px; text-align: right; font-size: var(--font-size-xxs); color: var(--text-dim); }
.destroyed { opacity: 0.35; filter: grayscale(1); }

.vitals-row-compact {
    margin-top: 6px;
    padding-top: 6px;
    border-top: 1px dashed var(--border-dim);
    display: flex;
    gap: 10px;
    font-size: var(--font-size-xxs);
    font-family: var(--font-mono);
    color: var(--text-dim);
    letter-spacing: 0.5px;
}
.vital-inline { display: flex; gap: 4px; }
.vital-val { font-weight: bold; }
.vital-val.heat-val { color: #ff9900; }
.vital-val.stress-val { color: #88aaff; }
.vital-sep { color: var(--border-dim); }

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
