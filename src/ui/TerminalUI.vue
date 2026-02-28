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
import { getAllianceLabel } from "@/ui/uiHelpers";

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

// Tab group definitions — maps primary tab IDs to their sub-tab children
const TAB_GROUPS = {
    profile: {
        label: 'PROFILE',
        children: ['pilot_overview', 'pilot_training', 'pilot_skills'],
        childLabels: { pilot_overview: 'OVERVIEW', pilot_training: 'TRAINING', pilot_skills: 'SKILL TREE' },
    },
    base: {
        label: 'BASE',
        children: ['scrapyard', 'income', 'exploration', 'refinery'],
        // Which child categories are task-groups (use OperationsPanel)
        taskGroupChildren: ['income', 'exploration', 'refinery'],
    },
    world: {
        label: 'WORLD',
        children: ['zones', 'factions', 'career'],
    },
};

// Flat set of all children for quick lookup
const ALL_GROUP_CHILDREN = new Set(
    Object.values(TAB_GROUPS).flatMap(g => g.children)
);

// Map child → parent for reverse lookup
const CHILD_TO_PARENT = {};
for (const [parentId, group] of Object.entries(TAB_GROUPS)) {
    for (const child of group.children) {
        CHILD_TO_PARENT[child] = parentId;
    }
}

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
            selectedCategory: 'base',
            selectedSubTab: { base: 'scrapyard', world: 'zones', profile: 'pilot_overview' },
            renderTick: 0,
            _renderInterval: null,
            _pauseRenderTick: false,
            _seenCategories: new Set(['pilot', 'pilot_overview', 'scrapyard', 'base', 'profile']),
            _showPrestigeModal: false,
            _prestigeBreakdown: null,
        };
    },
    methods: {
        isNewTab(cat) {
            this.renderTick;
            return !this._seenCategories.has(cat);
        },
        isNewGroup(groupId) {
            // A group tab shows NEW if any of its children are new
            this.renderTick;
            const group = TAB_GROUPS[groupId];
            if (!group) return this.isNewTab(groupId);
            return group.children.some(child => this.isNewTab(child));
        },
        setCategory(cat) {
            this.selectedCategory = cat;
            this._seenCategories.add(cat);
            // If selecting a group tab, also mark the default sub-tab as seen
            if (TAB_GROUPS[cat]) {
                const defaultChild = this.selectedSubTab[cat] || TAB_GROUPS[cat].children[0];
                this._seenCategories.add(defaultChild);
            }
            this.itemOut();
        },
        setSubTab(parentId, childId) {
            this.selectedSubTab[parentId] = childId;
            this._seenCategories.add(childId);
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
        // All unlocked leaf categories (flat Set)
        _allLeafCategories() {
            this.renderTick;
            const cats = new Set(Object.values(this.state.items)
                .filter(i => i.type === 'task' && !i.locked && i.group)
                .map(i => i.group));
            
            // Profile sub-tabs are always available
            cats.add('pilot_overview');
            cats.add('pilot_training');
            cats.add('pilot_skills');

            // Mecha available when frame is equipped
            if (this.frame && this.chassis) cats.add('mecha');
            
            const hasMissions = Object.values(this.state.items).some(i => i.type === 'mission' && !i.locked);
            if (hasMissions) cats.add('combat');
            
            const hasFactions = this.factions && this.factions.length > 0;
            if (hasFactions) cats.add('factions');

            const hasJobs = Object.values(this.state.items).some(i => i.type === 'job' && !i.locked);
            if (hasJobs) cats.add('career');
            
            const hasBlueprints = Object.values(this.state.items).some(i => i.type === 'blueprint' && !i.locked);
            if (hasBlueprints) cats.add('workshop');

            const hasZones = Object.values(this.state.items).some(i => i.type === 'zone' && i.discovered);
            if (hasZones) cats.add('zones');
            
            return cats;
        },
        // Primary tabs — groups replace their children
        primaryTabs() {
            const leafSet = this._allLeafCategories;
            const tabs = [];
            const added = new Set();

            // Fixed order: profile, mecha, base, combat, world, workshop
            const order = ['profile', 'mecha', 'base', 'combat', 'world', 'workshop'];

            for (const id of order) {
                if (TAB_GROUPS[id]) {
                    // Group tab — show if ANY child is unlocked
                    const group = TAB_GROUPS[id];
                    const hasAnyChild = group.children.some(c => leafSet.has(c));
                    if (hasAnyChild) {
                        tabs.push({ id, label: group.label, isGroup: true });
                        added.add(id);
                    }
                } else if (leafSet.has(id)) {
                    tabs.push({ id, label: id.toUpperCase(), isGroup: false });
                    added.add(id);
                }
            }
            return tabs;
        },
        // Sub-tabs for the currently selected group (empty if not a group)
        activeSubTabs() {
            const group = TAB_GROUPS[this.selectedCategory];
            if (!group) return [];
            const leafSet = this._allLeafCategories;
            return group.children
                .filter(c => leafSet.has(c))
                .map(c => ({
                    id: c,
                    label: group.childLabels?.[c] || c.toUpperCase(),
                }));
        },
        // The actual resolved category for panel routing
        activeCategory() {
            const group = TAB_GROUPS[this.selectedCategory];
            if (group) {
                return this.selectedSubTab[this.selectedCategory] || group.children[0];
            }
            return this.selectedCategory;
        },
        // Keep old name for backward compat in template
        categories() {
            return this.primaryTabs.map(t => t.id);
        },
        currentDirective() {
            this.renderTick;
            const items = this.state.items;
            const directives = [
                { id: 'gather_scrap', text: 'Scavenge scrap from the piles.', condition: () => (items.scrap?.val || 0) >= 30, progress: () => Math.floor(items.scrap?.val || 0), target: 30 },
                { id: 'earn_creds', text: 'Earn Creds from Odd Jobs.', condition: () => (items.creds?.val || 0) >= 15, progress: () => Math.floor(items.creds?.val || 0), target: 15 },
                { id: 'build_sorting', text: 'Build the Sorting Station.', condition: () => (this.state.get('sorting_station')?.owned || 0) > 0, progress: () => ((this.state.get('sorting_station')?.owned || 0) > 0 ? 1 : 0), target: 1 },
                { id: 'upgrade_workshop', text: 'Upgrade the Workshop.', condition: () => (this.state.get('workshop_lv2')?.owned || 0) > 0, progress: () => ((this.state.get('workshop_lv2')?.owned || 0) > 0 ? 1 : 0), target: 1 },
                { id: 'restore_garage', text: 'Restore the Garage.', condition: () => (this.state.get('garage')?.owned || 0) > 0, progress: () => ((this.state.get('garage')?.owned || 0) > 0 ? 1 : 0), target: 1 },
            ];
            for (const d of directives) {
                if (!d.condition()) return d;
            }
            return null;
        },
        tasks() {
            this.renderTick;
            const cat = this.activeCategory;
            const allTasks = Object.values(this.state.items).filter(i => i.type === 'task');
            if (cat === 'pilot' || cat === 'pilot_overview' || cat === 'pilot_training' || cat === 'pilot_skills') {
                return allTasks.filter(t => !t.locked && t.group === 'pilot');
            }
            return allTasks.filter(t => !t.locked && t.group === cat);
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
                    
                    return { ...f, repValue, currentTier, nextTier, progressPct, allianceLabel: getAllianceLabel(repValue) };
                });
        },
        contacts() {
            this.renderTick;
            return Object.values(this.state.items)
                .filter(i => i.type === 'contact' && Game.evalRequire(i.unlockRequire));
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
        Game.dismissDialogue = () => {
            if (this.$refs.dialogue) {
                this.$refs.dialogue.queue = [];
                this.$refs.dialogue.onComplete = null;
                this.$refs.dialogue.onChoice = null;
                this.$refs.dialogue.close();
            }
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
            <div v-if="currentDirective" class="header-directive">
                <span class="directive-icon">▶</span>
                <span class="directive-label">{{ currentDirective.text }}</span>
                <span class="directive-progress-inline">[{{ currentDirective.progress() }}/{{ currentDirective.target }}]</span>
                <div class="directive-bar-inline">
                    <div class="directive-fill-inline" :style="{ width: Math.min(100, (currentDirective.progress() / currentDirective.target) * 100) + '%' }"></div>
                </div>
            </div>
        </header>

        <!-- RESOURCE MONITOR (Left Sidebar) -->
        <ResourceMonitor :state="state" />

        <!-- MAIN CONSOLE (Central Fragment) -->
        <main class="terminal-main-content hud-panel main-panel">
            <!-- PRIMARY TABS -->
            <nav class="terminal-category-tabs">
                <button v-for="tab in primaryTabs" :key="tab.id"
                        :class="['hud-tab-btn', { active: selectedCategory === tab.id }]"
                        @click="setCategory(tab.id)">
                    <span class="tab-indicator"></span>
                    {{ tab.label }}
                    <span v-if="isNewGroup(tab.id)" class="tab-new-badge">NEW</span>
                </button>
            </nav>

            <!-- SUB-TABS (shown only when a group tab is selected) -->
            <nav v-if="activeSubTabs.length > 0" class="sub-tab-bar">
                <button v-for="sub in activeSubTabs" :key="sub.id"
                        :class="['sub-tab-btn', { active: activeCategory === sub.id }]"
                        @click="setSubTab(selectedCategory, sub.id)">
                    {{ sub.label }}
                    <span v-if="isNewTab(sub.id)" class="tab-new-badge">NEW</span>
                </button>
            </nav>

            <div class="console-body">
                <!-- COMBAT AREA -->
                <section v-if="activeCategory === 'combat'">
                    <CombatPanel :state="state" :combatRunner="combatRunner" />
                </section>

                <MechaPanel v-else-if="activeCategory === 'mecha'"
                    :state="state"
                    @action="renderTick++" />

                <FactionsPanel v-else-if="activeCategory === 'factions'"
                    :factions="factions"
                    :contacts="contacts"
                    :state="state"
                    @vendor-buy="renderTick++" />

                <WorkshopPanel v-else-if="activeCategory === 'workshop'"
                    :state="state"
                    @action="renderTick++" />

                <ScrapyardPanel v-else-if="activeCategory === 'scrapyard'"
                    :state="state"
                    :tasks="tasks" />

                <ZonesPanel v-else-if="activeCategory === 'zones'"
                    :state="state" />

                <CareerPanel v-else-if="activeCategory === 'career'"
                    :state="state"
                    @action="renderTick++" />

                <PilotPanel v-else-if="activeCategory === 'pilot_overview' || activeCategory === 'pilot_training' || activeCategory === 'pilot_skills'"
                    :state="state"
                    :tasks="tasks"
                    :activeView="activeCategory" />

                <OperationsPanel v-else
                    :state="state"
                    :tasks="tasks"
                    :selectedCategory="activeCategory" />
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
/* -- HUD GRID SYSTEM ------------------------ */
.hud-grid {
    display: grid;
    grid-template-columns: clamp(260px, 18vw, 360px) 1fr;
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
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
}

/* Header Directive Tracker */
.header-directive {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    padding-top: 8px;
    margin-top: 6px;
    border-top: 1px solid var(--border-dim);
    font-family: var(--font-mono);
    font-size: var(--font-size-xxs);
    color: var(--text-dim);
    letter-spacing: 0.5px;
}
.directive-icon {
    color: var(--primary);
    font-size: var(--font-size-xs);
}
.directive-label {
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 40%;
}
.directive-progress-inline {
    color: var(--primary);
    font-weight: bold;
    white-space: nowrap;
}
.directive-bar-inline {
    flex: 1;
    height: 4px;
    background: rgba(0, 255, 65, 0.1);
    border: 1px solid rgba(0, 255, 65, 0.15);
    min-width: 60px;
    max-width: 200px;
}
.directive-fill-inline {
    height: 100%;
    background: var(--primary);
    box-shadow: 0 0 6px var(--primary);
    transition: width 0.3s ease;
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
    font-size: var(--font-size-xxs);
    color: var(--color-success);
    margin-left: 4px;
    animation: pulse-new 1.5s ease-in-out infinite;
}

/* -- SUB-TAB NAVIGATION ---------------------- */
.sub-tab-bar {
    display: flex;
    gap: 4px;
    padding: 6px 0;
    border-bottom: 1px solid var(--border-dim);
    background: rgba(0, 0, 0, 0.2);
    margin: 0 -15px;
    padding-left: 15px;
    padding-right: 15px;
}

.sub-tab-btn {
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--text-dim);
    padding: 4px 12px;
    font-family: var(--font-mono);
    cursor: pointer;
    transition: all 0.2s;
    font-size: var(--font-size-sm, 11px);
    display: flex;
    align-items: center;
    gap: 6px;
    letter-spacing: 1px;
}

.sub-tab-btn:hover {
    color: var(--secondary, #fdc);
    border-bottom-color: var(--secondary, #fdc);
}

.sub-tab-btn.active {
    color: var(--secondary, #fdc);
    border-bottom: 2px solid var(--secondary, #fdc);
    background: rgba(255, 220, 0, 0.05);
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
.prestige-row { display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: var(--font-size-sm); margin-bottom: 8px; }
.prestige-divider { height: 1px; background: #333; margin: 10px 0; }
.prestige-total { font-weight: bold; color: var(--primary); font-size: var(--font-size-lg); margin-top: 10px; }
.prestige-highlight { color: var(--color-success); font-weight: bold; }
.prestige-actions { display: flex; gap: 15px; margin-top: 25px; }
.prestige-btn { flex: 1; font-family: var(--font-mono); font-weight: bold; padding: 12px; cursor: pointer; border: 1px solid; }
.prestige-btn.confirm { background: var(--primary); color: #000; border-color: var(--primary); }
.prestige-btn.cancel { background: transparent; color: var(--text-dim); border-color: #333; }
.prestige-warning { margin-top: 15px; font-size: var(--font-size-xxs); color: var(--text-faint); text-align: center; text-transform: uppercase; }

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
