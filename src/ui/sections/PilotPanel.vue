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
            activeTree: 'combat',
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
        skillTrees() {
            return [
                { id: 'combat',      label: 'COMBAT',      parentId: 'skill_combat' },
                { id: 'hacking',     label: 'HACKING',     parentId: 'skill_hacking' },
                { id: 'engineering', label: 'ENGINEERING', parentId: 'skill_mecha_tech' },
                { id: 'athletics',   label: 'ATHLETICS',   parentId: 'skill_gathering' },
                { id: 'negotiation', label: 'NEGOTIATION', parentId: 'skill_social' },
                { id: 'medicine',    label: 'MEDICINE',    parentId: 'skill_investigation' },
                { id: 'piloting',    label: 'PILOTING',    parentId: 'skill_crafting' },
            ];
        },
        skillPoints() {
            this.renderTick;
            return Math.floor(this.state.items['skill_points']?.val || 0);
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
        treeSubSkills(treeId, tier) {
            return Object.values(this.state.items)
                .filter(i => i.type === 'sub_skill' && i.tree === treeId && i.tier === tier)
                .sort((a, b) => a.id.localeCompare(b.id));
        },
        ownedInTree(treeId) {
            return Object.values(this.state.items)
                .filter(i => i.type === 'sub_skill' && i.tree === treeId && i.owned).length;
        },
        canBuy(sk) {
            if (sk.owned) return false;
            if (this.skillPoints < sk.cost) return false;
            if (sk.require && !Game.evalRequire(sk.require)) return false;
            return true;
        },
        buySubSkill(sk) {
            Game.buySubSkill(sk.id);
            this.renderTick++;
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
            <!-- Parent skill levels (training progress) -->
            <div class="skills-list">
                <div v-for="skill in skills" :key="skill.id"
                     class="hud-skill-item"
                     @mouseover="itemOver($event, skill)"
                     @mouseleave="itemOut">
                    <div class="flex-between">
                        <span class="skill-name">{{ skill.icon || '●' }} {{ skill.name }}</span>
                        <span class="skill-lvl">LVL {{ Math.floor(skill.val) }}/{{ skill.max || 20 }}</span>
                    </div>
                </div>
            </div>

            <!-- Skill Tree -->
            <h3 class="hud-section-title" style="margin-top:14px;">> SKILL TREE</h3>
            <div class="sp-row">★ <strong>{{ skillPoints }}</strong> Skill Points available</div>

            <div class="tree-selector">
                <button v-for="tree in skillTrees" :key="tree.id"
                        :class="['tree-tab', { active: activeTree === tree.id }]"
                        @click="activeTree = tree.id">
                    {{ tree.label }}
                    <span class="tree-progress">{{ ownedInTree(tree.id) }}/10</span>
                </button>
            </div>

            <div class="skill-tree-panel">
                <div v-for="tier in [1,2,3,4]" :key="tier" class="tree-tier">
                    <div class="tier-label">TIER {{ tier }}</div>
                    <div class="tier-skills">
                        <div v-for="sk in treeSubSkills(activeTree, tier)" :key="sk.id"
                             :class="['sub-skill', {
                                 owned: sk.owned,
                                 available: canBuy(sk),
                                 locked: !canBuy(sk) && !sk.owned
                             }]"
                             @click="buySubSkill(sk)">
                            <div class="sk-name">{{ sk.name }}</div>
                            <div class="sk-desc">{{ sk.desc }}</div>
                            <div class="sk-cost" v-if="!sk.owned">{{ sk.cost }} SP</div>
                            <div class="sk-owned" v-else>✓ OWNED</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped>
.sp-row { font-size: 11px; color: var(--secondary, #5f5); margin: 4px 0 8px; }
.tree-selector { display: flex; flex-wrap: wrap; gap: 3px; margin-bottom: 10px; }
.tree-tab {
    padding: 3px 7px; font-size: 9px; letter-spacing: 0.06em;
    border: 1px solid var(--border-dim, #444); background: transparent;
    color: var(--text-dim, #888); cursor: pointer; display: flex; gap: 4px; align-items: center;
}
.tree-tab.active { border-color: var(--secondary, #5f5); color: var(--secondary, #5f5); }
.tree-progress { font-size: 8px; color: var(--text-dim2, #666); }
.skill-tree-panel { padding-bottom: 8px; }
.tree-tier { margin-bottom: 10px; }
.tier-label { font-size: 8px; letter-spacing: 0.1em; color: var(--text-dim, #888); margin-bottom: 4px; }
.tier-skills { display: flex; flex-wrap: wrap; gap: 5px; }
.sub-skill {
    border: 1px solid var(--border-dim, #444); padding: 5px 7px; width: 130px;
    cursor: pointer; background: var(--bg2, #111); font-family: var(--font-mono, monospace);
}
.sub-skill.available { border-color: var(--secondary, #5f5); cursor: pointer; }
.sub-skill.owned { border-color: var(--secondary, #5f5); opacity: 0.6; cursor: default; }
.sub-skill.locked { opacity: 0.35; cursor: not-allowed; }
.sk-name { font-size: 10px; font-weight: bold; margin-bottom: 2px; color: var(--text-bright, #eee); }
.sk-desc { font-size: 9px; color: var(--text-dim, #888); margin-bottom: 4px; line-height: 1.3; }
.sk-cost { font-size: 9px; color: var(--secondary, #5f5); }
.sk-owned { font-size: 9px; color: var(--secondary, #5f5); }
</style>
