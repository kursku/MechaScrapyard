<script>
import Game from "@/game";
import { RollOver, ItemOut, default as itemPopup } from "@/ui/popups/itemPopup.vue";
import CombatPanel from "./components/CombatPanel.vue";
import ResourceBufferBadge from "./components/ResourceBufferBadge.vue";
import DialogueModal from "./popups/DialogueModal.vue";

export default {
    components: { itemPopup, CombatPanel, ResourceBufferBadge, DialogueModal },
    props: ['state'],
    data() {
        return {
            selectedCategory: 'scrapyard',
            renderTick: 0,
            _renderInterval: null,
            _seenCategories: new Set(['pilot', 'scrapyard']),
            _showPrestigeModal: false,
            _selectedZoneId: null,
            _prestigeBreakdown: null,
            selectedInventoryTab: 'parts',
            selectedWorkshopTab: 'all',
        };
    },
    methods: {
        isNewTab(cat) {
            this.renderTick;
            if (this._seenCategories.has(cat)) return false;
            return true;
        },
        assignAndroid(id) { Game.assignAndroid(id); },
        unassignAndroid() { Game.unassignAndroid(); },
        getTaskName(id) {
            const task = this.state.items[id];
            return task ? task.name : 'Unknown';
        },
        itemOver(e, it) {
            RollOver(e, it);
        },
        itemOut() {
            ItemOut();
        },
        tryItem(it) {
            Game.tryItem(it);
        },
        enrollJob(id) { Game.enrollJob(id); this.renderTick++; },
        promoteJob() { Game.promoteJob(); this.renderTick++; },
        quitJob() { Game.quitJob(); this.renderTick++; },
        makeChoice(task, choice) {
            Game.runner.fulfillChoice(task, choice);
        },
        getAlignmentText(val) {
            if (val >= 40) return "PARAGON";
            if (val <= -40) return "SHADOW";
            return "PRAGMATIST";
        },
        getPercent(task) {
            if (!task.length || Game.runner.activeTask !== task) return 0;
            return (Game.runner.taskProgress / task.length) * 100;
        },
        isRunning(task) {
            return Game.runner.activeTask === task;
        },
        getTaskTimeRemaining(task) {
            if (!this.isRunning(task) || !task.length) return "0.0";
            const progress = Game.runner.taskProgress || 0;
            const remaining = Math.max(0, task.length - progress);
            const speed = Game.runner.getTaskSpeed(task);
            return (remaining / Math.max(0.1, speed)).toFixed(1);
        },
        stopAllTasks() {
            Game.runner.stopTask();
        },
        renderBar(val, max, width = 12) {
            if (!max) return '[' + '.'.repeat(width) + ']';
            const pct = Math.min(1, val / max);
            const filled = Math.round(pct * width);
            const empty = width - filled;
            return '[' + '|'.repeat(filled) + '.'.repeat(empty) + ']';
        },
        getNetRate(res) {
            let rate = res.rate || 0;
            // Add Focus multiplier to base production
            if (rate > 0) {
                const focus = this.state.get('focus')?.val || 0;
                rate *= (1 + focus * 0.05);
            }

            const activeTask = Game.runner.activeTask;
            if (activeTask) {
                if (activeTask.effect && activeTask.effect[res.id]) {
                    rate += activeTask.effect[res.id];
                }
                if (activeTask.run && activeTask.run[res.id]) {
                    rate -= activeTask.run[res.id];
                }
            }
            return rate;
        },
        getTaskNetRates(task) {
            const rates = {};
            if (task.effect) Object.entries(task.effect).forEach(([k, v]) => { rates[k] = (rates[k] || 0) + v; });
            if (task.run) Object.entries(task.run).forEach(([k, v]) => { rates[k] = (rates[k] || 0) - v; });
            return rates;
        },
        fmtRate(val) {
            if (Math.abs(val) < 0.01) return "";
            const sign = val > 0 ? "+" : "";
            const v = Math.abs(val);
            if (v >= 100) return sign + Math.floor(v);
            if (v >= 10) return sign + v.toFixed(1);
            return sign + v.toFixed(2);
        },
        resourceIcon(id) {
            const res = this.state?.items?.[id];
            if (res && res.abbr) return res.abbr;
            const ICONS = {
                energy: 'E', scrap: 'S', creds: '\u00A2',
                ferrous_scrap: 'Fe', polymer_scrap: 'Po', electronic_scrap: 'El',
                nano_infra: 'Ni', nanofiber: 'Nf', ceramite: 'Ce', fusion_cells: 'Fu', quantum_circuits: 'Qc',
                glory: 'G', parts: 'P', supply: 'Sp', data_chips: 'Dc',
                rep_police: 'RP', rep_military: 'RM', rep_underground: 'RU',
                rep_corporate: 'RC', rep_exile: 'RE',
                morality: '\u2696', prestige_points: '\u2605'
            };
            return ICONS[id] || '\u2022';
        },
        dismantlePart(part) {
            Game.dismantlePart(part);
        },
        canAfford(matId, amount) {
            const res = this.state.get(matId);
            return res && res.val >= amount;
        },
        craftBlueprint(bp) {
            Game.craftBlueprint(bp);
        },
        formatName(id) {
            return id.replace(/_/g, ' ');
        },
        formatModKey(k) {
            const parts = k.split('.');
            if (parts.length === 2) {
                if (parts[1].toLowerCase() === 'val') {
                    return this.formatName(parts[0]).toUpperCase();
                }
                return `${this.formatName(parts[0]).toUpperCase()} ${parts[1].toUpperCase()}`;
            }
            return this.formatName(k).toUpperCase();
        },
        getValidWeapons(slotId) {
            const chassis = this.state.get(this.frame.chassisId);
            if (!chassis || !chassis.equipSlots || !chassis.equipSlots[slotId]) return [];
            const accepts = chassis.equipSlots[slotId].accepts;
            return Object.values(this.state.items).filter(i => {
                if (!i.owned) return false;
                if (accepts === 'backpack') return i.type === 'backpack';
                return i.type === 'weapon' && i.slot === accepts;
            });
        },
        equipItem(slotId, event) {
            Game.equipItem(slotId, event.target.value);
        },
        getLinkedEquipSlot(partSlotId) {
            const chassis = this.state.get(this.frame.chassisId);
            if (!chassis || !chassis.equipSlots) return null;
            return Object.keys(chassis.equipSlots).find(k => chassis.equipSlots[k].linkedPart === partSlotId);
        },
        equipFrame(frameId) {
            Game.equipFrame(frameId);
        },
        equipPart(slotId, partObjId) {
            Game.equipPart(slotId, partObjId);
        },
        getFactionVendorItems(factionId) {
            if (!Game.getFactionVendor) return { parts: [], weapons: [], blueprints: [], backpacks: [] };
            return Game.getFactionVendor(factionId);
        },
        buyVendorItem(itemId, factionId) {
            if (!Game.buyFromVendor) return;
            Game.buyFromVendor(itemId, factionId);
            this.renderTick++;
        },
        getVendorItem(itemId) {
            return this.state.items[itemId] || null;
        },
        getVendorItemCost(itemId) {
            if (Game.getVendorItemCost) return Game.getVendorItemCost(itemId);
            const item = this.getVendorItem(itemId);
            if (!item) return null;
            return typeof item.value === 'number' ? item.value : 50;
        },
        canBuyVendorItem(itemId, factionId) {
            const item = this.getVendorItem(itemId);
            if (!item) return false;

            const catalog = this.getFactionVendorItems(factionId);
            const inCatalog = ['parts', 'weapons', 'blueprints', 'backpacks'].some(cat => catalog[cat].includes(itemId));
            if (!inCatalog) return false;

            if (item.type === 'blueprint' && !item.locked) return false;
            if (item.max !== undefined && item.owned !== undefined && (item.owned || 0) >= item.max) return false;

            const creds = this.state.get('creds');
            const cost = this.getVendorItemCost(itemId);
            if (!creds || cost == null) return false;
            return (creds.val || 0) >= cost;
        },
        getAllianceLabel(repValue) {
            if (repValue < 10) return 'HOSTILE';
            if (repValue < 25) return 'TENSE';
            if (repValue < 50) return 'NEUTRAL';
            if (repValue < 75) return 'FRIENDLY';
            return 'ALLIED';
        },
        getFactionVendorCategories(fac) {
            const catalog = this.getFactionVendorItems(fac.id);
            return [
                { key: 'parts', label: 'PARTS', items: catalog.parts || [] },
                { key: 'weapons', label: 'WEAPONS', items: catalog.weapons || [] },
                { key: 'backpacks', label: 'BACKPACKS', items: catalog.backpacks || [] },
                { key: 'blueprints', label: 'BLUEPRINTS', items: catalog.blueprints || [] }
            ].filter(c => c.items.length > 0);
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
        }
    },
    computed: {
        currentDirective() {
            this.renderTick; // Force reactivity

            const g = this.state.g;
            const items = this.state.items;

            const directives = [
                {
                    id: 'gather_scrap',
                    text: 'Scavenge scrap from the piles.',
                    detail: 'Click SCAVENGE SCRAP to start collecting.',
                    condition: () => (items.scrap?.val || 0) >= 30,
                    progress: () => Math.floor(items.scrap?.val || 0),
                    target: 30,
                    unit: 'SCRAP'
                },
                {
                    id: 'earn_creds',
                    text: 'Earn Creds from Odd Jobs.',
                    detail: 'Run ODD JOBS to earn currency.',
                    condition: () => (items.creds?.val || 0) >= 15,
                    progress: () => Math.floor(items.creds?.val || 0),
                    target: 15,
                    unit: 'CREDS'
                },
                {
                    id: 'build_sorting',
                    text: 'Build the Sorting Station.',
                    detail: 'Scroll down to BASE INFRASTRUCTURE.',
                    condition: () => (this.state.get('sorting_station')?.owned || 0) > 0,
                    progress: () => ((this.state.get('sorting_station')?.owned || 0) > 0 ? 1 : 0),
                    target: 1,
                    unit: 'BUILT'
                },
                {
                    id: 'upgrade_workshop',
                    text: 'Upgrade the Workshop.',
                    detail: 'Restore grandpa\'s workshop to full power.',
                    condition: () => (this.state.get('workshop_lv2')?.owned || 0) > 0,
                    progress: () => ((this.state.get('workshop_lv2')?.owned || 0) > 0 ? 1 : 0),
                    target: 1,
                    unit: 'BUILT'
                },
                {
                    id: 'restore_garage',
                    text: 'Restore the Garage.',
                    detail: 'Something from the past awaits inside.',
                    condition: () => (this.state.get('garage')?.owned || 0) > 0,
                    progress: () => ((this.state.get('garage')?.owned || 0) > 0 ? 1 : 0),
                    target: 1,
                    unit: 'BUILT'
                },
            ];

            for (const d of directives) {
                if (!d.condition()) return d;
            }
            return null;
        },
        android() {
            this.renderTick;
            return Game.state.android;
        },
        resources() {
            // Force UI updates even when the underlying source is non-reactive (class instances, timers)
            this.renderTick;

            // Trigger update when runner changes active task (to update net rates)
            const _ = Game.runner.activeTask;
            
            return Object.values(this.state.items)
                .filter(i => {
                    if (i.type !== 'resource' || i.locked) return false;
                    // Support for hideWhen logic
                    if (i.hideWhen && Game.techTree.evaluate(i.hideWhen)) return false;
                    return true;
                })
                .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        },
        tasks() {
            this.renderTick;

            const allTasks = Object.values(this.state.items).filter(i => i.type === 'task');
            if (this.selectedCategory === 'pilot') {
                return allTasks.filter(t => !t.locked && t.group === 'pilot');
            }
            return allTasks.filter(t => !t.locked && t.group === this.selectedCategory);
        },
        categories() {
        this.renderTick;

        const allTasks = Object.values(this.state.items).filter(i => i.type === 'task');
        const groups = new Set(allTasks.filter(t => !t.locked).map(t => t.group).filter(g => g !== 'pilot'));
        
        // Check if combat/missions are available
        const hasMissions = Object.values(this.state.items).some(i => i.type === 'mission' && !i.locked);
        if (hasMissions) groups.add('combat');

        const list = Array.from(groups);
        list.unshift('pilot'); // Put PILOT first
        if (this.frame && this.chassis) list.splice(1, 0, 'mecha');
        
        const hasFactions = this.factions && this.factions.length > 0;
        if (hasFactions) list.push('factions');

        // Career tab: visible when any job is unlocked
        const hasJobs = Object.values(this.state.items).some(i => i.type === 'job' && !i.locked);
        if (hasJobs) list.push('career');
        
        const hasBlueprints = Object.values(this.state.items).some(i => i.type === 'blueprint' && !i.locked);
        if (hasBlueprints) list.push('workshop');

        const hasZones = Object.values(this.state.items).some(i => i.type === 'zone' && i.discovered);
        if (hasZones) list.push('zones');
        
        return list;
    },
        zones() {
            this.renderTick;
            return Object.values(this.state.items)
                .filter(i => i.type === 'zone')
                .sort((a, b) => (a.phase || 1) - (b.phase || 1));
        },
        selectedZone() {
            this.renderTick;
            if (!this._selectedZoneId) {
                const first = this.zones.find(z => z.discovered);
                return first || null;
            }
            return this.state.items[this._selectedZoneId] || null;
        },
        factions() {
            this.renderTick;
            return Object.values(this.state.items)
                .filter(i => i.type === 'faction')
                .filter(f => {
                    const repItem = this.state.get(f.repId);
                    // Only show faction if the associated reputation resource is unlocked
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
                            if (i + 1 < thresholds.length) {
                                nextTier = { min: thresholds[i+1], ...f.repTiers[thresholds[i+1]] };
                            } else {
                                nextTier = null;
                            }
                        }
                    }
                    
                    // Progress to next tier
                    let progressPct = 100;
                    if (nextTier) {
                        const range = nextTier.min - currentTier.min;
                        const current = repValue - currentTier.min;
                        progressPct = Math.max(0, Math.min(100, (current / range) * 100));
                    }
                    
                    return { 
                        ...f, 
                        repValue, 
                        currentTier, 
                        nextTier, 
                        progressPct,
                        allianceLabel: this.getAllianceLabel(repValue),
                    };
                });
        },
        morphology() {
            this.renderTick;
            return Object.values(this.state.items).filter(i => i.type === 'player_stat' && !i.hide);
        },
        skills() {
            this.renderTick;
            return Object.values(this.state.items).filter(i => i.type === 'skill' && !i.locked);
        },
        upgrades() {
            this.renderTick;
            return Object.values(this.state.items).filter(i => 
                (i.type === 'upgrade' || i.type === 'furniture') && 
                !i.locked && 
                (i.owned || 0) < (i.max || 1) &&
                !(i.tags && i.tags.includes('t_blueprint'))
            );
        },
        blueprints() {
            this.renderTick;
            return Object.values(this.state.items).filter(i => 
                i.type === 'blueprint' && 
                !i.locked && 
                (i.repeatable || i.type === 'recycle' || (i.owned || 0) < (i.max || 1))
            );
        },
        filteredBlueprints() {
            this.renderTick;
            return this.blueprints.filter(bp => {
                if (this.selectedWorkshopTab === 'all') return true;
                if (this.selectedWorkshopTab === 'frames') return bp.type === 'frame';
                if (this.selectedWorkshopTab === 'parts') return bp.type === 'part' || bp.type === 'frame_part';
                if (this.selectedWorkshopTab === 'weapons') return bp.type === 'weapon';
                if (this.selectedWorkshopTab === 'recycle') return bp.type === 'recycle';
                return true;
            });
        },
        morality() {
            this.renderTick;
            return this.state.get("morality");
        },
        rawScrap() {
            this.renderTick;
            return this.state.items.scrap;
        },
        showRawScrapIndicator() {
            this.renderTick;
            return (this.state.g.sorting_station || 0) > 0 && !!this.rawScrap;
        },
        moralRes() {
            this.renderTick;
            return this.state.get("morality");
        },
        moralValue() {
            this.renderTick;
            return this.moralRes?.val || 0;
        },
        moralLabel() {
            const v = this.moralValue;
            if (v >= 80) return 'Paragon (Devoted)';
            if (v >= 40) return 'Paragon';
            if (v <= -80) return 'Shadow (Entrenched)';
            if (v <= -40) return 'Shadow';
            return 'Pragmatist';
        },
        moralColor() {
            const v = this.moralValue;
            if (v >= 40) return '#4af';
            if (v <= -40) return '#f55';
            return '#fa0';
        },
        moralBarStyle() {
            const v = this.moralValue;
            const pct = ((v + 100) / 200) * 100;
            return {
                width: pct + '%',
                backgroundColor: this.moralColor,
            };
        },
        reputation() {
            this.renderTick;
            return this.state.get("reputation");
        },
        energy() {
            this.renderTick;
            return this.state.get("energy");
        },
        currentHome() {
            this.renderTick;
            return Object.values(this.state.items).find(i => i.type === 'home' && i.owned > 0);
        },
        combatRunner() {
            // combatState is a reactive object synced from CombatRunner every tick
            return Game.combatState;
        },
        runner() {
            this.renderTick;
            return Game.runner;
        },
        isCritical() {
            this.renderTick;
            const energy = this.state.get('energy');
            return energy && (energy.val / energy.max) < 0.15;
        },
        frame() {
            this.renderTick;
            return this.state.player.frame;
        },
        chassis() {
            this.renderTick;
            return this.state.get(this.frame.chassisId);
        },
        activeJob() {
            this.renderTick;
            return Game.getActiveJob();
        },
        availableJobs() {
            this.renderTick;
            return Object.values(this.state.items).filter(i => i.type === 'job' && !i.locked && !i.enrolled);
        },
        jobTierData() {
            if (!this.activeJob) return null;
            return Game._getJobTierData(this.activeJob);
        },
        jobPathLabel() {
            if (!this.activeJob) return '';
            return this.activeJob.currentPath === 'high' ? '\u25C6 Paragon Path' : '\u25C7 Shadow Path';
        },
        jobPathColor() {
            if (!this.activeJob) return '#aaa';
            return this.activeJob.currentPath === 'high' ? '#4af' : '#f55';
        },
        nextTierInfo() {
            if (!this.activeJob || this.activeJob.currentTier >= 3) return null;
            const nextIdx = this.activeJob.currentTier;
            const nextTier = this.activeJob.tiers[nextIdx];
            if (!nextTier) return null;
            const morality = this.state.morality?.value || 0;
            const path = morality >= 30 ? 'high' : morality <= -30 ? 'low' : (morality >= 0 ? 'high' : 'low');
            return nextTier[path];
        }
    },
    mounted() {
        const TICK_MS = 200;
        this._renderInterval = setInterval(() => {
            this.renderTick++;
        }, TICK_MS);

        // Expose dialogue to global Game object so it can be called from logic
        Game.showDialogue = (speakerId, pages, onComplete) => {
            if (this.$refs.dialogue) {
                this.$refs.dialogue.show(speakerId, pages, onComplete);
            }
        };
        // Expose choice dialogue for moral events
        Game.showChoiceDialogue = (speakerId, pages, choices, onChoice) => {
            if (this.$refs.dialogue) {
                this.$refs.dialogue.showWithChoices(speakerId, pages, choices, onChoice);
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
        </header>

        <!-- RESOURCE MONITOR (Left Fragment) -->
        <aside class="terminal-resource-list hud-panel side-panel">
            <!-- CURRENT DIRECTIVE -->
            <div class="directive-tracker" v-if="currentDirective">
                <div class="directive-header">> CURRENT DIRECTIVE</div>
                <div class="directive-text">{{ currentDirective.text }}</div>
                <div class="directive-detail">{{ currentDirective.detail }}</div>
                <div class="directive-progress">
                    <span class="directive-count">
                        {{ currentDirective.progress() }}/{{ currentDirective.target }} {{ currentDirective.unit }}
                    </span>
                    <div class="directive-bar">
                        <div class="directive-fill" 
                             :style="{ width: Math.min(100, (currentDirective.progress() / currentDirective.target) * 100) + '%' }">
                        </div>
                    </div>
                </div>
            </div>

            <h4 class="hud-label">> RESOURCE MONITOR</h4>
            <template v-for="res in resources" :key="res.id">
                <div v-if="res.id === 'ferrous_scrap' && resources[0]?.id !== 'ferrous_scrap'" class="res-group-divider">
                    <span>&#x2500;&#x2500; REFINED &#x2500;&#x2500;</span>
                </div>
                <div v-if="res.id === 'glory'" class="res-group-divider">
                    <span>&#x2500;&#x2500; COMBAT &#x2500;&#x2500;</span>
                </div>
                <!-- RESOURCE BUTTON -->
                <div class="hud-resource-btn"
                     :class="{ 
                        'rate-pos': getNetRate(res) > 0.01, 
                        'rate-neg': getNetRate(res) < -0.01 
                     }"
                     :style="{ '--res-color': res.color || 'var(--primary)' }"
                     @mouseover="itemOver($event, res)"
                     @mouseleave="itemOut">
                    
                    <span class="res-badge" :style="{ 
                        '--badge-color': res.color || 'var(--primary)',
                        borderColor: (res.color || 'var(--primary)') + '60',
                        background: (res.color || 'var(--primary)') + '12'
                    }">
                        {{ res.abbr || res.icon || '•' }}
                    </span>
                    <span class="res-info">
                        <div class="flex-between">
                            <span>{{ res.name.toUpperCase() }}</span>
                            <div class="res-values">
                                <span v-if="getNetRate(res) !== 0" class="res-delta">
                                    {{ fmtRate(getNetRate(res)) }}/s
                                </span>
                                <span class="res-val">{{ Math.floor(res.val) }}</span>
                                <span class="res-max">/{{ res.max || 0 }}</span>
                                <span v-if="res.id === 'energy' && getNetRate(res) > 0" class="energy-stable-tag">STABLE</span>
                                <span v-if="res.id === 'energy' && getNetRate(res) < -0.01" class="energy-drain-tag">DRAIN</span>
                            </div>
                        </div>
                        <div class="res-progress-bar">
                            <div class="res-progress-fill" :style="{ 
                                width: Math.min(100, (res.val / (res.max || 1)) * 100) + '%',
                                backgroundColor: res.color || 'var(--primary)',
                                boxShadow: '0 0 6px ' + (res.color || 'var(--primary)') + '80'
                            }"></div>
                        </div>
                    </span>
                </div>
            </template>
            
            <div class="hud-align-widget" v-if="morality">
                <div class="hud-label">> MORALITY_V_1.0</div>
                <div class="align-text">{{ getAlignmentText(morality.val) }}</div>
                <div class="align-val">[{{ Math.floor(morality.val) }}]</div>
            </div>

            <!-- SECTOR SPECS FRAGMENT -->
            <div class="hud-sector-specs" v-if="currentHome">
                <div class="hud-label">> SECTOR_SPECS</div>
                <div class="spec-row" v-if="currentHome.mod">
                    <span class="spec-key">SPACE_CAP</span>
                    <span class="spec-val">{{ currentHome.mod['space.max'] || 0 }}u</span>
                </div>
                <template v-for="(val, k) in currentHome.mod" :key="k">
                    <div class="spec-row" v-if="k !== 'space.max'">
                        <span class="spec-key">{{ k.split('.')[0].toUpperCase() }}_BUFF</span>
                        <span class="spec-val">+{{ (val * 100).toFixed(0) }}%</span>
                    </div>
                </template>
            </div>
        </aside>

        <!-- MAIN CONSOLE (Central Fragment) -->
        <main class="terminal-main-content hud-panel main-panel">
            <nav class="terminal-category-tabs">
                <button v-for="cat in categories" :key="cat"
                        :class="['hud-tab-btn', { active: selectedCategory === cat }]"
                        @click="selectedCategory = cat; _seenCategories.add(cat)">
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

                <!-- MECHA AREA -->
                <section v-else-if="selectedCategory === 'mecha'" class="pilot-console">
                    <!-- Right side: Mecha BIOS Config -->
                    <div class="mecha-deck panel-container">
                        <h3 class="hud-section-title">> RIG_CONFIG: [ {{ chassis && chassis.category ? chassis.category.toUpperCase() : 'UNKNOWN' }} CHASSIS ]</h3>
                        
                        <!-- Chassis Overview Top Bar -->
                        <div class="chassis-overview" v-if="frame && frame.attributes">
                            <div class="stat-box">
                                <span class="stat-label">MODEL</span>
                                <span class="stat-val">{{ chassis && chassis.name ? chassis.name.toUpperCase() : 'UNKNOWN' }}</span>
                            </div>
                            <div class="stat-box">
                                <span class="stat-label">ATK</span>
                                <span class="stat-val text-success">{{ frame.attributes.atk || 0 }}</span>
                            </div>
                            <div class="stat-box">
                                <span class="stat-label">DEF</span>
                                <span class="stat-val text-info">{{ frame.attributes.def || 0 }}</span>
                            </div>
                            <div class="stat-box">
                                <span class="stat-label">ENR</span>
                                <span class="stat-val text-warning">{{ frame.attributes.enr || 0 }}</span>
                            </div>
                        </div>

                        <!-- Hardware Config Table -->
                        <div class="hardware-table" v-if="frame && frame.parts">
                            <div class="table-header">
                                <div class="col-mount">MOUNT_POINT</div>
                                <div class="col-status">DIAGNOSTICS</div>
                                <div class="col-int">INT</div>
                                <div class="col-equip">INSTALLED_MODULE</div>
                            </div>
                            
                            <div v-for="(p, slotId) in frame.parts" :key="slotId" class="equip-row">
                                <!-- Mount Point -->
                                <div class="col-mount">
                                    > {{ slotId.replace('_', ' ').toUpperCase() }}
                                    <div style="font-size: 9px; opacity: 0.6; margin-left: 10px;">{{ p.name }}</div>
                                </div>
                                
                                <!-- Diagnostics -->
                                <div class="col-status">
                                    <span class="slot-hp" :class="{ 'text-danger': p.hp < p.maxHp * 0.3 }">
                                        HP: {{ renderBar ? renderBar(p.hp, p.maxHp, 10) : p.hp + '/' + p.maxHp }}
                                    </span>
                                    <span class="slot-cnd" :class="{ 'text-warning': p.condition < 0.5 }">
                                        CND: {{ Math.round((p.condition || 0) * 100) }}%
                                    </span>
                                </div>
                                
                                <!-- Integrity -->
                                <div class="col-int">x{{ p.integrity || 0 }}</div>
                                
                                <!-- Equipment Dropdown -->
                                <div class="col-equip">
                                    <template v-if="getLinkedEquipSlot(slotId)">
                                        <div style="font-size: 9px; color: var(--text-dim); margin-bottom: 3px;">
                                            MOUNT: {{ getLinkedEquipSlot(slotId).replace('_', ' ').toUpperCase() }}
                                        </div>
                                        <select class="hud-select" 
                                                :value="frame.installedEquip && frame.installedEquip[getLinkedEquipSlot(slotId)] ? frame.installedEquip[getLinkedEquipSlot(slotId)] : ''" 
                                                @change="equipItem && equipItem(getLinkedEquipSlot(slotId), $event)">
                                            <option value="">[ EMPTY_SLOT ]</option>
                                            <template v-if="getValidWeapons">
                                                <option v-for="w in getValidWeapons(getLinkedEquipSlot(slotId))" :key="w.id" :value="w.id">
                                                    {{ w.name ? w.name.toUpperCase() : w.id }}
                                                </option>
                                            </template>
                                        </select>
                                    </template>
                                    <span v-else class="text-dim" style="font-size: 10px;">-- NO MOUNT --</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="inventory-deck hud-card-section" style="margin-top: 15px;">
                        <h3 class="hud-section-title">> RECOVERED_INVENTORY</h3>
                        <div class="hud-category-tabs" style="margin-bottom: 10px;">
                            <div class="hud-tab" :class="{ active: selectedInventoryTab === 'frames' }" @click="selectedInventoryTab = 'frames'">FRAMES</div>
                            <div class="hud-tab" :class="{ active: selectedInventoryTab === 'parts' }" @click="selectedInventoryTab = 'parts'">PARTS</div>
                            <div class="hud-tab" :class="{ active: selectedInventoryTab === 'weapons' }" @click="selectedInventoryTab = 'weapons'">WEAPONS</div>
                        </div>

                        <!-- FRAMES TAB -->
                        <div v-if="selectedInventoryTab === 'frames'" class="inventory-grid">
                            <div v-if="state.player.inventory.frames.length === 0" class="empty-state">NO FRAMES IN STORAGE</div>
                            <div v-for="frameId in state.player.inventory.frames" :key="frameId" class="hud-task-card salvage-card"
                                 @mouseover="itemOver($event, state.items[frameId])" @mouseleave="itemOut">
                                <template v-if="state.items[frameId]">
                                    <div class="hud-card-header">{{ state.items[frameId].name.toUpperCase() }}</div>
                                    <div class="salvage-meta">
                                        <span>[{{ state.items[frameId].category.toUpperCase() }}]</span>
                                    </div>
                                    <div class="hud-card-actions" style="margin-top: 8px;">
                                        <button class="hud-btn small" :disabled="frame.chassisId === frameId" @click="equipFrame(frameId)">
                                            {{ frame.chassisId === frameId ? 'EQUIPPED' : 'EQUIP CHASSIS' }}
                                        </button>
                                    </div>
                                </template>
                            </div>
                        </div>

                        <!-- PARTS TAB -->
                        <div v-else-if="selectedInventoryTab === 'parts'" class="inventory-grid">
                            <div v-if="!state.player.partsInventory || state.player.partsInventory.length === 0" class="empty-state">NO PARTS IN STORAGE</div>
                            <div v-for="part in state.player.partsInventory" :key="part.id" class="hud-task-card salvage-card"
                                 @mouseover="itemOver($event, part)" @mouseleave="itemOut">
                                <div class="hud-card-header">{{ part.name.toUpperCase() }}</div>
                                <div class="salvage-meta" style="justify-content: space-between;">
                                    <span>[{{ part.slot.toUpperCase() }}]</span>
                                    <span :class="{ worn: part.condition < 0.5 }">{{ Math.round(part.condition * 100) }}% CND</span>
                                </div>
                                <div class="hud-card-actions" style="margin-top: 8px; display: flex; gap: 5px;">
                                    <button class="hud-btn small" @click="equipPart(part.slot, part.id)">EQUIP</button>
                                    <button class="hud-btn small" @click="dismantlePart(part)">DISMANTLE</button>
                                </div>
                            </div>
                        </div>

                        <!-- WEAPONS TAB -->
                        <div v-else-if="selectedInventoryTab === 'weapons'" class="inventory-grid">
                            <div v-if="state.player.inventory.weapons.length === 0" class="empty-state">NO WEAPONS IN STORAGE</div>
                            <div v-for="weaponId in state.player.inventory.weapons" :key="weaponId" class="hud-task-card salvage-card"
                                 @mouseover="itemOver($event, state.items[weaponId])" @mouseleave="itemOut">
                                <template v-if="state.items[weaponId]">
                                    <div class="hud-card-header">{{ state.items[weaponId].name.toUpperCase() }}</div>
                                    <div class="salvage-meta">
                                        <span>[{{ state.items[weaponId].slot.toUpperCase() }}]</span>
                                    </div>
                                    <div class="salvage-hint" style="margin-top: 8px;">EQUIP VIA SLOT MENU</div>
                                </template>
                            </div>
                        </div>
                    </div>

                                    </section>

                <!-- FACTIONS AREA -->
                <section v-else-if="selectedCategory === 'factions'">
                    <h3 class="hud-section-title">> REPUTATION & FACTIONS</h3>
                    <div class="factions-grid">
                        <div v-for="fac in factions" :key="fac.id" class="faction-card"
                             :style="{
                                borderColor: fac.color,
                                background: 'linear-gradient(180deg, transparent 0%, ' + fac.color + '1A 100%)'
                             }">
                            <div class="faction-title" :style="{ color: fac.color }">
                                {{ fac.icon }} {{ fac.name.toUpperCase() }}
                            </div>
                            <div class="faction-desc">{{ fac.desc }}</div>

                            <div class="faction-status">
                                <div class="faction-rep-row">
                                    <span class="tier-name" :style="{ color: fac.color }">STATUS: {{ fac.currentTier.name.toUpperCase() }}</span>
                                    <span class="tier-rep">REP: {{ fac.repValue }}</span>
                                </div>
                                <div class="faction-alliance-row">
                                    <span>ALLIANCE:</span>
                                    <span class="alliance-chip" :style="{ color: fac.color, borderColor: fac.color }">{{ fac.allianceLabel }}</span>
                                </div>
                                <div v-if="fac.nextTier" class="hud-ascii-bar" :style="{ color: fac.color, marginBottom: '15px' }">
                                    {{ renderBar(fac.repValue - fac.currentTier.min, fac.nextTier.min - fac.currentTier.min, 15) }}
                                </div>
                                <div v-else class="hud-ascii-bar" :style="{ color: fac.color, marginBottom: '15px' }">
                                    [ MAX REPUTATION REACHED ]
                                </div>

                                <div v-if="fac.currentTier.unlocks && fac.currentTier.unlocks.length" class="faction-perks">
                                    <div class="faction-perks-title" :style="{ color: fac.color }">UNLOCKED:</div>
                                    <div v-for="(perk, i) in fac.currentTier.unlocks.filter(u => !u.startsWith('bp_'))" :key="i" class="perk-item">
                                        - {{ perk }}
                                    </div>
                                </div>

                                <div class="faction-vendor" v-if="getFactionVendorCategories(fac).length" style="border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 10px;">
                                    <details>
                                        <summary class="faction-perks-title" :style="{ color: fac.color, cursor: 'pointer' }">
                                            &#x25BC; ACCESS VOR-X VENDOR (UNLOCKED)
                                        </summary>
                                        <div class="vendor-category" v-for="cat in getFactionVendorCategories(fac)" :key="cat.key" style="margin-top: 10px;">
                                            <div class="vendor-category-title" style="background: rgba(255,255,255,0.05); padding: 2px 5px; font-size: 10px;">{{ cat.label }}</div>
                                            <div v-for="itemId in cat.items" :key="itemId" class="vendor-item-row" style="padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                                                <div class="vendor-item-meta" style="flex: 1;">
                                                    <span class="vendor-item-name" style="font-size: 12px;">{{ getVendorItem(itemId)?.name || itemId }}</span>
                                                    <span class="vendor-item-cost" style="color: var(--color-warning);">{{ getVendorItemCost(itemId) }} C</span>
                                                </div>
                                                <button class="hud-btn small"
                                                    :disabled="!canBuyVendorItem(itemId, fac.id)"
                                                    @click="buyVendorItem(itemId, fac.id)">
                                                    BUY
                                                </button>
                                            </div>
                                        </div>
                                    </details>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- WORKSHOP AREA -->
                <section v-else-if="selectedCategory === 'workshop'">
                    <h3 class="hud-section-title">> WORKSHOP & ASSEMBLY</h3>
                    
                    <div class="workshop-layout">
                        <!-- Sidebar Filters -->
                        <aside class="workshop-sidebar">
                            <div class="hud-tab-vertical" :class="{ active: selectedWorkshopTab === 'all' }" @click="selectedWorkshopTab = 'all'">[ ALL_FILES ]</div>
                            <div class="hud-tab-vertical" :class="{ active: selectedWorkshopTab === 'frames' }" @click="selectedWorkshopTab = 'frames'">[ FRAMES ]</div>
                            <div class="hud-tab-vertical" :class="{ active: selectedWorkshopTab === 'parts' }" @click="selectedWorkshopTab = 'parts'">[ COMPONENTS ]</div>
                            <div class="hud-tab-vertical" :class="{ active: selectedWorkshopTab === 'weapons' }" @click="selectedWorkshopTab = 'weapons'">[ ARMAMENT ]</div>
                            <div class="hud-tab-vertical" :class="{ active: selectedWorkshopTab === 'recycle' }" @click="selectedWorkshopTab = 'recycle'">[ RECYCLING ]</div>
                        </aside>

                        <!-- Blueprint List -->
                        <div class="workshop-main">
                            <div v-if="filteredBlueprints.length === 0" class="empty-state">
                                NO BLUEPRINTS FOUND IN THIS CATEGORY
                            </div>
                            <div class="blueprint-list">
                                <div v-for="bp in filteredBlueprints" :key="bp.id" 
                                     class="blueprint-entry"
                                     :class="{ affordable: bp.materials && Object.entries(bp.materials).every(([m, a]) => canAfford(m, a)) }"
                                     @click="craftBlueprint(bp)"
                                     @mouseover="itemOver($event, bp)"
                                     @mouseleave="itemOut">
                                    <div class="bp-info">
                                        <div class="bp-name">&#x2726; {{ bp.name.toUpperCase() }}</div>
                                        <div class="bp-type">{{ bp.type.toUpperCase() }}</div>
                                    </div>
                                    <div class="bp-mat-preview">
                                        <span v-for="(amount, matId) in bp.materials" :key="matId" 
                                              class="mat-tag"
                                              :style="{ color: canAfford(matId, amount) ? '#6a8' : '#e44' }">
                                            {{ resourceIcon(matId) }} {{ amount }}
                                        </span>
                                    </div>
                                    <div class="bp-action">[ INITIATE ]</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- SCRAPYARD AREA -->
                <section v-else-if="selectedCategory === 'scrapyard'">
                    
                    <!-- 1. ANDROID CONTROL PANEL -->
                    <div class="android-control-panel" v-if="android && android.active">
                        <div class="android-header">
                            <div class="android-name">
                                &#x1F916; {{ android.name.toUpperCase() }}
                                <span class="android-lvl-badge">LV.{{ android.level || 1 }}</span>
                            </div>
                            <div class="text-muted" style="font-size: 12px;">Kinetic Industrial Task Automaton</div>
                        </div>

                        <div class="android-stats">
                            <div class="stat-block">
                                <span class="stat-block-label">ENERGY CORE</span>
                                <div class="battery-bar-container">
                                    <div class="battery-bar-fill" :style="{ width: ((android.energy || 0) / (android.maxEnergy || 100) * 100) + '%' }"></div>
                                    <span class="battery-text">{{ Math.floor(android.energy || 0) }}/{{ android.maxEnergy || 100 }}</span>
                                </div>
                            </div>
                            <div class="stat-block">
                                <span class="stat-block-label">OPERATIONAL EFFICIENCY</span>
                                <div style="font-size: 16px; color: var(--color-success); font-weight: bold;">
                                    {{ Math.round((android.efficiency || 1) * 100) }}% 
                                    <span style="font-size: 10px; color: var(--text-dim);">[Boosted by Focus]</span>
                                </div>
                            </div>
                        </div>

                        <div class="android-task-row">
                            <div class="android-status">
                                <span v-if="android.assignment" class="working">&#x25B6; EXECUTING: {{ getTaskName(android.assignment).toUpperCase() }}</span>
                                <span v-else class="idle">&#x25A0; STANDBY MODE</span>
                            </div>
                            <div>
                                <button v-if="android.assignment" class="btn-outline btn-stop" @click="unassignAndroid">STOP TASK</button>
                                <button v-else class="btn-outline" style="border-style: dashed; opacity: 0.5;" disabled>AWAITING ORDERS</button>
                            </div>
                        </div>
                    </div>

                    <ResourceBufferBadge
                        v-if="showRawScrapIndicator"
                        label="RAW SCRAP BUFFER"
                        :value="Math.floor(rawScrap.val || 0)"
                        :max="rawScrap.max || 0"
                    />

                    <!-- 2. LOCAL OPERATIONS (Manual & Assignable) -->
                    <h3 class="hud-section-title">> LOCAL OPERATIONS</h3>
                    <div class="hud-task-grid">
                        <!-- Show only perpetual missions and basic scrapyard exploration -->
                        <div v-for="task in tasks.filter(t => !t.tags || !t.tags.includes('infrastructure'))" :key="task.id"
                             :class="['hud-task-card', { running: isRunning(task) }]"
                             @click="tryItem(task)">
                            <div class="hud-card-header">
                                <span class="status-dot"></span>
                                <span class="list-card__name">{{ task.name.toUpperCase() }}</span>
                                <span v-if="isRunning(task)" class="task-active-label">&#x25B6; ACTIVE</span>
                            </div>
                            <div class="list-card__desc" style="font-size: 11px; color: #888; font-family: var(--font-mono); line-height: 1.3; margin-bottom: 10px;">{{ task.desc }}</div>
                            <div class="list-card__bottom">
                                <div v-if="isRunning(task)">
                                    <div class="hud-ascii-bar" style="color: var(--primary)">
                                         {{ renderBar(getPercent(task), 100, 15) }}
                                    </div>
                                    <div v-if="task.length" style="font-size: 13px; font-weight: bold; font-family: var(--font-mono); color: var(--primary); text-align: right; margin-top: 4px;">
                                        &#x23F1; {{ getTaskTimeRemaining(task) }}s
                                    </div>
                                    <div style="font-size: 11px; margin-top: 8px; font-weight: bold; color: var(--color-danger)">[ ABORT OPERATION ]</div>
                                </div>
                                <div v-else>
                                    <div class="hud-ascii-bar" style="color: var(--border-light)">[...............]</div>
                                    <div style="font-size: 11px; margin-top: 8px; font-weight: bold; color: var(--text-dim)">[ INITIATE ]</div>
                                </div>
                                
                                <div style="display: flex; gap: 8px;">
                                    <button v-if="android && android.active && task.perpetual" 
                                            class="btn-outline btn-assign" 
                                            :disabled="android.assignment === task.id" 
                                            @click.stop="assignAndroid(task.id)">
                                            {{ android.assignment === task.id ? '\u{1F916} ASSIGNED' : '\u{1F916} ASSIGN K.I.T.A.' }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 3. BASE INFRASTRUCTURE -->
                    <div class="infra-fragment" v-if="upgrades && upgrades.length > 0">
                        <h3 class="hud-section-title" style="color: var(--secondary); margin-top: 15px;">> BASE INFRASTRUCTURE</h3>
                        <ResourceBufferBadge
                            v-if="showRawScrapIndicator"
                            label="RAW SCRAP BUFFER"
                            :value="Math.floor(rawScrap.val || 0)"
                            :max="rawScrap.max || 0"
                        />
                        <div class="hud-task-grid">
                            <div v-for="upg in upgrades" :key="upg.id"
                                 :class="['hud-task-card', 'upgrade-card', { 'upgrade-maxed': (upg.owned || 0) >= (upg.max || 1) }]"
                                 @click="tryItem(upg)">
                                <div class="hud-card-header">
                                    <span class="list-card__name">{{ upg.name.toUpperCase() }}</span>
                                    <span style="font-size: 12px; color: var(--text-dim)">[{{ upg.owned || 0 }}/{{ upg.max }}]</span>
                                </div>
                                <div class="list-card__desc" style="font-size: 11px; color: #888; font-family: var(--font-mono); line-height: 1.3; margin-bottom: 10px;">{{ upg.desc }}</div>
                                
                                <div v-if="upg.mod" class="upgrade-mods" style="margin-bottom: 10px; font-size: 9px; color: var(--secondary); display: flex; flex-wrap: wrap; gap: 4px;">
                                    <span v-for="(val, k) in upg.mod" :key="k" style="background: rgba(0, 255, 65, 0.05); padding: 3px 6px; border: 1px solid rgba(0, 255, 65, 0.2);">
                                        +{{ val }} {{ formatModKey(k) }}
                                    </span>
                                </div>

                                <div class="list-card__bottom">
                                    <div v-if="upg.cost" class="hud-cost-list">
                                        <span v-for="(amt, id) in upg.cost" :key="id"
                                              :class="['cost-item', canAfford(id, amt * Math.pow(upg.costScale || 1, upg.owned || 0)) ? '' : 'text-danger']">
                                            {{ resourceIcon(id) }} {{ Math.floor(amt * Math.pow(upg.costScale || 1, upg.owned || 0)) }} <span class="cost-name">{{ formatName(id).toUpperCase() }}</span>
                                        </span>
                                    </div>
                                    <div v-else class="list-card__cost" style="color: var(--text-dim); font-size: 10px;">CLICK TO BUILD</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- MISSION/OPERATION AREA -->
                <section v-else-if="!['pilot', 'zones', 'career'].includes(selectedCategory)">
                    <h3 class="hud-section-title">> OPERATIONS: {{ selectedCategory.toUpperCase() }}</h3>
                    <div class="hud-task-grid">
                        <div v-for="task in tasks" :key="task.id"
                             :class="['hud-task-card', { running: isRunning(task) }]"
                             @click="tryItem(task)"
                             @mouseover="itemOver($event, task)"
                             @mouseleave="itemOut">
                            <div class="hud-card-header">
                                <span class="status-dot"></span>
                                <span class="list-card__name">{{ task.name.toUpperCase() }}</span>
                                <span v-if="isRunning(task)" class="task-active-label">&#x25B6; ACTIVE</span>
                            </div>
                            <div v-if="task.length">
                                <div class="hud-ascii-bar" style="color: var(--secondary)">
                                     {{ renderBar(getPercent(task), 100, 20) }}
                                </div>
                                <div v-if="isRunning(task)" style="font-size: 13px; font-weight: bold; font-family: var(--font-mono); color: var(--secondary); text-align: right; margin-top: 4px;">
                                    &#x23F1; {{ getTaskTimeRemaining(task) }}s
                                </div>
                            </div>

                            <!-- TASK EFFECTS (DELTA) -->
                            <div v-if="isRunning(task)" class="active-task-rates">
                                <div v-for="(val, rid) in getTaskNetRates(task)" :key="rid"
                                     :class="['rate-delta', val > 0 ? 'pos' : 'neg']">
                                    {{ resourceIcon(rid) }} {{ fmtRate(val) }}/s <span class="cost-name">{{ formatName(rid).toUpperCase() }}</span>
                                </div>
                            </div>
                            
                            <!-- ACTION BUTTON FOOTER -->
                            <div v-if="!task.choices || !isRunning(task)" style="font-size: 11px; margin-top: 10px; font-weight: bold;">
                                <span v-if="isRunning(task)" style="color: var(--color-danger)">[ ABORT OPERATION ]</span>
                                <span v-else style="color: var(--text-dim)">[ INITIATE ]</span>
                            </div>

                            <!-- NARRATIVE CHOICE OVERLAY -->
                            <div v-if="isRunning(task) && getPercent(task) >= 100 && task.choices" class="hud-choice-overlay">
                                <span class="choice-alert">! PENDING DECISION !</span>
                                <div class="choice-actions">
                                    <button v-for="choice in task.choices" :key="choice.id"
                                         class="hud-btn-cta"
                                         @click.stop="makeChoice(task, choice)">
                                        {{ choice.name.toUpperCase() }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- ZONES / MAP AREA -->
                <section v-else-if="selectedCategory === 'zones'" class="zones-panel">
                    <h3 class="hud-section-title">> NEW TOKYO &#x2014; ZONE MAP</h3>
                    <div class="zones-layout">
                        <div class="zone-list">
                            <div v-for="zone in zones" :key="zone.id"
                                 :class="['zone-card', { discovered: zone.discovered, selected: selectedZone && selectedZone.id === zone.id }]"
                                 :style="zone.discovered ? { borderColor: zone.color, '--zone-color': zone.color } : {}"
                                 @click="zone.discovered ? (_selectedZoneId = zone.id) : null">
                                <div v-if="zone.discovered" class="zone-card-inner">
                                    <div class="zone-card-header">
                                        <span class="zone-icon">{{ zone.icon }}</span>
                                        <span class="zone-name" :style="{ color: zone.color }">{{ zone.shortName.toUpperCase() }}</span>
                                        <span class="zone-phase">P{{ zone.phase }}</span>
                                    </div>
                                    <div class="zone-desc">{{ zone.desc }}</div>
                                </div>
                                <div v-else class="zone-card-locked">
                                    <span class="zone-icon">?</span>
                                    <span class="zone-name">??? LOCKED ???</span>
                                    <span class="zone-phase">P{{ zone.phase }}</span>
                                </div>
                            </div>
                        </div>

                        <div class="zone-detail" v-if="selectedZone && selectedZone.discovered">
                            <div class="zone-detail-header" :style="{ borderColor: selectedZone.color }">
                                <span class="zone-detail-icon" :style="{ color: selectedZone.color }">{{ selectedZone.icon }}</span>
                                <div>
                                    <div class="zone-detail-name" :style="{ color: selectedZone.color }">{{ selectedZone.name.toUpperCase() }}</div>
                                    <div class="zone-detail-flavor">{{ selectedZone.flavor }}</div>
                                </div>
                            </div>

                            <div class="zone-sub-areas">
                                <div class="zone-sub-title">> SUB-AREAS</div>
                                <div v-for="sub in selectedZone.subAreas" :key="sub.id" class="zone-sub-card">
                                    <span class="zone-sub-name">&#x25B8; {{ sub.name }}</span>
                                    <span class="zone-sub-desc">{{ sub.desc }}</span>
                                </div>
                            </div>

                            <div v-if="selectedZone.npcs && selectedZone.npcs.length" class="zone-npcs">
                                <div class="zone-sub-title">> KEY CONTACTS</div>
                                <span v-for="npc in selectedZone.npcs" :key="npc" class="zone-npc-tag">
                                    {{ npc.replace(/_/g, ' ').toUpperCase() }}
                                </span>
                            </div>

                            <div class="zone-narrative-hook" :style="{ borderColor: selectedZone.color + '40' }">
                                &ldquo;{{ selectedZone.narrativeHook }}&rdquo;
                            </div>
                        </div>
                    </div>
                </section>

                <!-- CAREER AREA -->
                <section v-else-if="selectedCategory === 'career'" class="career-panel">
                    <!-- ACTIVE JOB -->
                    <div v-if="activeJob" class="active-job-panel">
                        <h3 class="hud-section-title">> ACTIVE CAREER</h3>
                        <div class="job-active-card">
                            <div class="job-header">
                                <span class="job-icon">{{ activeJob.icon }}</span>
                                <span class="job-title">{{ jobTierData ? jobTierData.title : activeJob.name }}</span>
                                <span class="job-tier-badge">Tier {{ activeJob.currentTier }}/3</span>
                            </div>
                            <div class="job-path" :style="{ color: jobPathColor }">{{ jobPathLabel }}</div>
                            <div class="job-flavor" v-if="jobTierData">{{ jobTierData.flavor }}</div>

                            <div class="job-income" v-if="jobTierData && jobTierData.passiveIncome">
                                <div class="income-header">PASSIVE INCOME</div>
                                <div v-for="(rate, res) in jobTierData.passiveIncome" :key="res" class="income-line">
                                    +{{ rate.toFixed(2) }} <span class="income-res">{{ res.toUpperCase() }}/s</span>
                                </div>
                            </div>

                            <div v-if="activeJob.currentTier < 3" class="promotion-section">
                                <div class="promote-header">NEXT TIER: {{ nextTierInfo ? nextTierInfo.title : '???' }}</div>
                                <div v-if="nextTierInfo && nextTierInfo.require" class="promote-req">
                                    Requirements: {{ nextTierInfo.require }}
                                </div>
                                <button class="hud-btn-cta" @click="promoteJob()">&#x25B2; PROMOTE</button>
                            </div>
                            <div v-else class="job-max-tier">&#x2605; MAXIMUM TIER REACHED</div>

                            <button class="hud-btn-danger" @click="quitJob()">&#x2715; QUIT JOB</button>
                        </div>
                    </div>

                    <!-- AVAILABLE JOBS -->
                    <div v-else>
                        <h3 class="hud-section-title">> AVAILABLE CAREERS</h3>
                        <div v-if="availableJobs.length === 0" class="career-empty">
                            No careers available yet. Complete missions and build your reputation.
                        </div>
                        <div class="job-grid">
                            <div v-for="job in availableJobs" :key="job.id"
                                 class="job-card"
                                 @click="enrollJob(job.id)"
                                 @mouseover="itemOver($event, job)"
                                 @mouseleave="itemOut">
                                <div class="job-header">
                                    <span class="job-icon">{{ job.icon }}</span>
                                    <span class="job-name">{{ job.name }}</span>
                                </div>
                                <div class="job-desc">{{ job.desc }}</div>
                                <div class="job-flavor">{{ job.flavor }}</div>
                                <div class="job-start-hint">
                                    Starting as: {{ (state.morality.value >= 30 ? job.tiers[0].high.title : state.morality.value <= -30 ? job.tiers[0].low.title : (state.morality.value >= 0 ? job.tiers[0].high.title : job.tiers[0].low.title)) }}
                                </div>
                                <div class="job-enroll-btn">[ ENROLL ]</div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- PILOT PROFILE AREA -->
                <section v-else class="pilot-console">
                    <div class="morphology-deck">
                        <h3 class="hud-section-title">> PILOT MORPHOLOGY</h3>
                        <div class="pilot-stats-grid">
                            <div v-for="stat in morphology" :key="stat.id" class="hud-stat-widget"
                                 @mouseover="itemOver($event, stat)"
                                 @mouseleave="itemOut">
                                <div class="stat-meta">
                                    <span :style="{ color: stat.color }">{{ stat.icon }} {{ stat.name.toUpperCase() }}</span>
                                    <span>{{ Math.floor(stat.val) }}</span>
                                </div>
                                <div class="hud-bar-bg">
                                    <div class="hud-bar-fill" :style="{ width: (stat.val / (stat.max || 100) * 100) + '%', backgroundColor: stat.color }"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Morality Bar -->
                        <div v-if="moralRes" class="morality-widget">
                            <div class="stat-meta">
                                <span :style="{ color: moralColor }">&#x2696; MORAL COMPASS</span>
                                <span :style="{ color: moralColor }">{{ moralLabel }} ({{ moralValue }})</span>
                            </div>
                            <div class="morality-track">
                                <div class="morality-fill" :style="moralBarStyle"></div>
                                <div class="morality-center"></div>
                            </div>
                            <div class="morality-axis">
                                <span style="color:#f55">SHADOW</span>
                                <span style="color:#fa0">PRAGMATIST</span>
                                <span style="color:#4af">PARAGON</span>
                            </div>
                        </div>
                    </div>
                    
<div class="training-deck">
                        <h3 class="hud-section-title">> RE-PROGRAMMING / TRAINING</h3>
                        <div class="hud-task-grid mini">
                            <div v-for="task in tasks" :key="task.id"
                                 :class="['hud-task-card mini', { running: isRunning(task) }]"
                                 @click="tryItem(task)"
                                 @mouseover="itemOver($event, task)"
                                 @mouseleave="itemOut">
                                <div class="hud-card-header">{{ task.name.toUpperCase() }}</div>
                                <div v-if="task.length">
                                    <div class="hud-ascii-bar" style="color: var(--secondary)">
                                         {{ renderBar(getPercent(task), 100, 10) }}
                                    </div>
                                    <div v-if="isRunning(task)" style="font-size: 12px; font-weight: bold; font-family: var(--font-mono); color: var(--secondary); text-align: right; margin-top: 2px;">
                                        &#x23F1; {{ getTaskTimeRemaining(task) }}s
                                    </div>
                                </div>
                                <div v-if="isRunning(task)" style="font-size: 9px; margin-top: 6px; font-weight: bold; color: var(--color-danger)">[ ABORT ]</div>
                                <div v-else style="font-size: 9px; margin-top: 6px; font-weight: bold; color: var(--text-dim)">[ INITIATE ]</div>
                            </div>
                        </div>
                    </div>

                    <div class="skills-deck">
                        <h3 class="hud-section-title">> NEURAL SKILLS</h3>
                        <div class="skills-list">
                            <div v-for="skill in skills" :key="skill.id" 
                                 class="hud-skill-item"
                                 @mouseover="itemOver($event, skill)"
                                 @mouseleave="itemOut">
                                <div class="flex-between">
                                    <span class="skill-name">{{ skill.icon || '●' }} {{ skill.name }}</span>
                                    <span class="skill-lvl">LVL {{ Math.floor(skill.val) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
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
/* -- FACTION DETAILS (NEW LAYOUT) ------------------------ */
.factions-grid { 
    display: grid; 
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); 
    gap: 20px; 
}
.faction-card {
    display: flex; flex-direction: column;
    border: 1px solid;
    background-color: #0b0e12;
    padding: 20px;
    transition: transform 0.2s;
}
.faction-card:hover { transform: translateY(-3px); }
.faction-title { display: flex; align-items: center; gap: 10px; font-size: var(--font-size-lg); font-weight: bold; margin-bottom: 15px; text-transform: uppercase; }
.faction-desc { font-size: var(--font-size-sm); color: var(--text-dim); line-height: 1.5; margin-bottom: 20px; }
.faction-status { margin-top: auto; padding-top: 15px; border-top: 1px dashed rgba(255,255,255,0.1); }
.faction-rep-row { display: flex; justify-content: space-between; font-weight: bold; font-size: var(--font-size-xs); margin-bottom: 10px; }
.faction-alliance-row { display: flex; justify-content: space-between; align-items: center; font-size: var(--font-size-xs); color: var(--text-dim); margin-bottom: 10px; }
.alliance-chip { border: 1px solid; padding: 1px 6px; font-weight: bold; letter-spacing: 1px; font-size: 10px; }
.faction-perks { background: rgba(0,0,0,0.4); padding: 10px; font-size: var(--font-size-xs); color: var(--text-dim); }
.faction-perks-title { margin-bottom: 5px; font-weight: bold; }
.faction-vendor { margin-top: 12px; padding-top: 10px; border-top: 1px dashed rgba(255,255,255,0.1); }
.vendor-category { margin-bottom: 10px; }
.vendor-category-title { font-size: 10px; letter-spacing: 1px; color: var(--text-dim); margin-bottom: 6px; }
.vendor-item-row { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 6px; }
.vendor-item-meta { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.vendor-item-name { font-size: var(--font-size-xs); color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.vendor-item-cost { font-size: 10px; color: var(--text-dim); }
.vendor-buy-btn { padding: 2px 10px; min-width: 54px; }

/* -- PILOT CONSOLE DECKS (2 COLUMN FIX) ---------------------- */
.pilot-stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr; /* 2 columns to save vertical space */
    gap: 15px 20px;
}

/* -- MECHA PARTS (TABLE LAYOUT) ---------------------- */
.part-list { display: flex; flex-direction: column; gap: 15px; }
.hud-part-widget { background: rgba(255,255,255,0.02); border: 1px solid var(--border-dim); padding: 10px; margin-bottom: 10px;}
.part-title { font-weight: bold; color: var(--text); margin-bottom: 8px; font-size: var(--font-size-sm); letter-spacing: 1px; }
.part-status-row, .part-condition-row { display: flex; justify-content: space-between; align-items: center; font-size: var(--font-size-xs); margin-bottom: 4px; }
.p-hp-bar, .p-cond-bar { flex: 1; margin: 0 10px; font-family: var(--font-mono); letter-spacing: 1px; text-align: right;}

/* -- HUD GRID SYSTEM RESPONSIVE ------------------------ */
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
        grid-template-areas: 
            "head"
            "res"
            "main"
            "foot";
        height: auto; 
        min-height: 100vh;
    }
    
    .side-panel {
        clip-path: none !important;
        border-right: 1px solid var(--border-dim) !important;
        border-bottom: 2px solid var(--primary);
        max-height: 250px; 
    }
    
    .main-panel {
        border-left: none !important;
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

.side-panel { 
    grid-area: res; 
    border-right: 0; 
    clip-path: polygon(0 0, 100% 0, 97% 100%, 0 100%); 
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--border-dim) transparent;
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
    /* Keep center width capped so it does not stretch on ultrawide screens */
    max-width: 1400px;
    margin-left: auto;
    margin-right: auto;
    width: 100%;
}

/* -- TASK CARDS (AUTO-FIT TO AUTO-FILL) ----------------─ */
.hud-task-grid, .task-grid {
    display: grid;
    /* auto-fill: prevents cards from stretching to fill empty space */
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
}

/* -- FACTIONS GRID ------------------------ */
.factions-grid { 
    display: grid; 
    /* Same behavior for faction cards */
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); 
    gap: 20px; 
}

/* -- PILOT CONSOLE DECKS ---------------------- */
.pilot-console { 
    display: grid; 
    /* On small screens use 1 column, on normal screens 2 columns */
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); 
    gap: 30px; 
}

.pilot-stats-grid {
    display: grid;
    /* Prevent stat bars from becoming too wide */
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 15px 20px;
}

.bottom-span { 
    grid-area: foot; 
    display: flex; 
    justify-content: space-between; 
    font-size: var(--font-size-xs); 
    color: var(--text-dim); 
    background: var(--bg-main);
}

/* -- TAB NAVIGATION IMPROVED -------------------------- */
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
    box-shadow: inset 0 -5px 10px rgba(255, 176, 0, 0.05); 
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

/* -- PILOT CONSOLE RESTRUCTURE ---------------------- */
.pilot-deck-column {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.text-center { text-align: center; }
.blink { animation: blink 1s infinite; }
@keyframes blink { 50% { opacity: 0; } }

/* -- ARMORY STYLES (kept from the original version) -------------------------- */
.part-header {
    display: flex;
    justify-content: space-between;
    border-bottom: 1px dashed var(--secondary);
    padding-bottom: 4px;
    margin-bottom: 4px;
    align-items: center;
}
.armory-slot .part-header {
    border-bottom: none;
    margin-bottom: 0;
}
.armory-slot {
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin-bottom: 8px;
}
.hud-select {
    width: 100%;
    background: rgba(13, 17, 23, 0.9);
    border: 1px solid var(--border-dim);
    color: var(--primary);
    padding: 4px;
    font-family: inherit;
    font-size: var(--font-size-xs);
    outline: none;
    cursor: pointer;
}
.hud-select:focus, .hud-select:hover {
    border-color: var(--primary);
}
.hud-select option {
    background: #0d1117;
    color: var(--primary);
}

/* -- RESOURCE WIDGETS ----------------------─ */
.hud-resource-btn {
    display: flex;
    gap: 10px;
    padding: 8px;
    margin-bottom: 5px;
    border-bottom: 1px solid rgba(0, 143, 17, 0.1);
    cursor: help;
}

.res-icon { font-size: var(--font-size-xl); color: var(--res-color); text-shadow: 0 0 5px var(--res-color); }
.res-info { flex: 1; font-size: var(--font-size-xs); }

.hud-mini-bar { height: 2px; background: #000; margin-top: 3px; }
.hud-mini-fill { height: 100%; transition: width 0.3s; }

.hud-ascii-bar {
    font-family: var(--font-mono);
    font-size: var(--font-size-xs);
    letter-spacing: 1px;
    margin-top: 5px;
    white-space: pre;
}

/* -- TASK CARDS (FRAGMENTED) ----------------─ */
.hud-task-card {
    background: rgba(18, 24, 31, 0.6);
    border: 1px solid var(--border-dim);
    padding: 15px;
    position: relative;
    transition: all 0.3s cubic-bezier(0.19, 1, 0.22, 1);
    cursor: pointer;
}

.hud-task-card.running {
    border-color: var(--primary);
    box-shadow: 0 0 15px rgba(0, 255, 65, 0.05);
}

.hud-task-card:hover {
    border-color: var(--secondary);
    transform: translateY(-2px);
    background: rgba(0, 255, 65, 0.02);
}

.hud-card-header {
    font-size: var(--font-size-lg);
    font-weight: 800;
    color: var(--text);
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.status-dot {
    width: 4px;
    height: 4px;
    background: var(--text-faint);
}

.running .status-dot {
    background: var(--primary);
    box-shadow: 0 0 5px var(--primary);
    animation: blink-dot 1s infinite;
}

@keyframes blink-dot { 50% { opacity: 0.3; } }

.hud-card-desc {
    font-size: var(--font-size-base);
    color: var(--text-dim);
    line-height: 1.5;
    margin-bottom: 12px;
}

/* -- CHOICE OVERLAY -------------------------- */
.hud-choice-overlay {
    position: absolute;
    inset: 0;
    background: rgba(13, 17, 23, 0.95);
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 15px;
    border: 1px solid var(--cta);
}

.choice-alert {
    color: var(--cta);
    font-weight: bold;
    font-size: var(--font-size-base);
    margin-bottom: 15px;
    animation: pulse 1s infinite alternate;
}

.choice-actions {
    display: flex;
    gap: 10px;
    width: 100%;
}

.hud-btn-cta {
    flex: 1;
    background: transparent;
    border: 1px solid var(--cta);
    color: var(--cta);
    padding: 10px;
    font-family: var(--font-mono);
    cursor: pointer;
    font-size: var(--font-size-base);
}

.hud-btn-cta:hover {
    background: var(--cta);
    color: #fff;
}

/* -- MECHA DECK & HARDWARE ------------------- */
.hud-category-tabs {
    display: flex;
    gap: 10px;
    margin-bottom: 12px;
    border-bottom: 1px solid var(--border-dim);
    padding-bottom: 5px;
}
.hud-category-tabs .hud-tab {
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
    color: var(--text-dim);
    letter-spacing: 1px;
    cursor: pointer;
    padding: 6px 12px;
    transition: all 0.2s;
    user-select: none;
}
.hud-category-tabs .hud-tab:hover {
    color: var(--text);
    background: rgba(255, 255, 255, 0.05);
}
.hud-category-tabs .hud-tab.active {
    color: var(--primary);
    border-bottom: 2px solid var(--primary);
    font-weight: bold;
}

.mecha-deck { margin-bottom: 20px; }
.stat-meta { display: flex; justify-content: space-between; font-size: var(--font-size-base); margin-bottom: 6px; }
.hud-bar-bg { height: 2px; background: #000; }
.hud-bar-fill { height: 100%; box-shadow: 0 0 5px currentColor; }

/* Morality bar */
.morality-widget { margin-top: 15px; padding-top: 10px; border-top: 1px dashed var(--border-dim); }
.morality-track { position: relative; height: 6px; background: #111; margin: 6px 0; }
.morality-fill { height: 100%; transition: width 0.3s ease, background-color 0.3s ease; }
.morality-center { position: absolute; top: -2px; left: 50%; width: 2px; height: 10px; background: #555; transform: translateX(-50%); }
.morality-axis { display: flex; justify-content: space-between; font-size: 10px; font-family: var(--font-mono); opacity: 0.5; }

.hud-skill-item {
    font-size: var(--font-size-base);
    padding: 8px;
    border-left: 2px solid var(--secondary);
    background: rgba(18, 24, 31, 1);
    margin-bottom: 5px;
}

.glitch-title {
    font-weight: 900;
    letter-spacing: 5px;
    color: var(--primary);
}

/* -- RATE INDICATORS ------------------------ */
.res-values { display: flex; align-items: center; gap: 8px; }
.res-delta { font-size: var(--font-size-sm); font-weight: bold; opacity: 0.8; }
.rate-pos .res-delta { color: #4f8; }
.rate-neg .res-delta { color: #f44; }
.rate-pos .res-badge { animation: flow-up 1.5s infinite linear; }
.rate-neg .res-badge { animation: flow-down 1.5s infinite linear; }

@keyframes flow-up {
    0% { transform: translateY(0); opacity: 1; }
    50% { transform: translateY(-2px); opacity: 0.7; }
    100% { transform: translateY(0); opacity: 1; }
}

@keyframes flow-down {
    0% { transform: translateY(0); opacity: 1; }
    50% { transform: translateY(2px); opacity: 0.7; }
    100% { transform: translateY(0); opacity: 1; }
}

.active-task-rates {
    margin-top: 8px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding-top: 5px;
    border-top: 1px dashed rgba(0, 255, 65, 0.1);
}

.rate-delta {
    font-size: var(--font-size-sm);
    font-family: var(--font-mono);
}

.rate-delta.pos { color: #4f8; }
.rate-delta.neg { color: #f44; }

/* -- CRITICAL ALERT SYSTEM ----------------─ */
.emergency-rest-btn {
    background: rgba(255, 65, 54, 0.1);
    border: 1px solid #ff4136;
    color: #ff4136;
    padding: 2px 10px;
    margin-right: 15px;
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

.critical-alert::before {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    border: 4px solid rgba(255, 0, 0, 0.1);
    z-index: 10002;
    box-shadow: inset 0 0 100px rgba(255, 0, 0, 0.1);
}

@keyframes critical-jitter {
    0% { transform: translate(0, 0); }
    25% { transform: translate(1px, -1px); }
    50% { transform: translate(-1px, 1px); }
    75% { transform: translate(1px, 1px); }
    100% { transform: translate(0, 0); }
}

/* -- HARDWARE CONFIG TABLE (BIOS STYLE) ---------------------- */
.chassis-overview {
    display: flex;
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid var(--border-dim);
    margin-bottom: 20px;
}

.stat-box {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 10px 15px;
    border-right: 1px solid var(--border-dim);
}

.stat-box:last-child {
    border-right: none;
}

.stat-label {
    font-size: 10px;
    color: var(--text-dim);
    font-family: var(--font-mono);
    margin-bottom: 2px;
    letter-spacing: 1px;
}

.stat-val {
    font-size: 16px;
    font-weight: bold;
    font-family: var(--font-mono);
}

.hardware-table {
    display: flex;
    flex-direction: column;
    width: 100%;
}

.table-header {
    display: grid;
    grid-template-columns: 2fr 3fr 0.5fr 4fr;
    gap: 15px;
    font-size: 10px;
    color: var(--secondary);
    border-bottom: 1px dashed var(--border-dim);
    padding-bottom: 8px;
    margin-bottom: 5px;
    letter-spacing: 1px;
}

.equip-row {
    display: grid;
    grid-template-columns: 2fr 3fr 0.5fr 4fr;
    gap: 15px;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.02);
    transition: background 0.2s;
}

.equip-row:hover {
    background: rgba(0, 255, 65, 0.02);
}

.col-mount {
    color: var(--text);
    font-weight: bold;
    font-size: var(--font-size-sm);
    letter-spacing: 1px;
}

.col-status {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-family: var(--font-mono);
    font-size: 12px;
}

.col-int {
    color: var(--text-dim);
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
    text-align: center;
}

.col-equip .hud-select {
    margin-bottom: 0;
    width: 100%;
    background: #050505;
    border: 1px solid var(--border-dim);
    color: var(--primary);
    padding: 6px 8px;
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
    outline: none;
    cursor: pointer;
    appearance: none;
    background-image: linear-gradient(45deg, transparent 50%, var(--primary) 50%), linear-gradient(135deg, var(--primary) 50%, transparent 50%);
    background-position: calc(100% - 15px) calc(1em + 2px), calc(100% - 10px) calc(1em + 2px);
    background-size: 5px 5px, 5px 5px;
    background-repeat: no-repeat;
}

.col-equip .hud-select:focus, .col-equip .hud-select:hover {
    border-color: var(--primary);
    box-shadow: 0 0 5px rgba(255, 176, 0, 0.1);
}

.col-equip .hud-select option {
    background: #0d1117;
    color: var(--primary);
}

/* Responsive behavior for the table */
@media (max-width: 650px) {
    .table-header { display: none; }
    .equip-row {
        grid-template-columns: 1fr;
        gap: 8px;
        padding: 15px 0;
    }
    .col-int { text-align: left; }
    .col-int::before { content: "INTEGRITY: "; font-size: 10px; color: var(--secondary); }
}

/* -- ANDROID CONTROL PANEL ---------------------- */
.android-control-panel {
    background: rgba(0, 170, 255, 0.03);
    border: 1px solid var(--color-info);
    border-left: 4px solid var(--color-info);
    padding: 20px;
    margin-bottom: 30px;
    position: relative;
    overflow: hidden;
}

.android-control-panel::before {
    content: "K.I.T.A. LINK ACTIVE";
    position: absolute;
    top: -5px;
    right: 10px;
    font-size: 40px;
    color: rgba(0, 170, 255, 0.03);
    font-weight: 900;
    pointer-events: none;
}

.android-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    border-bottom: 1px dashed rgba(0, 170, 255, 0.3);
    padding-bottom: 10px;
}

.android-name {
    font-size: var(--font-size-lg);
    color: var(--color-info);
    font-weight: bold;
    display: flex;
    align-items: center;
    gap: 10px;
}

.android-lvl-badge {
    background: var(--color-info);
    color: #000;
    padding: 2px 6px;
    font-size: var(--font-size-xs);
    border-radius: 2px;
}

.android-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 15px;
}

.stat-block { display: flex; flex-direction: column; gap: 4px; }
.stat-block-label { font-size: 10px; color: var(--text-dim); letter-spacing: 1px; }

.battery-bar-container {
    height: 12px;
    background: #000;
    border: 1px solid var(--border-dim);
    width: 100%;
    position: relative;
}

.battery-bar-fill {
    height: 100%;
    background: var(--color-warning);
    box-shadow: 0 0 5px var(--color-warning);
    transition: width 0.3s linear;
}

.battery-text {
    position: absolute;
    top: -2px;
    right: 5px;
    font-size: 10px;
    color: #fff;
    text-shadow: 1px 1px 0 #000;
}

.android-task-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(0, 0, 0, 0.5);
    padding: 10px 15px;
    border: 1px solid var(--border-dim);
}

.android-status { font-size: var(--font-size-sm); }
.android-status span.working { color: var(--color-success); animation: blink 2s infinite; }
.android-status span.idle { color: var(--text-dim); }
@keyframes blink { 50% { opacity: 0.5; } }

/* Android/task-specific buttons */
.btn-outline {
    background: transparent; border: 1px solid var(--text-dim); color: var(--text-dim);
    padding: 4px 12px; font-family: var(--font-mono); font-size: var(--font-size-xs);
    cursor: pointer; transition: all 0.2s;
}
.btn-outline:hover:not(:disabled) { border-color: var(--text); color: var(--text); }

.btn-assign { border-color: var(--color-info); color: var(--color-info); }
.btn-assign:hover:not(:disabled) { background: var(--color-info); color: #000; }
.btn-assign:disabled { border-color: var(--border-dim); color: var(--border-dim); cursor: not-allowed; }

.btn-stop { border-color: var(--color-danger); color: var(--color-danger); }
.btn-stop:hover { background: var(--color-danger); color: #000; }

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

/* Directive Tracker */
.directive-tracker {
    background: rgba(0, 255, 65, 0.04);
    border: 1px solid var(--color-success, #0f0);
    border-left: 3px solid var(--color-success, #0f0);
    padding: 12px;
    margin-bottom: 20px;
    position: relative;
    font-family: var(--font-mono);
}
.directive-tracker::after {
    content: "TRACKING";
    position: absolute;
    top: -8px;
    right: 8px;
    background: var(--bg-deep, #0a0a0a);
    padding: 0 6px;
    font-size: 9px;
    color: var(--color-success, #0f0);
    letter-spacing: 2px;
}
.directive-header {
    font-size: 11px;
    color: var(--text-dim, #666);
    letter-spacing: 1px;
    margin-bottom: 6px;
}
.directive-text {
    font-size: 13px;
    font-weight: bold;
    color: var(--color-success, #0f0);
    line-height: 1.3;
    margin-bottom: 4px;
}

/* -- WORKSHOP REDESIGN ---------------------- */
.workshop-layout {
    display: flex;
    gap: 20px;
    height: 600px;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid var(--border-dim);
    padding: 10px;
}

.workshop-sidebar {
    width: 180px;
    display: flex;
    flex-direction: column;
    gap: 5px;
    border-right: 1px solid var(--border-dim);
    padding-right: 10px;
}

.hud-tab-vertical {
    padding: 10px;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-dim);
    cursor: pointer;
    transition: all 0.2s;
    border-left: 2px solid transparent;
}

.hud-tab-vertical:hover {
    background: rgba(255, 255, 255, 0.05);
    color: var(--text);
}

.hud-tab-vertical.active {
    color: var(--primary);
    background: rgba(255, 176, 0, 0.05);
    border-left-color: var(--primary);
}

.workshop-main {
    flex: 1;
    overflow-y: auto;
    padding-right: 5px;
}

.blueprint-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.blueprint-entry {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 15px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid var(--border-dim);
    cursor: pointer;
    transition: all 0.2s;
}

.blueprint-entry:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: var(--primary);
}

.blueprint-entry.affordable {
    border-left: 3px solid var(--color-success);
}

.bp-info {
    flex: 1;
}

.bp-name {
    font-weight: bold;
    color: var(--primary);
    font-size: 14px;
}

.bp-type {
    font-size: 9px;
    color: var(--text-dim);
    letter-spacing: 1px;
}

.bp-mat-preview {
    display: flex;
    gap: 15px;
    margin: 0 20px;
}

.mat-tag {
    font-family: var(--font-mono);
    font-size: 12px;
}

.bp-action {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: bold;
    color: var(--text-dim);
}

.blueprint-entry:hover .bp-action {
    color: var(--primary);
}
.directive-detail {
    font-size: 11px;
    color: var(--text-dim, #666);
    margin-bottom: 8px;
}
.directive-count {
    font-size: 11px;
    color: var(--text, #ccc);
    display: block;
    text-align: right;
    margin-bottom: 3px;
}
.directive-bar {
    height: 3px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid var(--border-dim, #333);
    width: 100%;
}
.directive-fill {
    height: 100%;
    background: var(--color-success, #0f0);
    box-shadow: 0 0 4px var(--color-success, #0f0);
    transition: width 0.3s ease;
}

.cost-name {
    font-size: 0.85em;
    opacity: 0.7;
    margin-left: 2px;
    font-weight: normal;
}

.cost-item, .rate-delta {
    margin-right: 12px;
    display: inline-block;
}
/* --- IMPL_SPEC_07 VISUAL OVERHAUL --- */

/* Periodic-table badge container */
.res-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    min-width: 32px;
    border: 1px solid;
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
    font-weight: bold;
    color: var(--badge-color, var(--res-color));
    text-shadow: 0 0 6px var(--badge-color, var(--res-color));
    letter-spacing: -0.5px;
    line-height: 1;
}
.res-badge:has(+ .res-info) { font-size: var(--font-size-base); }

/* Resource progress bar */
.res-progress-bar {
    height: 3px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--border-dim);
    margin-top: 5px;
    overflow: hidden;
}
.res-progress-fill {
    height: 100%;
    transition: width 0.4s ease;
}
.res-max {
    color: var(--text-faint);
    font-size: var(--font-size-xxs);
}

/* Status Pips */
.status-dot {
    width: 8px;
    height: 8px;
    border: 1px solid var(--text-faint);
    background: transparent;
    flex-shrink: 0;
}
.hud-task-card.running .status-dot {
    background: var(--primary);
    border-color: var(--primary);
    box-shadow: 0 0 8px var(--primary);
}

/* Left border accents */
.hud-task-card {
    border-left: 3px solid var(--border-dim);
}
.hud-task-card.running {
    border-left-color: var(--primary) !important;
}

/* Active Label */
.task-active-label {
    font-size: var(--font-size-xxs);
    color: var(--primary);
    margin-left: auto;
    letter-spacing: 2px;
    animation: pulse-label 2s ease-in-out infinite;
}
@keyframes pulse-label {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
}

/* Upgrade Cards */
.hud-task-card.upgrade-card {
    border-left: 3px solid var(--secondary);
}
.hud-task-card.upgrade-card .list-card__name {
    color: var(--secondary);
}
.hud-task-card.upgrade-maxed {
    opacity: 0.5;
    border-left-color: var(--text-faint) !important;
    pointer-events: none;
}
.hud-task-card.upgrade-maxed::after {
    content: "BUILT";
    position: absolute;
    top: 8px;
    right: 10px;
    font-size: var(--font-size-xxs);
    color: var(--color-success);
    letter-spacing: 2px;
}

/* Cost Pill Tags */
.hud-cost-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;
}
.cost-item {
    font-family: var(--font-mono);
    font-size: var(--font-size-xs);
    padding: 2px 8px;
    border: 1px solid var(--border-dim);
    background: rgba(0, 0, 0, 0.3);
    color: var(--text);
    letter-spacing: 0.5px;
}
.cost-item.text-danger {
    border-color: var(--color-danger);
    color: var(--color-danger);
}

/* Section Dividers */
.hud-section-title {
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
    color: var(--text-dim);
    letter-spacing: 2px;
    text-transform: uppercase;
    padding-bottom: 8px;
    margin-bottom: 16px;
    border-bottom: 1px solid var(--border-dim);
    position: relative;
}
.hud-section-title::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    width: 60px;
    height: 1px;
    background: var(--primary);
}
.infra-fragment .hud-section-title::after {
    background: var(--secondary);
}

/* Resource Grouping */
.res-group-divider {
    text-align: center;
    font-size: 9px;
    color: var(--text-faint);
    letter-spacing: 3px;
    padding: 6px 0 4px;
    margin: 4px 0;
}

/* Energy Stability Tags */
.energy-stable-tag {
    font-size: 9px;
    color: var(--color-success);
    letter-spacing: 2px;
    padding: 1px 4px;
    border: 1px solid var(--color-success);
    margin-left: 4px;
}
.energy-drain-tag {
    font-size: 9px;
    color: var(--color-danger);
    letter-spacing: 2px;
    padding: 1px 4px;
    border: 1px solid var(--color-danger);
    margin-left: 4px;
    animation: pulse-label 1s ease-in-out infinite;
}

/* -- PRESTIGE SYSTEM UI ------------------------ */
.prestige-banner {
    background: rgba(245, 197, 66, 0.1);
    border: 1px solid #f5c542;
    color: #f5c542;
    padding: 4px 14px;
    margin-right: 15px;
    font-size: var(--font-size-base);
    font-weight: bold;
    cursor: pointer;
    animation: prestige-pulse 1.5s ease-in-out infinite alternate;
    letter-spacing: 2px;
}
.prestige-banner:hover {
    background: rgba(245, 197, 66, 0.25);
    box-shadow: 0 0 15px rgba(245, 197, 66, 0.3);
}
@keyframes prestige-pulse {
    from { border-color: #f5c542; box-shadow: 0 0 5px rgba(245, 197, 66, 0.1); }
    to   { border-color: #ffd700; box-shadow: 0 0 20px rgba(245, 197, 66, 0.3); }
}

.prestige-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.85);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(4px);
}
.prestige-modal {
    background: #0b0e12;
    border: 2px solid #f5c542;
    padding: 24px 36px;
    max-width: 600px;
    width: 92%;
    max-height: 85vh;
    overflow-y: auto;
    font-family: var(--font-mono);
    box-shadow: 0 0 40px rgba(245, 197, 66, 0.15);
}
.prestige-title {
    text-align: center;
    color: #f5c542;
    font-size: var(--font-size-xl);
    letter-spacing: 4px;
    margin-bottom: 20px;
}
.prestige-subtitle {
    color: #f5c542;
    font-size: var(--font-size-sm);
    letter-spacing: 2px;
    margin: 20px 0 10px;
    opacity: 0.7;
}
.prestige-section {
    border: 1px solid rgba(245, 197, 66, 0.15);
    padding: 10px 15px;
    margin-bottom: 5px;
    background: rgba(245, 197, 66, 0.02);
}
.prestige-row {
    display: flex;
    justify-content: space-between;
    font-size: var(--font-size-sm);
    color: var(--text-dim);
    padding: 4px 0;
}
.prestige-row.prestige-total {
    color: #f5c542;
    font-weight: bold;
    font-size: var(--font-size-base);
}
.prestige-row.prestige-highlight {
    color: #4af;
}
.prestige-divider {
    border-top: 1px dashed rgba(245, 197, 66, 0.2);
    margin: 6px 0;
}
.prestige-actions {
    display: flex;
    gap: 15px;
    margin-top: 25px;
}
.prestige-btn {
    flex: 1;
    padding: 12px;
    font-family: var(--font-mono);
    font-size: var(--font-size-base);
    cursor: pointer;
    border: 1px solid;
    background: transparent;
    letter-spacing: 2px;
    transition: all 0.2s;
}
.prestige-btn.cancel {
    border-color: var(--border-dim);
    color: var(--text-dim);
}
.prestige-btn.cancel:hover {
    border-color: var(--text);
    color: var(--text);
}
.prestige-btn.confirm {
    border-color: #f5c542;
    color: #f5c542;
}
.prestige-btn.confirm:hover {
    background: rgba(245, 197, 66, 0.15);
    box-shadow: 0 0 15px rgba(245, 197, 66, 0.2);
}
.prestige-warning {
    text-align: center;
    margin-top: 15px;
    font-size: var(--font-size-xs);
    color: var(--text-faint);
    letter-spacing: 1px;
    font-style: italic;
}
.align-paragon { color: #4af; }
.align-shadow  { color: #f55; }
.align-pragmatist { color: #aaa; }

/* -- CAREER PANEL ----------------------------─ */
.career-panel { padding: 10px 0; }
.job-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 14px;
    padding: 10px 0;
}
.job-card {
    border: 1px solid var(--border-dim);
    padding: 16px;
    cursor: pointer;
    transition: border-color 0.2s, box-shadow 0.2s;
    background: var(--bg-card, rgba(10,15,25,0.5));
}
.job-card:hover {
    border-color: var(--secondary);
    box-shadow: 0 0 12px var(--secondary-glow, rgba(255, 170, 0, 0.15));
}
.job-card .job-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
}
.job-icon { font-size: 1.4em; }
.job-name, .job-title {
    font-family: var(--font-mono);
    font-size: var(--font-size-lg, 15px);
    font-weight: bold;
    color: var(--text);
    letter-spacing: 1px;
}
.job-desc {
    font-size: var(--font-size-sm, 12px);
    color: var(--text-dim);
    margin-bottom: 6px;
    line-height: 1.4;
}
.job-flavor {
    font-size: var(--font-size-xs, 11px);
    color: var(--text-faint);
    font-style: italic;
    margin-bottom: 10px;
}
.job-start-hint {
    font-size: var(--font-size-xs, 11px);
    color: var(--secondary);
    margin-bottom: 8px;
}
.job-enroll-btn {
    font-family: var(--font-mono);
    font-size: var(--font-size-sm, 12px);
    color: var(--secondary);
    font-weight: bold;
    letter-spacing: 2px;
    text-align: center;
    margin-top: 6px;
}

/* Active Job Card */
.job-active-card {
    border: 1px solid var(--secondary);
    padding: 20px;
    background: var(--bg-card, rgba(10,15,25,0.5));
}
.job-active-card .job-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
}
.job-tier-badge {
    font-family: var(--font-mono);
    font-size: var(--font-size-xs, 11px);
    color: var(--secondary);
    border: 1px solid var(--secondary);
    padding: 2px 8px;
    letter-spacing: 1px;
}
.job-path {
    font-family: var(--font-mono);
    font-size: var(--font-size-sm, 12px);
    margin-bottom: 6px;
    letter-spacing: 1px;
}
.job-income {
    border-top: 1px solid var(--border-dim);
    margin-top: 12px;
    padding-top: 10px;
}
.income-header {
    font-family: var(--font-mono);
    font-size: var(--font-size-xs, 11px);
    color: var(--text-dim);
    letter-spacing: 2px;
    margin-bottom: 6px;
}
.income-line {
    font-family: var(--font-mono);
    font-size: var(--font-size-sm, 12px);
    color: #0f0;
    margin-bottom: 3px;
}
.income-res { color: var(--text-dim); }
.promotion-section {
    border-top: 1px solid var(--border-dim);
    margin-top: 14px;
    padding-top: 10px;
}
.promote-header {
    font-family: var(--font-mono);
    font-size: var(--font-size-sm, 12px);
    color: var(--text);
    letter-spacing: 1px;
    margin-bottom: 6px;
}
.promote-req {
    font-size: var(--font-size-xs, 11px);
    color: var(--text-dim);
    margin-bottom: 8px;
    word-break: break-all;
}
.job-max-tier {
    font-family: var(--font-mono);
    font-size: var(--font-size-sm, 12px);
    color: var(--secondary);
    text-align: center;
    margin-top: 14px;
    letter-spacing: 2px;
}
.hud-btn-danger {
    display: block;
    width: 100%;
    margin-top: 14px;
    padding: 8px;
    font-family: var(--font-mono);
    font-size: var(--font-size-xs, 11px);
    color: var(--color-danger, #f55);
    border: 1px solid var(--color-danger, #f55);
    background: transparent;
    cursor: pointer;
    text-align: center;
    letter-spacing: 2px;
    transition: all 0.2s;
}
.hud-btn-danger:hover {
    background: rgba(255, 85, 85, 0.1);
}
.career-empty {
    font-family: var(--font-mono);
    font-size: var(--font-size-sm, 12px);
    color: var(--text-dim);
    text-align: center;
    padding: 40px 20px;
    letter-spacing: 1px;
}

/* -- ZONES / MAP ------------------------------─ */
.zones-panel {
    padding: 10px;
}
.zones-layout {
    display: grid;
    grid-template-columns: 1fr 1.4fr;
    gap: 15px;
    margin-top: 10px;
}
.zone-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
}
.zone-card {
    border: 1px solid #333;
    border-radius: 4px;
    padding: 8px 10px;
    cursor: default;
    transition: all 0.2s;
    background: rgba(0,0,0,0.3);
}
.zone-card.discovered {
    cursor: pointer;
    border-left-width: 3px;
}
.zone-card.discovered:hover {
    background: rgba(255,255,255,0.04);
}
.zone-card.selected {
    background: rgba(255,255,255,0.06);
    box-shadow: inset 0 0 12px rgba(255,255,255,0.03);
}
.zone-card-inner {
    display: flex;
    flex-direction: column;
    gap: 3px;
}
.zone-card-header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-mono);
    font-size: 13px;
    font-weight: bold;
}
.zone-icon {
    font-size: 16px;
}
.zone-name {
    flex: 1;
    letter-spacing: 1px;
}
.zone-phase {
    font-size: 10px;
    color: var(--text-dim);
    background: rgba(255,255,255,0.05);
    padding: 1px 5px;
    border-radius: 3px;
}
.zone-desc {
    font-size: 11px;
    color: var(--text-dim);
    line-height: 1.4;
}
.zone-card-locked {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-mono);
    font-size: 13px;
    color: #555;
    font-weight: bold;
    letter-spacing: 2px;
}

/* Zone Detail Panel */
.zone-detail {
    border: 1px solid #333;
    border-radius: 4px;
    padding: 12px;
    background: rgba(0,0,0,0.2);
}
.zone-detail-header {
    display: flex;
    align-items: center;
    gap: 12px;
    border-bottom: 1px solid #333;
    padding-bottom: 10px;
    margin-bottom: 12px;
}
.zone-detail-icon {
    font-size: 32px;
}
.zone-detail-name {
    font-size: 16px;
    font-weight: bold;
    font-family: var(--font-mono);
    letter-spacing: 2px;
}
.zone-detail-flavor {
    font-size: 11px;
    color: var(--text-dim);
    font-style: italic;
    margin-top: 2px;
}
.zone-sub-areas {
    margin-bottom: 12px;
}
.zone-sub-title {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-dim);
    letter-spacing: 2px;
    margin-bottom: 6px;
}
.zone-sub-card {
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 5px 8px;
    border-left: 2px solid #444;
    margin-bottom: 4px;
    transition: border-color 0.2s;
}
.zone-sub-card:hover {
    border-color: var(--primary);
}
.zone-sub-name {
    font-family: var(--font-mono);
    font-size: 12px;
    color: #ccc;
    font-weight: bold;
}
.zone-sub-desc {
    font-size: 11px;
    color: var(--text-dim);
}
.zone-npcs {
    margin-bottom: 12px;
}
.zone-npc-tag {
    display: inline-block;
    font-family: var(--font-mono);
    font-size: 10px;
    color: #aaa;
    background: rgba(255,255,255,0.05);
    border: 1px solid #444;
    padding: 2px 8px;
    border-radius: 3px;
    margin-right: 5px;
    margin-top: 3px;
    letter-spacing: 1px;
}
.zone-narrative-hook {
    font-family: var(--font-mono);
    font-size: 12px;
    color: #888;
    font-style: italic;
    border-top: 1px solid #333;
    padding-top: 10px;
    margin-top: 10px;
    line-height: 1.5;
}

</style>





