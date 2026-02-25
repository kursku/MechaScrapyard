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
            _pauseRenderTick: false,
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
    },
    methods: {
        renderBar,
        itemOver(e, it) { RollOver(e, it); },
        itemOut() { ItemOut(); },

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
            </div>

            <!-- Hardware Config Table -->
            <div class="hardware-table" v-if="frame && frame.parts">
                <div class="table-header">
                    <div class="col-mount">MOUNT_POINT</div>
                    <div class="col-status">DIAGNOSTICS</div>
                    <div class="col-int">INT</div>
                    <div class="col-equip">INSTALLED_MODULE</div>
                </div>
                
                <div v-for="(p, slotId) in frame.parts" :key="slotId" class="equip-row">
                    <div class="col-mount">
                        > {{ slotId.replace('_', ' ').toUpperCase() }}
                        <div class="mount-part-name">{{ p.name }}</div>
                    </div>
                    <div class="col-status">
                        <span class="slot-hp" :class="{ 'text-danger': p.hp < p.maxHp * 0.3 }">
                            HP: {{ renderBar ? renderBar(p.hp, p.maxHp, 10) : p.hp + '/' + p.maxHp }}
                        </span>
                        <span class="slot-cnd" :class="{ 'text-warning': p.condition < 0.5 }">
                            CND: {{ Math.round((p.condition || 0) * 100) }}%
                        </span>
                    </div>
                    <div class="col-int">x{{ p.integrity || 0 }}</div>
                    <div class="col-equip">
                        <template v-if="getLinkedEquipSlots(slotId).length">
                            <div class="mount-slot-list">
                                <div v-for="equipSlotId in getLinkedEquipSlots(slotId)" :key="equipSlotId" class="mount-slot-item">
                                    <div class="mount-slot-label">
                                        MOUNT: {{ equipSlotId.replace('_', ' ').toUpperCase() }}
                                    </div>
                                    <select class="hud-select"
                                            :value="frame.installedEquip && frame.installedEquip[equipSlotId] ? frame.installedEquip[equipSlotId] : ''"
                                            @focus="onMountSelectFocus"
                                            @blur="onMountSelectBlur"
                                            @change="onMountSelectChange(equipSlotId, $event)">
                                        <option value="">[ EMPTY_SLOT ]</option>
                                        <template v-if="getValidWeapons">
                                            <option v-for="w in getValidWeapons(equipSlotId)" :key="w.id" :value="w.id">
                                                {{ w.name ? w.name.toUpperCase() : w.id }}
                                            </option>
                                        </template>
                                    </select>
                                </div>
                            </div>
                        </template>
                        <span v-else class="text-dim no-mount-label">-- NO MOUNT --</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Inventory Deck -->
        <div class="inventory-deck hud-card-section" style="margin-top: 15px;">
            <h3 class="hud-section-title">> RECOVERED_INVENTORY</h3>
            <div class="hud-category-tabs" style="margin-bottom: 10px;">
                <div class="hud-tab" :class="{ active: selectedInventoryTab === 'frames' }" @click="selectedInventoryTab = 'frames'">FRAMES</div>
                <div class="hud-tab" :class="{ active: selectedInventoryTab === 'parts' }" @click="selectedInventoryTab = 'parts'">PARTS</div>
                <div class="hud-tab" :class="{ active: selectedInventoryTab === 'weapons' }" @click="selectedInventoryTab = 'weapons'">WEAPONS</div>
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
                <div v-if="!state.player.partsInventory || state.player.partsInventory.length === 0" class="empty-state">NO PARTS IN STORAGE</div>
                <div v-for="part in state.player.partsInventory" :key="part.id"
                     class="hud-task-card salvage-card"
                     :style="getPartMfrStyle(part)"
                     @mouseover="itemOver($event, part)" @mouseleave="itemOut">
                    <div class="hud-card-header">
                        <span v-if="getPartMfrIcon(part)" class="mfr-icon" :style="{ color: getPartMfrColor(part) }">{{ getPartMfrIcon(part) }}</span>
                        {{ part.name.toUpperCase() }}
                    </div>
                    <div class="salvage-meta" style="justify-content: space-between;">
                        <span>[{{ part.slot.toUpperCase() }}]</span>
                        <span class="mfr-tag" v-if="getPartMfrName(part)" :style="{ color: getPartMfrColor(part) }">{{ getPartMfrName(part) }}</span>
                        <span :class="{ worn: part.condition < 0.5 }">{{ Math.round(part.condition * 100) }}% CND</span>
                    </div>
                    <div class="hud-card-actions" style="margin-top: 8px; display: flex; gap: 5px;">
                        <button class="hud-btn small" @click="equipPart(part.slot, part)">EQUIP</button>
                        <button class="hud-btn small" @click="dismantlePart(part)">DISMANTLE</button>
                    </div>
                </div>
            </div>

            <!-- WEAPONS TAB -->
            <div v-else-if="selectedInventoryTab === 'weapons'" class="inventory-grid">
                <div v-if="state.player.inventory.weapons.length === 0" class="empty-state">NO WEAPONS IN STORAGE</div>
                <div v-for="weaponId in state.player.inventory.weapons" :key="weaponId"
                     class="hud-task-card salvage-card"
                     :style="state.items[weaponId]?.mfr ? { borderLeftColor: getMfrColor(state.items[weaponId].mfr) } : {}"
                     @mouseover="itemOver($event, state.items[weaponId])" @mouseleave="itemOut">
                    <template v-if="state.items[weaponId]">
                        <div class="hud-card-header">
                            <span v-if="getMfrIcon(state.items[weaponId].mfr)" class="mfr-icon" :style="{ color: getMfrColor(state.items[weaponId].mfr) }">{{ getMfrIcon(state.items[weaponId].mfr) }}</span>
                            {{ state.items[weaponId].name.toUpperCase() }}
                        </div>
                        <div class="salvage-meta">
                            <span>[{{ (state.items[weaponId].category || state.items[weaponId].slot || '').toUpperCase() }}]</span>
                            <span class="mfr-tag" v-if="getMfrName(state.items[weaponId].mfr)" :style="{ color: getMfrColor(state.items[weaponId].mfr) }">
                                {{ getMfrName(state.items[weaponId].mfr) }}
                            </span>
                        </div>
                        <div class="salvage-hint" style="margin-top: 8px;">EQUIP VIA RIG_CONFIG SLOT MENU ↑</div>
                    </template>
                </div>
            </div>
        </div>
    </section>
</template>
