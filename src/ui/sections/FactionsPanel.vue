<script>
/**
 * FactionsPanel.vue — Extracted from TerminalUI.vue
 * Displays faction cards with reputation, alliance status, vendor access.
 * Follows props + emits pattern for Game interactions.
 */
import Game from "@/game";
import { renderBar, getAllianceLabel } from "@/ui/uiHelpers";

export default {
    props: {
        /** @type {Array} Pre-computed faction objects from parent */
        factions: { type: Array, required: true },
        /** @type {Object} Game state for item/vendor lookups */
        state: { type: Object, required: true },
    },
    methods: {
        renderBar,
        getAllianceLabel,

        getFactionVendorItems(factionId) {
            if (!Game.getFactionVendor) return { parts: [], weapons: [], blueprints: [], backpacks: [] };
            return Game.getFactionVendor(factionId);
        },

        getFactionVendorCategories(fac) {
            const catalog = this.getFactionVendorItems(fac.id);
            return [
                { key: 'parts', label: 'PARTS', items: catalog.parts || [] },
                { key: 'weapons', label: 'WEAPONS', items: catalog.weapons || [] },
                { key: 'backpacks', label: 'BACKPACKS', items: catalog.backpacks || [] },
                { key: 'blueprints', label: 'BLUEPRINTS', items: catalog.blueprints || [] }
            ].filter(c => c.items.length > 0);
        },

        getVendorItem(itemId) {
            return this.state.items[itemId] || null;
        },

        getVendorItemCost(itemId) {
            if (Game.getVendorItemCost) return Game.getVendorItemCost(itemId);
            const item = this.getVendorItem(itemId);
            if (!item) return null;
            return typeof item.value === 'number' ? item.value : 50;
        },

        canBuyVendorItem(itemId, factionId) {
            const item = this.getVendorItem(itemId);
            if (!item) return false;

            const catalog = this.getFactionVendorItems(factionId);
            const inCatalog = ['parts', 'weapons', 'blueprints', 'backpacks'].some(cat => catalog[cat].includes(itemId));
            if (!inCatalog) return false;

            if (item.type === 'blueprint' && !item.locked) return false;
            if (item.max !== undefined && item.owned !== undefined && (item.owned || 0) >= item.max) return false;

            const creds = this.state.get('creds');
            const cost = this.getVendorItemCost(itemId);
            if (!creds || cost == null) return false;
            return (creds.val || 0) >= cost;
        },

        buyVendorItem(itemId, factionId) {
            if (!Game.buyFromVendor) return;
            Game.buyFromVendor(itemId, factionId);
            this.$emit('vendor-buy');
        },
    },
};
</script>

<template>
    <section>
        <h3 class="hud-section-title">> REPUTATION & FACTIONS</h3>
        <div class="factions-grid">
            <div v-for="fac in factions" :key="fac.id" class="faction-card"
                 :style="{
                    borderColor: fac.color,
                    background: 'linear-gradient(180deg, transparent 0%, ' + fac.color + '1A 100%)'
                 }">
                <div class="faction-title" :style="{ color: fac.color }">
                    {{ fac.icon }} {{ fac.name.toUpperCase() }}
                </div>
                <div class="faction-desc">{{ fac.desc }}</div>

                <div class="faction-status">
                    <div class="faction-rep-row">
                        <span class="tier-name" :style="{ color: fac.color }">STATUS: {{ fac.currentTier.name.toUpperCase() }}</span>
                        <span class="tier-rep">REP: {{ fac.repValue }}</span>
                    </div>
                    <div class="faction-alliance-row">
                        <span>ALLIANCE:</span>
                        <span class="alliance-chip" :style="{ color: fac.color, borderColor: fac.color }">{{ fac.allianceLabel }}</span>
                    </div>
                    <div v-if="fac.nextTier" class="hud-ascii-bar" :style="{ color: fac.color, marginBottom: '15px' }">
                        {{ renderBar(fac.repValue - fac.currentTier.min, fac.nextTier.min - fac.currentTier.min, 15) }}
                    </div>
                    <div v-else class="hud-ascii-bar" :style="{ color: fac.color, marginBottom: '15px' }">
                        [ MAX REPUTATION REACHED ]
                    </div>

                    <div v-if="fac.currentTier.unlocks && fac.currentTier.unlocks.length" class="faction-perks">
                        <div class="faction-perks-title" :style="{ color: fac.color }">UNLOCKED:</div>
                        <div v-for="(perk, i) in fac.currentTier.unlocks.filter(u => !u.startsWith('bp_'))" :key="i" class="perk-item">
                            - {{ perk }}
                        </div>
                    </div>

                    <div class="faction-vendor" v-if="getFactionVendorCategories(fac).length">
                        <details class="faction-vendor-details">
                            <summary class="faction-vendor-summary" :style="{ '--fac-color': fac.color }">
                                ACCESS VOR-X VENDOR (UNLOCKED)
                            </summary>
                            <div class="faction-vendor-scroll">
                                <div class="vendor-category" v-for="cat in getFactionVendorCategories(fac)" :key="cat.key">
                                    <div class="vendor-category-title">{{ cat.label }}</div>
                                    <div v-for="itemId in cat.items" :key="itemId" class="vendor-item-row">
                                        <div class="vendor-item-meta">
                                            <span class="vendor-item-name">{{ getVendorItem(itemId)?.name || itemId }}</span>
                                            <span class="vendor-item-cost">{{ getVendorItemCost(itemId) }} C</span>
                                        </div>
                                        <button class="hud-btn small vendor-buy-btn"
                                            :disabled="!canBuyVendorItem(itemId, fac.id)"
                                            @click="buyVendorItem(itemId, fac.id)">
                                            BUY
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </details>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>
