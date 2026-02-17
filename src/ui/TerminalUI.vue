<script>
import Game from "@/game";
import { RollOver, ItemOut, default as itemPopup } from "@/ui/popups/itemPopup.vue";

export default {
    components: { itemPopup },
    props: ['state'],
    data() {
        return {
            selectedCategory: 'scrapyard'
        };
    },
    methods: {
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
            if (val >= 30) return "IDEALISTA";
            if (val <= -30) return "PRAGMÁTICO";
            return "NEUTRO";
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
            const ICONS = { scrap: '⚙', creds: '¢', energy: '⚡', nano_infra: '◈', ceramite: '◆', nanofiber: '≋' };
            return ICONS[id] || '•';
        }
    },
    computed: {
        resources() {
            // Trigger update when runner changes active task (to update net rates)
            const _ = Game.runner.activeTask;
            return Object.values(this.state.items).filter(i => i.type === 'resource');
        },
        tasks() {
            const allTasks = Object.values(this.state.items).filter(i => i.type === 'task');
            if (this.selectedCategory === 'pilot') {
                return allTasks.filter(t => !t.locked && t.group === 'pilot');
            }
            return allTasks.filter(t => !t.locked && t.group === this.selectedCategory);
        },
        categories() {
            const allTasks = Object.values(this.state.items).filter(i => i.type === 'task');
            const groups = new Set(allTasks.filter(t => !t.locked).map(t => t.group).filter(g => g !== 'pilot'));
            const list = Array.from(groups);
            list.unshift('pilot'); // Put PILOT first
            return list;
        },
        morphology() {
            return Object.values(this.state.items).filter(i => i.type === 'player_stat' && !i.hide);
        },
        skills() {
            return Object.values(this.state.items).filter(i => i.type === 'skill' && !i.locked);
        },
        upgrades() {
            return Object.values(this.state.items).filter(i => 
                (i.type === 'upgrade' || i.type === 'furniture') && 
                !i.locked && 
                (i.owned || 0) < (i.max || 1)
            );
        },
        morality() {
            return this.state.get("morality");
        },
        reputation() {
            return this.state.get("reputation");
        },
        energy() {
            return this.state.get("energy");
        },
        currentHome() {
            return Object.values(this.state.items).find(i => i.type === 'home' && i.owned > 0);
        },
        runner() {
            return Game.runner;
        },
        isCritical() {
            const energy = this.state.get('energy');
            return energy && (energy.val / energy.max) < 0.15;
        }
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
                    {{ cat === 'pilot' ? 'PERFIL' : cat.toUpperCase() }}
                </button>
            </nav>

            <div class="console-body">
                <!-- MISSION/OPERATION AREA -->
                <section v-if="selectedCategory !== 'pilot'">
                    <h3 class="hud-section-title">> OPERAÇÕES: {{ selectedCategory.toUpperCase() }}</h3>
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
                            <div class="hud-card-desc">{{ task.desc }}</div>
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

                    <!-- INFRASTRUCTURE FRAGMENT (Overlapping) -->
                    <div class="infra-fragment" v-if="upgrades.length > 0">
                        <h3 class="hud-section-title">> INFRASTRUCTURE</h3>
                        <div class="hud-task-grid compact">
                            <div v-for="upg in upgrades" :key="upg.id"
                                 class="hud-task-card compact"
                                 @click="tryItem(upg)"
                                 @mouseover="itemOver($event, upg)"
                                 @mouseleave="itemOut">
                                <div class="flex-between">
                                    <span class="hud-card-header">{{ upg.name.toUpperCase() }}</span>
                                    <span class="owned-tag">{{ upg.owned || 0 }}/{{ upg.max }}</span>
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
                            <div v-for="stat in morphology" :key="stat.id" class="hud-stat-widget">
                                <div class="stat-meta">
                                    <span :style="{ color: stat.color }">{{ stat.icon }} {{ stat.name.toUpperCase() }}</span>
                                    <span>{{ Math.floor(stat.val) }}</span>
                                </div>
                                <div class="hud-bar-bg">
                                    <div class="hud-bar-fill" :style="{ width: (stat.val / (stat.max || 100) * 100) + '%', backgroundColor: stat.color }"></div>
                                </div>
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
    </div>
</template>

<style scoped>
@import "@/../css/mecha_terminal.css";

/* ── HUD GRID SYSTEM ──────────────────────── */
.hud-grid {
    display: grid;
    grid-template-columns: 240px 1fr;
    grid-template-rows: auto 1fr auto;
    grid-template-areas: 
        "head head"
        "res main"
        "foot foot";
    gap: 10px;
    height: 100vh;
    padding: 10px;
    background: var(--bg-deep);
}

.hud-panel {
    background: rgba(13, 17, 23, 0.8);
    border: 1px solid var(--border-dim);
    position: relative;
    padding: 15px;
}

.top-span { grid-area: head; border-left: 4px solid var(--primary); }
.side-panel { grid-area: res; border-right: 0; clip-path: polygon(0 0, 100% 0, 95% 100%, 0 100%); width: 260px; }
.main-panel { grid-area: main; border-left: 1px solid var(--border-dim); }
.bottom-span { grid-area: foot; display: flex; justify-content: space-between; font-size: 12px; color: var(--secondary); padding: 10px 15px; }

/* ── RESOURCE WIDGETS ─────────────────────── */
.hud-resource-btn {
    display: flex;
    gap: 10px;
    padding: 8px;
    margin-bottom: 5px;
    border-bottom: 1px solid rgba(0, 143, 17, 0.1);
    cursor: help;
}

.res-icon { font-size: 20px; color: var(--res-color); text-shadow: 0 0 5px var(--res-color); }
.res-info { flex: 1; font-size: 12px; }

.hud-mini-bar { height: 2px; background: #000; margin-top: 3px; }
.hud-mini-fill { height: 100%; transition: width 0.3s; }

.hud-ascii-bar {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 1px;
    margin-top: 5px;
    white-space: pre;
}

.hud-label { 
    font-size: 11px; 
    color: var(--secondary); 
    letter-spacing: 2px; 
    margin-bottom: 12px;
    border-bottom: 1px solid var(--border-dim);
}

/* ── TAB NAVIGATION ────────────────────────── */
.terminal-category-tabs {
    display: flex;
    gap: 5px;
    margin-bottom: 20px;
}

.hud-tab-btn {
    background: rgba(0, 143, 17, 0.05);
    border: 1px solid var(--border-dim);
    color: var(--text-dim);
    padding: 10px 18px;
    font-family: var(--font-mono);
    cursor: pointer;
    transition: all 0.2s;
    text-transform: uppercase;
    font-weight: bold;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.hud-tab-btn.active {
    background: rgba(0, 255, 65, 0.1);
    color: var(--primary);
    border-color: var(--primary);
    box-shadow: 0 0 10px rgba(0, 255, 65, 0.1);
}

.tab-indicator {
    width: 6px;
    height: 6px;
    border: 1px solid var(--text-dim);
}

.hud-tab-btn.active .tab-indicator {
    background: var(--primary);
    border-color: var(--primary);
    box-shadow: 0 0 5px var(--primary);
}

/* ── TASK CARDS (FRAGMENTED) ───────────────── */
.hud-task-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 15px;
}

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
    font-size: 13px;
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
    animation: blink 1s infinite;
}

@keyframes blink { 50% { opacity: 0.3; } }

.hud-card-desc {
    font-size: 11px;
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
    font-size: 12px;
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
    padding: 8px;
    font-family: var(--font-mono);
    cursor: pointer;
    font-size: 13px;
}

.hud-btn-cta:hover {
    background: var(--cta);
    color: #fff;
}

/* ── PILOT CONSOLE DECKS ────────────────────── */
.pilot-console { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.pilot-console > div { 
    background: rgba(0, 143, 17, 0.03); 
    border: 1px solid rgba(0, 143, 17, 0.1); 
    padding: 15px; 
}

.hud-stat-widget { margin-bottom: 10px; }
.stat-meta { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px; }
.hud-bar-bg { height: 2px; background: #000; }
.hud-bar-fill { height: 100%; box-shadow: 0 0 5px currentColor; }

.hud-skill-item {
    font-size: 13px;
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

.blink { animation: blink 1s infinite; }

/* ── RATE INDICATORS ──────────────────────── */
.res-values {
    display: flex;
    align-items: center;
    gap: 8px;
}

.res-delta {
    font-size: 11px;
    font-weight: bold;
    opacity: 0.8;
}

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
    font-size: 11px;
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
    font-size: 12px;
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
</style>
