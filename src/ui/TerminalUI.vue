<script>
/**
 * TerminalUI.vue - Main UI Coordinator
 * Refactored into smaller, focused components.
 */
import Game from "@/game";
import { RollOver, ItemOut, default as itemPopup } from "@/ui/popups/itemPopup.vue";
import CombatPanel from "./components/CombatPanel.vue";
import ResourceBufferBadge from "./components/ResourceBufferBadge.vue";
import DialogueModal from "./popups/DialogueModal.vue";

// Section Components
import FactionsPanel from "./sections/FactionsPanel.vue";
import CareerPanel from "./sections/CareerPanel.vue";
import WorkshopPanel from "./sections/WorkshopPanel.vue";
import ZonesPanel from "./sections/ZonesPanel.vue";
import MechaPanel from "./sections/MechaPanel.vue";
import ScrapyardPanel from "./sections/ScrapyardPanel.vue";
import PilotPanel from "./sections/PilotPanel.vue";
import OperationsPanel from "./sections/OperationsPanel.vue";
import ResourceMonitor from "./sections/ResourceMonitor.vue";

export default {
    components: { 
        itemPopup, CombatPanel, ResourceBufferBadge, DialogueModal, 
        FactionsPanel, CareerPanel, WorkshopPanel, ZonesPanel, 
        MechaPanel, ScrapyardPanel, PilotPanel, OperationsPanel, 
        ResourceMonitor 
    },
    props: ['state'],
    data() {
        return {
            selectedCategory: 'scrapyard',
            renderTick: 0,
            _renderInterval: null,
            _pauseRenderTick: false,
            _seenCategories: new Set(['pilot', 'scrapyard']),
            _showPrestigeModal: false,
            _prestigeBreakdown: null,
        };
    },
    methods: {
        isNewTab(cat) {
            this.renderTick;
            return !this._seenCategories.has(cat);
        },
        setCategory(cat) {
            this.selectedCategory = cat;
            this._seenCategories.add(cat);
            this.itemOut();
        },
        itemOut() {
            ItemOut();
        },
        isRunning(task) {
            if (!task) return false;
            return Game.runner.activeTask === task;
        },
        stopAllTasks() {
            Game.runner.stopTask();
        },
        devUnlockAll() {
            if (window.Game) window.Game.devUnlockAll();
            this.renderTick++;
        },
        openPrestigeSummary() {
            if (!window.Game) return;
            this._prestigeBreakdown = window.Game._calculatePrestigeGlory();
            this._showPrestigeModal = true;
        },
        confirmPrestige() {
            if (!window.Game) return;
            window.Game.performPrestige(this._prestigeBreakdown);
            this._showPrestigeModal = false;
            this._prestigeBreakdown = null;
        },
        cancelPrestige() {
            this._showPrestigeModal = false;
            this._prestigeBreakdown = null;
        },
        formatName(id) {
            return id ? id.replace(/_/g, ' ') : '';
        }
    },
    computed: {
        categories() {
            this.renderTick;
            const groups = new Set(Object.values(this.state.items)
                .filter(i => i.type === 'task' && !i.locked && i.group)
                .map(i => i.group));
            
            const hasMissions = Object.values(this.state.items).some(i => i.type === 'mission' && !i.locked);
            if (hasMissions) groups.add('combat');

            const list = Array.from(groups);
            list.unshift('pilot'); 
            if (this.frame && this.chassis) list.splice(1, 0, 'mecha');
            
            const hasFactions = this.factions && this.factions.length > 0;
            if (hasFactions) list.push('factions');

            const hasJobs = Object.values(this.state.items).some(i => i.type === 'job' && !i.locked);
            if (hasJobs) list.push('career');
            
            const hasBlueprints = Object.values(this.state.items).some(i => i.type === 'blueprint' && !i.locked);
            if (hasBlueprints) list.push('workshop');

            const hasZones = Object.values(this.state.items).some(i => i.type === 'zone' && i.discovered);
            if (hasZones) list.push('zones');
            
            return list;
        },
        tasks() {
            this.renderTick;
            const allTasks = Object.values(this.state.items).filter(i => i.type === 'task');
            if (this.selectedCategory === 'pilot') {
                return allTasks.filter(t => !t.locked && t.group === 'pilot');
            }
            return allTasks.filter(t => !t.locked && t.group === this.selectedCategory);
        },
        factions() {
            this.renderTick;
            return Object.values(this.state.items)
                .filter(i => i.type === 'faction')
                .filter(f => {
                    const repItem = this.state.get(f.repId);
                    return repItem && !repItem.locked;
                })
                .map(f => {
                    const repItem = this.state.get(f.repId);
                    const repValue = Math.floor(repItem ? (repItem.val || 0) : 0);
                    
                    let currentTier = { name: "Unknown", min: 0 };
                    let nextTier = null;
                    const thresholds = Object.keys(f.repTiers).map(Number).sort((a,b)=>a-b);
                    for (let i = 0; i < thresholds.length; i++) {
                        if (repValue >= thresholds[i]) {
                            currentTier = { min: thresholds[i], ...f.repTiers[thresholds[i]] };
                            nextTier = thresholds[i+1] ? { min: thresholds[i+1], ...f.repTiers[thresholds[i+1]] } : null;
                        }
                    }
                    
                    let progressPct = 100;
                    if (nextTier) {
                        const range = nextTier.min - currentTier.min;
                        const current = repValue - currentTier.min;
                        progressPct = Math.max(0, Math.min(100, (current / range) * 100));
                    }
                    
                    return { ...f, repValue, currentTier, nextTier, progressPct };
                });
        },
        currentHome() {
            this.renderTick;
            return Object.values(this.state.items).find(i => i.type === 'home' && i.owned > 0);
        },
        combatRunner() {
            return Game.combatState;
        },
        runner() {
            this.renderTick;
            return Game.runner;
        },
        isCritical() {
            this.renderTick;
            const energy = this.state.get('energy');
            return energy && (energy.val / (energy.max || 1)) < 0.15;
        },
        frame() {
            this.renderTick;
            return this.state.player.frame;
        },
        chassis() {
            this.renderTick;
            return this.state.get(this.frame?.chassisId);
        }
    },
    watch: {
        selectedCategory() {
            this.itemOut();
        }
    },
    mounted() {
        const TICK_MS = 200;
        this._renderInterval = setInterval(() => {
            if (!this._pauseRenderTick) this.renderTick++;
        }, TICK_MS);

        Game.showDialogue = (speakerId, pages, onComplete) => {
            if (this.$refs.dialogue) this.$refs.dialogue.show(speakerId, pages, onComplete);
        };
        Game.showChoiceDialogue = (speakerId, pages, choices, onChoice) => {
            if (this.$refs.dialogue) this.$refs.dialogue.showWithChoices(speakerId, pages, choices, onChoice);
        };
    },
    beforeUnmount() {
        if (this._renderInterval) clearInterval(this._renderInterval);
        this._renderInterval = null;
    }
};
</script>

<template>
    <div class="terminal-screen hud-grid" :class="{ 'critical-alert': isCritical }">
        <!-- HEADER WIDGET -->
        <header class="terminal-header hud-panel top-span">
            <div class="glitch-title" data-text="MECHA SCRAPYARD OS v1.5.0">
                {{ currentHome ? currentHome.name.toUpperCase() : 'SCRAPYARD' }} // OS v1.5.0
            </div>
            <div class="header-status">
                <span class="emergency-rest-btn" v-if="isRunning(runner.activeTask)" @click="stopAllTasks">
                    [!] EMERGENCY_STOP [!]
                </span>
                <span class="emergency-rest-btn" style="color: var(--color-warning); border-color: var(--color-warning); margin-right: 15px;" @click="devUnlockAll" title="Unlock All For Testing">
                    [DEV UNLOCK]
                </span>
                <span v-if="state.prestige && state.prestige.gateCompleted"
                      class="prestige-banner"
                      @click="openPrestigeSummary">
                    &#x2605; GLORY RESET AVAILABLE &#x2605;
                </span>
                <span class="sector-phase-tag">[ PHASE: {{ currentHome ? currentHome.id.split('_')[1].toUpperCase() : '0' }} ]</span>
                [ PLT: PILOT_01 ]
            </div>
        </header>

        <!-- RESOURCE MONITOR (Left Sidebar) -->
        <ResourceMonitor :state="state" />

        <!-- MAIN CONSOLE (Central Fragment) -->
        <main class="terminal-main-content hud-panel main-panel">
            <nav class="terminal-category-tabs">
                <button v-for="cat in categories" :key="cat"
                        :class="['hud-tab-btn', { active: selectedCategory === cat }]"
                        @click="setCategory(cat)">
                    <span class="tab-indicator"></span>
                    {{ cat === 'pilot' ? 'PROFILE' : cat.toUpperCase() }}
                    <span v-if="isNewTab(cat)" class="tab-new-badge">NEW</span>
                </button>
            </nav>

            <div class="console-body">
                <!-- COMBAT AREA -->
                <section v-if="selectedCategory === 'combat'">
                    <CombatPanel :state="state" :combatRunner="combatRunner" />
                </section>

                <MechaPanel v-else-if="selectedCategory === 'mecha'"
                    :state="state"
                    @action="renderTick++" />

                <FactionsPanel v-else-if="selectedCategory === 'factions'"
                    :factions="factions"
                    :state="state"
                    @vendor-buy="renderTick++" />

                <WorkshopPanel v-else-if="selectedCategory === 'workshop'"
                    :state="state"
                    @action="renderTick++" />

                <ScrapyardPanel v-else-if="selectedCategory === 'scrapyard'"
                    :state="state"
                    :tasks="tasks" />

                <ZonesPanel v-else-if="selectedCategory === 'zones'"
                    :state="state" />

                <CareerPanel v-else-if="selectedCategory === 'career'"
                    :state="state"
                    @action="renderTick++" />

                <PilotPanel v-else-if="selectedCategory === 'pilot'"
                    :state="state"
                    :tasks="tasks" />

                <OperationsPanel v-else
                    :state="state"
                    :tasks="tasks"
                    :selectedCategory="selectedCategory" />
            </div>
        </main>

        <!-- SYSTEM INFO (Bottom Fragment) -->
        <footer class="terminal-footer hud-panel bottom-span">
            <div class="system-status">
                <span class="status-label">SYS_READY</span> | <span class="blink">_</span>
            </div>
            <div class="home-info" v-if="currentHome">
                SEC: {{ currentHome.name.toUpperCase() }} | {{ currentHome.desc }}
            </div>
        </footer>

        <!-- POPUPS & MODALS -->
        <itemPopup />
        <DialogueModal ref="dialogue" />

        <!-- PRESTIGE SUMMARY MODAL -->
        <div v-if="_showPrestigeModal && _prestigeBreakdown" class="prestige-overlay" @click.self="cancelPrestige">
            <div class="prestige-modal">
                <h2 class="prestige-title">&#x2550;&#x2550; CYCLE COMPLETE &#x2550;&#x2550;</h2>

                <div class="prestige-section">
                    <div class="prestige-row"><span>Story Layer</span><span>{{ state.prestige.storyLayer }} &#x2192; {{ state.prestige.storyLayer + 1 }}</span></div>
                    <div class="prestige-row"><span>Alignment</span><span :class="'align-' + _prestigeBreakdown.alignmentName.toLowerCase()">{{ _prestigeBreakdown.alignmentName.toUpperCase() }} ({{ _prestigeBreakdown.morale }})</span></div>
                    <div class="prestige-row"><span>Cycle</span><span>#{{ state.prestige.cycleCount + 1 }}</span></div>
                </div>

                <h3 class="prestige-subtitle">&#x2500;&#x2500; GLORY EARNED THIS CYCLE &#x2500;&#x2500;</h3>
                <div class="prestige-section">
                    <div class="prestige-row"><span>Phase bonus</span><span>{{ _prestigeBreakdown.phaseBonus }}</span></div>
                    <div class="prestige-row"><span>Mission bonus</span><span>{{ _prestigeBreakdown.missionBonus }}</span></div>
                    <div class="prestige-row"><span>Combat bonus</span><span>{{ _prestigeBreakdown.combatBonus }}</span></div>
                    <div class="prestige-row"><span>Economy bonus</span><span>{{ _prestigeBreakdown.economyBonus }}</span></div>
                    <div class="prestige-divider"></div>
                    <div class="prestige-row"><span>Subtotal</span><span>{{ _prestigeBreakdown.baseGlory }}</span></div>
                    <div class="prestige-row"><span>x {{ _prestigeBreakdown.alignmentName }} multiplier</span><span>x{{ _prestigeBreakdown.alignmentMultiplier.toFixed(2) }}</span></div>
                    <div class="prestige-row"><span>x Consistency bonus</span><span>x{{ _prestigeBreakdown.consistencyBonus.toFixed(2) }}</span></div>
                    <div v-if="_prestigeBreakdown.firstBonus > 1" class="prestige-row prestige-highlight"><span>x FIRST PRESTIGE BONUS</span><span>x{{ _prestigeBreakdown.firstBonus.toFixed(2) }}</span></div>
                    <div class="prestige-divider"></div>
                    <div class="prestige-row prestige-total"><span>GLORY EARNED</span><span>{{ _prestigeBreakdown.totalGlory }}</span></div>
                </div>

                <h3 class="prestige-subtitle">&#x2500;&#x2500; POOL STATUS &#x2500;&#x2500;</h3>
                <div class="prestige-section">
                    <div class="prestige-row"><span>Previous Pool</span><span>{{ state.prestige.gloryPool }}</span></div>
                    <div class="prestige-row"><span>+ Earned</span><span>{{ _prestigeBreakdown.totalGlory }}</span></div>
                    <div class="prestige-divider"></div>
                    <div class="prestige-row prestige-total"><span>= Available</span><span>{{ state.prestige.gloryPool + _prestigeBreakdown.totalGlory }}</span></div>
                </div>

                <div class="prestige-actions">
                    <button class="prestige-btn cancel" @click="cancelPrestige">[ CANCEL ]</button>
                    <button class="prestige-btn confirm" @click="confirmPrestige">&#x2605; CONFIRM RESET &#x2605;</button>
                </div>

                <div class="prestige-warning">
                    Everything will reset. Your knowledge remains.
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
@import "@/../css/mecha_terminal.css";

/* -- HUD GRID SYSTEM ------------------------ */
.hud-grid {
    display: grid;
    grid-template-columns: minmax(220px, 260px) 1fr;
    grid-template-rows: auto 1fr auto;
    grid-template-areas: 
        "head head"
        "res main"
        "foot foot";
    gap: 15px; 
    height: 100vh;
    padding: 15px;
    background: var(--bg-deep);
}

@media (max-width: 900px) {
    .hud-grid {
        grid-template-columns: 1fr; 
        grid-template-rows: auto auto 1fr auto;
        grid-template-areas: "head" "res" "main" "foot";
        height: auto; 
        min-height: 100vh;
    }
}

.hud-panel {
    background: var(--bg-surface);
    border: 1px solid var(--border-dim);
    position: relative;
    padding: 15px;
    border-radius: var(--radius-sm);
}

.top-span { 
    grid-area: head; 
    border-left: 4px solid var(--primary); 
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.main-panel { 
    grid-area: main; 
    border-left: 1px solid var(--border-dim); 
    display: flex;
    flex-direction: column;
    overflow: hidden; 
}

.console-body {
    flex: 1;
    overflow-y: auto;
    padding-right: 15px;
    margin-top: 15px;
    max-width: 1400px;
    margin-left: auto;
    margin-right: auto;
    width: 100%;
}

.bottom-span { 
    grid-area: foot; 
    display: flex; 
    justify-content: space-between; 
    font-size: var(--font-size-xs); 
    color: var(--text-dim); 
    background: var(--bg-main);
}

/* -- TAB NAVIGATION -------------------------- */
.terminal-category-tabs {
    display: flex;
    gap: 8px;
    border-bottom: 1px solid var(--border-dim);
    padding-bottom: 10px;
    flex-wrap: wrap; 
}

.hud-tab-btn {
    background: transparent;
    border: 1px solid transparent;
    border-bottom: 2px solid var(--border-dim);
    color: var(--text-dim);
    padding: 8px 16px;
    font-family: var(--font-mono);
    cursor: pointer;
    transition: all 0.2s;
    font-size: var(--font-size-base);
    display: flex;
    align-items: center;
    gap: 8px;
}

.hud-tab-btn:hover {
    color: var(--primary);
    background: var(--bg-surface-hover);
    border-bottom-color: var(--primary);
}

.hud-tab-btn.active {
    color: var(--primary);
    border: 1px solid var(--border-dim);
    border-bottom: 2px solid var(--primary);
    background: rgba(0, 0, 0, 0.4);
}

.tab-indicator {
    width: 6px;
    height: 6px;
    background: transparent;
    border: 1px solid currentColor;
}

.hud-tab-btn.active .tab-indicator {
    background: var(--primary);
    box-shadow: 0 0 5px var(--primary);
}

.tab-new-badge {
    font-size: 9px;
    color: var(--color-success);
    margin-left: 4px;
    animation: pulse-new 1.5s ease-in-out infinite;
}

@keyframes pulse-new {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
}

/* -- PRESTIGE MODAL -------------------------- */
.prestige-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.85);
    z-index: 10005; display: flex; align-items: center; justify-content: center;
    backdrop-filter: blur(4px);
}
.prestige-modal {
    background: #0b0e12; border: 2px solid var(--primary); width: 100%; max-width: 500px;
    padding: 30px; position: relative; box-shadow: 0 0 40px rgba(255,176,0,0.2);
}
.prestige-title { color: var(--primary); text-align: center; margin-bottom: 20px; letter-spacing: 2px; }
.prestige-section { background: rgba(0,0,0,0.3); padding: 15px; margin-bottom: 20px; border: 1px solid #1a1a1a; }
.prestige-row { display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: 14px; margin-bottom: 8px; }
.prestige-divider { height: 1px; background: #333; margin: 10px 0; }
.prestige-total { font-weight: bold; color: var(--primary); font-size: 18px; margin-top: 10px; }
.prestige-highlight { color: var(--color-success); font-weight: bold; }
.prestige-actions { display: flex; gap: 15px; margin-top: 25px; }
.prestige-btn { flex: 1; font-family: var(--font-mono); font-weight: bold; padding: 12px; cursor: pointer; border: 1px solid; }
.prestige-btn.confirm { background: var(--primary); color: #000; border-color: var(--primary); }
.prestige-btn.cancel { background: transparent; color: var(--text-dim); border-color: #333; }
.prestige-warning { margin-top: 15px; font-size: 10px; color: var(--text-faint); text-align: center; text-transform: uppercase; }

/* -- GLOBAL UTILS -------------------------- */
.blink { animation: blink 1s infinite; }
@keyframes blink { 50% { opacity: 0; } }

.emergency-rest-btn {
    background: rgba(255, 65, 54, 0.1);
    border: 1px solid #ff4136;
    color: #ff4136;
    padding: 2px 10px;
    font-size: var(--font-size-base);
    cursor: pointer;
    animation: flash-red 0.5s infinite alternate;
}

@keyframes flash-red {
    from { background: rgba(255, 65, 54, 0.1); }
    to { background: rgba(255, 65, 54, 0.3); }
}

.critical-alert {
    animation: critical-jitter 0.2s infinite;
}

@keyframes critical-jitter {
    0% { transform: translate(0, 0); }
    25% { transform: translate(1px, -1px); }
    50% { transform: translate(-1px, 1px); }
    75% { transform: translate(1px, 1px); }
    100% { transform: translate(0, 0); }
}
</style>
