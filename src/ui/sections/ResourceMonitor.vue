<script>
/**
 * ResourceMonitor.vue — Sidebar resource panel
 * Collapsible sections with compact grids for secondary resources.
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
            collapsedSections: {
                refined: true,
                combat: true,
                reputation: true,
            },
        };
    },
    mounted() {
        this._tick = setInterval(() => this.renderTick++, 200);
    },
    beforeUnmount() {
        if (this._tick) clearInterval(this._tick);
    },
    computed: {
        allResources() {
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
        coreResources() {
            return this.allResources.filter(r => this.isCoreResource(r));
        },
        refinedResources() {
            return this.allResources.filter(r => 
                !this.isCoreResource(r) && !this.isSecondaryResource(r) && !this.isCombatResource(r)
            );
        },
        combatResources() {
            return this.allResources.filter(r => this.isCombatResource(r));
        },
        reputationResources() {
            return this.allResources.filter(r => r.id && r.id.startsWith('rep_'));
        },
        spaceResource() {
            return this.allResources.find(r => r.id === 'space');
        },
        morality() {
            this.renderTick;
            return this.state.get("morality");
        },
        currentHome() {
            this.renderTick;
            return Object.values(this.state.items).find(i => i.type === 'home' && i.owned > 0);
        },
    },
    methods: {
        renderBar,
        resourceIcon,
        fmtRate,
        formatName,
        itemOver(e, it) { RollOver(e, it); },
        itemOut() { ItemOut(); },

        toggleSection(section) {
            this.collapsedSections[section] = !this.collapsedSections[section];
        },

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
            return ['energy', 'scrap', 'creds', 'mecha_parts', 'data_chips'].includes(res.id);
        },
        isSecondaryResource(res) {
            return res.id === 'space' || (res.id && res.id.startsWith('rep_'));
        },
        isCombatResource(res) {
            return ['glory', 'supply'].includes(res.id);
        },
        getAlignmentText(val) {
            if (val >= 40) return "PARAGON";
            if (val <= -40) return "SHADOW";
            return "PRAGMATIST";
        },
        getRepShort(res) {
            // Extract faction name: "rep_kuroda" → "KRD", "rep_ntpd" → "NTPD"
            const name = res.name || res.id;
            const clean = name.replace(/\s*reputation\s*/i, '').trim();
            return clean.substring(0, 4).toUpperCase();
        },
        getRepPct(res) {
            return Math.min(100, (res.val / (res.max || 100)) * 100);
        },
    }
};
</script>

<template>
    <aside class="terminal-resource-list hud-panel side-panel">
        <h4 class="hud-label">> RESOURCE MONITOR</h4>

        <!-- CORE RESOURCES — always visible, full rows -->
        <div v-for="res in coreResources" :key="res.id"
             class="hud-resource-btn"
             :class="{ 
                'rate-pos': getNetRate(res) > 0.01,
                'rate-neg': getNetRate(res) < -0.01,
                'resource-core': true,
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

        <!-- SPACE (always visible if unlocked) -->
        <div v-if="spaceResource" class="hud-resource-btn resource-secondary"
             :style="{ '--res-color': spaceResource.color || 'var(--primary)' }"
             @mouseover="itemOver($event, spaceResource)"
             @mouseleave="itemOut">
            <span class="res-badge" :style="{ 
                '--badge-color': spaceResource.color || 'var(--primary)',
                borderColor: (spaceResource.color || 'var(--primary)') + '60',
                background: (spaceResource.color || 'var(--primary)') + '12'
            }">
                {{ spaceResource.icon || '📦' }}
            </span>
            <span class="res-info">
                <div class="flex-between">
                    <span>SPACE</span>
                    <div class="res-values">
                        <span class="res-val">{{ Math.floor(spaceResource.val) }}</span>
                        <span class="res-max">/{{ spaceResource.max || 0 }}</span>
                    </div>
                </div>
            </span>
        </div>

        <!-- REFINED — collapsible, compact tiles -->
        <div v-if="refinedResources.length > 0" class="section-group">
            <button type="button" class="section-toggle"
                    :aria-expanded="!collapsedSections.refined"
                    aria-controls="section-refined"
                    @click="toggleSection('refined')">
                <span>── REFINED</span>
                <span class="toggle-chevron" :class="{ open: !collapsedSections.refined }">▶</span>
                <span class="section-count">{{ refinedResources.length }}</span>
            </button>
            <div v-if="!collapsedSections.refined" id="section-refined" class="compact-grid">
                <div v-for="res in refinedResources" :key="res.id"
                     class="compact-tile"
                     :style="{ '--tile-color': res.color || 'var(--primary)' }"
                     @mouseover="itemOver($event, res)"
                     @mouseleave="itemOut">
                    <div class="compact-tile-icon">{{ res.icon || res.abbr || '•' }}</div>
                    <div class="compact-tile-name">{{ (res.name || res.id).replace(/\s+/g, ' ').toUpperCase() }}</div>
                    <div class="compact-tile-val">{{ Math.floor(res.val) }}</div>
                </div>
            </div>
        </div>

        <!-- COMBAT — collapsible, inline row -->
        <div v-if="combatResources.length > 0" class="section-group">
            <button type="button" class="section-toggle"
                    :aria-expanded="!collapsedSections.combat"
                    aria-controls="section-combat"
                    @click="toggleSection('combat')">
                <span>── COMBAT</span>
                <span class="toggle-chevron" :class="{ open: !collapsedSections.combat }">▶</span>
                <span class="section-count">{{ combatResources.length }}</span>
            </button>
            <div v-if="!collapsedSections.combat" id="section-combat" class="compact-inline-row">
                <div v-for="res in combatResources" :key="res.id"
                     class="compact-inline-item"
                     :style="{ '--tile-color': res.color || 'var(--primary)' }"
                     @mouseover="itemOver($event, res)"
                     @mouseleave="itemOut">
                    <span class="cii-icon">{{ res.icon || '⚔' }}</span>
                    <span class="cii-name">{{ (res.name || res.id).toUpperCase() }}</span>
                    <span class="cii-val">{{ Math.floor(res.val) }}</span>
                </div>
            </div>
        </div>

        <!-- REPUTATION — collapsible, compact badge row -->
        <div v-if="reputationResources.length > 0" class="section-group">
            <button type="button" class="section-toggle"
                    :aria-expanded="!collapsedSections.reputation"
                    aria-controls="section-reputation"
                    @click="toggleSection('reputation')">
                <span>── REPUTATION</span>
                <span class="toggle-chevron" :class="{ open: !collapsedSections.reputation }">▶</span>
                <span class="section-count">{{ reputationResources.length }}</span>
            </button>
            <div v-if="!collapsedSections.reputation" id="section-reputation" class="rep-badge-row">
                <div v-for="res in reputationResources" :key="res.id"
                     class="rep-badge"
                     :style="{ '--rep-color': res.color || '#88aaff' }"
                     @mouseover="itemOver($event, res)"
                     @mouseleave="itemOut">
                    <div class="rep-badge-label">{{ getRepShort(res) }}</div>
                    <div class="rep-badge-val">{{ Math.floor(res.val) }}</div>
                    <div class="rep-badge-bar">
                        <div class="rep-badge-fill" :style="{ width: getRepPct(res) + '%' }"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- MORALITY -->
        <div class="hud-align-widget" v-if="morality">
            <div class="hud-label">> MORALITY_V_1.0</div>
            <div class="align-text">{{ getAlignmentText(morality.val) }}</div>
            <div class="align-val">[{{ Math.floor(morality.val) }}]</div>
        </div>

        <!-- SECTOR SPECS -->
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

<style scoped>
/* ── Section Groups ────────────────────────────────── */
.section-group {
    margin: 6px 0;
}

.section-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    color: var(--text-dim);
    font-family: var(--font-mono);
    font-size: var(--font-size-xxs);
    letter-spacing: 1.5px;
    padding: 4px 0;
    user-select: none;
    transition: color 0.15s, text-shadow 0.15s;
    /* button resets */
    background: transparent;
    border: none;
    width: 100%;
    text-align: left;
}
.section-toggle:hover {
    color: var(--primary);
    text-shadow: 0 0 6px rgba(0, 255, 65, 0.2);
}
.toggle-chevron {
    font-size: var(--font-size-micro);
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

/* ── Compact Grid (Refined materials) ──────────────── */
.compact-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 4px;
    padding: 4px 0;
    animation: slideDown 0.2s ease;
}

.compact-tile {
    background: var(--success-bg);
    border: 1px solid var(--success-border);
    padding: 6px 8px;
    text-align: center;
    cursor: default;
    transition: all 0.2s ease-out;
    font-family: var(--font-mono);
}
.compact-tile:hover {
    background: var(--success-bg-hover);
    border-color: var(--tile-color, var(--primary));
    box-shadow: var(--success-glow);
}
.compact-tile:hover .compact-tile-val {
    text-shadow: 0 0 6px var(--tile-color, var(--primary));
}
.compact-tile-icon {
    font-size: var(--font-size-sm);
    margin-bottom: 2px;
}
.compact-tile-name {
    font-size: var(--font-size-xxs);
    color: var(--text-dim);
    letter-spacing: 0.5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.compact-tile-val {
    font-size: var(--font-size-xs);
    color: var(--tile-color, var(--primary));
    font-weight: bold;
    transition: text-shadow 0.2s;
}

/* ── Compact Inline Row (Combat) ───────────────────── */
.compact-inline-row {
    display: flex;
    gap: 10px;
    padding: 6px 0;
    animation: slideDown 0.2s ease;
}
.compact-inline-item {
    display: flex;
    align-items: center;
    gap: 5px;
    font-family: var(--font-mono);
    font-size: var(--font-size-xxs);
    cursor: default;
    padding: 4px 8px;
    border: 1px solid var(--success-border);
    background: var(--success-bg);
    transition: all 0.2s ease-out;
    flex: 1;
}
.compact-inline-item:hover {
    background: var(--success-bg-hover);
    border-color: var(--tile-color, var(--primary));
    box-shadow: var(--success-glow);
}
.cii-icon {
    font-size: var(--font-size-sm);
}
.cii-name {
    color: var(--text-dim);
    letter-spacing: 0.5px;
}
.cii-val {
    margin-left: auto;
    color: var(--tile-color, var(--primary));
    font-weight: bold;
    font-size: var(--font-size-xs);
}

/* ── Progress Bar Segment Markers ──────────────────── */
.res-progress-bar {
    position: relative;
}
.res-progress-bar::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: repeating-linear-gradient(
        90deg,
        transparent,
        transparent 24%,
        rgba(0, 0, 0, 0.4) 24%,
        rgba(0, 0, 0, 0.4) 25%
    );
}

/* ── Reputation Badge Row ──────────────────────────── */
.rep-badge-row {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding: 4px 0;
    animation: slideDown 0.2s ease;
}
.rep-badge {
    flex: 1 1 calc(50% - 4px);
    min-width: 70px;
    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-rows: auto auto;
    background: rgba(136, 170, 255, 0.04);
    border: 1px solid rgba(136, 170, 255, 0.12);
    padding: 4px 6px;
    font-family: var(--font-mono);
    cursor: default;
    transition: all 0.2s ease-out;
}
.rep-badge:hover {
    background: rgba(136, 170, 255, 0.1);
    border-color: var(--rep-color);
    box-shadow: 0 0 8px rgba(136, 170, 255, 0.1);
}
.rep-badge-label {
    font-size: var(--font-size-xxs);
    color: var(--rep-color, #88aaff);
    font-weight: bold;
    letter-spacing: 1px;
    grid-column: 1;
    grid-row: 1;
}
.rep-badge-val {
    font-size: var(--font-size-xxs);
    color: var(--text-dim);
    grid-column: 2;
    grid-row: 1;
    text-align: right;
}
.rep-badge-bar {
    height: 2px;
    background: rgba(136, 170, 255, 0.1);
    margin-top: 3px;
    grid-column: 1 / -1;
    grid-row: 2;
}
.rep-badge-fill {
    height: 100%;
    background: var(--rep-color, #88aaff);
    box-shadow: 0 0 4px var(--rep-color, #88aaff);
    transition: width 0.3s;
}

/* ── Slide Animation ───────────────────────────────── */
@keyframes slideDown {
    from {
        opacity: 0;
        max-height: 0;
        transform: translateY(-4px);
    }
    to {
        opacity: 1;
        max-height: 500px;
        transform: translateY(0);
    }
}

/* ── Reduced Motion ────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
    .compact-grid,
    .compact-inline-row,
    .rep-badge-row {
        animation: none;
    }
    .toggle-chevron {
        transition: none;
    }
}
</style>
