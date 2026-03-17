<script>
/**
 * WorkshopPanel.vue — Extracted from TerminalUI.vue
 * Displays blueprint crafting interface with category filters.
 */
import Game from "@/game";
import { RollOver, ItemOut } from "@/ui/popups/itemPopup.vue";
import { resourceIcon } from "@/ui/uiHelpers";

export default {
    props: {
        state: { type: Object, required: true },
    },
    emits: ['action'],
    data() {
        return {
            renderTick: 0,
            selectedWorkshopTab: 'all',
        };
    },
    mounted() {
        this._tick = setInterval(() => this.renderTick++, 200);
    },
    beforeUnmount() {
        if (this._tick) clearInterval(this._tick);
    },
    computed: {
        blueprints() {
            this.renderTick;
            return Object.values(this.state.items).filter(i =>
                i.type === 'blueprint' && !i.locked
            );
        },
        filteredBlueprints() {
            this.renderTick;
            return this.blueprints.filter(bp => {
                if (this.selectedWorkshopTab === 'all') return true;
                if (this.selectedWorkshopTab === 'frames') return bp.bpType === 'craft_frame';
                if (this.selectedWorkshopTab === 'parts') return bp.bpType === 'craft_item' || bp.bpType === 'part_mod' || bp.bpType === 'frame_part';
                if (this.selectedWorkshopTab === 'weapons') return bp.bpType === 'craft_weapon' || bp.bpType === 'weapon_mod';
                if (this.selectedWorkshopTab === 'recycle') return bp.bpType === 'recycle';
                return true;
            });
        },
    },
    methods: {
        resourceIcon(id) {
            return resourceIcon(id, this.state?.items);
        },
        canAfford(matId, amount) {
            const res = this.state.get(matId);
            return res && res.val >= amount;
        },
        craftBlueprint(bp) {
            Game.craftBlueprint(bp);
            this.$emit('action');
        },
        itemOver(e, it) {
            RollOver(e, it);
        },
        itemOut() {
            ItemOut();
        },
    },
};
</script>

<template>
    <section>
        <h3 class="hud-section-title">> WORKSHOP & ASSEMBLY</h3>
        
        <div class="workshop-layout">
            <!-- Sidebar Filters -->
            <aside class="workshop-sidebar" role="tablist" aria-label="Blueprint filter">
                <button type="button" class="hud-tab-vertical" :class="{ active: selectedWorkshopTab === 'all' }" :aria-pressed="selectedWorkshopTab === 'all'" @click="selectedWorkshopTab = 'all'">[ ALL_FILES ]</button>
                <button type="button" class="hud-tab-vertical" :class="{ active: selectedWorkshopTab === 'frames' }" :aria-pressed="selectedWorkshopTab === 'frames'" @click="selectedWorkshopTab = 'frames'">[ FRAMES ]</button>
                <button type="button" class="hud-tab-vertical" :class="{ active: selectedWorkshopTab === 'parts' }" :aria-pressed="selectedWorkshopTab === 'parts'" @click="selectedWorkshopTab = 'parts'">[ COMPONENTS ]</button>
                <button type="button" class="hud-tab-vertical" :class="{ active: selectedWorkshopTab === 'weapons' }" :aria-pressed="selectedWorkshopTab === 'weapons'" @click="selectedWorkshopTab = 'weapons'">[ ARMAMENT ]</button>
                <button type="button" class="hud-tab-vertical" :class="{ active: selectedWorkshopTab === 'recycle' }" :aria-pressed="selectedWorkshopTab === 'recycle'" @click="selectedWorkshopTab = 'recycle'">[ RECYCLING ]</button>
            </aside>

            <!-- Blueprint List -->
            <div class="workshop-main">
                <div v-if="filteredBlueprints.length === 0" class="empty-state">
                    NO BLUEPRINTS FOUND IN THIS CATEGORY
                </div>
                <div class="blueprint-list">
                    <div v-for="bp in filteredBlueprints" :key="bp.id"
                         class="blueprint-entry"
                         :class="{ affordable: bp.materials && Object.entries(bp.materials).every(([m, a]) => canAfford(m, a)) }"
                         role="button"
                         tabindex="0"
                         @click="craftBlueprint(bp)"
                         @keydown.enter.prevent="craftBlueprint(bp)"
                         @keydown.space.prevent="craftBlueprint(bp)"
                         @mouseover="itemOver($event, bp)"
                         @mouseleave="itemOut">
                        <div class="bp-info">
                            <div class="bp-name">&#x2726; {{ bp.name.toUpperCase() }}</div>
                            <div class="bp-type">{{ bp.type.toUpperCase() }}</div>
                        </div>
                        <div class="bp-mat-preview">
                            <span v-for="(amount, matId) in bp.materials" :key="matId" 
                                  class="mat-tag"
                                  :style="{ color: canAfford(matId, amount) ? '#6a8' : '#e44' }">
                                {{ resourceIcon(matId) }} {{ amount }}
                            </span>
                        </div>
                        <div class="bp-action">[ INITIATE ]</div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>
