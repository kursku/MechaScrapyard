<script>
/**
 * ZonesPanel.vue — Extracted from TerminalUI.vue
 * Displays New Tokyo zone map with zone list and detail view.
 */
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
                const first = this.zones.find(z => z.discovered);
                return first || null;
            }
            return this.state.items[this._selectedZoneId] || null;
        },
    },
    methods: {
        selectZone(zone) {
            if (zone.discovered) this._selectedZoneId = zone.id;
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
                     :class="['zone-card', { discovered: zone.discovered, selected: selectedZone && selectedZone.id === zone.id }]"
                     :style="zone.discovered ? { borderColor: zone.color, '--zone-color': zone.color } : {}"
                     @click="selectZone(zone)">
                    <div v-if="zone.discovered" class="zone-card-inner">
                        <div class="zone-card-header">
                            <span class="zone-icon">{{ zone.icon }}</span>
                            <span class="zone-name" :style="{ color: zone.color }">{{ zone.shortName.toUpperCase() }}</span>
                            <span class="zone-phase">P{{ zone.phase }}</span>
                        </div>
                        <div class="zone-desc">{{ zone.desc }}</div>
                    </div>
                    <div v-else class="zone-card-locked">
                        <span class="zone-icon">?</span>
                        <span class="zone-name">??? LOCKED ???</span>
                        <span class="zone-phase">P{{ zone.phase }}</span>
                    </div>
                </div>
            </div>

            <div class="zone-detail" v-if="selectedZone && selectedZone.discovered">
                <div class="zone-detail-header" :style="{ borderColor: selectedZone.color }">
                    <span class="zone-detail-icon" :style="{ color: selectedZone.color }">{{ selectedZone.icon }}</span>
                    <div>
                        <div class="zone-detail-name" :style="{ color: selectedZone.color }">{{ selectedZone.name.toUpperCase() }}</div>
                        <div class="zone-detail-flavor">{{ selectedZone.flavor }}</div>
                    </div>
                </div>

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
            </div>
        </div>
    </section>
</template>
