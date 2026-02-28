<script>
/**
 * ZonesPanel.vue
 * Zone map with 3-state progression: locked → scouted → unlocked.
 */
import Game from "@/game";

export default {
    props: {
        state: { type: Object, required: true },
    },
    data() {
        return {
            renderTick: 0,
            _selectedZoneId: null,
        };
    },
    mounted() {
        this._tick = setInterval(() => this.renderTick++, 200);
    },
    beforeUnmount() {
        if (this._tick) clearInterval(this._tick);
    },
    computed: {
        zones() {
            this.renderTick;
            return Object.values(this.state.items)
                .filter(i => i.type === 'zone')
                .sort((a, b) => (a.phase || 1) - (b.phase || 1));
        },
        selectedZone() {
            this.renderTick;
            if (!this._selectedZoneId) {
                const first = this.zones.find(z => z.status === 'unlocked');
                return first || null;
            }
            return this.state.items[this._selectedZoneId] || null;
        },
    },
    methods: {
        selectZone(zone) {
            if (zone.status !== 'locked') this._selectedZoneId = zone.id;
        },
        canAffordUnlock(zone) {
            if (!zone.scoutCost) return true;
            return Object.entries(zone.scoutCost).every(([r, amt]) => {
                const res = this.state.items[r];
                return res && (res.val || 0) >= amt;
            });
        },
        formatCost(cost) {
            if (!cost) return '';
            return Object.entries(cost).map(([r, v]) => `${v} ${r.toUpperCase()}`).join(' + ');
        },
        unlockZone(zone) {
            Game.unlockZone(zone.id);
        },
    },
};
</script>

<template>
    <section class="zones-panel">
        <h3 class="hud-section-title">> NEW TOKYO &#x2014; ZONE MAP</h3>
        <div class="zones-layout">
            <div class="zone-list">
                <div v-for="zone in zones" :key="zone.id"
                     :class="['zone-card', zone.status, { selected: selectedZone && selectedZone.id === zone.id }]"
                     :style="zone.status !== 'locked' ? { borderColor: zone.color, '--zone-color': zone.color } : {}"
                     @click="selectZone(zone)">

                    <!-- LOCKED -->
                    <div v-if="zone.status === 'locked'" class="zone-card-locked">
                        <span class="zone-icon">?</span>
                        <span class="zone-name">??? LOCKED ???</span>
                        <span class="zone-phase">P{{ zone.phase }}</span>
                    </div>

                    <!-- SCOUTED or UNLOCKED -->
                    <div v-else class="zone-card-inner">
                        <div class="zone-card-header">
                            <span class="zone-icon">{{ zone.icon }}</span>
                            <span class="zone-name" :style="{ color: zone.color }">{{ zone.shortName.toUpperCase() }}</span>
                            <span class="zone-phase">P{{ zone.phase }}</span>
                        </div>
                        <div class="zone-status-badge" :class="zone.status">
                            {{ zone.status === 'unlocked' ? 'UNLOCKED' : 'SCOUTED' }}
                        </div>
                        <div class="zone-desc">{{ zone.desc }}</div>
                    </div>
                </div>
            </div>

            <!-- DETAIL PANEL -->
            <div class="zone-detail" v-if="selectedZone && selectedZone.status !== 'locked'">
                <div class="zone-detail-header" :style="{ borderColor: selectedZone.color }">
                    <span class="zone-detail-icon" :style="{ color: selectedZone.color }">{{ selectedZone.icon }}</span>
                    <div>
                        <div class="zone-detail-name" :style="{ color: selectedZone.color }">{{ selectedZone.name.toUpperCase() }}</div>
                        <div class="zone-detail-flavor">{{ selectedZone.flavor }}</div>
                    </div>
                </div>

                <!-- SCOUTED: show unlock action -->
                <div v-if="selectedZone.status === 'scouted'" class="zone-unlock-section">
                    <div class="zone-sub-title">> ACCESS PROTOCOL</div>
                    <div class="zone-unlock-desc">
                        Zone detected. Operational access requires resource commitment.
                    </div>
                    <div v-if="selectedZone.scoutCost" class="zone-unlock-cost">
                        COST: {{ formatCost(selectedZone.scoutCost) }}
                    </div>
                    <button class="hud-btn unlock-btn"
                            :disabled="!canAffordUnlock(selectedZone)"
                            @click="unlockZone(selectedZone)">
                        {{ selectedZone.scoutCost ? `UNLOCK ZONE` : `ENTER ZONE` }}
                    </button>
                </div>

                <!-- UNLOCKED: full info -->
                <template v-if="selectedZone.status === 'unlocked'">
                    <div class="zone-sub-areas">
                        <div class="zone-sub-title">> SUB-AREAS</div>
                        <div v-for="sub in selectedZone.subAreas" :key="sub.id" class="zone-sub-card">
                            <span class="zone-sub-name">&#x25B8; {{ sub.name }}</span>
                            <span class="zone-sub-desc">{{ sub.desc }}</span>
                        </div>
                    </div>

                    <div v-if="selectedZone.npcs && selectedZone.npcs.length" class="zone-npcs">
                        <div class="zone-sub-title">> KEY CONTACTS</div>
                        <span v-for="npc in selectedZone.npcs" :key="npc" class="zone-npc-tag">
                            {{ npc.replace(/_/g, ' ').toUpperCase() }}
                        </span>
                    </div>

                    <div class="zone-narrative-hook" :style="{ borderColor: selectedZone.color + '40' }">
                        &ldquo;{{ selectedZone.narrativeHook }}&rdquo;
                    </div>
                </template>
            </div>
        </div>
    </section>
</template>

<style scoped>
.zone-status-badge {
    display: inline-block;
    font-size: var(--font-size-xxs);
    letter-spacing: 1px;
    padding: 2px 6px;
    margin: 4px 0;
    border: 1px solid;
}

.zone-status-badge.unlocked {
    color: var(--primary);
    border-color: var(--primary);
}

.zone-status-badge.scouted {
    color: var(--secondary, #ff0);
    border-color: var(--secondary, #ff0);
}

.zone-unlock-section {
    margin: 12px 0;
    padding: 10px;
    border: 1px solid rgba(255, 220, 0, 0.3);
    background: rgba(255, 220, 0, 0.03);
}

.zone-unlock-desc {
    font-size: var(--font-size-xxs);
    color: #888;
    font-family: var(--font-mono);
    margin-bottom: 8px;
}

.zone-unlock-cost {
    font-size: var(--font-size-xxs);
    color: var(--secondary, #ff0);
    font-family: var(--font-mono);
    letter-spacing: 1px;
    margin-bottom: 10px;
}

.unlock-btn {
    width: 100%;
    font-size: var(--font-size-xxs);
    padding: 6px 12px;
    letter-spacing: 2px;
    border: 1px solid var(--secondary, #ff0);
    background: transparent;
    color: var(--secondary, #ff0);
    cursor: pointer;
    font-family: var(--font-mono, monospace);
}

.unlock-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}

.zone-card.scouted {
    opacity: 0.85;
}
</style>
