<template>
    <div v-if="isMecha">
        <HudOverlay />
        <TerminalUI :state="game.state" />
    </div>
    <div v-else class="game">
        <!-- Header -->
        <div class="header">
            <span class="header__title">◆ MECHA SCRAPYARD</span>
            <div style="display:flex;gap:12px;align-items:center">
                <span class="header__meta">NEW TOKYO • SCRAPYARD DISTRICT</span>
                <span class="header__version">v{{ version }}</span>
            </div>
        </div>

        <!-- Resource Bar -->
        <div class="resource-bar">
            <div v-for="r in visibleResources" :key="r.id" class="resource-chip"
                 :class="{ 'resource-chip--warning': pct(r.val, r.max) > 90 }"
                 :title="r.desc">
                <span :style="{ color: groupColor(r.group), width: '80px', display: 'inline-block' }" class="resource-chip__name">
                    {{ resourceIcon(r.id) }} {{ r.name }}
                </span>
                <span class="ascii-bar ascii-bar--thin" :style="{ color: pct(r.val, r.max) > 0.15 ? groupColor(r.group) : '#333' }">
                    {{ asciiBar(r.val, r.max, 10) }}
                </span>
                <span class="resource-chip__value">
                    {{ fmt(r.val) }}/{{ fmt(r.max) }}
                </span>
                <span v-if="r.rate !== 0" :style="{ color: r.rate > 0 ? '#3a7' : '#a44' }" class="resource-chip__rate">
                    {{ r.rate > 0 ? '▲' : '▼' }}{{ fmt(Math.abs(r.rate)) }}/s
                </span>
            </div>
        </div>

        <!-- Main layout -->
        <div class="layout">
            <!-- Left: tabs + content -->
            <div class="layout__left">
                <!-- Tab bar -->
                <div class="tabs">
                    <button v-for="t in visibleTabs" :key="t.id"
                            class="tab" :class="{ 'tab--active': tab === t.id }"
                            @click="tab = t.id">
                        {{ t.icon }} {{ t.name }}
                    </button>
                </div>

                <!-- Content -->
                <div class="content">

                    <!-- SCRAPYARD TAB -->
                    <template v-if="tab === 'scrapyard'">
                        <!-- Active task panel -->
                        <div v-if="runner.activeTask" class="active-task">
                            <div class="flex-between" style="margin-bottom:4px">
                                <span class="active-task__name">▶ {{ runner.activeTask.name }}</span>
                                <button class="btn btn--stop" @click="stopTask">■ STOP</button>
                            </div>
                            <div v-if="!runner.activeTask.perpetual && runner.activeTask.length" style="margin-bottom:3px">
                                <div class="flex-center gap-6">
                                    <div class="progress-bar" style="flex:1">
                                        <div class="progress-bar__fill progress-bar__fill--task"
                                             :style="{ width: pct(runner.taskProgress, runner.activeTask.length) + '%' }"></div>
                                    </div>
                                    <span class="active-task__timer">
                                        {{ Math.ceil(runner.activeTask.length - runner.taskProgress) }}s
                                    </span>
                                </div>
                            </div>
                        </div>

                        <!-- Task groups -->
                        <div v-for="grp in taskGroups" :key="grp.id">
                            <div class="section-header">── {{ grp.label }} ──</div>

                            <ListCard
                                v-for="t in grp.items"
                                :key="t.id"
                                :lead="runner.activeTask === t ? '▶' : '►'"
                                :name="t.name"
                                :desc="t.desc"
                                :flavor="t.flavor"
                                :cost="t.cost"
                                :canAffordOne="canAffordOne"
                                :resourceIcon="resourceIcon"
                                :fmt="fmt"
                                :active="runner.activeTask === t"
                                :disabled="!!runner.activeTask && runner.activeTask !== t"
                                :unaffordable="!runner.activeTask && !canStartTask(t)"
                                @click="startTask(t)"
                            >
                                <template #badges>
                                    <span v-if="t.perpetual" class="badge badge--idle">IDLE</span>
                                    <span v-if="t.loot" class="badge badge--loot">✦</span>
                                </template>

                                <template #meta>
                                    <span v-if="t.length" class="badge badge--timed">{{ fmt(t.length) }}s</span>
                                </template>
                            </ListCard>
                        </div>
                    </template>

                    <!-- UPGRADES TAB -->
                    <template v-if="tab === 'upgrades'">
                        <div class="section-header">── AVAILABLE ──</div>
                        <div v-if="availableUpgrades.length === 0" class="empty-state">
                            No upgrades available. Keep progressing.
                        </div>

                        <ListCard
                            v-for="u in availableUpgrades"
                            :key="u.id"
                            lead="★"
                            :name="u.name"
                            :desc="u.desc"
                            :flavor="u.flavor"
                            :cost="scaledCost(u)"
                            :canAffordOne="canAffordOne"
                            :resourceIcon="resourceIcon"
                            :fmt="fmt"
                            :unaffordable="!canAffordUpgrade(u)"
                            @click="buyUpgrade(u.id)"
                        >
                            <template #meta>
                                <span v-if="u.max > 1" style="color:#94a3b8">[{{ u.owned }}/{{ u.max }}]</span>
                            </template>
                        </ListCard>

                        <!-- Built -->
                        <template v-if="builtUpgrades.length > 0">
                            <div class="section-header" style="margin-top:14px">── CONSTRUCTED ──</div>
                            <div v-for="u in builtUpgrades" :key="u.id" class="built-item">
                                ✓ {{ u.name }} {{ u.max > 1 ? `×${u.owned}` : '' }}
                            </div>
                        </template>
                    </template>

                    <!-- REFINERY TAB -->
                    <template v-if="tab === 'refinery'">
                        <!-- Active recipe -->
                        <div v-if="runner.activeRecipe" class="active-recipe">
                            <div class="active-recipe__name">
                                ◈ {{ runner.activeRecipe.name.replace('Refine: ', '') }}
                            </div>
                            <div class="flex-center gap-6">
                                <div class="progress-bar" style="flex:1;border-color:#3a1a2a">
                                    <div class="progress-bar__fill progress-bar__fill--recipe"
                                         :style="{ width: pct(runner.recipeProgress, runner.activeRecipe.length) + '%' }"></div>
                                </div>
                                <span class="active-recipe__timer">
                                    {{ Math.ceil(runner.activeRecipe.length - runner.recipeProgress) }}s
                                </span>
                            </div>
                        </div>
                        <div class="section-header">── RECIPES ──</div>
                        <div v-if="recipes.length === 0" class="empty-state">
                            No recipes unlocked. Acquire Blueprints at the MARKET.
                        </div>

                        <ListCard
                            v-for="r in recipes"
                            :key="r.id"
                            lead="◈"
                            :name="r.name"
                            :desc="r.desc"
                            :flavor="r.flavor"
                            :cost="r.cost"
                            :canAffordOne="canAffordOne"
                            :resourceIcon="resourceIcon"
                            :fmt="fmt"
                            :disabled="!!runner.activeRecipe"
                            :unaffordable="!canAffordTask(r)"
                            @click="startRecipe(r)"
                        >
                            <template #meta>
                                <span class="badge badge--timed">{{ fmt(r.length) }}s</span>
                            </template>

                            <template #bottom>
                                <div class="list-subrow">
                                    <span style="color:#6a4">→</span>
                                    <span v-for="(v, k) in r.result" :key="k" class="list-subrow__item">
                                        {{ resourceIcon(k) }}+{{ fmt(v) }}
                                    </span>
                                </div>
                            </template>
                        </ListCard>
                    </template>

                    <!-- MARKET TAB -->
                    <template v-if="tab === 'market'">
                        <div class="section-header">── BLUEPRINTS FOR SALE ──</div>
                        <div v-if="bpForSale.length === 0 && bpOwned.length === 0" class="empty-state">
                            Build the Refinery to unlock the blueprint market.
                        </div>

                        <ListCard
                            v-for="b in bpForSale"
                            :key="b.id"
                            lead="✦"
                            :name="b.name"
                            :desc="b.desc"
                            :flavor="b.flavor"
                            :cost="b.cost"
                            :canAffordOne="canAffordOne"
                            :resourceIcon="resourceIcon"
                            :fmt="fmt"
                            :unaffordable="!canAffordTask(b)"
                            @click="buyBlueprint(b.id)"
                        />

                        <template v-if="bpOwned.length > 0">
                            <div class="section-header" style="margin-top:14px">── COLLECTED ──</div>
                            <div v-for="b in bpOwned" :key="b.id" class="built-item">
                                ✦ {{ b.name }}
                            </div>
                        </template>
                    </template>

                </div>
            </div>

            <!-- Right: Log -->
            <div class="layout__right">
                <div class="log__header">── SYSTEM LOG ──</div>
                <div ref="logPanel" class="log">
                    <div v-for="(l, i) in logEntries" :key="i" class="log-entry" :class="'log-entry--' + l.type">
                        <span style="color:#1a1a1a">› </span>{{ l.text }}
                    </div>
                </div>
                <div class="log__footer">
                    <span>⏱ {{ fmtTime(game.timer?.totalTime || 0) }}</span>
                    <span>TICK {{ TICK_MS }}ms</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import Game from '@/game';
import Log from '@/log';
import Persist from 'modules/persist';
import { fmt, clamp, pct, fmtTime } from '@/util/format';
import TerminalUI from './TerminalUI.vue';
import HudOverlay from "@/ui/HudOverlay.vue";
import ListCard from '@/ui/components/ListCard.vue';

const TICK_MS = 200;

const ICONS = {
    scrap: '⚙', creds: '¢', energy: '⚡',
    nano_infra: '◈', ceramite: '◆', nanofiber: '≋',
    parts: '⊞', data_chips: '◇',
};

const GROUP_COLORS = {
    player: '#0af', base: '#0fa', currency: '#ff0', refined: '#f0a',
};

export default {
    name: 'Main',

    data() {
        return {
            game: Game,
            runner: Game.runner,
            tab: 'scrapyard',
            TICK_MS,
            renderTick: 0,
        };
    },

    components: {
        TerminalUI,
        HudOverlay,
        ListCard,
    },

    computed: {
        isMecha() {
            // If scrap is identified, we are in Mecha mode
            return this.game.state?.items['scrap'] !== undefined;
        },

        logEntries() {
            this.renderTick; // trigger reactivity
            return Log.entries;
        },

        version() {
            return __VERSION;
        },

        allItems() {
            this.renderTick;
            return this.game.state ? Object.values(this.game.state.items) : [];
        },

        visibleResources() {
            return this.allItems.filter(i => i.type === 'resource' && !i.locked)
                .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        },

        visibleTasks() {
            return this.allItems.filter(i => i.type === 'task' && !i.locked && i.group !== 'refinery');
        },

        recipes() {
            return this.allItems.filter(i => i.type === 'task' && !i.locked && i.group === 'refinery');
        },

        taskGroups() {
            const groups = [
                { id: 'scrapyard', label: 'SCAVENGING' },
                { id: 'income', label: 'INCOME' },
                { id: 'exploration', label: 'EXPLORATION' },
            ];
            return groups.map(g => ({
                ...g,
                items: this.visibleTasks.filter(t => t.group === g.id),
            })).filter(g => g.items.length > 0);
        },

        availableUpgrades() {
            return this.allItems.filter(i =>
                i.type === 'upgrade' && !i.locked && (i.owned || 0) < (i.max || 1) &&
                !(i.tags && i.tags.includes('t_blueprint'))
            );
        },

        builtUpgrades() {
            return this.allItems.filter(i => i.type === 'upgrade' && (i.owned || 0) > 0 &&
                !(i.tags && i.tags.includes('t_blueprint')));
        },

        bpForSale() {
            return this.allItems.filter(i =>
                i.type === 'upgrade' && !i.locked && (i.owned || 0) === 0 &&
                i.tags && i.tags.includes('t_blueprint') &&
                i.cost && Object.keys(i.cost).length > 0
            );
        },

        bpOwned() {
            return this.allItems.filter(i =>
                i.type === 'upgrade' && (i.owned || 0) > 0 &&
                i.tags && i.tags.includes('t_blueprint')
            );
        },

        visibleTabs() {
            const tabs = [
                { id: 'scrapyard', name: 'SCRAPYARD', icon: '⚙', always: true },
                { id: 'upgrades', name: 'UPGRADES', icon: '★', always: true },
                { id: 'refinery', name: 'REFINERY', icon: '◈', section: 'sect_refinery' },
                { id: 'market', name: 'MARKET', icon: '¢', section: 'sect_market' },
            ];
            return tabs.filter(t => {
                if (t.always) return true;
                if (t.section) {
                    const s = this.game.state?.items[t.section];
                    return s && !s.locked;
                }
                return false;
            });
        },
    },

    mounted() {
        // Force re-render every tick for smooth updates
        this._renderInterval = setInterval(() => {
            this.renderTick++;
            this.$nextTick(() => {
                if (this.$refs.logPanel) {
                    this.$refs.logPanel.scrollTop = this.$refs.logPanel.scrollHeight;
                }
            });
        }, TICK_MS);
    },

    beforeUnmount() {
        if (this._renderInterval) clearInterval(this._renderInterval);
    },

    methods: {
        fmt, pct, fmtTime,

        resourceIcon(id) { return ICONS[id] || '·'; },
        groupColor(group) { return GROUP_COLORS[group] || '#0fa'; },

        asciiBar(val, max, width = 14) {
            const p = max > 0 ? val / max : 0;
            const filled = Math.round(p * width);
            return '█'.repeat(filled) + '░'.repeat(width - filled);
        },

        canAffordOne(resId, amount) {
            const res = this.game.state?.items[resId];
            return res && res.val >= amount;
        },

        canAffordTask(task) {
            if (!task.cost) return true;
            return Object.entries(task.cost).every(([k, v]) => this.canAffordOne(k, v));
        },

        canStartTask(task) {
            if (task.cost && !this.canAffordTask(task)) return false;
            if (task.run) {
                return Object.entries(task.run).every(([k, v]) => {
                    const res = this.game.state?.items[k];
                    return res && res.val >= v * 3;
                });
            }
            return true;
        },

        scaledCost(upg) {
            const costs = {};
            const scale = upg.costScale || 1;
            for (const [k, v] of Object.entries(upg.cost || {})) {
                costs[k] = Math.floor(v * Math.pow(scale, upg.owned || 0));
            }
            return costs;
        },

        canAffordUpgrade(upg) {
            const costs = this.scaledCost(upg);
            return Object.entries(costs).every(([k, v]) => this.canAffordOne(k, v));
        },

        startTask(task) {
            if (this.runner.activeTask || !this.canStartTask(task)) return;
            this.runner.startTask(task);
        },

        stopTask() {
            this.runner.stopTask();
        },

        buyUpgrade(id) {
            this.game.buyUpgrade(id);
        },

        buyBlueprint(id) {
            this.game.buyUpgrade(id); // blueprints are upgrades with t_blueprint tag
        },

        startRecipe(recipe) {
            this.runner.startRecipe(recipe);
        },
    },
};
</script>

<style scoped>
.list-subrow {
    font-size: var(--font-size-xxs);
    color: #94a3b8;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.resource-chip__name {
    font-size: var(--font-size-xxs);
}

.resource-chip__value {
    color: #999;
    font-size: var(--font-size-xxs);
    width: 55px;
    text-align: right;
}

.resource-chip__rate {
    font-size: var(--font-size-xxs);
}

.active-task__name {
    color: #0fa;
    font-size: var(--font-size-xs);
}

.active-task__timer {
    color: #6a8;
    font-size: var(--font-size-xxs);
    width: 40px;
    text-align: right;
}

.active-recipe__name {
    color: #f0a;
    font-size: var(--font-size-xs);
    margin-bottom: 4px;
}

.active-recipe__timer {
    color: #a68;
    font-size: var(--font-size-xxs);
    width: 30px;
}

.list-subrow__item {
    color: #6a4;
}
</style>
