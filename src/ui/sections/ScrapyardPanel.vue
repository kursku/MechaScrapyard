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
            selectedAndroidTask: '',
        };
    },
    mounted() {
        this._tick = setInterval(() => this.renderTick++, 200);
    },
    beforeUnmount() {
        if (this._tick) clearInterval(this._tick);
    },
    computed: {
        androidUnlocked() {
            this.renderTick;
            return this.state.android?.active || false;
        },
        androidStatus() {
            return Game.runner.slots.android ? 'ACTIVE' : 'STANDBY';
        },
        androidEligibleTasks() {
            this.renderTick;
            return Object.values(this.state.items)
                .filter(i => i.type === 'task' && i.androidEligible && !i.locked);
        },
        androidSlot() {
            this.renderTick;
            return Game.runner.slots.android;
        },
        androidSlotTask() {
            const slot = this.androidSlot;
            if (!slot) return null;
            return this.state.items[slot.taskId] || null;
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
        
        startAndroid() {
            if (!this.selectedAndroidTask) return;
            Game.runner.startAndroidTask(this.selectedAndroidTask);
            this.selectedAndroidTask = '';
        },
        stopAndroid() {
            Game.runner.stopAndroidTask();
        },
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
        
        <!-- 1. ANDROID TASK SLOT -->
        <div v-if="androidUnlocked" class="android-task-section">
            <div class="hud-section-title">> ANDROID_UNIT: [ {{ androidStatus }} ]</div>

            <div v-if="androidSlot && androidSlotTask" class="active-task-row">
                <span class="task-label">{{ androidSlotTask.name.toUpperCase() }}</span>
                <div class="hud-progress-bar">
                    <div class="hud-progress-fill android-fill"
                         :style="{ width: (androidSlotTask.perpetual ? 100 : (androidSlot.progress / androidSlotTask.length) * 100) + '%' }">
                    </div>
                </div>
                <span v-if="androidSlotTask.perpetual" class="task-perpetual-tag">CONT.</span>
                <button class="hud-btn small" @click="stopAndroid">HALT</button>
            </div>
            <div v-else class="task-assign-row">
                <select class="hud-select" v-model="selectedAndroidTask">
                    <option value="">[ SELECT_TASK ]</option>
                    <option v-for="task in androidEligibleTasks" :key="task.id" :value="task.id">
                        {{ task.name.toUpperCase() }}
                    </option>
                </select>
                <button class="hud-btn small" :disabled="!selectedAndroidTask" @click="startAndroid">DEPLOY</button>
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

<style scoped>
.android-task-section {
    border: 1px solid rgba(0, 255, 170, 0.25);
    background: rgba(0, 255, 170, 0.03);
    padding: 8px 10px;
    margin-bottom: 12px;
}

.active-task-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 6px;
}

.task-label {
    font-size: 10px;
    color: var(--primary);
    letter-spacing: 1px;
    white-space: nowrap;
    min-width: 80px;
}

.hud-progress-bar {
    flex: 1;
    height: 6px;
    background: var(--border-dim, #222);
    border: 1px solid var(--border, #333);
}

.hud-progress-fill {
    height: 100%;
    background: var(--primary);
    transition: width 0.3s;
}

.android-fill {
    background: rgba(0, 255, 170, 0.7);
}

.task-perpetual-tag {
    font-size: 9px;
    color: var(--text-dim);
    letter-spacing: 1px;
}

.task-assign-row {
    display: flex;
    gap: 6px;
    margin-top: 6px;
    align-items: center;
}

.hud-select {
    flex: 1;
    background: var(--bg, #0a0c0e);
    border: 1px solid var(--border);
    color: var(--text);
    font-family: var(--font-mono, monospace);
    font-size: 10px;
    padding: 3px 6px;
    letter-spacing: 1px;
}

.hud-btn.small {
    font-size: 10px;
    padding: 3px 8px;
    letter-spacing: 1px;
    border: 1px solid var(--primary);
    background: transparent;
    color: var(--primary);
    cursor: pointer;
    font-family: var(--font-mono, monospace);
}

.hud-btn.small:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}
</style>
