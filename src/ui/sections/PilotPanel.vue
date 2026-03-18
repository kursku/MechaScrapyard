<script>
/**
 * PilotPanel.vue — Profile tab with 3 sub-views
 * OVERVIEW: Stats grid, alignment badge, neural skills
 * TRAINING: Training tasks grouped by stat category
 * SKILL TREE: Full-width skill tree
 */
import Game from "@/game";
import { RollOver, ItemOut } from "../../ui/popups/itemPopup.vue";
import { renderBar } from "../uiHelpers";

export default {
    props: {
        state: { type: Object, required: true },
        tasks: { type: Array, required: true },
        activeView: { type: String, default: 'pilot_overview' },
    },
    data() {
        return {
            renderTick: 0,
            activeTree: 'combat',
            skillsCollapsed: false,
            gloryPurchaseError: false,
            cycleLogCollapsed: true,
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
        gloryPool() {
            this.renderTick;
            return Math.floor(this.state.items['glory_pool']?.val || 0);
        },
        prestigeCount() {
            this.renderTick;
            return this.state.items['prestige_count']?.val || 0;
        },
        alignment() {
            this.renderTick;
            return this.state.items['alignment']?.val || 'pragmatist';
        },
        alignmentLabel() {
            const labels = { paragon: '◈ PARAGON', shadow: '◈ SHADOW', pragmatist: '◈ PRAGMATIST' };
            return labels[this.alignment] || '◈ PRAGMATIST';
        },
        alignmentColor() {
            if (this.alignment === 'paragon') return '#4af';
            if (this.alignment === 'shadow') return '#f55';
            return '#fa0';
        },
        cycleLog() {
            const history = this.state.prestige?.alignmentHistory || [];
            return [...history].reverse();
        },
        showGloryShop() {
            return this.gloryPool >= 50 || this.prestigeCount > 0;
        },
        gloryShopItems() {
            return Game.getGloryShopItems?.() || [];
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
        streetCred() {
            this.renderTick;
            return this.state.items['street_cred']?.val || 0;
        },
        credTier() {
            const c = this.streetCred;
            if (c >= 80) return 'LEGEND';
            if (c >= 60) return 'KNOWN';
            if (c >= 40) return 'RELIABLE';
            if (c >= 20) return 'BUILDING';
            if (c >= 0)  return 'UNKNOWN';
            return 'BURNED';
        },
        credColor() {
            if (this.streetCred >= 60) return '#4f4';
            if (this.streetCred >= 20) return '#fa0';
            if (this.streetCred < 0)   return '#f44';
            return '#888';
        },
        hasPhase4Stats() {
            return this.state.items['grandpa_trust'] ||
                   this.state.items['intel_tokens'] ||
                   this.state.items['rep_refugee'];
        },
        // Group training tasks by category
        trainingGroups() {
            const groups = {
                physical: { label: 'PHYSICAL', tasks: [] },
                technical: { label: 'TECHNICAL', tasks: [] },
                social: { label: 'SOCIAL', tasks: [] },
                other: { label: 'OTHER', tasks: [] },
            };
            for (const task of this.tasks) {
                const name = (task.name || '').toLowerCase();
                if (name.includes('lifting') || name.includes('endure') || name.includes('grit')) {
                    groups.physical.tasks.push(task);
                } else if (name.includes('repair') || name.includes('circuit') || name.includes('drone')) {
                    groups.technical.tasks.push(task);
                } else if (name.includes('intel') || name.includes('charisma') || name.includes('social')) {
                    groups.social.tasks.push(task);
                } else {
                    groups.other.tasks.push(task);
                }
            }
            return Object.values(groups).filter(g => g.tasks.length > 0);
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
        skillState(sk) {
            if (sk.owned) return 'owned';
            if (sk.require && !Game.evalRequire(sk.require)) return 'locked';
            if (this.skillPoints < sk.cost) return 'unaffordable';
            return 'available';
        },
        buySubSkill(sk) {
            Game.buySubSkill(sk.id);
            this.renderTick++;
        },
        buyGloryItem(itemId) {
            const result = Game.buyGloryShopItem(itemId);
            if (result === false) {
                this.gloryPurchaseError = true;
                setTimeout(() => { this.gloryPurchaseError = false; }, 1200);
            }
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
        getStatEffect(task) {
            if (!task.effect) return '';
            const keys = Object.keys(task.effect);
            if (keys.length === 0) return '';
            const statName = keys[0].replace(/_/g, ' ').toUpperCase();
            const val = task.effect[keys[0]];
            return `→ ${statName} +${val}`;
        },
    }
};
</script>

<template>
    <section class="pilot-console">
        <!-- ═══════════ OVERVIEW ═══════════ -->
        <div v-if="activeView === 'pilot_overview'">
            <h3 class="hud-section-title">> PILOT MORPHOLOGY</h3>
            
            <!-- Stats Grid: 4-across compact cards -->
            <div class="pilot-stats-compact">
                <div v-for="stat in morphology" :key="stat.id" 
                     class="stat-card"
                     :style="{ '--stat-color': stat.color || 'var(--primary)' }"
                     @mouseover="itemOver($event, stat)"
                     @mouseleave="itemOut">
                    <div class="stat-card-icon">{{ stat.icon || '●' }}</div>
                    <div class="stat-card-name">{{ stat.name.toUpperCase() }}</div>
                    <div class="stat-card-row">
                        <span class="stat-card-val">{{ Math.floor(stat.val) }}</span>
                        <span class="stat-card-tier" :style="{ color: stat.color }">{{ statTier(stat.val) }}</span>
                    </div>
                    <div class="stat-card-bar">
                        <div class="stat-card-fill" :style="{ 
                            width: (stat.val / (stat.max || 100) * 100) + '%',
                            backgroundColor: stat.color 
                        }"></div>
                    </div>
                </div>
            </div>

            <!-- Alignment Badge + Glory Pool Row -->
            <div class="identity-row">
                <div v-if="moralRes" class="morality-compact">
                    <span class="morality-label" :style="{ color: moralColor }">⚖ MORAL COMPASS</span>
                    <span class="morality-value" :style="{ color: moralColor }">{{ moralLabel }} ({{ moralValue }})</span>
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
                <div class="identity-badges">
                    <div class="alignment-badge" :style="{ color: alignmentColor, borderColor: alignmentColor }">
                        {{ alignmentLabel }}
                    </div>
                    <div v-if="gloryPool > 0" class="glory-pool-hud" :class="{ 'gp-error': gloryPurchaseError }">
                        ◈ {{ gloryPool }} GP
                    </div>
                    <div v-if="state.items['street_cred']" class="cred-compact">
                        <span :style="{ color: credColor }">◇ STREET CRED: {{ streetCred > 0 ? '+' : '' }}{{ streetCred }} — {{ credTier }}</span>
                    </div>
                    <div v-if="streetCred < 0" class="cred-burned-notice">
                        ⚠ BURNED — vendors charge +10%, contacts build slower
                    </div>
                </div>
            </div>

            <!-- Neural Skills — collapsible -->
            <div class="neural-section">
                <button type="button" class="section-toggle"
                        :aria-expanded="!skillsCollapsed"
                        aria-controls="neural-grid-content"
                        @click="skillsCollapsed = !skillsCollapsed">
                    <span class="hud-section-title" style="margin:0">> NEURAL SKILLS</span>
                    <span class="toggle-chevron" :class="{ open: !skillsCollapsed }">▶</span>
                    <span class="section-count">{{ skills.length }}</span>
                </button>
                <div v-if="!skillsCollapsed" id="neural-grid-content" class="neural-grid">
                    <div v-for="skill in skills" :key="skill.id"
                         class="neural-badge"
                         @mouseover="itemOver($event, skill)"
                         @mouseleave="itemOut">
                        <span class="neural-icon">{{ skill.icon || '●' }}</span>
                        <span class="neural-name">{{ skill.name }}</span>
                        <span class="neural-lvl">LVL {{ Math.floor(skill.val) }}/{{ skill.max || 20 }}</span>
                    </div>
                </div>
            </div>
            <!-- Phase 4 Story Stats -->
            <div v-if="hasPhase4Stats" class="intel-deck">
                <div class="hud-section-title" style="margin-top:10px;font-size:var(--font-size-xxs);opacity:0.5;">&gt; PHASE 4 INTEL</div>
                <div class="intel-row" v-if="state.items['grandpa_trust']">
                    <span class="intel-label">GRANDPA TRUST</span>
                    <span class="intel-val">{{ Math.floor(state.g.grandpa_trust || 0) }}</span>
                </div>
                <div class="intel-row" v-if="state.items['intel_tokens']">
                    <span class="intel-label">INTEL TOKENS</span>
                    <span class="intel-val">{{ Math.floor(state.g.intel_tokens || 0) }}</span>
                </div>
                <div class="intel-row" v-if="state.items['rep_refugee']">
                    <span class="intel-label">REFUGEE REP</span>
                    <span class="intel-val">{{ Math.floor(state.g.rep_refugee || 0) }}</span>
                </div>
            </div>

            <!-- Cycle Log — only visible after first prestige -->
            <div v-if="cycleLog.length > 0" class="cycle-log-section">
                <button type="button" class="section-toggle"
                        :aria-expanded="!cycleLogCollapsed"
                        aria-controls="cycle-log-content"
                        @click="cycleLogCollapsed = !cycleLogCollapsed">
                    <span class="hud-section-title" style="margin:0">> CYCLE LOG</span>
                    <span class="toggle-chevron" :class="{ open: !cycleLogCollapsed }">▶</span>
                    <span class="section-count">{{ cycleLog.length }}</span>
                </button>
                <div v-if="!cycleLogCollapsed" id="cycle-log-content" class="cycle-log">
                    <div v-for="entry in cycleLog" :key="entry.cycle" class="cycle-entry">
                        <span class="cycle-num">CYCLE {{ entry.cycle + 1 }}</span>
                        <span class="cycle-align"
                              :class="{
                                'align-paragon': entry.alignment === 'Paragon' || entry.alignment === 'PARAGON',
                                'align-shadow':  entry.alignment === 'Shadow'  || entry.alignment === 'SHADOW',
                              }">
                            {{ entry.alignment.toUpperCase() }}
                        </span>
                        <span class="cycle-glory">★ {{ entry.glory }} GP</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- ═══════════ TRAINING ═══════════ -->
        <div v-else-if="activeView === 'pilot_training'">
            <h3 class="hud-section-title">> RE-PROGRAMMING / TRAINING</h3>
            
            <div v-for="group in trainingGroups" :key="group.label" class="training-group">
                <div class="training-group-label">── {{ group.label }} ──</div>
                <div class="training-rows">
                    <button type="button"
                            v-for="task in group.tasks" :key="task.id"
                            :class="['training-row', { running: isRunning(task) }]"
                            @click="tryItem(task)"
                            @mouseover="itemOver($event, task)"
                            @mouseleave="itemOut">
                        <span class="training-name">{{ task.name.toUpperCase() }}</span>
                        <span class="training-effect">{{ getStatEffect(task) }}</span>
                        <div class="training-progress">
                            <span class="hud-ascii-bar" style="color: var(--secondary)">
                                {{ renderBar(getPercent(task), 100, 10) }}
                            </span>
                            <span v-if="isRunning(task)" class="training-timer">
                                ⏱ {{ getTaskTimeRemaining(task) }}s
                            </span>
                        </div>
                        <span v-if="isRunning(task)" class="training-action abort">[ ABORT ]</span>
                        <span v-else class="training-action">[ INITIATE ]</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- ═══════════ SKILL TREE ═══════════ -->
        <div v-else-if="activeView === 'pilot_skills'">
            <h3 class="hud-section-title">> SKILL TREE</h3>
            <div class="sp-row">★ <strong>{{ skillPoints }}</strong> Skill Points available</div>

            <div class="tree-selector">
                <button v-for="tree in skillTrees" :key="tree.id"
                        :class="['tree-tab', { active: activeTree === tree.id }]"
                        @click="activeTree = tree.id">
                    {{ tree.label }}
                    <span class="tree-progress">{{ ownedInTree(tree.id) }}/10</span>
                </button>
            </div>

            <div class="skill-tree-panel-wide">
                <div v-for="tier in [1,2,3,4]" :key="tier" class="tree-tier">
                    <div class="tier-label">TIER {{ tier }}</div>
                    <div class="tier-skills-wide">
                        <button type="button"
                                v-for="sk in treeSubSkills(activeTree, tier)" :key="sk.id"
                                :class="['sub-skill-wide', skillState(sk)]"
                                :disabled="sk.owned || skillState(sk) === 'locked'"
                                @click="buySubSkill(sk)">
                            <div class="sk-name">{{ sk.name }}</div>
                            <div class="sk-desc">{{ sk.desc }}</div>
                            <div class="sk-owned" v-if="sk.owned">&#x2713; OWNED</div>
                            <div class="sk-locked-label" v-else-if="skillState(sk) === 'locked'">[LOCKED]</div>
                            <div class="sk-cost" v-else :class="{ 'sk-cost-unaffordable': skillState(sk) === 'unaffordable' }">{{ sk.cost }} SP</div>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Glory Shop -->
            <div v-if="showGloryShop" class="glory-shop-deck">
                <h3 class="hud-section-title">> GLORY SHOP</h3>
                <div class="glory-pool-balance">&#x25C8; Glory Pool: <strong>{{ gloryPool }}</strong></div>
                <div class="glory-shop-grid">
                    <div v-for="item in gloryShopItems" :key="item.id" class="glory-item">
                        <div class="glory-item-name">{{ item.name }}</div>
                        <div class="glory-item-desc">{{ item.desc }}</div>
                        <div class="glory-item-owned" v-if="item.max > 1">{{ item.owned }}/{{ item.max }}</div>
                        <button class="glory-buy-btn"
                                :disabled="item.owned >= item.max || gloryPool < item.cost_glory_pool"
                                @click="buyGloryItem(item.id)">
                            {{ item.owned >= item.max ? 'OWNED' : item.cost_glory_pool + ' &#x25C8;' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped>
/* ═══════════ STATS GRID ═══════════ */
.pilot-stats-compact {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin-bottom: 16px;
}
.stat-card {
    background: var(--success-bg);
    border: 1px solid var(--success-border);
    padding: 10px;
    font-family: var(--font-mono);
    cursor: default;
    transition: all 0.2s ease-out;
}
.stat-card:hover {
    background: var(--success-bg-hover);
    border-color: var(--stat-color, var(--primary));
    box-shadow: var(--success-glow);
}
.stat-card-icon {
    font-size: var(--font-size-lg);
    margin-bottom: 4px;
}
.stat-card-name {
    font-size: var(--font-size-xxs);
    color: var(--stat-color, var(--primary));
    font-weight: bold;
    letter-spacing: 1px;
    margin-bottom: 4px;
}
.stat-card-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 4px;
}
.stat-card-val {
    font-size: var(--font-size-base);
    font-weight: bold;
    color: var(--text);
}
.stat-card-tier {
    font-size: var(--font-size-xxs);
    font-weight: bold;
    letter-spacing: 0.5px;
}
.stat-card-bar {
    height: 3px;
    background: var(--bar-bg);
    border: 1px solid var(--bar-border);
    position: relative;
}
.stat-card-bar::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    width: 2px;
    height: 100%;
    background: rgba(255, 255, 255, 0.2);
}
.stat-card-fill {
    height: 100%;
    transition: width 0.3s ease;
    box-shadow: 0 0 4px var(--stat-color, var(--primary));
    min-width: 0;
}

/* ═══════════ IDENTITY ROW ═══════════ */
.identity-row {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
    padding: 10px;
    border: 1px solid var(--border-dim);
    background: rgba(0, 0, 0, 0.2);
}
.morality-compact {
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    flex-wrap: wrap;
}
.morality-label {
    font-size: var(--font-size-xxs);
    font-weight: bold;
    font-family: var(--font-mono);
}
.morality-value {
    font-size: var(--font-size-xxs);
    font-family: var(--font-mono);
}
.morality-track {
    height: 6px;
    background: linear-gradient(90deg, #f55 0%, #fa0 50%, #4af 100%);
    opacity: 0.2;
    margin-top: 8px;
    position: relative;
}
.morality-fill {
    height: 100%;
    position: absolute;
    left: 0;
    top: 0;
    opacity: 1;
    box-shadow: 0 0 6px rgba(255, 255, 255, 0.15);
}
.morality-center {
    position: absolute;
    left: 50%;
    top: -2px;
    width: 2px;
    height: 10px;
    background: #fa0;
}
.morality-axis {
    display: flex;
    justify-content: space-between;
    font-size: var(--font-size-xxs);
    font-family: var(--font-mono);
    margin-top: 2px;
    opacity: 0.7;
}
.identity-badges {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 180px;
}
.alignment-badge {
    font-size: var(--font-size-xxs); font-weight: bold; letter-spacing: 0.1em;
    border: 1px solid; padding: 4px 8px; font-family: var(--font-mono);
}
.glory-pool-hud {
    font-size: var(--font-size-xxs); color: var(--glory); font-family: var(--font-mono); font-weight: bold;
    padding: 4px 8px; border: 1px solid var(--glory-border); background: var(--glory-bg);
}
.glory-pool-hud.gp-error {
    color: #f44 !important;
    animation: gp-flash 0.3s ease-in-out 2;
}
@keyframes gp-flash {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
}
@media (prefers-reduced-motion: reduce) {
    .glory-pool-hud.gp-error { animation: none; }
}
.cred-compact {
    font-size: var(--font-size-xxs); font-family: var(--font-mono);
    padding: 4px 8px; border: 1px solid rgba(255,255,255,0.1);
}
.cred-burned-notice {
    font-size: var(--font-size-xxs);
    font-family: var(--font-mono);
    color: #f44;
    letter-spacing: 0.06em;
    margin-top: 4px;
    padding: 2px 8px;
    opacity: 0.85;
}

/* ═══════════ PHASE 4 INTEL ═══════════ */
.intel-deck { margin-top: 6px; }
.intel-row {
    display: flex;
    justify-content: space-between;
    font-size: var(--font-size-xxs);
    font-family: var(--font-mono);
    color: var(--text-dim);
    letter-spacing: 0.06em;
    padding: 2px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}
.intel-label { opacity: 0.6; }
.intel-val { color: var(--primary); }

/* ═══════════ NEURAL SKILLS ═══════════ */
.neural-section {
    margin-bottom: 16px;
}
.section-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    user-select: none;
    /* button resets */
    background: transparent;
    border: none;
    padding: 0;
    color: inherit;
    width: 100%;
    text-align: left;
}
.toggle-chevron {
    font-size: var(--font-size-micro);
    color: var(--text-dim);
    display: inline-block;
    transition: transform 0.25s ease-out;
}
.toggle-chevron.open {
    transform: rotate(90deg);
}
.section-count {
    margin-left: auto;
    color: var(--text-dim);
    opacity: 0.5;
    font-size: var(--font-size-xxs);
}
.neural-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 4px;
    margin-top: 8px;
    animation: slideDown 0.2s ease;
}
.neural-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 8px;
    border: 1px solid var(--success-border);
    background: var(--success-bg);
    font-family: var(--font-mono);
    font-size: var(--font-size-xxs);
    cursor: default;
    transition: all 0.2s ease-out;
}
.neural-badge:hover {
    background: var(--success-bg-hover);
    border-color: var(--primary);
    box-shadow: var(--success-glow);
}
.neural-icon { font-size: var(--font-size-sm); }
.neural-name { color: var(--text); }
.neural-lvl { margin-left: auto; color: var(--secondary); font-weight: bold; }

/* ═══════════ TRAINING ═══════════ */
.training-group {
    margin-bottom: 16px;
}
.training-group-label {
    font-size: var(--font-size-xxs);
    color: var(--text-dim);
    font-family: var(--font-mono);
    letter-spacing: 1.5px;
    margin-bottom: 6px;
}
.training-rows {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
}
.training-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border: 1px solid var(--border-dim);
    background: var(--success-bg);
    cursor: pointer;
    font-family: var(--font-mono);
    transition: all 0.2s ease-out;
    /* button resets */
    color: inherit;
    text-align: left;
    width: 100%;
}
.training-row:hover {
    background: var(--success-bg-hover);
    border-color: var(--primary);
    box-shadow: var(--success-glow);
}
.training-row.running {
    border-color: var(--secondary);
    background: var(--success-bg-hover);
    box-shadow: inset 3px 0 0 var(--secondary), var(--success-glow);
}
.training-name {
    font-size: var(--font-size-xs);
    font-weight: bold;
    color: var(--text);
}
.training-effect {
    font-size: var(--font-size-xxs);
    color: var(--secondary);
}
.training-progress {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
}
.training-timer {
    font-size: var(--font-size-xxs);
    color: var(--secondary);
    font-weight: bold;
}
.training-action {
    font-size: var(--font-size-xxs);
    font-weight: bold;
    color: var(--text-dim);
    margin-left: auto;
}
.training-action.abort {
    color: var(--color-danger);
}

/* ═══════════ SKILL TREE (WIDE) ═══════════ */
.sp-row { font-size: var(--font-size-xs); color: var(--secondary); margin: 4px 0 10px; }
.tree-selector { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 12px; }
.tree-tab {
    padding: 5px 10px; min-height: 44px; font-size: var(--font-size-xxs); letter-spacing: 0.06em;
    border: 1px solid var(--border-dim); background: transparent;
    color: var(--text-dim); cursor: pointer; display: flex; gap: 4px; align-items: center;
}
.tree-tab.active { border-color: var(--secondary); color: var(--secondary); }
.tree-progress { font-size: var(--font-size-xxs); color: var(--text-faint); }
.skill-tree-panel-wide { padding-bottom: 8px; }
.tree-tier { margin-bottom: 14px; }
.tier-label { font-size: var(--font-size-xxs); letter-spacing: 0.1em; color: var(--text-dim); margin-bottom: 6px; }
.tier-skills-wide { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.sub-skill-wide {
    border: 1px solid var(--border-dim); padding: 10px 12px;
    cursor: pointer; background: var(--bg-panel); font-family: var(--font-mono);
    transition: all 0.15s;
    /* button resets */
    color: inherit;
    text-align: left;
    width: 100%;
}
.sub-skill-wide.available { border-color: var(--primary); cursor: pointer; }
.sub-skill-wide.available:hover { background: rgba(255, 176, 0, 0.08); box-shadow: 0 0 10px rgba(255, 176, 0, 0.08); }
.sub-skill-wide.owned { border-color: var(--color-success); opacity: 0.55; cursor: default; }
.sub-skill-wide.unaffordable { opacity: 0.6; cursor: not-allowed; }
.sub-skill-wide.locked { opacity: 0.25; cursor: not-allowed; filter: grayscale(0.4); }
.sk-name { font-size: var(--font-size-xs); font-weight: bold; margin-bottom: 4px; color: var(--text); }
.sk-desc { font-size: var(--font-size-xxs); color: var(--text-dim); margin-bottom: 6px; line-height: 1.4; }
.sk-cost { font-size: var(--font-size-xxs); color: var(--primary); }
.sk-cost-unaffordable { color: #e66 !important; }
.sk-owned { font-size: var(--font-size-xxs); color: var(--color-success); }
.sk-locked-label { font-size: var(--font-size-xxs); color: var(--text-faint); letter-spacing: 1px; }

/* ═══════════ GLORY SHOP ═══════════ */
.glory-shop-deck { margin-top: 20px; }
.glory-pool-balance { font-size: var(--font-size-xs); color: var(--glory); margin: 4px 0 10px; font-family: var(--font-mono); }
.glory-shop-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; }
.glory-item {
    border: 1px solid var(--glory-border); background: var(--glory-bg); padding: 10px 12px;
    font-family: var(--font-mono);
}
.glory-item-name { font-size: var(--font-size-xs); font-weight: bold; color: var(--glory); margin-bottom: 4px; }
.glory-item-desc { font-size: var(--font-size-xxs); color: var(--text-dim); margin-bottom: 6px; line-height: 1.4; }
.glory-item-owned { font-size: var(--font-size-xxs); color: var(--text-faint); margin-bottom: 4px; }
.glory-buy-btn {
    font-size: var(--font-size-xxs); padding: 4px 10px; min-height: 44px; cursor: pointer;
    border: 1px solid var(--glory); background: transparent; color: var(--glory);
    font-family: var(--font-mono); letter-spacing: 0.05em;
}
.glory-buy-btn:disabled { border-color: var(--disabled); color: var(--text-faint); cursor: not-allowed; }

/* ═══════════ ANIMATION ═══════════ */
@keyframes slideDown {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
}

/* ═══════════ CYCLE LOG ═══════════ */
.cycle-log-section { margin-top: 14px; }

.cycle-log {
    margin-top: 4px;
    animation: slideDown 0.2s ease;
}

.cycle-entry {
    display: flex;
    align-items: baseline;
    gap: 10px;
    padding: 4px 0;
    border-bottom: 1px solid var(--border-dim);
    font-family: var(--font-mono);
    font-size: var(--font-size-xxs);
    color: var(--text-dim);
}

.cycle-num {
    color: var(--text-faint);
    min-width: 60px;
    letter-spacing: 0.5px;
}

.cycle-align {
    flex: 1;
    letter-spacing: 1px;
    font-weight: bold;
}
.cycle-align.align-paragon { color: #4af; }
.cycle-align.align-shadow  { color: #f55; }

.cycle-glory {
    color: var(--glory);
    letter-spacing: 0.5px;
}

/* ── Reduced motion — P6 ─────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
    .neural-grid { animation: none; }
    .cycle-log { animation: none; }
    .toggle-chevron { transition: none; }
}
</style>
