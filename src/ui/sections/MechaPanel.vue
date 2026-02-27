<script>
/**
 * MechaPanel.vue — Extracted from TerminalUI.vue
 * Displays rig config (chassis overview, hardware table, equip mounts)
 * and recovered inventory (frames, parts, weapons tabs).
 */
import Game from "@/game";
import { RollOver, ItemOut } from "@/ui/popups/itemPopup.vue";
import { renderBar } from "@/ui/uiHelpers";

export default {
    props: {
        state: { type: Object, required: true },
    },
    emits: ['action'],
    data() {
        return {
            renderTick: 0,
            selectedInventoryTab: 'frames',
            filterPartSlot: null,
            _pauseRenderTick: false,
            _dismantleTarget: null,
        };
    },
    mounted() {
        this._tick = setInterval(() => {
            if (!this._pauseRenderTick) this.renderTick++;
        }, 200);
    },
    beforeUnmount() {
        if (this._tick) clearInterval(this._tick);
    },
    computed: {
        frame() {
            this.renderTick;
            return this.state.player.frame;
        },
        chassis() {
            this.renderTick;
            return this.state.get(this.frame.chassisId);
        },
        partsBySlot() {
            const slotOrder = ['torso', 'left_arm', 'right_arm', 'legs'];
            const slotLabels = { torso: 'TORSO', left_arm: 'LEFT ARM', right_arm: 'RIGHT ARM', legs: 'LEGS' };
            const groups = {};
            for (const slot of slotOrder) {
                groups[slot] = {
                    label: slotLabels[slot] || slot.toUpperCase(),
                    parts: (this.state.player.partsInventory || []).filter(p => p.slot === slot),
                };
            }
            const knownSlots = new Set(slotOrder);
            const others = (this.state.player.partsInventory || []).filter(p => !knownSlots.has(p.slot));
            if (others.length > 0) groups['other'] = { label: 'OTHER', parts: others };
            if (this.filterPartSlot) {
                const filtered = {};
                if (groups[this.filterPartSlot]) filtered[this.filterPartSlot] = groups[this.filterPartSlot];
                return filtered;
            }
            return groups;
        },
        slotLayout() {
            const defs = [
                { id: 'torso',     label: 'TORSO',     gridArea: 'torso' },
                { id: 'left_arm',  label: 'LEFT ARM',  gridArea: 'larm'  },
                { id: 'right_arm', label: 'RIGHT ARM', gridArea: 'rarm'  },
                { id: 'legs',      label: 'LEGS',      gridArea: 'legs'  },
            ];
            return defs.map(d => ({
                ...d,
                part: this.frame?.parts?.[d.id] || null,
            }));
        },
        mountSlots() {
            this.renderTick;
            const chassis = this.state.get(this.frame?.chassisId);
            if (!chassis?.equipSlots) return [];
            return Object.keys(chassis.equipSlots).map(k => ({ id: k }));
        },
        installedWeaponIds() {
            const equip = this.frame?.installedEquip || {};
            return new Set(Object.values(equip).filter(Boolean));
        },
    },
    methods: {
        renderBar,
        itemOver(e, it) { RollOver(e, it); },
        itemOut() { ItemOut(); },
        getInstalledPartForSlot(slot) {
            return this.frame?.parts?.[slot] || null;
        },
        itemOverPart(e, part) {
            const installed = this.getInstalledPartForSlot(part.slot);
            RollOver(e, part, { compare: installed });
        },

        // --- Slot grid ---
        jumpToPartSlot(slotId) {
            this.selectedInventoryTab = 'parts';
            this.filterPartSlot = slotId;
        },

        // --- Equipment ---
        getValidWeapons(slotId) {
            this.renderTick;
            const chassis = this.state.get(this.frame.chassisId);
            if (!chassis || !chassis.equipSlots || !chassis.equipSlots[slotId]) return [];
            const accepts = chassis.equipSlots[slotId].accepts;
            return Object.values(this.state.items).filter(i => {
                if (!i.owned) return false;
                if (accepts === 'backpack') return i.type === 'backpack';
                if (accepts === 'utility') return i.type === 'module' || i.slot === 'utility';
                return i.type === 'weapon' && i.slot === accepts;
            });
        },
        equipItem(slotId, event) {
            Game.equipItem(slotId, event.target.value);
        },
        onMountSelectFocus() {
            this._pauseRenderTick = true;
        },
        onMountSelectBlur() {
            this._pauseRenderTick = false;
        },
        onMountSelectChange(slotId, event) {
            this.equipItem(slotId, event);
            this._pauseRenderTick = false;
            this.renderTick++;
        },
        getLinkedEquipSlots(partSlotId) {
            const chassis = this.state.get(this.frame.chassisId);
            if (!chassis || !chassis.equipSlots) return [];
            return Object.keys(chassis.equipSlots).filter(k => chassis.equipSlots[k].linkedPart === partSlotId);
        },
        equipFrame(frameId) {
            Game.equipFrame(frameId);
            this.renderTick++;
            this.$emit('action');
        },
        equipPart(slot, partObj) {
            if (typeof partObj === 'string') {
                partObj = this.state.player.partsInventory.find(p => p.id === partObj);
            }
            if (!partObj) return;
            Game.equipPart(slot, partObj);
            this.renderTick++;
            this.$emit('action');
        },
        dismantlePart(part) {
            Game.dismantlePart(part);
            this.$emit('action');
        },
        confirmDismantle(part) {
            this.dismantlePart(part);
            this._dismantleTarget = null;
        },

        // --- Manufacturer helpers ---
        _getMfr(mfrId) {
            if (!mfrId) return null;
            return this.state.items[mfrId] || null;
        },
        getMfrColor(mfrId) {
            const m = this._getMfr(mfrId);
            return m?.color || 'var(--primary)';
        },
        getMfrIcon(mfrId) {
            const m = this._getMfr(mfrId);
            return m?.icon || null;
        },
        getMfrName(mfrId) {
            const m = this._getMfr(mfrId);
            return m?.name || null;
        },
        getPartMfrColor(part) {
            const tpl = this.state.items[part.templateId || part.id];
            return this.getMfrColor(tpl?.mfr || part.mfr);
        },
        getPartMfrIcon(part) {
            const tpl = this.state.items[part.templateId || part.id];
            return this.getMfrIcon(tpl?.mfr || part.mfr);
        },
        getPartMfrName(part) {
            const tpl = this.state.items[part.templateId || part.id];
            return this.getMfrName(tpl?.mfr || part.mfr);
        },
        getPartMfrStyle(part) {
            const color = this.getPartMfrColor(part);
            if (color && color !== 'var(--primary)') return { borderLeftColor: color };
            return {};
        },
    },
};
</script>

<template>
    <section class="pilot-console">
        <!-- Mecha BIOS Config -->
        <div class="mecha-deck panel-container">
            <h3 class="hud-section-title">> RIG_CONFIG: [ {{ chassis && chassis.category ? chassis.category.toUpperCase() : 'UNKNOWN' }} CHASSIS ]</h3>
            
            <!-- Chassis Overview Top Bar -->
            <div class="chassis-overview" v-if="frame && frame.attributes">
                <div class="stat-box">
                    <span class="stat-label">MODEL</span>
                    <span class="stat-val">{{ chassis && chassis.name ? chassis.name.toUpperCase() : 'UNKNOWN' }}</span>
                </div>
                <div class="stat-box">
                    <span class="stat-label">ATK</span>
                    <span class="stat-val text-success">{{ frame.attributes.atk || 0 }}</span>
                </div>
                <div class="stat-box">
                    <span class="stat-label">DEF</span>
                    <span class="stat-val text-info">{{ frame.attributes.def || 0 }}</span>
                </div>
                <div class="stat-box">
                    <span class="stat-label">ENR</span>
                    <span class="stat-val text-warning">{{ frame.attributes.enr || 0 }}</span>
                </div>
                <div class="stat-box">
                    <span class="stat-label">COR</span>
                    <span class="stat-val text-corruption">{{ frame.attributes.cor || 0 }}</span>
                </div>
            </div>
            <div
                class="energy-hint"
                v-if="(state.items.energy?.val || 0) < 20"
                title="Energy regenerates over time. Increase your cap by building base upgrades."
            >
                [ENR] {{ Math.floor(state.items.energy?.val || 0) }}/{{ state.items.energy?.max || 0 }}
                <span class="hint-text">[ regenerates passively ]</span>
            </div>

            <!-- Rig Slot Grid -->
            <div class="rig-grid" v-if="frame">
                <div v-for="slot in slotLayout" :key="slot.id"
                     class="rig-cell" :style="{ gridArea: slot.gridArea }">
                    <div class="rig-cell-label">{{ slot.label }}</div>
                    <template v-if="slot.part">
                        <div class="rig-part-name">{{ slot.part.name.toUpperCase() }}</div>
                        <div class="rig-part-hp" :class="{ 'text-danger': slot.part.hp < slot.part.maxHp * 0.3 }">
                            HP {{ renderBar(slot.part.hp, slot.part.maxHp, 8) }}
                        </div>
                        <div class="rig-part-cnd" :class="{ 'text-warning': slot.part.condition < 0.5 }">
                            CND {{ Math.round((slot.part.condition || 0) * 100) }}%
                        </div>
                        <button class="hud-btn micro" @click="jumpToPartSlot(slot.id)">SWAP</button>
                    </template>
                    <div v-else class="rig-cell-empty">-- EMPTY --</div>
                </div>
            </div>

            <!-- Mount Points -->
            <div class="mount-points" v-if="frame && mountSlots.length">
                <div class="table-header"><div>MOUNT_POINTS</div></div>
                <div v-for="ms in mountSlots" :key="ms.id" class="mount-slot-row">
                    <div class="mount-slot-label">MOUNT: {{ ms.id.replace(/_/g, ' ').toUpperCase() }}</div>
                    <select class="hud-select"
                            :value="frame.installedEquip?.[ms.id] || ''"
                            @focus="onMountSelectFocus"
                            @blur="onMountSelectBlur"
                            @change="onMountSelectChange(ms.id, $event)">
                        <option value="">[ EMPTY_SLOT ]</option>
                        <option v-for="w in getValidWeapons(ms.id)" :key="w.id" :value="w.id">
                            {{ w.name ? w.name.toUpperCase() : w.id }}
                        </option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Inventory Deck -->
        <div class="inventory-deck hud-card-section" style="margin-top: 15px;">
            <h3 class="hud-section-title">> RECOVERED_INVENTORY</h3>
            <div class="hud-category-tabs" style="margin-bottom: 10px;">
                <div class="hud-tab" :class="{ active: selectedInventoryTab === 'frames' }" @click="selectedInventoryTab = 'frames'">
                    FRAMES ({{ state.player.inventory.frames.length }})
                </div>
                <div class="hud-tab" :class="{ active: selectedInventoryTab === 'parts' }" @click="selectedInventoryTab = 'parts'">
                    PARTS ({{ state.player.partsInventory?.length || 0 }})
                </div>
                <div class="hud-tab" :class="{ active: selectedInventoryTab === 'weapons' }" @click="selectedInventoryTab = 'weapons'">
                    WEAPONS ({{ state.player.inventory.weapons.length }})
                </div>
            </div>

            <!-- FRAMES TAB -->
            <div v-if="selectedInventoryTab === 'frames'" class="inventory-grid">
                <div v-if="state.player.inventory.frames.length === 0" class="empty-state">NO FRAMES IN STORAGE</div>
                <div v-for="frameId in state.player.inventory.frames" :key="frameId"
                     class="hud-task-card salvage-card"
                     :style="state.items[frameId]?.mfr ? { borderLeftColor: getMfrColor(state.items[frameId].mfr) } : {}"
                     @mouseover="itemOver($event, state.items[frameId])" @mouseleave="itemOut">
                    <template v-if="state.items[frameId]">
                        <div class="hud-card-header">
                            <span v-if="getMfrIcon(state.items[frameId].mfr)" class="mfr-icon" :style="{ color: getMfrColor(state.items[frameId].mfr) }">{{ getMfrIcon(state.items[frameId].mfr) }}</span>
                            {{ state.items[frameId].name.toUpperCase() }}
                        </div>
                        <div class="salvage-meta">
                            <span>[{{ state.items[frameId].category.toUpperCase() }}]</span>
                            <span class="mfr-tag" v-if="getMfrName(state.items[frameId].mfr)" :style="{ color: getMfrColor(state.items[frameId].mfr) }">
                                {{ getMfrName(state.items[frameId].mfr) }}
                            </span>
                        </div>
                        <div class="frame-stats-mini" style="display: flex; gap: 8px; margin-top: 4px; font-size: 0.75rem;">
                            <span class="text-success">ATK:{{ state.items[frameId].baseStats?.base_atk || '?' }}</span>
                            <span class="text-info">DEF:{{ state.items[frameId].baseStats?.base_def || '?' }}</span>
                            <span class="text-warning">ENR:{{ state.items[frameId].baseStats?.base_enr || '?' }}</span>
                        </div>
                        <div class="hud-card-actions" style="margin-top: 8px;">
                            <button class="hud-btn small" :disabled="frame.chassisId === frameId" @click="equipFrame(frameId)">
                                {{ frame.chassisId === frameId ? '◆ EQUIPPED' : 'EQUIP CHASSIS' }}
                            </button>
                        </div>
                    </template>
                </div>
            </div>

            <!-- PARTS TAB -->
            <div v-else-if="selectedInventoryTab === 'parts'" class="inventory-grid">
                <div v-if="filterPartSlot" class="slot-filter-bar">
                    SHOWING: {{ filterPartSlot.replace(/_/g, ' ').toUpperCase() }} PARTS ONLY
                    <button class="hud-btn micro" @click="filterPartSlot = null">SHOW ALL</button>
                </div>
                <div v-if="!state.player.partsInventory || state.player.partsInventory.length === 0" class="empty-state">NO PARTS IN STORAGE</div>
                <template v-for="(group, slotKey) in partsBySlot" :key="slotKey">
                    <div v-if="group.parts.length > 0" class="slot-group-header">
                        {{ group.label }} ({{ group.parts.length }})
                    </div>
                    <div v-for="part in group.parts" :key="part.id"
                         class="hud-task-card salvage-card"
                         :style="getPartMfrStyle(part)"
                         @mouseover="itemOverPart($event, part)" @mouseleave="itemOut">
                        <div class="hud-card-header">
                            <span v-if="getPartMfrIcon(part)" class="mfr-icon" :style="{ color: getPartMfrColor(part) }">{{ getPartMfrIcon(part) }}</span>
                            {{ part.name.toUpperCase() }}
                        </div>
                        <div class="salvage-meta" style="justify-content: space-between;">
                            <span>[{{ part.slot.toUpperCase() }}]</span>
                            <span class="mfr-tag" v-if="getPartMfrName(part)" :style="{ color: getPartMfrColor(part) }">{{ getPartMfrName(part) }}</span>
                            <span :class="{ worn: part.condition < 0.5 }">{{ Math.round(part.condition * 100) }}% CND</span>
                        </div>
                        <div class="hud-card-actions" style="margin-top: 8px; display: flex; gap: 5px; align-items: center;">
                            <button class="hud-btn small" @click="equipPart(part.slot, part)">EQUIP</button>
                            <template v-if="_dismantleTarget === part.id">
                                <span class="dismantle-confirm-label">CONFIRM?</span>
                                <button class="hud-btn small danger" @click="confirmDismantle(part)">YES</button>
                                <button class="hud-btn small" @click="_dismantleTarget = null">NO</button>
                            </template>
                            <button v-else class="hud-btn small" @click="_dismantleTarget = part.id">DISMANTLE</button>
                        </div>
                    </div>
                </template>
            </div>

            <!-- WEAPONS TAB -->
            <div v-else-if="selectedInventoryTab === 'weapons'" class="inventory-grid">
                <div v-if="state.player.inventory.weapons.length === 0" class="empty-state">NO WEAPONS IN STORAGE</div>
                <div v-for="weaponId in state.player.inventory.weapons" :key="weaponId"
                     class="hud-task-card salvage-card"
                     :class="{ 'is-installed': installedWeaponIds.has(weaponId) }"
                     :style="state.items[weaponId]?.mfr ? { borderLeftColor: getMfrColor(state.items[weaponId].mfr) } : {}"
                     @mouseover="itemOver($event, state.items[weaponId])" @mouseleave="itemOut">
                    <template v-if="state.items[weaponId]">
                        <div class="hud-card-header">
                            <span v-if="getMfrIcon(state.items[weaponId].mfr)" class="mfr-icon" :style="{ color: getMfrColor(state.items[weaponId].mfr) }">{{ getMfrIcon(state.items[weaponId].mfr) }}</span>
                            {{ state.items[weaponId].name.toUpperCase() }}
                            <span v-if="installedWeaponIds.has(weaponId)" class="installed-badge">INSTALLED</span>
                        </div>
                        <div class="salvage-meta">
                            <span>[{{ (state.items[weaponId].category || state.items[weaponId].slot || '').toUpperCase() }}]</span>
                            <span class="mfr-tag" v-if="getMfrName(state.items[weaponId].mfr)" :style="{ color: getMfrColor(state.items[weaponId].mfr) }">
                                {{ getMfrName(state.items[weaponId].mfr) }}
                            </span>
                        </div>
                        <div class="salvage-hint" v-if="!installedWeaponIds.has(weaponId)" style="margin-top: 8px;">EQUIP VIA RIG_CONFIG SLOT MENU ↑</div>
                        <div class="salvage-hint installed" v-else style="margin-top: 8px;">CURRENTLY INSTALLED IN RIG</div>
                    </template>
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped>
.text-corruption { color: #c070ff; }

.energy-hint {
    font-size: 10px;
    color: var(--text-dim);
    letter-spacing: 1px;
    margin-top: 6px;
    padding: 4px 8px;
    border: 1px dashed rgba(255, 200, 0, 0.2);
    display: inline-flex;
    gap: 8px;
    align-items: center;
}
.energy-hint .hint-text {
    opacity: 0.5;
    font-size: 9px;
}

.dismantle-confirm-label {
    font-size: 10px;
    color: var(--error);
    letter-spacing: 1px;
    margin-right: 4px;
}
.hud-btn.small.danger {
    border-color: var(--error);
    color: var(--error);
}
.hud-btn.small.danger:hover {
    background: var(--error);
    color: #000;
}

/* Parts slot grouping */
.slot-group-header {
    font-size: 10px;
    color: var(--text-dim);
    letter-spacing: 2px;
    padding: 4px 0 2px;
    border-bottom: 1px solid var(--border-dim);
    margin-bottom: 6px;
    margin-top: 10px;
}

/* Installed weapon badge */
.installed-badge {
    font-size: 9px;
    color: var(--primary);
    border: 1px solid var(--primary);
    padding: 1px 4px;
    letter-spacing: 1px;
    margin-left: auto;
}
.salvage-card.is-installed {
    border-left-color: var(--primary);
    background: rgba(0, 255, 170, 0.03);
}
.salvage-hint.installed {
    color: var(--primary);
    opacity: 0.6;
}

/* Rig slot grid */
.rig-grid {
    display: grid;
    grid-template-areas:
        "larm torso rarm"
        ". legs .";
    grid-template-columns: 1fr 1.5fr 1fr;
    gap: 6px;
    margin-bottom: 12px;
}

.rig-cell {
    border: 1px solid var(--border-dim);
    padding: 8px;
    font-size: 11px;
    min-height: 70px;
    display: flex;
    flex-direction: column;
    gap: 3px;
}

.rig-cell-label {
    font-size: 9px;
    color: var(--text-dim);
    letter-spacing: 2px;
    margin-bottom: 4px;
}

.rig-part-name {
    color: var(--text-bright, #fff);
    font-size: 11px;
}

.rig-part-hp,
.rig-part-cnd {
    font-size: 10px;
    color: var(--text-dim);
    font-family: var(--font-mono, monospace);
}

.rig-cell-empty {
    color: var(--text-dim);
    font-size: 10px;
    font-style: italic;
}

.hud-btn.micro {
    font-size: 9px;
    padding: 2px 6px;
    margin-top: auto;
    align-self: flex-start;
    letter-spacing: 1px;
}

/* Mount points section */
.mount-points {
    margin-top: 4px;
}

.mount-slot-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 0;
    border-bottom: 1px solid var(--border-dim);
    font-size: 11px;
}

.mount-slot-row .mount-slot-label {
    min-width: 140px;
    color: var(--text-dim);
    letter-spacing: 1px;
}

/* PARTS tab slot filter bar */
.slot-filter-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 10px;
    color: var(--secondary, #ff0);
    letter-spacing: 1px;
    padding: 4px 8px;
    border: 1px solid rgba(255, 220, 0, 0.3);
    margin-bottom: 8px;
}
</style>
