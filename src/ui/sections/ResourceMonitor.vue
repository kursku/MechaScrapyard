<script>
/**
 * ResourceMonitor.vue — Extracted from TerminalUI.vue
 * Displays the current directive, resource list (core and auxiliary),
 * morality alignment, and sector specifications.
 */
import Game from "@/game";
import { RollOver, ItemOut } from "../../ui/popups/itemPopup.vue";
import { renderBar, resourceIcon, fmtRate, formatName } from "../uiHelpers";

export default {
    props: {
        state: { type: Object, required: true },
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
        resources() {
            this.renderTick;
            const _ = Game.runner.activeTask;
            
            return Object.values(this.state.items)
                .filter(i => {
                    if (i.type !== 'resource' || i.locked) return false;
                    if (i.hideWhen && Game.techTree.evaluate(i.hideWhen)) return false;
                    return true;
                })
                .sort((a, b) => {
                    const priorityDiff = this.getResourcePriority(a) - this.getResourcePriority(b);
                    if (priorityDiff !== 0) return priorityDiff;
                    const sortDiff = (a.sortOrder || 0) - (b.sortOrder || 0);
                    if (sortDiff !== 0) return sortDiff;
                    return (a.name || a.id).localeCompare(b.name || b.id);
                });
        },
        morality() {
            this.renderTick;
            return this.state.get("morality");
        },
        currentHome() {
            this.renderTick;
            return Object.values(this.state.items).find(i => i.type === 'home' && i.owned > 0);
        },
        currentDirective() {
            this.renderTick;
            const items = this.state.items;
            const directives = [
                {
                    id: 'gather_scrap',
                    text: 'Scavenge scrap from the piles.',
                    detail: 'Click SCAVENGE SCRAP to start collecting.',
                    condition: () => (items.scrap?.val || 0) >= 30,
                    progress: () => Math.floor(items.scrap?.val || 0),
                    target: 30,
                    unit: 'SCRAP'
                },
                {
                    id: 'earn_creds',
                    text: 'Earn Creds from Odd Jobs.',
                    detail: 'Run ODD JOBS to earn currency.',
                    condition: () => (items.creds?.val || 0) >= 15,
                    progress: () => Math.floor(items.creds?.val || 0),
                    target: 15,
                    unit: 'CREDS'
                },
                {
                    id: 'build_sorting',
                    text: 'Build the Sorting Station.',
                    detail: 'Scroll down to BASE INFRASTRUCTURE.',
                    condition: () => (this.state.get('sorting_station')?.owned || 0) > 0,
                    progress: () => ((this.state.get('sorting_station')?.owned || 0) > 0 ? 1 : 0),
                    target: 1,
                    unit: 'BUILT'
                },
                {
                    id: 'upgrade_workshop',
                    text: 'Upgrade the Workshop.',
                    detail: 'Restore grandpa\'s workshop to full power.',
                    condition: () => (this.state.get('workshop_lv2')?.owned || 0) > 0,
                    progress: () => ((this.state.get('workshop_lv2')?.owned || 0) > 0 ? 1 : 0),
                    target: 1,
                    unit: 'BUILT'
                },
                {
                    id: 'restore_garage',
                    text: 'Restore the Garage.',
                    detail: 'Something from the past awaits inside.',
                    condition: () => (this.state.get('garage')?.owned || 0) > 0,
                    progress: () => ((this.state.get('garage')?.owned || 0) > 0 ? 1 : 0),
                    target: 1,
                    unit: 'BUILT'
                },
            ];

            for (const d of directives) {
                if (!d.condition()) return d;
            }
            return null;
        }
    },
    methods: {
        renderBar,
        resourceIcon,
        fmtRate,
        formatName,
        itemOver(e, it) { RollOver(e, it); },
        itemOut() { ItemOut(); },

        getNetRate(res) {
            let rate = res.rate || 0;
            if (rate > 0) {
                const focus = this.state.get('focus')?.val || 0;
                rate *= (1 + focus * 0.05);
            }
            const activeTask = Game.runner.activeTask;
            if (activeTask) {
                if (activeTask.effect && activeTask.effect[res.id]) rate += activeTask.effect[res.id];
                if (activeTask.run && activeTask.run[res.id]) rate -= activeTask.run[res.id];
            }
            return rate;
        },
        getResourcePriority(res) {
            const corePriority = { energy: 0, scrap: 1, creds: 2 };
            if (corePriority[res.id] !== undefined) return corePriority[res.id];
            if (res.id === 'space') return 90;
            if (res.id && res.id.startsWith('rep_')) return 100;
            return 40 + (res.sortOrder || 0);
        },
        isCoreResource(res) {
            return res.id === 'energy' || res.id === 'scrap' || res.id === 'creds';
        },
        isSecondaryResource(res) {
            return res.id === 'space' || (res.id && res.id.startsWith('rep_'));
        },
        getAlignmentText(val) {
            if (val >= 40) return "PARAGON";
            if (val <= -40) return "SHADOW";
            return "PRAGMATIST";
        }
    }
};
</script>

<template>
    <aside class="terminal-resource-list hud-panel side-panel">
        <!-- CURRENT DIRECTIVE -->
        <div class="directive-tracker" v-if="currentDirective">
            <div class="directive-header">> CURRENT DIRECTIVE</div>
            <div class="directive-text">{{ currentDirective.text }}</div>
            <div class="directive-detail">{{ currentDirective.detail }}</div>
            <div class="directive-progress">
                <span class="directive-count">
                    {{ currentDirective.progress() }}/{{ currentDirective.target }} {{ currentDirective.unit }}
                </span>
                <div class="directive-bar">
                    <div class="directive-fill" 
                         :style="{ width: Math.min(100, (currentDirective.progress() / currentDirective.target) * 100) + '%' }">
                    </div>
                </div>
            </div>
        </div>

        <h4 class="hud-label">> RESOURCE MONITOR</h4>
        <template v-for="(res, resIndex) in resources" :key="res.id">
            <div v-if="resIndex > 0 && isSecondaryResource(res) && !isSecondaryResource(resources[resIndex - 1])" class="res-group-divider">
                <span>&#x2500;&#x2500; AUXILIARY &#x2500;&#x2500;</span>
            </div>
            <div v-if="res.id === 'ferrous_scrap' && resources[0]?.id !== 'ferrous_scrap'" class="res-group-divider">
                <span>&#x2500;&#x2500; REFINED &#x2500;&#x2500;</span>
            </div>
            <div v-if="res.id === 'glory'" class="res-group-divider">
                <span>&#x2500;&#x2500; COMBAT &#x2500;&#x2500;</span>
            </div>
            <!-- RESOURCE BUTTON -->
            <div class="hud-resource-btn"
                 :class="{ 
                    'rate-pos': getNetRate(res) > 0.01,
                    'rate-neg': getNetRate(res) < -0.01,
                    'resource-core': isCoreResource(res),
                    'resource-secondary': isSecondaryResource(res)
                 }"
                 :style="{ '--res-color': res.color || 'var(--primary)' }"
                 @mouseover="itemOver($event, res)"
                 @mouseleave="itemOut">
                
                <span class="res-badge" :style="{ 
                    '--badge-color': res.color || 'var(--primary)',
                    borderColor: (res.color || 'var(--primary)') + '60',
                    background: (res.color || 'var(--primary)') + '12'
                }">
                    {{ res.icon || res.abbr || '•' }}
                </span>
                <span class="res-info">
                    <div class="flex-between">
                        <span>{{ res.name.toUpperCase() }}</span>
                        <div class="res-values">
                            <span v-if="getNetRate(res) !== 0" class="res-delta">
                                {{ fmtRate(getNetRate(res)) }}/s
                            </span>
                            <span class="res-val">{{ Math.floor(res.val) }}</span>
                            <span class="res-max">/{{ res.max || 0 }}</span>
                            <span v-if="res.id === 'energy' && getNetRate(res) > 0" class="energy-stable-tag">STABLE</span>
                            <span v-if="res.id === 'energy' && getNetRate(res) < -0.01" class="energy-drain-tag">DRAIN</span>
                        </div>
                    </div>
                    <div class="res-progress-bar">
                        <div class="res-progress-fill" :style="{ 
                            width: Math.min(100, (res.val / (res.max || 1)) * 100) + '%',
                            backgroundColor: res.color || 'var(--primary)',
                            boxShadow: '0 0 6px ' + (res.color || 'var(--primary)') + '80'
                        }"></div>
                    </div>
                </span>
            </div>
        </template>
        
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
</template>
