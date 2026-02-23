<script>
import Game from "@/game";
import { RollOver, ItemOut, default as itemPopup } from "@/ui/popups/itemPopup.vue";
import CombatPanel from "./components/CombatPanel.vue";
import DialogueModal from "./popups/DialogueModal.vue";

export default {
    components: { itemPopup, CombatPanel, DialogueModal },
    props: ['state'],
    data() {
        return {
            selectedCategory: 'scrapyard',
            renderTick: 0,
            _renderInterval: null,
        };
    },
    methods: {
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
        makeChoice(task, choice) {
            Game.runner.fulfillChoice(task, choice);
        },
        getAlignmentText(val) {
            if (val >= 30) return "IDEALIST";
            if (val <= -30) return "PRAGMATIC";
            return "NEUTRAL";
        },
        getPercent(task) {
            if (!task.length || Game.runner.activeTask !== task) return 0;
            return (Game.runner.taskProgress / task.length) * 100;
        },
        isRunning(task) {
            return Game.runner.activeTask === task;
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
            const ICONS = { 
                energy: '⚡', scrap: '⚙', creds: '¢',
                ferrous_scrap: '⛏', polymer_scrap: '⬡', electronic_scrap: '⧉',
                nano_infra: '◈', nanofiber: '≋', ceramite: '◆', fusion_cells: '⚛', quantum_circuits: '◇',
                glory: '⚔', parts: '⊞', supply: '▸', data_chips: '◇',
                rep_police: '🛡️', rep_military: '⚔️', rep_underground: '🔧',
                rep_corporate: '🔥', rep_exile: '👁️',
                moralidade: '⚖', prestige_points: '★'
            };
            return ICONS[id] || '•';
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
        devUnlockAll() {
            if (window.Game) window.Game.devUnlockAll();
            // Force re-render just to be safe
            this.renderTick++;
        }
    },
    computed: {
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
            
            const hasBlueprints = Object.values(this.state.items).some(i => i.type === 'blueprint' && !i.locked);
            if (hasBlueprints) list.push('workshop');
            
            return list;
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
                    
                    return { ...f, repValue, currentTier, nextTier, progressPct };
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
        morality() {
            this.renderTick;
            return this.state.get("moralidade");
        },
        moralRes() {
            this.renderTick;
            return this.state.items.moralidade;
        },
        moralValue() {
            this.renderTick;
            return this.moralRes?.val || 0;
        },
        moralLabel() {
            const v = this.moralValue;
            if (v >= 70) return 'Paragon';
            if (v >= 30) return 'Idealist';
            if (v <= -70) return 'Ruthless';
            if (v <= -30) return 'Pragmatic';
            return 'Neutral';
        },
        moralColor() {
            const v = this.moralValue;
            if (v >= 30) return '#4af';
            if (v <= -30) return '#f55';
            return '#aaa';
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
                <span class="sector-phase-tag">[ PHASE: {{ currentHome ? currentHome.id.split('_')[1].toUpperCase() : '0' }} ]</span>
                [ PLT: PILOT_01 ]
            </div>
        </header>

        <!-- RESOURCE MONITOR (Left Fragment) -->
        <aside class="terminal-resource-list hud-panel side-panel">
            <h4 class="hud-label">> RESOURCE MONITOR</h4>
            <div v-for="res in resources" :key="res.id" 
                 class="hud-resource-btn"
                 :class="{ 
                    'rate-pos': getNetRate(res) > 0.01, 
                    'rate-neg': getNetRate(res) < -0.01 
                 }"
                 :style="{ '--res-color': res.color || 'var(--primary)' }"
                 @mouseover="itemOver($event, res)"
                 @mouseleave="itemOut">
                <span class="res-icon">{{ res.icon || '•' }}</span>
                <span class="res-info">
                    <div class="flex-between">
                        <span>{{ res.name.toUpperCase() }}</span>
                        <div class="res-values">
                            <span v-if="getNetRate(res) !== 0" class="res-delta">
                                {{ fmtRate(getNetRate(res)) }}/s
                            </span>
                            <span class="res-val">{{ Math.floor(res.val) }}</span>
                        </div>
                    </div>
                    <div class="hud-ascii-bar" :style="{ color: res.color }">
                        {{ renderBar(res.val, res.max, 15) }}
                    </div>
                </span>
            </div>
            
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
                        @click="selectedCategory = cat">
                    <span class="tab-indicator"></span>
                    {{ cat === 'pilot' ? 'PROFILE' : cat.toUpperCase() }}
                </button>
            </nav>

            <div class="console-body">
                <!-- COMBAT AREA -->
                <section v-if="selectedCategory === 'combat'">
                    <CombatPanel :state="state" :combatRunner="combatRunner" />
                </section>

                <!-- MECHA AREA -->
                <section v-else-if="selectedCategory === 'mecha'" class="pilot-console">
                    <!-- Lado Direito: Mecha BIOS Config -->
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
                                <div class="col-mount">> {{ slotId.replace('_', ' ').toUpperCase() }}</div>
                                
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
                                    <select class="hud-select" 
                                            :value="frame.installedEquip && frame.installedEquip[slotId] ? frame.installedEquip[slotId] : ''" 
                                            @change="equipItem && equipItem(slotId, $event)">
                                        <option value="">[ EMPTY_SLOT ]</option>
                                        <template v-if="getValidWeapons">
                                            <option v-for="w in getValidWeapons(slotId)" :key="w.id" :value="w.id">
                                                {{ w.name ? w.name.toUpperCase() : w.id }}
                                            </option>
                                        </template>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="inventory-deck" v-if="state.partsInventory && state.partsInventory.length > 0">
                        <h3 class="hud-section-title">> RECOVERED_PARTS_INVENTORY</h3>
                        <div class="hud-task-grid mini">
                            <div v-for="part in state.partsInventory" :key="part.id" 
                                 class="hud-task-card mini salvage-card"
                                 @click="dismantlePart(part)"
                                 @mouseover="itemOver($event, part)"
                                 @mouseleave="itemOut">
                                <div class="hud-card-header">{{ part.name.toUpperCase() }}</div>
                                <div class="salvage-meta">
                                    <span>[{{ part.slot.toUpperCase() }}]</span>
                                    <span :class="{ worn: part.condition < 0.5 }">{{ Math.round(part.condition * 100) }}% CND</span>
                                </div>
                                <div class="salvage-hint">CLICK TO DISMANTLE</div>
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
                                <div v-if="fac.nextTier" class="hud-ascii-bar" :style="{ color: fac.color, marginBottom: '15px' }">
                                    {{ renderBar(fac.repValue - fac.currentTier.min, fac.nextTier.min - fac.currentTier.min, 15) }}
                                </div>
                                <div v-else class="hud-ascii-bar" :style="{ color: fac.color, marginBottom: '15px' }">
                                    [ MAX REPUTATION REACHED ]
                                </div>
                                
                                <div v-if="fac.currentTier.unlocks && fac.currentTier.unlocks.length" class="faction-perks">
                                    <div class="faction-perks-title" :style="{ color: fac.color }">UNLOCKED:</div>
                                    <div v-for="(perk, i) in fac.currentTier.unlocks.filter(u => !u.startsWith('bp_'))" :key="i" class="perk-item">
                                        ▸ {{ perk }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- WORKSHOP AREA -->
                <section v-else-if="selectedCategory === 'workshop'">
                    <h3 class="hud-section-title">> WORKSHOP & ASSEMBLY</h3>
                    <div class="hud-task-grid">
                        <div v-for="bp in blueprints" :key="bp.id" class="hud-task-card workshop-card" 
                             @click="craftBlueprint(bp)"
                             @mouseover="itemOver($event, bp)"
                             @mouseleave="itemOut">
                            <div class="hud-card-header" style="color: #0fa">
                                ✦ {{ bp.name.toUpperCase() }}
                            </div>
                            <div v-if="bp.materials" class="blueprint-materials">
                                <span v-for="(amount, matId) in bp.materials" :key="matId" 
                                      class="blueprint-mat"
                                      :style="{ color: canAfford(matId, amount) ? '#6a8' : '#e44' }">
                                    {{ formatName(matId).toUpperCase() }}: {{ amount }}
                                </span>
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
                                🤖 {{ android.name.toUpperCase() }} 
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
                                <span v-if="android.assignment" class="working">▶ EXECUTING: {{ getTaskName(android.assignment).toUpperCase() }}</span>
                                <span v-else class="idle">■ STANDBY MODE</span>
                            </div>
                            <div>
                                <button v-if="android.assignment" class="btn-outline btn-stop" @click="unassignAndroid">STOP TASK</button>
                                <button v-else class="btn-outline" style="border-style: dashed; opacity: 0.5;" disabled>AWAITING ORDERS</button>
                            </div>
                        </div>
                    </div>

                    <!-- 2. LOCAL OPERATIONS (Manual & Assignable) -->
                    <h3 class="hud-section-title">> LOCAL OPERATIONS</h3>
                    <div class="hud-task-grid">
                        <!-- Filtra apenas missões perpétuas e explorações básicas do scrapyard -->
                        <div v-for="task in tasks.filter(t => !t.tags || !t.tags.includes('infrastructure'))" :key="task.id"
                             class="hud-task-card"
                             :style="isRunning(task) ? 'border-color: var(--primary); border-left-color: var(--primary); background: rgba(255, 176, 0, 0.05);' : ''"
                             @click="tryItem(task)">
                            <div class="hud-card-header">
                                    <span class="status-dot" :style="isRunning(task) ? 'background-color: var(--primary)' : ''"></span>
                                    <span class="list-card__name" :style="isRunning(task) ? 'color: var(--primary)' : 'color: var(--text)'">{{ task.name.toUpperCase() }}</span>
                            </div>
                            <div class="list-card__desc" style="font-size: 11px; color: #888; font-family: var(--font-mono); line-height: 1.3; margin-bottom: 10px;">{{ task.desc }}</div>
                            <div class="list-card__bottom">
                                <div v-if="isRunning(task)" class="hud-ascii-bar" style="color: var(--primary)">
                                     {{ renderBar(getPercent(task), 100, 15) }}
                                </div>
                                <div v-else class="hud-ascii-bar" style="color: var(--border-light)">[...............]</div>
                                
                                <div style="display: flex; gap: 8px;">
                                    <button v-if="android && android.active && task.perpetual" 
                                            class="btn-outline btn-assign" 
                                            :disabled="android.assignment === task.id" 
                                            @click.stop="assignAndroid(task.id)">
                                        {{ android.assignment === task.id ? '🤖 ASSIGNED' : '🤖 ASSIGN K.I.T.A.' }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 3. BASE INFRASTRUCTURE -->
                    <div class="infra-fragment" v-if="upgrades && upgrades.length > 0">
                        <h3 class="hud-section-title" style="color: var(--secondary); margin-top: 15px;">> BASE INFRASTRUCTURE</h3>
                        <div class="hud-task-grid">
                            <div v-for="upg in upgrades" :key="upg.id"
                                 class="hud-task-card"
                                 @click="tryItem(upg)">
                                <div class="hud-card-header">
                                    <span class="list-card__name">{{ upg.name.toUpperCase() }}</span>
                                    <span style="font-size: 12px; color: var(--text-dim)">[{{ upg.owned || 0 }}/{{ upg.max }}]</span>
                                </div>
                                <div class="list-card__desc" style="font-size: 11px; color: #888; font-family: var(--font-mono); line-height: 1.3; margin-bottom: 10px;">{{ upg.desc }}</div>
                                <div class="list-card__bottom">
                                    <div v-if="upg.cost" class="hud-cost-list">
                                        <span v-for="(amt, id) in upg.cost" :key="id"
                                              :class="['cost-item', canAfford(id, amt * Math.pow(upg.costScale || 1, upg.owned || 0)) ? '' : 'text-danger']">
                                            {{ resourceIcon(id) }} {{ Math.floor(amt * Math.pow(upg.costScale || 1, upg.owned || 0)) }}
                                        </span>
                                    </div>
                                    <div v-else class="list-card__cost" style="color: var(--text-dim); font-size: 10px;">CLICK TO BUILD</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- MISSION/OPERATION AREA -->
                <section v-else-if="selectedCategory !== 'pilot'">
                    <h3 class="hud-section-title">> OPERATIONS: {{ selectedCategory.toUpperCase() }}</h3>
                    <div class="hud-task-grid">
                        <div v-for="task in tasks" :key="task.id"
                             :class="['hud-task-card', { running: isRunning(task) }]"
                             @click="tryItem(task)"
                             @mouseover="itemOver($event, task)"
                             @mouseleave="itemOut">
                            <div class="hud-card-header">
                                <span class="status-dot"></span>
                                {{ task.name.toUpperCase() }}
                            </div>
                            <div v-if="task.length" class="hud-ascii-bar" style="color: var(--secondary)">
                                 {{ renderBar(getPercent(task), 100, 20) }}
                            </div>

                            <!-- TASK EFFECTS (DELTA) -->
                            <div v-if="isRunning(task)" class="active-task-rates">
                                <div v-for="(val, rid) in getTaskNetRates(task)" :key="rid"
                                     :class="['rate-delta', val > 0 ? 'pos' : 'neg']">
                                    {{ resourceIcon(rid) }} {{ fmtRate(val) }}/s
                                </div>
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
                                <span :style="{ color: moralColor }">⚖ MORAL COMPASS</span>
                                <span :style="{ color: moralColor }">{{ moralLabel }} ({{ moralValue }})</span>
                            </div>
                            <div class="morality-track">
                                <div class="morality-fill" :style="moralBarStyle"></div>
                                <div class="morality-center"></div>
                            </div>
                            <div class="morality-axis">
                                <span style="color:#f55">PRAGMATIC</span>
                                <span style="color:#aaa">NEUTRAL</span>
                                <span style="color:#4af">IDEALIST</span>
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
                                <div v-if="task.length" class="hud-ascii-bar" style="color: var(--secondary)">
                                     {{ renderBar(getPercent(task), 100, 10) }}
                                </div>
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
                                    <span class="skill-name">● {{ skill.name }}</span>
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
    </div>
</template>

<style scoped>
@import "@/../css/mecha_terminal.css";
/* ── FACTION DETAILS (NEW LAYOUT) ──────────────────────── */
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
.faction-perks { background: rgba(0,0,0,0.4); padding: 10px; font-size: var(--font-size-xs); color: var(--text-dim); }
.faction-perks-title { margin-bottom: 5px; font-weight: bold; }

/* ── PILOT CONSOLE DECKS (2 COLUMN FIX) ────────────────────── */
.pilot-stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr; /* 2 colunas para poupar espaço vertical */
    gap: 15px 20px;
}

/* ── MECHA PARTS (TABLE LAYOUT) ────────────────────── */
.part-list { display: flex; flex-direction: column; gap: 15px; }
.hud-part-widget { background: rgba(255,255,255,0.02); border: 1px solid var(--border-dim); padding: 10px; margin-bottom: 10px;}
.part-title { font-weight: bold; color: var(--text); margin-bottom: 8px; font-size: var(--font-size-sm); letter-spacing: 1px; }
.part-status-row, .part-condition-row { display: flex; justify-content: space-between; align-items: center; font-size: var(--font-size-xs); margin-bottom: 4px; }
.p-hp-bar, .p-cond-bar { flex: 1; margin: 0 10px; font-family: var(--font-mono); letter-spacing: 1px; text-align: right;}

/* ── HUD GRID SYSTEM RESPONSIVO ──────────────────────── */
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
    /* O SEGREDO: Limita a largura central para não esticar no Ultrawide */
    max-width: 1400px;
    margin-left: auto;
    margin-right: auto;
    width: 100%;
}

/* ── TASK CARDS (MUDANÇA DE AUTO-FIT PARA AUTO-FILL) ───────────────── */
.hud-task-grid, .task-grid {
    display: grid;
    /* auto-fill: impede que os cartões estiquem para preencher espaços vazios */
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
}

/* ── FACTIONS GRID ──────────────────────── */
.factions-grid { 
    display: grid; 
    /* Idem para as fações */
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); 
    gap: 20px; 
}

/* ── PILOT CONSOLE DECKS ────────────────────── */
.pilot-console { 
    display: grid; 
    /* Em ecrãs pequenos vira 1 coluna, em normais 2 colunas */
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); 
    gap: 30px; 
}

.pilot-stats-grid {
    display: grid;
    /* Impede que as barras de stat fiquem demasiado largas */
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

/* ── TAB NAVIGATION MELHORADA ────────────────────────── */
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

/* ── RESTRUTURAÇÃO DO PILOT CONSOLE ────────────────────── */
.pilot-deck-column {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.text-center { text-align: center; }
.blink { animation: blink 1s infinite; }
@keyframes blink { 50% { opacity: 0; } }

/* ── ARMORY STYLES (Mantidos da versão original) ────────────────────────── */
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

/* ── RESOURCE WIDGETS ─────────────────────── */
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

/* ── TASK CARDS (FRAGMENTED) ───────────────── */
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

/* ── CHOICE OVERLAY ────────────────────────── */
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

/* ── PILOT CONSOLE DECKS ────────────────────── */
.hud-stat-widget { margin-bottom: 10px; }
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

/* ── RATE INDICATORS ──────────────────────── */
.res-values { display: flex; align-items: center; gap: 8px; }
.res-delta { font-size: var(--font-size-sm); font-weight: bold; opacity: 0.8; }
.rate-pos .res-delta { color: #4f8; }
.rate-neg .res-delta { color: #f44; }
.rate-pos .res-icon { animation: flow-up 1.5s infinite linear; }
.rate-neg .res-icon { animation: flow-down 1.5s infinite linear; }

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

/* ── CRITICAL ALERT SYSTEM ───────────────── */
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

/* ── HARDWARE CONFIG TABLE (BIOS STYLE) ────────────────────── */
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

/* Responsividade para a tabela */
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

/* ── ANDROID CONTROL PANEL ────────────────────── */
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

/* Botões específicos do Android/Tarefas */
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
</style>
