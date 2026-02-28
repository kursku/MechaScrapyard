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
        dtlLevel() {
            this.renderTick;
            return this.state.dtl?.level || 0;
        },
        dtlLabel() {
            return ['CLEAR', 'WATCHED', 'FLAGGED', 'HUNTED', 'BESIEGED', 'CRISIS'][this.dtlLevel] || 'CLEAR';
        },
        dtlPoints() {
            this.renderTick;
            return Math.floor(this.state.dtl?.points || 0);
        },
        layLowCooldown() {
            this.renderTick;
            return Math.ceil(this.state.dtl?.layLowCooldown || 0);
        },
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
        androidData() {
            this.renderTick;
            return this.state.android;
        },
        androidXPPercent() {
            const a = this.state.android;
            if (!a || !a.xpToNext) return 0;
            return Math.min(100, (a.xp / a.xpToNext) * 100);
        },
        androidEnergyPercent() {
            const a = this.state.android;
            if (!a || !a.maxEnergy) return 0;
            return Math.min(100, (a.energy / a.maxEnergy) * 100);
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
        layLow() { Game.layLow(); },
        salvage(opt) { Game.salvagePart(opt); },
        breakdown(opt) { Game.breakdownPart(opt); },
        closeSalvage() { Game.closeSalvage(); },
        conditionClass(cnd) {
            const v = Math.round((cnd || 0) * 100);
            if (v >= 70) return 'cnd-good';
            if (v >= 40) return 'cnd-worn';
            return 'cnd-damaged';
        },

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

        <!-- DTL HUD — District Threat Level -->
        <div v-if="dtlLevel > 0" class="dtl-hud-block" :class="'dtl-' + dtlLevel">
            <div class="dtl-hud-row">
                <span class="dtl-label-text">THREAT</span>
                <div class="dtl-pips">
                    <span v-for="i in 5" :key="i" :class="['dtl-pip', { active: i <= dtlLevel }]"></span>
                </div>
                <span class="dtl-status-text">{{ dtlLabel }}</span>
                <span class="dtl-points-text">({{ dtlPoints }}/100)</span>
            </div>
            <div v-if="dtlLevel >= 2" class="lay-low-row">
                <button
                    class="lay-low-btn"
                    :disabled="layLowCooldown > 0"
                    @click="layLow()"
                >
                    <span v-if="layLowCooldown > 0">[ GO DARK — {{ layLowCooldown }}s ]</span>
                    <span v-else>[ GO DARK — Reduce exposure ]</span>
                </button>
            </div>
        </div>

        <!-- 1. ANDROID TASK SLOT -->
        <div v-if="androidUnlocked" class="android-task-section">
            <div class="hud-section-title">> ANDROID_UNIT: [ {{ androidStatus }} ]</div>

            <!-- K.I.T.A. stats row -->
            <div class="kita-stats-row">
                <span class="kita-level-badge">LVL {{ androidData.level }}</span>
                <div class="kita-stat-block">
                    <span class="kita-stat-label">XP</span>
                    <div class="kita-bar-track">
                        <div class="kita-bar-fill kita-xp-fill" :style="{ width: androidXPPercent + '%' }"></div>
                    </div>
                    <span class="kita-stat-val">{{ androidData.xp }}/{{ androidData.xpToNext }}</span>
                </div>
                <div class="kita-stat-block">
                    <span class="kita-stat-label">NRG</span>
                    <div class="kita-bar-track">
                        <div class="kita-bar-fill kita-nrg-fill" :style="{ width: androidEnergyPercent + '%' }"></div>
                    </div>
                    <span class="kita-stat-val">{{ Math.floor(androidData.energy) }}/{{ androidData.maxEnergy }}</span>
                </div>
            </div>

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
                <div class="list-card__desc" style="font-size: var(--font-size-xxs); color: #888; font-family: var(--font-mono); line-height: 1.3; margin-bottom: 10px;">{{ task.desc }}</div>
                <div class="list-card__bottom">
                    <div v-if="isRunning(task)">
                        <div class="hud-ascii-bar" style="color: var(--primary)">
                             {{ renderBar(getPercent(task), 100, 15) }}
                        </div>
                        <div v-if="task.length" style="font-size: 13px; font-weight: bold; font-family: var(--font-mono); color: var(--primary); text-align: right; margin-top: 4px;">
                            &#x23F1; {{ getTaskTimeRemaining(task) }}s
                        </div>
                        <div style="font-size: var(--font-size-xxs); margin-top: 8px; font-weight: bold; color: var(--color-danger)">[ ABORT OPERATION ]</div>
                    </div>
                    <div v-else>
                        <div class="hud-ascii-bar" style="color: var(--border-light)">[...............]</div>
                        <div style="font-size: var(--font-size-xxs); margin-top: 8px; font-weight: bold; color: var(--text-dim)">[ INITIATE ]</div>
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
                    
                    <div v-if="upg.mod" class="upgrade-mods" style="margin-bottom: 10px; font-size: var(--font-size-xxs); color: var(--secondary); display: flex; flex-wrap: wrap; gap: 4px;">
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
                        <div v-else class="list-card__cost" style="color: var(--text-dim); font-size: var(--font-size-xxs);">CLICK TO BUILD</div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Salvage Overlay (Dismantling Bay) -->
    <div v-if="state.salvage.show" class="salvage-overlay">
        <div class="salvage-modal">
            <div class="salvage-title">◈ SALVAGE OPPORTUNITY</div>
            <div class="salvage-subtitle">The downed mech has recoverable components.</div>

            <div v-for="opt in state.salvage.options" :key="opt.slot" class="salvage-option">
                <div class="salvage-info">
                    <span class="salvage-part-name">{{ opt.partName }}</span>
                    <span class="salvage-condition" :class="conditionClass(opt.condition / 100)">
                        {{ opt.condition }}% CONDITION
                    </span>
                </div>
                <div class="salvage-breakdown-preview">
                    breakdown: {{ Object.entries(opt.breakdown).map(([k,v]) => `${v} ${k.replace(/_/g,' ')}`).join(' · ') }}
                </div>
                <div class="salvage-buttons">
                    <button class="hud-btn" @click="salvage(opt)">▶ Take Part</button>
                    <button class="hud-btn secondary" @click="breakdown(opt)">⚙ Break Down</button>
                </div>
            </div>

            <button class="hud-btn dim" @click="closeSalvage()">Leave it</button>
        </div>
    </div>
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
    font-size: var(--font-size-xxs);
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

/* K.I.T.A. stats row */
.kita-stats-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 5px 0 2px;
    flex-wrap: wrap;
}

.kita-level-badge {
    font-size: var(--font-size-xxs);
    font-family: var(--font-mono);
    color: rgba(0, 255, 170, 0.9);
    background: rgba(0, 255, 170, 0.08);
    border: 1px solid rgba(0, 255, 170, 0.3);
    padding: 2px 6px;
    letter-spacing: 1px;
    white-space: nowrap;
}

.kita-stat-block {
    display: flex;
    align-items: center;
    gap: 5px;
    flex: 1;
    min-width: 100px;
}

.kita-stat-label {
    font-size: var(--font-size-xxs);
    font-family: var(--font-mono);
    color: var(--text-dim);
    letter-spacing: 1px;
    width: 22px;
}

.kita-bar-track {
    flex: 1;
    height: 4px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.kita-bar-fill {
    height: 100%;
    transition: width 0.4s ease;
}

.kita-xp-fill {
    background: rgba(0, 200, 255, 0.7);
}

.kita-nrg-fill {
    background: rgba(255, 200, 0, 0.7);
}

.kita-stat-val {
    font-size: var(--font-size-xxs);
    font-family: var(--font-mono);
    color: var(--text-dim);
    white-space: nowrap;
}

.task-perpetual-tag {
    font-size: var(--font-size-xxs);
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
    font-size: var(--font-size-xxs);
    padding: 3px 6px;
    letter-spacing: 1px;
}

.hud-btn.small {
    font-size: var(--font-size-xxs);
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

/* Salvage Overlay */
.salvage-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
}
.salvage-modal {
    background: #0e0e0e;
    border: 1px solid #4a4;
    padding: 20px;
    width: 360px;
    max-width: 95vw;
    font-family: var(--font-mono);
}
.salvage-title {
    font-size: 1rem;
    color: #4f4;
    letter-spacing: 0.1em;
    margin-bottom: 4px;
}
.salvage-subtitle {
    font-size: 0.75rem;
    color: #888;
    margin-bottom: 14px;
}
.salvage-option {
    border: 1px solid #333;
    padding: 8px 10px;
    margin-bottom: 10px;
    background: #111;
}
.salvage-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
}
.salvage-part-name { color: #ddd; font-size: 0.85rem; }
.salvage-condition { font-size: 0.75rem; }
.cnd-good    { color: #4f4; }
.cnd-worn    { color: #fa4; }
.cnd-damaged { color: #f44; }
.salvage-breakdown-preview {
    font-size: 0.68rem;
    color: #555;
    margin-bottom: 8px;
}
.salvage-buttons {
    display: flex;
    gap: 6px;
}
.hud-btn.dim {
    margin-top: 10px;
    opacity: 0.5;
    width: 100%;
}
.hud-btn.dim:hover { opacity: 1; }

/* DTL HUD */
.dtl-hud-block {
    border: 1px solid currentColor;
    background: rgba(0, 0, 0, 0.3);
    padding: 6px 10px;
    margin-bottom: 12px;
    font-family: var(--font-mono);
}

.dtl-hud-row {
    display: flex;
    align-items: center;
    gap: 8px;
}

.dtl-label-text {
    font-size: var(--font-size-xxs);
    letter-spacing: 0.12em;
    opacity: 0.7;
}

.dtl-pips {
    display: flex;
    gap: 3px;
}

.dtl-pip {
    width: 8px;
    height: 8px;
    border: 1px solid currentColor;
    opacity: 0.25;
}

.dtl-pip.active {
    opacity: 1;
    background: currentColor;
}

.dtl-status-text {
    font-size: var(--font-size-xxs);
    font-weight: bold;
    letter-spacing: 0.1em;
}

.dtl-points-text {
    font-size: var(--font-size-xxs);
    opacity: 0.5;
    margin-left: auto;
}

.dtl-1 { color: #aaa; }
.dtl-2 { color: #e83; }
.dtl-3 { color: #e55; }
.dtl-4, .dtl-5 { color: #e05; animation: dtl-pulse 1.5s ease-in-out infinite; }

@keyframes dtl-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
}

.lay-low-row {
    margin-top: 6px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    padding-top: 6px;
}

.lay-low-btn {
    width: 100%;
    background: transparent;
    border: 1px solid currentColor;
    color: currentColor;
    font-family: var(--font-mono);
    font-size: var(--font-size-xxs);
    letter-spacing: 0.08em;
    padding: 4px 8px;
    cursor: pointer;
    opacity: 0.85;
    transition: opacity 0.15s;
}

.lay-low-btn:hover:not(:disabled) {
    opacity: 1;
}

.lay-low-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
}
</style>
