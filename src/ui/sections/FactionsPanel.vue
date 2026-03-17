<script>
/**
 * FactionsPanel.vue — Extracted from TerminalUI.vue
 * Displays faction cards with reputation, alliance status, vendor access.
 * Follows props + emits pattern for Game interactions.
 */
import Game from "@/game";
import { renderBar, getAllianceLabel } from "@/ui/uiHelpers";

const OPEN_VENDORS = new Set();

export default {
    props: {
        /** @type {Array} Pre-computed faction objects from parent */
        factions: { type: Array, required: true },
        /** @type {Array} Unlocked contact objects */
        contacts: { type: Array, default: () => [] },
        /** @type {Object} Game state for item/vendor lookups */
        state: { type: Object, required: true },
    },
    data() {
        return {
            purchasingItems: new Set(),
            openVendors: OPEN_VENDORS,
        };
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
            if (this.purchasingItems.has(itemId)) return;
            this.purchasingItems.add(itemId);
            Game.buyFromVendor(itemId, factionId);
            this.$emit('vendor-buy');
            setTimeout(() => this.purchasingItems.delete(itemId), 400);
        },
        toggleVendor(facId) {
            if (this.openVendors.has(facId)) {
                this.openVendors.delete(facId);
            } else {
                this.openVendors.add(facId);
            }
        },
        isVendorOpen(facId) {
            return this.openVendors.has(facId);
        },
    },
};
</script>

<template>
    <section>
        <h3 class="hud-section-title">> REPUTATION & FACTIONS</h3>
        <div v-if="!factions.length" class="empty-state">
            &gt; NO FACTION CONTACTS — UNLOCK VIA STORY MISSIONS
        </div>
        <div class="factions-grid">
            <div v-for="fac in factions" :key="fac.id" class="faction-card"
                 :style="{
                    borderColor: fac.color,
                    background: `linear-gradient(180deg, transparent 0%, ${fac.color || '#ffffff'}1A 100%)`
                 }">
                <div class="faction-title" :style="{ color: fac.color }">
                    <span class="faction-icon-glow" :style="{ color: fac.color }">{{ fac.icon }}</span>
                    {{ fac.name.toUpperCase() }}
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
                    <div v-if="fac.nextTier" class="faction-rep-bar-track">
                        <div class="faction-rep-bar-fill" :style="{
                            width: ((fac.repValue - fac.currentTier.min) / (fac.nextTier.min - fac.currentTier.min) * 100) + '%',
                            background: fac.color,
                        }"></div>
                        <div class="faction-rep-segments"></div>
                    </div>
                    <div v-else class="hud-ascii-bar" :style="{ color: fac.color, marginBottom: '15px' }">
                        [ MAX REPUTATION REACHED ]
                    </div>

                    <div v-if="fac.currentTier.unlocks && fac.currentTier.unlocks.length" class="faction-perks">
                        <div class="faction-perks-title" :style="{ color: fac.color }">UNLOCKED:</div>
                        <div v-for="(perk, i) in fac.currentTier.unlocks.filter(u => !u.startsWith('bp_'))" :key="i" class="perk-item">
                            <span class="perk-bullet" :style="{ color: fac.color }">◆</span> {{ perk }}
                        </div>
                    </div>

                    <div class="faction-vendor" v-if="getFactionVendorCategories(fac).length">
                        <button type="button"
                                class="vendor-toggle"
                                :aria-expanded="isVendorOpen(fac.id)"
                                :aria-controls="'vendor-' + fac.id"
                                :style="{ '--fac-color': fac.color }"
                                @click="toggleVendor(fac.id)">
                            <span class="vendor-toggle-chevron" :class="{ open: isVendorOpen(fac.id) }">▶</span>
                            ACCESS VOR-X VENDOR (UNLOCKED)
                        </button>
                        <div v-if="isVendorOpen(fac.id)" class="vendor-content-slide" :id="'vendor-' + fac.id">
                            <div class="faction-vendor-scroll">
                                <div class="vendor-category" v-for="cat in getFactionVendorCategories(fac)" :key="cat.key">
                                    <div class="vendor-category-title">{{ cat.label }}</div>
                                    <div v-for="itemId in cat.items" :key="itemId" class="vendor-item-row">
                                        <div class="vendor-item-meta">
                                            <span class="vendor-item-name">{{ getVendorItem(itemId)?.name || itemId }}</span>
                                            <span class="vendor-item-cost">{{ getVendorItemCost(itemId) }} C</span>
                                        </div>
                                        <button class="vendor-buy-btn"
                                            :style="{ '--fac-color': fac.color }"
                                            :disabled="!canBuyVendorItem(itemId, fac.id) || purchasingItems.has(itemId)"
                                            @click="buyVendorItem(itemId, fac.id)">
                                            [ BUY ]
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- CONTACTS -->
        <div v-if="contacts.length > 0" class="contacts-section">
            <h3 class="hud-section-title">> CONTACT NETWORK</h3>
            <div v-for="c in contacts" :key="c.id" class="contact-row">
                <div class="contact-header">
                    <span class="contact-name">{{ c.name }}</span>
                    <span class="contact-spec">{{ c.specialty.replace(/_/g, ' ').toUpperCase() }}</span>
                </div>
                <div class="contact-desc">{{ c.desc }}</div>
                <div class="contact-loyalty-wrap">
                    <div class="contact-loyalty-bar">
                        <div class="loyalty-fill"
                            :class="{ active: c.loyalty >= c.benefit.threshold }"
                            :style="{ width: (c.loyalty / c.loyaltyMax * 100) + '%' }">
                        </div>
                    </div>
                    <span class="contact-loyalty-num">{{ c.loyalty }}/{{ c.loyaltyMax }}</span>
                </div>
                <div class="contact-benefit"
                    :class="{ 'contact-benefit--active': c.loyalty >= c.benefit.threshold }">
                    {{ c.loyalty >= c.benefit.threshold ? '◈ ' + c.benefit.effect : 'Build loyalty to unlock' }}
                </div>
                <div v-if="c.loyalty >= c.highLoyaltyBenefit.threshold" class="contact-benefit contact-benefit--high">
                    ◈◈ {{ c.highLoyaltyBenefit.effect }}
                </div>
            </div>
        </div>
        <div v-else class="contacts-empty">
            [ No contacts — build faction rep to establish connections ]
        </div>
    </section>
</template>

<style scoped>
/* ══ P3 FactionsPanel — Scoped CSS ════════════════════════════════════════ */

/* ── Faction card glow ────────────────────────────────────────────────── */
.faction-card {
    transition: box-shadow 0.3s ease-out;
}
.faction-card:hover {
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.04);
}
.faction-icon-glow {
    text-shadow: 0 0 10px currentColor;
    margin-right: 4px;
    font-size: 1.1em;
}

/* ── Rep progress bar ─────────────────────────────────────────────────── */
.faction-rep-bar-track {
    height: 6px;
    background: var(--bar-bg);
    border: 1px solid var(--bar-border);
    position: relative;
    margin-bottom: 15px;
}
.faction-rep-bar-fill {
    height: 100%;
    transition: width 0.4s ease-out;
    box-shadow: 0 0 8px rgba(255, 255, 255, 0.15);
}
.faction-rep-segments {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: repeating-linear-gradient(
        90deg,
        transparent,
        transparent 24%,
        rgba(0, 0, 0, 0.5) 24%,
        rgba(0, 0, 0, 0.5) 25%
    );
}

/* ── Perk items ───────────────────────────────────────────────────────── */
.perk-item {
    display: flex;
    align-items: baseline;
    gap: 6px;
}
.perk-bullet {
    font-size: 0.6em;
    text-shadow: 0 0 4px currentColor;
}

/* ── Vendor toggle (replaces <details>) ───────────────────────────────── */
.vendor-toggle {
    font-size: var(--font-size-xxs);
    font-family: var(--font-mono);
    color: var(--fac-color, var(--primary));
    letter-spacing: 1px;
    padding: 6px 8px;
    cursor: pointer;
    user-select: none;
    display: flex;
    align-items: center;
    gap: 6px;
    border: 1px dashed rgba(255, 255, 255, 0.1);
    transition: background 0.2s, border-color 0.2s;
}
.vendor-toggle:hover {
    background: rgba(255, 255, 255, 0.03);
    border-color: var(--fac-color, var(--primary));
}
.vendor-toggle-chevron {
    display: inline-block;
    font-size: 0.7em;
    transition: transform 0.2s ease-out;
}
.vendor-toggle-chevron.open {
    transform: rotate(90deg);
}

/* ── Vendor content ───────────────────────────────────────────────────── */
.vendor-content-slide {
    animation: vendor-slide-in 0.2s ease-out;
    padding: 8px;
    border: 1px dashed rgba(255, 255, 255, 0.06);
    border-top: none;
}
@keyframes vendor-slide-in {
    0%   { opacity: 0; max-height: 0; }
    100% { opacity: 1; max-height: 500px; }
}

/* ── Vendor buy button ────────────────────────────────────────────────── */
.vendor-buy-btn {
    background: transparent;
    border: 1px solid var(--fac-color, var(--primary));
    color: var(--fac-color, var(--primary));
    font-family: var(--font-mono);
    font-size: var(--font-size-xxs);
    padding: 2px 8px;
    min-height: 44px;
    cursor: pointer;
    letter-spacing: 1px;
    transition: all 0.15s;
}
.vendor-buy-btn:hover:not(:disabled) {
    background: var(--fac-color, var(--primary));
    color: #000;
}
.vendor-buy-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}

/* ── Vendor item row ──────────────────────────────────────────────────── */
.vendor-item-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}
.vendor-item-row:last-child {
    border-bottom: none;
}
.vendor-item-meta {
    display: flex;
    gap: 8px;
    align-items: baseline;
}
.vendor-item-name {
    font-size: var(--font-size-xxs);
    color: var(--text, #ccc);
}
.vendor-item-cost {
    font-size: var(--font-size-xxs);
    color: #f5c542;
    font-weight: bold;
}
.vendor-category-title {
    font-size: var(--font-size-xxs);
    letter-spacing: 1.5px;
    color: var(--text-dim);
    margin: 8px 0 4px;
    padding-bottom: 3px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

/* ── Contacts section ─────────────────────────────────────────────────── */
.contacts-section {
    margin-top: 16px;
    border-top: 1px solid var(--border-dim);
    padding-top: 8px;
}
.contacts-empty {
    font-size: var(--font-size-xxs);
    font-family: var(--font-mono);
    color: var(--text-dim);
    opacity: 0.45;
    letter-spacing: 0.06em;
    padding: 10px 0;
    margin-top: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
}
.contact-row {
    margin-bottom: 12px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--border-dim);
    transition: background 0.2s;
}
.contact-row:hover {
    background: rgba(255, 255, 255, 0.015);
}
.contact-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 2px;
}
.contact-name { font-size: var(--font-size-xxs); font-weight: bold; color: var(--text); }
.contact-spec { font-size: var(--font-size-micro); letter-spacing: 0.1em; color: var(--text-dim); }
.contact-desc { font-size: var(--font-size-micro); color: var(--text-faint); margin-bottom: 6px; }
.contact-loyalty-wrap {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
}
.contact-loyalty-bar {
    flex: 1;
    height: 4px;
    background: rgba(0, 0, 0, 0.2);
    position: relative;
}
.loyalty-fill {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    background: var(--text-dim);
    transition: width 0.3s;
}
.loyalty-fill.active {
    background: var(--color-success);
    box-shadow: 0 0 6px var(--color-success);
}
.contact-loyalty-num { font-size: var(--font-size-micro); color: var(--text-dim); white-space: nowrap; }
.contact-benefit { font-size: var(--font-size-micro); color: var(--text-faint); }
.contact-benefit--active { color: var(--color-success); text-shadow: 0 0 4px var(--color-success); }
.contact-benefit--high { color: var(--color-info); margin-top: 2px; text-shadow: 0 0 4px rgba(0, 170, 255, 0.3); }

/* ── Reduced motion ───────────────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
    .vendor-content-slide { animation: none; }
    .vendor-toggle-chevron { transition: none; }
}
</style>
