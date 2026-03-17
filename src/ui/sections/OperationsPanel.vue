<script>
/**
 * OperationsPanel.vue — Extracted from TerminalUI.vue
 * Handles generic task categories that don't have a dedicated specialized panel.
 * Functional equivalent of the old "MISSION/OPERATION AREA".
 *
 * P2 REDESIGN: category-specific theming, micro-animations, scoped CSS.
 */
import Game from "@/game";
import { RollOver, ItemOut } from "../../ui/popups/itemPopup.vue";
import { renderBar, resourceIcon, fmtRate, formatName } from "../uiHelpers";

const CATEGORY_THEMES = {
    income:      { icon: '¢', label: 'INCOME',      color: '#f5c542', accent: 'rgba(245, 197, 66, 0.15)' },
    exploration: { icon: '⊕', label: 'EXPLORATION', color: '#00d4ff', accent: 'rgba(0, 212, 255, 0.15)' },
    refinery:    { icon: '◈', label: 'REFINERY',    color: '#e060ff', accent: 'rgba(224, 96, 255, 0.15)' },
};

export default {
    props: {
        state: { type: Object, required: true },
        tasks: { type: Array, required: true },
        selectedCategory: { type: String, required: true },
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
        theme() {
            return CATEGORY_THEMES[this.selectedCategory] || {
                icon: '◉', label: this.selectedCategory.toUpperCase(),
                color: 'var(--primary)', accent: 'rgba(0, 255, 65, 0.15)'
            };
        },
        activeTasks() {
            this.renderTick;
            return this.tasks.filter(t => this.isRunning(t));
        },
        summaryText() {
            const total = this.tasks.length;
            const active = this.activeTasks.length;
            if (total === 0) return 'No operations available';
            return `${total} operation${total !== 1 ? 's' : ''}${active > 0 ? ' · ' + active + ' active' : ''}`;
        },
    },
    methods: {
        renderBar,
        resourceIcon,
        fmtRate,
        formatName,
        itemOver(e, it) { RollOver(e, it); },
        itemOut() { ItemOut(); },

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
        makeChoice(task, choice) {
            Game.runner.fulfillChoice(task, choice);
        },
    }
};
</script>

<template>
    <section class="operations-panel" :style="{ '--cat-color': theme.color, '--cat-accent': theme.accent }">
        <!-- Category Header -->
        <div class="ops-header">
            <span class="ops-header-icon" :style="{ color: theme.color }">{{ theme.icon }}</span>
            <h3 class="hud-section-title ops-title">> OPERATIONS: {{ theme.label }}</h3>
        </div>
        <div class="ops-summary">{{ summaryText }}</div>

        <!-- Empty State -->
        <div v-if="tasks.length === 0" class="ops-empty-state">
            <div class="ops-empty-icon">◌</div>
            <div class="ops-empty-text">
                NO {{ theme.label }} OPERATIONS AVAILABLE
            </div>
            <div class="ops-empty-hint">Unlock new operations through story progression and upgrades.</div>
        </div>

        <!-- Task Grid -->
        <div v-else class="hud-task-grid">
            <div v-for="task in tasks" :key="task.id"
                 :class="['hud-task-card', 'ops-card', { running: isRunning(task) }]"
                 role="button"
                 tabindex="0"
                 @click="tryItem(task)"
                 @keydown.enter.prevent="tryItem(task)"
                 @keydown.space.prevent="tryItem(task)"
                 @mouseover="itemOver($event, task)"
                 @mouseleave="itemOut">

                <div class="ops-card-accent"></div>

                <div class="hud-card-header">
                    <span class="status-dot" :class="{ 'dot-active': isRunning(task) }"></span>
                    <span class="list-card__name">{{ task.name.toUpperCase() }}</span>
                    <span v-if="isRunning(task)" class="task-active-label">&#x25B6; ACTIVE</span>
                </div>

                <div v-if="task.length" class="ops-progress-section">
                    <div class="ops-progress-bar-track">
                        <div class="ops-progress-bar-fill" :class="{ 'fill-active': isRunning(task) }"
                             :style="{ width: getPercent(task) + '%' }"></div>
                    </div>
                    <div v-if="isRunning(task)" class="ops-timer">
                        &#x23F1; {{ getTaskTimeRemaining(task) }}s
                    </div>
                </div>

                <!-- TASK EFFECTS (DELTA) -->
                <div v-if="isRunning(task)" class="active-task-rates ops-rates">
                    <div v-for="(val, rid) in getTaskNetRates(task)" :key="rid"
                         :class="['rate-pill', val > 0 ? 'rate-pos' : 'rate-neg']">
                        {{ resourceIcon(rid) }} {{ fmtRate(val) }}/s <span class="rate-name">{{ formatName(rid).toUpperCase() }}</span>
                    </div>
                </div>
                
                <!-- ACTION BUTTON FOOTER -->
                <div v-if="!task.choices || !isRunning(task)" class="ops-action-footer">
                    <span v-if="isRunning(task)" class="ops-action-abort">[ ABORT OPERATION ]</span>
                    <span v-else class="ops-action-initiate">[ INITIATE ]</span>
                </div>

                <!-- NARRATIVE CHOICE OVERLAY -->
                <div v-if="isRunning(task) && getPercent(task) >= 100 && task.choices" class="hud-choice-overlay ops-choice-overlay">
                    <span class="choice-alert ops-choice-alert">! PENDING DECISION !</span>
                    <div class="choice-actions">
                        <button v-for="choice in task.choices" :key="choice.id"
                             class="hud-btn-cta ops-choice-btn"
                             @click.stop="makeChoice(task, choice)">
                            {{ choice.name.toUpperCase() }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped>
/* ══ P2 OperationsPanel — Scoped CSS ══════════════════════════════════════ */

.operations-panel {
    min-height: 200px;
}

/* ── Category header ──────────────────────────────────────────────────── */
.ops-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 2px;
}
.ops-header-icon {
    font-size: var(--font-size-lg, 18px);
    text-shadow: 0 0 10px currentColor;
}
.ops-title {
    margin: 0;
}
.ops-summary {
    font-size: var(--font-size-xxs);
    color: var(--text-dim);
    letter-spacing: 0.5px;
    margin-bottom: 14px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border-dim);
}

/* ── Empty state ──────────────────────────────────────────────────────── */
.ops-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    text-align: center;
}
.ops-empty-icon {
    font-size: 32px;
    color: var(--cat-color, var(--primary));
    opacity: 0.3;
    margin-bottom: 10px;
    text-shadow: 0 0 12px var(--cat-color, var(--primary));
}
.ops-empty-text {
    font-size: var(--font-size-xs);
    color: var(--text-dim);
    letter-spacing: 2px;
    margin-bottom: 6px;
}
.ops-empty-hint {
    font-size: var(--font-size-xxs);
    color: var(--text-faint, #555);
    font-family: var(--font-mono);
}

/* ── Task card ────────────────────────────────────────────────────────── */
.ops-card {
    position: relative;
    overflow: hidden;
    transition: border-color 0.2s ease-out, box-shadow 0.2s ease-out;
}
.ops-card-accent {
    position: absolute;
    top: 0;
    left: 0;
    width: 3px;
    height: 100%;
    background: var(--cat-color, var(--primary));
    opacity: 0.35;
    transition: opacity 0.2s ease-out, box-shadow 0.2s ease-out;
}
.ops-card:hover .ops-card-accent {
    opacity: 1;
    box-shadow: 0 0 10px var(--cat-color, var(--primary));
}
.ops-card.running {
    border-color: var(--cat-color, var(--primary)) !important;
    box-shadow: inset 0 0 15px var(--cat-accent, rgba(0, 255, 65, 0.08));
}
.ops-card.running .ops-card-accent {
    opacity: 1;
    animation: accent-pulse 2s ease-in-out infinite;
}
@keyframes accent-pulse {
    0%, 100% { box-shadow: 0 0 6px var(--cat-color, var(--primary)); }
    50%      { box-shadow: 0 0 14px var(--cat-color, var(--primary)); }
}

/* ── Status dot ───────────────────────────────────────────────────────── */
.status-dot {
    transition: background 0.2s, box-shadow 0.2s;
}
.dot-active {
    background: var(--cat-color, var(--primary)) !important;
    box-shadow: 0 0 6px var(--cat-color, var(--primary));
}

/* ── Progress bar (replaces ASCII bar) ────────────────────────────────── */
.ops-progress-section {
    margin-top: 6px;
}
.ops-progress-bar-track {
    height: 4px;
    background: var(--bar-bg);
    border: 1px solid var(--bar-border);
    position: relative;
}
.ops-progress-bar-fill {
    height: 100%;
    background: var(--cat-color, var(--primary));
    transition: width 0.3s ease-out;
    position: relative;
}
.fill-active {
    box-shadow: 0 0 8px var(--cat-color, var(--primary));
}
.fill-active::after {
    content: '';
    position: absolute;
    right: 0;
    top: -1px;
    width: 2px;
    height: calc(100% + 2px);
    background: #fff;
    box-shadow: 0 0 6px #fff;
    animation: progress-cursor 1s ease-in-out infinite;
}
@keyframes progress-cursor {
    0%, 100% { opacity: 1; }
    50%      { opacity: 0.3; }
}
.ops-timer {
    font-size: var(--font-size-xxs);
    font-weight: bold;
    font-family: var(--font-mono);
    color: var(--cat-color, var(--secondary));
    text-align: right;
    margin-top: 4px;
}

/* ── Rate delta pills ─────────────────────────────────────────────────── */
.ops-rates {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 6px;
}
.rate-pill {
    font-size: var(--font-size-xxs);
    font-family: var(--font-mono);
    padding: 2px 6px;
    border: 1px solid;
    letter-spacing: 0.3px;
    display: flex;
    align-items: center;
    gap: 3px;
}
.rate-pos {
    color: #6a8;
    border-color: rgba(102, 170, 136, 0.3);
    background: rgba(102, 170, 136, 0.06);
}
.rate-neg {
    color: #e66;
    border-color: rgba(238, 102, 102, 0.3);
    background: rgba(238, 102, 102, 0.06);
}
.rate-name {
    color: var(--text-dim);
    font-size: var(--font-size-micro, 9px);
}

/* ── Action footer ────────────────────────────────────────────────────── */
.ops-action-footer {
    font-size: var(--font-size-xxs);
    margin-top: 10px;
    font-weight: bold;
    letter-spacing: 0.5px;
}
.ops-action-abort {
    color: var(--color-danger, #f55);
    cursor: pointer;
}
.ops-action-initiate {
    color: var(--text-dim);
    transition: color 0.2s;
}
.ops-card:hover .ops-action-initiate {
    color: var(--cat-color, var(--primary));
}

/* ── Choice overlay ───────────────────────────────────────────────────── */
.ops-choice-overlay {
    border-color: var(--cat-color, var(--primary)) !important;
}
.ops-choice-alert {
    animation: choice-blink 0.8s ease-in-out infinite;
}
@keyframes choice-blink {
    0%, 100% { opacity: 1; text-shadow: 0 0 8px currentColor; }
    50%      { opacity: 0.5; text-shadow: none; }
}
.ops-choice-btn {
    border-color: var(--cat-color, var(--primary)) !important;
    color: var(--cat-color, var(--primary)) !important;
}
.ops-choice-btn:hover {
    background: var(--cat-accent, rgba(0, 255, 65, 0.12)) !important;
}

/* ── Reduced motion ───────────────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
    .ops-card.running .ops-card-accent,
    .ops-choice-alert,
    .fill-active::after {
        animation: none !important;
    }
    .fill-active { box-shadow: none; }
}
</style>
