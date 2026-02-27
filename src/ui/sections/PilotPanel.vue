<script>
/**
 * PilotPanel.vue — Extracted from TerminalUI.vue
 * Displays Pilot Morphology, Re-programming/Training tasks, and Neural Skills.
 * Includes the Morality Compass implementation.
 */
import Game from "@/game";
import { RollOver, ItemOut } from "../../ui/popups/itemPopup.vue";
import { renderBar } from "../uiHelpers";

export default {
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
        morphology() {
            this.renderTick;
            return Object.values(this.state.items).filter(i => i.type === 'player_stat' && !i.hide);
        },
        skills() {
            this.renderTick;
            return Object.values(this.state.items).filter(i => i.type === 'skill' && !i.locked);
        },
        moralRes() {
            this.renderTick;
            return this.state.get("morality");
        },
        moralValue() {
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
    },
    methods: {
        renderBar,
        itemOver(e, it) { RollOver(e, it); },
        itemOut() { ItemOut(); },
        statTier(val) {
            if (val >= 90) return 'LEGEND';
            if (val >= 70) return 'MASTER';
            if (val >= 50) return 'ELITE';
            if (val >= 30) return 'VETERAN';
            if (val >= 20) return 'SKILLED';
            if (val >= 10) return 'TRAINED';
            return 'RAW';
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
    }
};
</script>

<template>
    <section class="pilot-console">
        <div class="morphology-deck">
            <h3 class="hud-section-title">> PILOT MORPHOLOGY</h3>
            <div class="pilot-stats-grid">
                <div v-for="stat in morphology" :key="stat.id" class="hud-stat-widget"
                     @mouseover="itemOver($event, stat)"
                     @mouseleave="itemOut">
                    <div class="stat-meta">
                        <span :style="{ color: stat.color }">{{ stat.icon }} {{ stat.name.toUpperCase() }}</span>
                        <span>
                            {{ Math.floor(stat.val) }}
                            <span class="stat-tier-label">{{ statTier(stat.val) }}</span>
                        </span>
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
</template>
