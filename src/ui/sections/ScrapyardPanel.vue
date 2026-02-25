<script>
/**
 * ScrapyardPanel.vue — Extracted from TerminalUI.vue
 * Handles Android control, local salvage operations, and base infrastructure upgrades.
 */
import Game from "@/game";
import ResourceBufferBadge from "../components/ResourceBufferBadge.vue";
import { renderBar, resourceIcon, formatName, formatModKey, fmtRate } from "../uiHelpers";

export default {
    components: { ResourceBufferBadge },
    props: {
        state: { type: Object, required: true },
        tasks: { type: Array, required: true },
    },
    data() {
        return {
            renderTick: 0,
        };
    },
    mounted() {
        this._tick = setInterval(() => this.renderTick++, 200);
    },
    beforeUnmount() {
        if (this._tick) clearInterval(this._tick);
    },
    computed: {
        android() {
            this.renderTick;
            return this.state.android;
        },
        rawScrap() {
            this.renderTick;
            return this.state.items.scrap;
        },
        showRawScrapIndicator() {
            this.renderTick;
            return (this.state.g.sorting_station || 0) > 0 && !!this.rawScrap;
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
    },
    methods: {
        renderBar,
        resourceIcon,
        formatName,
        formatModKey,
        fmtRate,
        
        assignAndroid(id) { Game.assignAndroid(id); },
        unassignAndroid() { Game.unassignAndroid(); },
        getTaskName(id) {
            const task = this.state.items[id];
            return task ? task.name : 'Unknown';
        },
        tryItem(it) {
            Game.tryItem(it);
        },
        isRunning(task) {
            return Game.runner.activeTask === task;
        },
        getPercent(task) {
            if (!task.length || Game.runner.activeTask !== task) return 0;
            return (Game.runner.taskProgress / task.length) * 100;
        },
        getTaskTimeRemaining(task) {
            if (!this.isRunning(task) || !task.length) return "0.0";
            const progress = Game.runner.taskProgress || 0;
            const remaining = Math.max(0, task.length - progress);
            const speed = Game.runner.getTaskSpeed(task);
            return (remaining / (speed || 1)).toFixed(1);
        },
        getTaskNetRates(task) {
            const rates = {};
            if (task.effect) Object.entries(task.effect).forEach(([k, v]) => { rates[k] = (rates[k] || 0) + v; });
            if (task.run) Object.entries(task.run).forEach(([k, v]) => { rates[k] = (rates[k] || 0) - v; });
            return rates;
        },
        canAfford(matId, amount) {
            const res = this.state.get(matId);
            return res && res.val >= amount;
        },
    }
};
</script>

<template>
    <section class="scrapyard-panel">
        
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
</template>
