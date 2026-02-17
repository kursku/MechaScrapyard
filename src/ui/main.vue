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
                <span class="header__meta">NEW TOKYO • FERRO-VELHO DISTRICT</span>
                <span class="header__version">v{{ version }}</span>
            </div>
        </div>

        <!-- Resource Bar -->
        <div class="resource-bar">
            <div v-for="r in visibleResources" :key="r.id" class="resource-chip"
                 :class="{ 'resource-chip--warning': pct(r.val, r.max) > 90 }"
                 :title="r.desc">
                <span :style="{ color: groupColor(r.group), width: '80px', display: 'inline-block', fontSize: '10px' }">
                    {{ resourceIcon(r.id) }} {{ r.name }}
                </span>
                <span class="ascii-bar ascii-bar--thin" :style="{ color: pct(r.val, r.max) > 0.15 ? groupColor(r.group) : '#333' }">
                    {{ asciiBar(r.val, r.max, 10) }}
                </span>
                <span style="color:#999;font-size:9px;width:55px;text-align:right">
                    {{ fmt(r.val) }}/{{ fmt(r.max) }}
                </span>
                <span v-if="r.rate !== 0" :style="{ color: r.rate > 0 ? '#3a7' : '#a44', fontSize: '8px' }">
                    {{ r.rate > 0 ? '▲' : '▼' }}{{ fmt(Math.abs(r.rate)) }}
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
                                <span style="color:#0fa;font-size:12px">▶ {{ runner.activeTask.name }}</span>
                                <button class="btn btn--stop" @click="stopTask">■ STOP</button>
                            </div>
                            <div v-if="!runner.activeTask.perpetual && runner.activeTask.length"
                                 style="margin-bottom:3px">
                                <div class="flex-center gap-6">
                                    <div class="progress-bar" style="flex:1">
                                        <div class="progress-bar__fill progress-bar__fill--task"
                                             :style="{ width: pct(runner.taskProgress, runner.activeTask.length) + '%' }"></div>
                                    </div>
                                    <span style="color:#6a8;font-size:9px;width:40px;text-align:right">
                                        {{ Math.ceil(runner.activeTask.length - runner.taskProgress) }}s
                                    </span>
                                </div>
                            </div>
                        </div>

                        <!-- Task groups -->
                        <div v-for="grp in taskGroups" :key="grp.id">
                            <div class="section-header">── {{ grp.label }} ──</div>
                            <div v-for="t in grp.items" :key="t.id"
                                 class="item-row"
                                 :class="{
                                     'item-row--active': runner.activeTask === t,
                                     'item-row--disabled': runner.activeTask && runner.activeTask !== t,
                                     'item-row--unaffordable': !runner.activeTask && !canStartTask(t),
                                 }"
                                 @click="startTask(t)">
                                <div class="flex-between">
                                    <span class="item-row__name">
                                        {{ runner.activeTask === t ? '▶' : '►' }} {{ t.name }}
                                        <span v-if="t.perpetual" class="badge badge--idle">IDLE</span>
                                        <span v-if="t.loot" class="badge badge--loot">✦</span>
                                    </span>
                                    <div class="flex gap-6" style="align-items:center">
                                        <span v-for="(v, k) in t.cost" :key="k" class="item-row__cost"
                                              :class="canAffordOne(k, v) ? 'cost--ok' : 'cost--no'">
                                            {{ resourceIcon(k) }}{{ v }}
                                        </span>
                                        <span v-if="t.length" class="badge badge--timed">{{ t.length }}s</span>
                                    </div>
                                </div>
                                <div class="item-row__desc">{{ t.desc }}</div>
                            </div>
                        </div>
                    </template>

                    <!-- UPGRADES TAB -->
                    <template v-if="tab === 'upgrades'">
                        <div class="section-header">── AVAILABLE ──</div>
                        <div v-if="availableUpgrades.length === 0" class="empty-state">
                            No upgrades available. Keep progressing.
                        </div>
                        <div v-for="u in availableUpgrades" :key="u.id"
                             class="item-row"
                             :class="{ 'item-row--unaffordable': !canAffordUpgrade(u) }"
                             @click="buyUpgrade(u.id)">
                            <div class="flex-between">
                                <span style="color:#ff0;font-size:11px">
                                    ★ {{ u.name }}
                                    <span v-if="u.max > 1" style="color:#aa8;font-size:9px">[{{ u.owned }}/{{ u.max }}]</span>
                                </span>
                                <span style="font-size:9px">
                                    <span v-for="(v, k) in scaledCost(u)" :key="k"
                                          :class="canAffordOne(k, v) ? 'cost--ok' : 'cost--no'"
                                          style="margin-right:4px">
                                        {{ resourceIcon(k) }}{{ v }}
                                    </span>
                                </span>
                            </div>
                            <div class="item-row__desc">{{ u.desc }}</div>
                        </div>

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
                            <div style="color:#f0a;font-size:11px;margin-bottom:4px">
                                ◈ {{ runner.activeRecipe.name.replace('Refine: ', '') }}
                            </div>
                            <div class="flex-center gap-6">
                                <div class="progress-bar" style="flex:1;border-color:#3a1a2a">
                                    <div class="progress-bar__fill progress-bar__fill--recipe"
                                         :style="{ width: pct(runner.recipeProgress, runner.activeRecipe.length) + '%' }"></div>
                                </div>
                                <span style="color:#a68;font-size:9px;width:30px">
                                    {{ Math.ceil(runner.activeRecipe.length - runner.recipeProgress) }}s
                                </span>
                            </div>
                        </div>
                        <div class="section-header">── RECIPES ──</div>
                        <div v-if="recipes.length === 0" class="empty-state">
                            No recipes unlocked. Acquire Blueprints at the MARKET.
                        </div>
                        <div v-for="r in recipes" :key="r.id"
                             class="item-row"
                             :class="{ 'item-row--disabled': runner.activeRecipe, 'item-row--unaffordable': !canAffordTask(r) }"
                             :style="{ background: '#10080e', borderColor: canAffordTask(r) && !runner.activeRecipe ? '#5a2a4a' : '#1a1118' }"
                             @click="startRecipe(r)">
                            <div class="flex-between">
                                <span :style="{ color: canAffordTask(r) ? '#f0a' : '#554', fontSize: '11px' }">◈ {{ r.name }}</span>
                                <span style="font-size:9px">
                                    <span v-for="(v, k) in r.cost" :key="k"
                                          :class="canAffordOne(k, v) ? 'cost--ok' : 'cost--no'"
                                          style="margin-right:4px">
                                        {{ resourceIcon(k) }}{{ v }}
                                    </span>
                                </span>
                            </div>
                            <div style="font-size:9px;color:#6a4">
                                → <span v-for="(v, k) in r.result" :key="k" style="margin-right:4px">{{ resourceIcon(k) }}+{{ v }}</span>
                                ({{ r.length }}s)
                            </div>
                        </div>
                    </template>

                    <!-- MARKET TAB -->
                    <template v-if="tab === 'market'">
                        <div class="section-header">── BLUEPRINTS FOR SALE ──</div>
                        <div v-if="bpForSale.length === 0 && bpOwned.length === 0" class="empty-state">
                            Build the Refinery to unlock the blueprint market.
                        </div>
                        <div v-for="b in bpForSale" :key="b.id"
                             class="item-row"
                             :class="{ 'item-row--unaffordable': !canAffordTask(b) }"
                             :style="{ background: '#12100a', borderColor: canAffordTask(b) ? '#5a5a2a' : '#1a1a10' }"
                             @click="buyBlueprint(b.id)">
                            <div class="flex-between">
                                <span :style="{ color: canAffordTask(b) ? '#ff0' : '#554', fontSize: '11px' }">✦ {{ b.name }}</span>
                                <span style="font-size:9px">
                                    <span v-for="(v, k) in b.cost" :key="k"
                                          :class="canAffordOne(k, v) ? 'cost--ok' : 'cost--no'"
                                          style="margin-right:4px">
                                        {{ resourceIcon(k) }}{{ v }}
                                    </span>
                                </span>
                            </div>
                            <div class="item-row__desc">{{ b.desc }}</div>
                        </div>
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
                    <div v-for="(l, i) in logEntries" :key="i"
                         class="log-entry" :class="'log-entry--' + l.type">
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
        HudOverlay
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
