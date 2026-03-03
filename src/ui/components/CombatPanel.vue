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
                { id: 'scout',   icon: '⊙', label: 'SCOUT',   desc: 'Speed, evasion, intel' },
                { id: 'gunner',  icon: '⊕', label: 'GUNNER',  desc: 'Accuracy, precision fire' },
            ];
        },
        activePosition() {
            const pos = this.combatRunner.position || 'fighter';
            const icons = { fighter: '⚔', scout: '⊙', gunner: '⊕' };
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
        filteredStoryMissions() {
            if (this.missionFilter !== 'all' && this.missionFilter !== 'story') return [];
            const list = this.storyMissions;
            return this.hideCompleted ? list.filter(m => !m.completed) : list;
        },
        filteredOpsMissions() {
            if (this.missionFilter !== 'all' && this.missionFilter !== 'combat') return [];
            const list = this.operationsMissions;
            return this.hideCompleted ? list.filter(m => !m.completed) : list;
        },
        filteredIntelMissions() {
            if (this.missionFilter !== 'all' && this.missionFilter !== 'intel') return [];
            const list = this.intelMissions;
            return this.hideCompleted ? list.filter(m => !m.completed) : list;
        },
        briefingPowerLabel() {
            const m = this.selectedMission;
            if (!m) return '';
            const cls = this.powerClass(m);
            const labels = { 'power-safe': '▲ SAFE', 'power-ok': '⚠ MARGINAL', 'power-risky': '▼ RISKY' };
            return labels[cls] || '';
        },
    },
    data() {
        return {
            selectedMission: null,
            missionFilter: 'all',
            hideCompleted: false,
        };
    },
    methods: {
        fmt, pct,
        tokenDef(type) {
            return TOKEN_DEFS[type] || { icon: '?', color: '#fff', desc: '' };
        },
        selectMission(m) {
            this.selectedMission = m;
        },
        cancelBriefing() {
            this.selectedMission = null;
        },
        deployMission() {
            const m = this.selectedMission;
            this.selectedMission = null;
            Game.startMission(m.id);
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
        powerLabel(mission) {
            return { 'power-safe': '▲ SAFE', 'power-ok': '⚠ MARG', 'power-risky': '▼ RISKY' }[this.powerClass(mission)] || '';
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
        <div class="scanline-overlay"></div>

        <!-- ══ PRE-COMBAT INTERFACE ══════════════════════════════════════════ -->
        <div v-if="!showBattle" class="pre-combat-layout">

            <!-- LEFT: Mission list (grouped) -->
            <div class="column-panel mission-list">

                <!-- ── Filter bar ──────────────────────────────────────── -->
                <div class="mission-filter-bar">
                    <button v-for="f in [['all','ALL'],['combat','⚔ OPS'],['story','◈ STORY'],['intel','◇ INTEL']]"
                            :key="f[0]"
                            :class="['filter-btn', { active: missionFilter === f[0] }]"
                            @click="missionFilter = f[0]; selectedMission = null">{{ f[1] }}</button>
                    <button :class="['filter-btn', 'filter-hide', { active: hideCompleted }]"
                            @click="hideCompleted = !hideCompleted"
                            :title="hideCompleted ? 'Showing active missions only' : 'Show all missions'">
                        ✓ HIDE DONE
                    </button>
                </div>

                <!-- Pilot power readout (shown once for all cards) -->
                <div class="pilot-power-line" v-if="playerPower > 0">
                    <span class="ppl-label">PILOT PWR</span>
                    <span class="ppl-val">{{ playerPower }}</span>
                </div>

                <!-- ─── STORY MISSIONS ─── -->
                <div v-if="filteredStoryMissions.length > 0" class="mission-group">
                    <div class="group-header group-story"><span class="group-icon">◈</span> STORY MISSIONS <span class="group-count">({{ filteredStoryMissions.length }})</span></div>
                    <div v-for="m in filteredStoryMissions" :key="m.id"
                         class="mission-card mission-story"
                         :class="{ 'mission-completed': m.completed > 0, 'mission-selected': selectedMission?.id === m.id }"
                         @click="selectMission(m)">
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
                            <span class="power-indicator" v-if="m.difficulty > 0" :class="powerClass(m)">{{ powerLabel(m) }}</span>
                            <span class="rewards">
                                <span v-if="m.rewards?.glory">{{ m.rewards.glory }}⚔</span>
                                <span v-if="m.rewards?.creds">{{ m.rewards.creds }}¢</span>
                                <span v-for="(val, key) in repRewards(m)" :key="key" class="rep-reward">+{{ val }} {{ key.replace('rep_', '').toUpperCase() }}</span>
                            </span>
                        </div>
                    </div>
                </div>

                <!-- ─── COMBAT OPERATIONS ─── -->
                <div v-if="filteredOpsMissions.length > 0" class="mission-group">
                    <div class="group-header group-ops"><span class="group-icon">⚔</span> COMBAT OPERATIONS <span class="group-count">({{ filteredOpsMissions.length }})</span></div>
                    <div v-for="m in filteredOpsMissions" :key="m.id"
                         class="mission-card"
                         :class="{ 'mission-completed': m.completed > 0, 'mission-selected': selectedMission?.id === m.id }"
                         @click="selectMission(m)">
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
                            <span class="power-indicator" :class="powerClass(m)">{{ powerLabel(m) }}</span>
                            <span class="rewards">
                                <span v-if="m.rewards?.glory">{{ m.rewards.glory }}⚔</span>
                                <span v-if="m.rewards?.creds">{{ m.rewards.creds }}¢</span>
                                <span v-for="(val, key) in repRewards(m)" :key="key" class="rep-reward">+{{ val }} {{ key.replace('rep_', '').toUpperCase() }}</span>
                            </span>
                        </div>
                    </div>
                </div>

                <!-- ─── INTEL / NARRATIVE ─── -->
                <div v-if="filteredIntelMissions.length > 0" class="mission-group">
                    <div class="group-header group-intel"><span class="group-icon">◇</span> INTEL / NARRATIVE <span class="group-count">({{ filteredIntelMissions.length }})</span></div>
                    <div v-for="m in filteredIntelMissions" :key="m.id"
                         class="mission-card mission-narrative"
                         :class="{ 'mission-completed': m.completed > 0, 'mission-selected': selectedMission?.id === m.id }"
                         @click="selectMission(m)">
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
                <div v-else-if="filteredStoryMissions.length === 0 && filteredOpsMissions.length === 0 && filteredIntelMissions.length === 0" class="empty-msg">
                    No missions match the current filter.
                </div>
            </div>

            <!-- RIGHT: Mission Briefing (when selected) OR Config + Loadout -->
            <div class="column-panel config-loadout">

                <!-- ══ MISSION BRIEFING ══════════════════════════════════ -->
                <template v-if="selectedMission">
                    <div class="briefing-panel">
                        <div class="briefing-header">
                            <span class="briefing-label">MISSION BRIEFING</span>
                            <button class="briefing-close" @click="cancelBriefing">✕</button>
                        </div>
                        <div class="briefing-mission-name">{{ selectedMission.name.toUpperCase() }}</div>
                        <div class="briefing-tags">
                            <span v-if="selectedMission.zone" class="zone-tag">{{ selectedMission.zone.replace(/_/g, ' ').toUpperCase() }}</span>
                            <span v-if="selectedMission.missionType === 'story'" class="story-tag">STORY</span>
                            <span v-if="selectedMission.missionType === 'patrol'" class="patrol-tag">PATROL</span>
                            <span v-if="selectedMission.completed > 0" class="completed-tag">✓ ×{{ selectedMission.completed }}</span>
                        </div>

                        <div class="briefing-section-label">▶ OBJECTIVE</div>
                        <div class="briefing-desc">{{ selectedMission.desc }}</div>

                        <div class="briefing-section-label">▶ THREAT ASSESSMENT</div>
                        <div class="briefing-threat">
                            <div class="threat-row">
                                <span class="threat-label">DIFFICULTY</span>
                                <span class="mission-difficulty threat-val">
                                    <template v-if="selectedMission.difficulty > 0">
                                        <span v-for="i in selectedMission.difficulty" :key="i">★</span>
                                    </template>
                                    <template v-else>— NONE</template>
                                </span>
                            </div>
                            <div class="threat-row" v-if="selectedMission.encounter?.mode !== 'none'">
                                <span class="threat-label">ENERGY COST</span>
                                <span class="threat-val cost">{{ selectedMission.cost?.energy || 0 }} ENR</span>
                            </div>
                            <div class="threat-row" v-if="selectedMission.difficulty > 0">
                                <span class="threat-label">POWER CHECK</span>
                                <span class="threat-val power-indicator" :class="powerClass(selectedMission)">
                                    PWR {{ playerPower }} — {{ briefingPowerLabel }}
                                </span>
                            </div>
                        </div>

                        <div class="briefing-section-label">▶ REWARDS</div>
                        <div class="briefing-rewards">
                            <span v-if="selectedMission.rewards?.glory" class="reward-pill">{{ selectedMission.rewards.glory }} GLORY</span>
                            <span v-if="selectedMission.rewards?.creds" class="reward-pill">{{ selectedMission.rewards.creds }} CREDS</span>
                            <span v-for="(val, key) in repRewards(selectedMission)" :key="key" class="reward-pill rep-pill">+{{ val }} {{ key.replace('rep_', '').toUpperCase() }}</span>
                            <span v-if="!selectedMission.rewards?.glory && !selectedMission.rewards?.creds" class="threat-val" style="opacity:0.5">— Intel value only</span>
                        </div>

                        <div class="briefing-section-label">▶ LOADOUT</div>
                        <div class="briefing-loadout">
                            <span v-if="equippedIds.length === 0" class="briefing-no-loadout">No maneuvers equipped</span>
                            <span v-for="id in equippedIds" :key="id" class="briefing-maneuver-pill">
                                {{ (allManeuvers.find(m => m.id === id)?.name || id).toUpperCase() }}
                            </span>
                        </div>
                        <div class="briefing-config-summary">
                            {{ activeStance.icon }} {{ activeStance.name.toUpperCase() }}
                            &nbsp;|&nbsp;
                            {{ activeTargeting.icon }} {{ activeTargeting.name.toUpperCase() }}
                            &nbsp;|&nbsp;
                            {{ activePosition }}
                        </div>

                        <div class="briefing-actions">
                            <button class="briefing-abort" @click="cancelBriefing">[ ABORT ]</button>
                            <button class="briefing-deploy deploy-pulse" @click="deployMission">[ DEPLOY ]</button>
                        </div>
                    </div>
                </template>

                <!-- ══ CONFIG + LOADOUT (default) ═══════════════════════════ -->
                <template v-else>

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
                    <div class="hud-section-title">> LOADOUT [{{ equippedIds.length }}/3]<span v-if="equippedIds.length >= 3" class="slots-full-badge">FULL</span></div>
                    
                    <!-- Frame Status Mini -->
                    <div class="frame-status-mini" v-if="frameDamaged">
                        <div class="damage-alert">⚠ FRAME DAMAGED</div>
                        <div class="repair-actions">
                            <button class="btn-repair" @click="repairFrame" title="15 Scrap + 2 Parts">
                                ◆ REPAIR (15⚙ + 2⊞)
                            </button>
                            <button class="btn-repair glory" @click="quickRepairGlory" title="5 Glory — emergency repair">
                                ⚔ GLORY REPAIR (5)
                            </button>
                        </div>
                    </div>
                    <div class="maneuver-grid-2col">
                        <div v-for="m in ownedManeuvers" :key="m.id"
                             class="maneuver-mini-card"
                             :class="{ 'equipped': equippedIds.includes(m.id), 'slots-locked': equippedIds.length >= 3 && !equippedIds.includes(m.id) }"
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

                </template><!-- end v-else config/loadout -->
            </div>
        </div>

        <!-- ══ BATTLE VIEW ═══════════════════════════════════════════════════ -->
        <div v-else class="battle-view">

            <!-- Mission context strip -->
            <div class="mission-context-strip" v-if="combatRunner.mission">
                <span class="mcs-label">MISSION</span>
                <span class="mcs-sep">◈</span>
                <span class="mcs-name">{{ combatRunner.mission.name.toUpperCase() }}</span>
                <span v-if="combatRunner.mission.zone" class="mcs-zone">{{ combatRunner.mission.zone.replace(/_/g, ' ').toUpperCase() }}</span>
            </div>

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
                <span class="turn-badge turn-tick">TURN {{ combatRunner.turnNumber }}</span>
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
                              class="token-badge token-glow"
                              :style="{ color: tokenDef(t.type).color, '--token-color': tokenDef(t.type).color }"
                              :title="`${tokenDef(t.type).desc}${t.turns ? ` (${t.turns} turns)` : ''}`">
                            {{ tokenDef(t.type).icon }}×{{ t.stacks }}<small v-if="t.turns"> ({{ t.turns }}t)</small>
                        </span>
                    </div>

                    <div class="parts-list">
                        <div v-for="part in Object.values(playerFrame.parts)" :key="part.id"
                             class="part-row" :class="{ 'destroyed': part.status === 'destroyed', 'part-critical': part.hp > 0 && (part.hp / part.maxHp) < 0.25 }">
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
                              class="token-badge token-glow"
                              :style="{ color: tokenDef(t.type).color, '--token-color': tokenDef(t.type).color }"
                              :title="`${tokenDef(t.type).desc}${t.turns ? ` (${t.turns} turns)` : ''}`">
                            {{ tokenDef(t.type).icon }}×{{ t.stacks }}<small v-if="t.turns"> ({{ t.turns }}t)</small>
                        </span>
                    </div>

                    <div class="parts-list">
                        <div v-for="part in Object.values(enemy.parts || {})" :key="part.id"
                             class="part-row" :class="{ 'destroyed': part.status === 'destroyed', 'part-critical': part.hp > 0 && (part.hp / part.maxHp) < 0.25 }">
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
                     class="log-entry" :class="[logClass(line), { 'log-alt': idx % 2 === 1 }]">
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
                <div class="result-glow-border"></div>
                <div class="result-title result-title-anim">{{ combatResult.toUpperCase() }}</div>
                <div class="result-mission" v-if="combatRunner.mission">
                    {{ combatRunner.mission.name.toUpperCase() }}
                </div>
                <div class="result-sub">
                    <span v-if="combatResult === 'victory'">Mission objectives completed. Salvage recovered.</span>
                    <span v-else>Mission failed. Partial salvage recovered.</span>
                </div>
                <div v-if="combatResult === 'victory' && combatRunner.mission?.rewards" class="result-rewards">
                    <span v-for="(val, key, i) in combatRunner.mission.rewards" :key="key" 
                          class="reward-item reward-stagger"
                          :style="{ animationDelay: (i * 120) + 'ms' }">
                        {{ key.replace(/_/g, ' ').toUpperCase() }}: +{{ val }}
                    </span>
                </div>
                <button class="hud-btn result-continue-btn" @click="continueAfterCombat">[ CONTINUE ]</button>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* ── Container ──────────────────────────────────────────────────────────── */
.combat-panel-container {
    padding: 10px;
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
.group-count {
    font-weight: normal;
    opacity: 0.45;
    letter-spacing: 0;
    font-size: var(--font-size-xxs);
    margin-left: 4px;
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
    font-family: var(--font-body);
    font-size: var(--font-size-xxs); color: var(--text-dim); margin-bottom: 4px;
    line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical;
    overflow: hidden;
}
.mission-footer { display: flex; gap: 12px; font-size: var(--font-size-xxs); font-weight: bold; }
.cost { color: var(--error); }
.rewards { color: var(--primary); display: flex; gap: 6px; }
.empty-msg { font-size: var(--font-size-xs); color: var(--text-dim); padding: 10px 0; }

.zone-tag, .story-tag, .patrol-tag, .completed-tag, .narrative-tag {
    font-size: var(--font-size-micro);
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
    animation: dmg-pulse 2s ease-in-out infinite;
}
@keyframes dmg-pulse {
    0%, 100% { opacity: 1; text-shadow: 0 0 8px rgba(255, 80, 80, 0.7); }
    50% { opacity: 0.65; text-shadow: none; }
}
@media (prefers-reduced-motion: reduce) {
    .damage-alert { animation: none; }
}
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
.maneuver-mini-card.slots-locked {
    opacity: 0.35;
    cursor: not-allowed;
}
.maneuver-mini-card.slots-locked:hover {
    border-color: var(--border-dim);
    background: rgba(30, 40, 50, 0.3);
}
.slots-full-badge {
    color: #f5c542;
    border: 1px solid rgba(245, 197, 66, 0.35);
    padding: 0 5px;
    margin-left: 8px;
    font-size: var(--font-size-xxs);
    letter-spacing: 1px;
    font-weight: normal;
    vertical-align: middle;
}
.mnvr-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
.mnvr-name { font-size: var(--font-size-xs); font-weight: bold; color: var(--text); }
.mnvr-type { font-size: var(--font-size-xxs); color: var(--text-dim); }
.mnvr-desc { font-size: var(--font-size-xxs); color: var(--text-dim); line-height: 1.4; }

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
    font-size: var(--font-size-micro);
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
    min-height: 120px;
    max-height: 220px;
    flex: 1;
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
    line-height: 1.4;
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

/* ── Pilot power readout ─────────────────────────────────────────────────── */
.pilot-power-line {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 0 10px;
    font-size: var(--font-size-xxs);
    letter-spacing: 0.5px;
}
.ppl-label { color: var(--text-dim); opacity: 0.5; letter-spacing: 1px; }
.ppl-val { color: var(--primary); font-weight: bold; }

/* ── Mission filter bar ─────────────────────────────────────────────────── */
.mission-filter-bar {
    display: flex;
    gap: 4px;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border-dim);
}
.filter-btn {
    background: transparent;
    border: 1px solid var(--border-dim);
    color: var(--text-dim);
    font-family: var(--font-mono);
    font-size: var(--font-size-xxs);
    padding: 5px 10px;
    cursor: pointer;
    letter-spacing: 0.5px;
    transition: border-color 0.15s, color 0.15s;
}
.filter-btn:hover { border-color: var(--primary); color: var(--primary); }
.filter-btn.active { border-color: var(--primary); color: var(--primary); background: rgba(0,255,170,0.07); font-weight: bold; }
.filter-hide { margin-left: auto; border-color: #556; }
.filter-hide.active { border-color: #f5c542; color: #f5c542; background: rgba(245,197,66,0.06); }

/* ── Mission selected state ─────────────────────────────────────────────── */
.mission-selected {
    border-color: var(--primary) !important;
    background: rgba(0, 255, 170, 0.06) !important;
    box-shadow: inset 2px 0 0 var(--primary);
}

/* ── Mission briefing panel ─────────────────────────────────────────────── */
.briefing-panel {
    display: flex;
    flex-direction: column;
    gap: 10px;
    height: 100%;
}
.briefing-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(0, 255, 170, 0.25);
    padding-bottom: 6px;
}
.briefing-label {
    font-size: var(--font-size-xxs);
    color: var(--primary);
    letter-spacing: 2px;
    font-weight: bold;
    opacity: 0.7;
}
.briefing-close {
    background: transparent;
    border: none;
    color: var(--text-dim);
    cursor: pointer;
    font-size: var(--font-size-xs);
    padding: 0 4px;
    line-height: 1;
    font-family: inherit;
}
.briefing-close:hover { color: var(--error); }
.briefing-mission-name {
    font-size: var(--font-size-sm);
    font-weight: 900;
    color: var(--secondary);
    letter-spacing: 2px;
    line-height: 1.2;
}
.briefing-tags {
    display: flex;
    gap: 5px;
    flex-wrap: wrap;
}
.briefing-section-label {
    font-size: var(--font-size-xxs);
    color: var(--primary);
    letter-spacing: 1.5px;
    opacity: 0.6;
    margin-top: 2px;
}
.briefing-desc {
    font-family: var(--font-body);
    font-size: var(--font-size-xxs);
    color: var(--text-dim);
    line-height: 1.5;
    letter-spacing: 0.3px;
}
.briefing-threat {
    display: flex;
    flex-direction: column;
    gap: 4px;
}
.threat-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: var(--font-size-xxs);
    padding: 2px 0;
    border-bottom: 1px solid rgba(255,255,255,0.04);
}
.threat-label {
    color: var(--text-dim);
    letter-spacing: 0.5px;
    opacity: 0.6;
}
.threat-val {
    font-weight: bold;
    letter-spacing: 0.5px;
}
.briefing-rewards {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
}
.reward-pill {
    font-size: var(--font-size-xxs);
    padding: 2px 7px;
    border: 1px solid rgba(0,255,170,0.25);
    color: var(--primary);
    letter-spacing: 0.5px;
}
.rep-pill { border-color: rgba(136,170,255,0.3); color: #8af; }
.briefing-loadout {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
}
.briefing-maneuver-pill {
    font-size: var(--font-size-xxs);
    padding: 2px 7px;
    border: 1px solid rgba(0,255,170,0.3);
    background: rgba(0,255,170,0.05);
    color: var(--primary);
    letter-spacing: 0.5px;
}
.briefing-no-loadout {
    font-size: var(--font-size-xxs);
    color: var(--text-dim);
    opacity: 0.5;
    font-style: italic;
}
.briefing-config-summary {
    font-size: var(--font-size-xxs);
    color: var(--text-dim);
    opacity: 0.5;
    letter-spacing: 0.5px;
    border-top: 1px dashed var(--border-dim);
    padding-top: 6px;
}
.briefing-actions {
    display: flex;
    gap: 8px;
    margin-top: auto;
    padding-top: 10px;
    border-top: 1px solid rgba(0,255,170,0.15);
}
.briefing-abort {
    flex: 1;
    background: transparent;
    border: 1px solid var(--error);
    color: var(--error);
    font-family: var(--font-mono);
    font-size: var(--font-size-xs);
    padding: 7px;
    cursor: pointer;
    letter-spacing: 1px;
    transition: all 0.15s;
}
.briefing-abort:hover { background: rgba(255,60,60,0.12); }
.briefing-deploy {
    flex: 2;
    background: rgba(0,255,170,0.08);
    border: 1px solid var(--primary);
    color: var(--primary);
    font-family: var(--font-mono);
    font-size: var(--font-size-xs);
    font-weight: bold;
    padding: 7px;
    cursor: pointer;
    letter-spacing: 2px;
    transition: all 0.15s;
}
.briefing-deploy:hover { background: rgba(0,255,170,0.18); }

/* ── Mission context strip (battle view) ────────────────────────────────── */
.mission-context-strip {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 10px;
    background: rgba(0,0,0,0.4);
    border: 1px solid rgba(255,255,255,0.06);
    font-size: var(--font-size-xxs);
    font-family: var(--font-mono);
    letter-spacing: 1px;
}
.mcs-label { color: var(--text-dim); opacity: 0.5; }
.mcs-sep { color: var(--primary); opacity: 0.4; }
.mcs-name { color: var(--secondary); font-weight: bold; letter-spacing: 1.5px; }
.mcs-zone {
    margin-left: auto;
    color: #8899aa;
    font-size: var(--font-size-micro);
    padding: 0 5px;
    border: 1px solid #334;
}

/* ══════════════════════════════════════════════════════════════════════════
   P1 REDESIGN — Micro-animations, Glow Effects, Visual Hierarchy
   ══════════════════════════════════════════════════════════════════════════ */

/* ── Scanline Overlay ──────────────────────────────────────────────────── */
.scanline-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 1;
    background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0, 255, 65, 0.012) 2px,
        rgba(0, 255, 65, 0.012) 4px
    );
    mix-blend-mode: overlay;
}

/* ── Group Icon Glow ───────────────────────────────────────────────────── */
.group-icon {
    display: inline-block;
    text-shadow: 0 0 8px currentColor;
    margin-right: 2px;
}
.group-header {
    position: relative;
    overflow: hidden;
}
.group-header::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, currentColor, transparent 80%);
    opacity: 0.4;
}
.group-story::after { color: #f5c542; }
.group-ops::after   { color: var(--primary); }
.group-intel::after  { color: #8af; }

/* ── Mission Card Hover Glow ───────────────────────────────────────────── */
.mission-card {
    position: relative;
    overflow: hidden;
}
.mission-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 3px;
    height: 100%;
    background: transparent;
    transition: background 0.25s ease-out, box-shadow 0.25s ease-out;
}
.mission-card:hover::before {
    background: var(--primary);
    box-shadow: 0 0 12px var(--primary), 0 0 4px var(--primary);
}
.mission-story:hover::before {
    background: #f5c542;
    box-shadow: 0 0 12px rgba(245, 197, 66, 0.6), 0 0 4px #f5c542;
}
.mission-narrative:hover::before {
    background: #8af;
    box-shadow: 0 0 12px rgba(136, 170, 255, 0.6), 0 0 4px #8af;
}

/* ── Deploy Button Pulse ───────────────────────────────────────────────── */
.deploy-pulse {
    animation: deploy-glow 2s ease-in-out infinite;
}
@keyframes deploy-glow {
    0%, 100% {
        box-shadow: 0 0 6px rgba(0, 255, 170, 0.15);
    }
    50% {
        box-shadow: 0 0 18px rgba(0, 255, 170, 0.35), inset 0 0 8px rgba(0, 255, 170, 0.08);
    }
}

/* ── Turn Counter Tick ─────────────────────────────────────────────────── */
.turn-tick {
    animation: turn-pulse 0.6s ease-out;
}
@keyframes turn-pulse {
    0%   { text-shadow: 0 0 12px var(--secondary); transform: scale(1.15); }
    100% { text-shadow: none; transform: scale(1); }
}

/* ── Token Glow ────────────────────────────────────────────────────────── */
.token-glow {
    text-shadow: 0 0 6px var(--token-color, currentColor);
    transition: text-shadow 0.3s ease-out;
}
.token-glow:hover {
    text-shadow: 0 0 12px var(--token-color, currentColor), 0 0 4px var(--token-color, currentColor);
}

/* ── Critical Part Pulse ───────────────────────────────────────────────── */
.part-critical .part-label {
    color: #ff4444;
    animation: critical-pulse 1.5s ease-in-out infinite;
}
.part-critical .hp-fill {
    box-shadow: 0 0 8px rgba(255, 51, 51, 0.7);
}
@keyframes critical-pulse {
    0%, 100% { opacity: 1; text-shadow: 0 0 4px rgba(255, 68, 68, 0.5); }
    50%      { opacity: 0.65; text-shadow: none; }
}

/* ── HP Bar Segments ───────────────────────────────────────────────────── */
.part-hp-bar {
    position: relative;
}
.part-hp-bar::after {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
        90deg,
        transparent,
        transparent 19%,
        rgba(0, 0, 0, 0.6) 19%,
        rgba(0, 0, 0, 0.6) 20%
    );
    pointer-events: none;
}
.hp-fill {
    box-shadow: 0 0 4px rgba(0, 255, 65, 0.3);
}

/* ── Combat Log Alternating Rows ───────────────────────────────────────── */
.log-alt {
    background: rgba(255, 255, 255, 0.015);
}
.log-entry {
    padding: 2px 6px;
    border-radius: 1px;
    transition: background 0.15s ease-out;
}
.log-entry:hover {
    background: rgba(255, 255, 255, 0.05);
}

/* ── Result Overlay Animations ─────────────────────────────────────────── */
.result-overlay {
    animation: result-fade-in 0.4s ease-out;
}
@keyframes result-fade-in {
    0% { opacity: 0; backdrop-filter: blur(0px); }
    100% { opacity: 1; backdrop-filter: blur(4px); }
}
.result-overlay { backdrop-filter: blur(4px); }

.result-glow-border {
    position: absolute;
    inset: -1px;
    pointer-events: none;
    z-index: -1;
}
.victory .result-glow-border {
    box-shadow: inset 0 0 30px rgba(0, 255, 65, 0.12), 0 0 40px rgba(0, 255, 65, 0.08);
    animation: victory-glow 2.5s ease-in-out infinite;
}
.defeat .result-glow-border {
    box-shadow: inset 0 0 30px rgba(255, 60, 60, 0.12), 0 0 40px rgba(255, 60, 60, 0.08);
    animation: defeat-flicker 3s ease-in-out infinite;
}
@keyframes victory-glow {
    0%, 100% { box-shadow: inset 0 0 30px rgba(0, 255, 65, 0.12), 0 0 40px rgba(0, 255, 65, 0.08); }
    50%      { box-shadow: inset 0 0 50px rgba(0, 255, 65, 0.2), 0 0 60px rgba(0, 255, 65, 0.15); }
}
@keyframes defeat-flicker {
    0%, 100% { box-shadow: inset 0 0 30px rgba(255, 60, 60, 0.12), 0 0 40px rgba(255, 60, 60, 0.08); }
    50%      { box-shadow: inset 0 0 45px rgba(255, 60, 60, 0.18), 0 0 50px rgba(255, 60, 60, 0.12); }
}

.result-title-anim {
    animation: title-expand 0.5s ease-out;
}
@keyframes title-expand {
    0%   { transform: scale(0.8); opacity: 0; letter-spacing: 2px; }
    70%  { transform: scale(1.05); opacity: 1; }
    100% { transform: scale(1); letter-spacing: 8px; }
}

.reward-stagger {
    animation: reward-slide-in 0.4s ease-out both;
}
@keyframes reward-slide-in {
    0%   { opacity: 0; transform: translateY(8px); }
    100% { opacity: 1; transform: translateY(0); }
}

.result-continue-btn {
    animation: continue-fade 0.6s ease-out 0.8s both;
}
@keyframes continue-fade {
    0%   { opacity: 0; }
    100% { opacity: 1; }
}

/* ── Frame Status Enhancements ─────────────────────────────────────────── */
.player-side {
    box-shadow: inset 0 0 20px rgba(0, 255, 170, 0.04);
}
.enemy-side {
    box-shadow: inset 0 0 20px rgba(255, 60, 60, 0.04);
}
.frame-header {
    text-shadow: 0 0 8px rgba(255, 220, 0, 0.15);
}

/* ── Battle Log Header ─────────────────────────────────────────────────── */
.battle-log {
    border-color: rgba(0, 255, 65, 0.15);
    box-shadow: inset 0 0 15px rgba(0, 0, 0, 0.5);
}

/* ── Briefing panel polish ─────────────────────────────────────────────── */
.briefing-panel {
    animation: briefing-slide 0.25s ease-out;
}
@keyframes briefing-slide {
    0%   { opacity: 0; transform: translateX(10px); }
    100% { opacity: 1; transform: translateX(0); }
}

/* ── Reduced Motion (Accessibility) ────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
    .deploy-pulse,
    .turn-tick,
    .critical-pulse,
    .result-title-anim,
    .reward-stagger,
    .result-continue-btn,
    .briefing-panel,
    .result-overlay {
        animation: none !important;
    }
    .deploy-pulse { box-shadow: 0 0 10px rgba(0, 255, 170, 0.25); }
    .scanline-overlay { display: none; }
    .victory .result-glow-border,
    .defeat .result-glow-border {
        animation: none !important;
    }
}
</style>
