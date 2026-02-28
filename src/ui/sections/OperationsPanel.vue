<script>
/**
 * OperationsPanel.vue — Extracted from TerminalUI.vue
 * Handles generic task categories that don't have a dedicated specialized panel.
 * Functional equivalent of the old "MISSION/OPERATION AREA".
 */
import Game from "@/game";
import { RollOver, ItemOut } from "../../ui/popups/itemPopup.vue";
import { renderBar, resourceIcon, fmtRate, formatName } from "../uiHelpers";

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
    <section class="operations-panel">
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
                <div v-if="!task.choices || !isRunning(task)" style="font-size: var(--font-size-xxs); margin-top: 10px; font-weight: bold;">
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
</template>
