<script>
/**
 * MechaPanel.vue - Extracted from TerminalUI.vue
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
            activeSubTab: 'rig',
            storageActiveTab: 'parts',
            viewMode: 'compact',
            storageSlotFilter: null,
            compareFrame: null,
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
            return this.state.get(this.frame?.chassisId);
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
        rigStats() {
            const attrs = this.frame?.attributes || {};
            const max = 30;
            return ['atk', 'def', 'enr', 'cor'].map(k => ({
                key: k,
                val: attrs[k] || 0,
                pct: Math.min(100, ((attrs[k] || 0) / max) * 100),
            }));
        },
        filteredPartsForStorage() {
            let parts = this.state.player.partsInventory || [];
            if (this.storageSlotFilter) parts = parts.filter(p => p.slot === this.storageSlotFilter);
            return parts;
        },
        compareStats() {
            if (!this.compareFrame || !this.state.items[this.compareFrame]) return null;
            const cur = this.frame?.attributes || {};
            const cmp = this.state.items[this.compareFrame]?.baseStats || {};
            return {
                atk: (cmp.base_atk || 0) - (cur.atk || 0),
                def: (cmp.base_def || 0) - (cur.def || 0),
                enr: (cmp.base_enr || 0) - (cur.enr || 0),
            };
        },
        isPartEquipped() {
            const equipped = new Set();
            if (this.frame?.parts) {
                Object.values(this.frame.parts).forEach(p => {
                    if (p.id) equipped.add(p.id);
                    if (p.templateId) equipped.add(p.templateId);
                });
            }
            return equipped;
        },
        activeSynergy() {
            this.renderTick;
            return Game._getManufacturerSynergy ? Game._getManufacturerSynergy() : null;
        },
    },
    methods: {
        renderBar,
        itemOver(e, it) { RollOver(e, it); },
        itemOut() { ItemOut(); },
        switchLoadout(slot) { Game.switchLoadout(slot); },
        conditionLabel(cnd) {
            const v = Math.round((cnd || 0) * 100);
            if (v >= 90) return 'PRISTINE';
            if (v >= 70) return 'GOOD';
            if (v >= 50) return 'WORN';
            if (v >= 30) return 'DAMAGED';
            if (v >= 10) return 'CRITICAL';
            return 'BROKEN';
        },
        conditionClass(cnd) {
            const v = Math.round((cnd || 0) * 100);
            if (v >= 70) return 'cnd-good';
            if (v >= 50) return 'cnd-worn';
            if (v >= 30) return 'cnd-damaged';
            return 'cnd-critical';
        },
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

        <!-- Sub-tab navigation bar -->
        <div class="mecha-subtabs">
            <button :class="['msubt-btn', { active: activeSubTab === 'rig' }]" @click="activeSubTab = 'rig'">◈ RIG</button>
            <button :class="['msubt-btn', { active: activeSubTab === 'hangar' }]" @click="activeSubTab = 'hangar'">▣ HANGAR</button>
            <button :class="['msubt-btn', { active: activeSubTab === 'storage' }]" @click="activeSubTab = 'storage'">⊞ STORAGE</button>
        </div>

        <!-- RIG TAB: 2-column layout, chassis stats left, mounts right -->
        <div v-if="activeSubTab === 'rig'" class="rig-layout">

            <!-- LEFT: Chassis info, CSS stat bars, body slot grid -->
            <div class="rig-left">
                <div class="rig-chassis-header" v-if="chassis">
                    <div class="rig-chassis-name">{{ chassis.name ? chassis.name.toUpperCase() : 'UNKNOWN' }} <span class="rig-chassis-cat">[{{ chassis.category ? chassis.category.toUpperCase() : '?' }}]</span></div>
                    <div class="rig-chassis-mfr" v-if="getMfrName(chassis.mfr)">{{ getMfrName(chassis.mfr) }}</div>
                </div>

                <div class="rig-stats" v-if="frame && frame.attributes">
                    <div v-for="s in rigStats" :key="s.key" class="rig-stat-row">
                        <span class="rig-stat-label" :class="'stat-' + s.key">{{ s.key.toUpperCase() }}</span>
                        <div class="rig-stat-bar">
                            <div class="rig-stat-fill" :class="'fill-' + s.key" :style="{ width: s.pct + '%' }"></div>
                        </div>
                        <span class="rig-stat-val">{{ typeof s.val === 'number' ? s.val.toFixed(1) : s.val }}</span>
                    </div>
                </div>

                <div class="rig-grid" v-if="frame">
                    <div v-for="slot in slotLayout" :key="slot.id" class="rig-cell" :style="{ gridArea: slot.gridArea }">
                        <div class="rig-cell-label">{{ slot.label }}</div>
                        <template v-if="slot.part">
                            <div class="rig-part-name" :style="getPartMfrStyle(slot.part)">{{ slot.part.name ? slot.part.name.toUpperCase() : '' }}</div>
                            <div class="rig-part-hp" :class="{ 'text-danger': slot.part.hp < slot.part.maxHp * 0.3 }">
                                HP {{ renderBar(slot.part.hp, slot.part.maxHp, 8) }}
                            </div>
                            <div class="rig-part-cnd" :class="conditionClass(slot.part.condition)">{{ conditionLabel(slot.part.condition) }}</div>
                            <button class="hud-btn micro" @click="activeSubTab = 'storage'; storageActiveTab = 'parts'; storageSlotFilter = slot.id">SWAP</button>
                        </template>
                        <div v-else class="rig-cell-empty">
                            -- EMPTY --
                            <button class="hud-btn micro" @click="activeSubTab = 'storage'; storageActiveTab = 'parts'; storageSlotFilter = slot.id">ADD</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- RIGHT: Mount points, synergy, loadout -->
            <div class="rig-right">
                <div class="rig-right-section">
                    <div class="hud-section-title">> MOUNT_POINTS</div>
                    <div v-if="frame && mountSlots.length">
                        <div v-for="ms in mountSlots" :key="ms.id" class="mount-slot-row">
                            <div class="mount-slot-label">MOUNT: {{ ms.id.replace(/_/g, ' ').toUpperCase() }}</div>
                            <select class="hud-select"
                                    :value="frame.installedEquip ? frame.installedEquip[ms.id] || '' : ''"
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
                    <div v-else class="rig-cell-empty">No mount points on this chassis.</div>
                </div>

                <div v-if="activeSynergy" class="synergy-badge rig-synergy">
                    <span>◈ {{ activeSynergy.mfr.replace(/_/g, ' ').toUpperCase() }} SYNERGY</span>
                    <span class="synergy-level">{{ activeSynergy.level.toUpperCase() }} ({{ activeSynergy.count }}/4)</span>
                </div>

                <div v-if="state.g.hangar_operacional > 0" class="rig-right-section loadout-switcher">
                    <span class="loadout-label">LOADOUT</span>
                    <button v-for="slot in ['primary', 'secondary']" :key="slot"
                            :class="['hud-btn', 'micro', { active: state.loadouts.active === slot }]"
                            @click="switchLoadout(slot)">{{ state.loadouts[slot].name || slot.toUpperCase() }}</button>
                </div>

                <div class="energy-hint" v-if="(state.items.energy ? state.items.energy.val || 0 : 0) < 20"
                     title="Energy regenerates over time. Increase your cap by building base upgrades.">
                    [ENR] {{ Math.floor(state.items.energy ? state.items.energy.val || 0 : 0) }}/{{ state.items.energy ? state.items.energy.max || 0 : 0 }}
                    <span class="hint-text">[ regenerates passively ]</span>
                </div>
            </div>
        </div>

        <!-- HANGAR TAB: Active frame strip + frame grid with stat compare -->
        <div v-else-if="activeSubTab === 'hangar'" class="hangar-view">

            <div class="hangar-active-strip" v-if="chassis">
                <span class="has-label">◆ ACTIVE</span>
                <span class="has-name">{{ chassis.name ? chassis.name.toUpperCase() : 'UNKNOWN' }} [{{ chassis.category ? chassis.category.toUpperCase() : '?' }}]</span>
                <span class="has-mfr" v-if="getMfrName(chassis.mfr)">— {{ getMfrName(chassis.mfr) }}</span>
                <div class="has-stats" v-if="frame && frame.attributes">
                    <span>ATK:{{ frame.attributes.atk || 0 }}</span>
                    <span>DEF:{{ frame.attributes.def || 0 }}</span>
                    <span>ENR:{{ frame.attributes.enr || 0 }}</span>
                </div>
            </div>

            <div class="hud-section-title" style="margin: 10px 0 6px;">
                > FRAMES IN STORAGE ({{ (state.player.inventory?.frames || []).length }})
            </div>

            <div v-if="(state.player.inventory?.frames || []).length === 0" class="empty-state">NO FRAMES IN STORAGE</div>
            <div v-else class="hangar-grid">
                <div v-for="frameId in (state.player.inventory?.frames || [])" :key="frameId"
                     class="hangar-frame-card"
                     :class="{ 'is-active': frame?.chassisId === frameId }"
                     :style="state.items[frameId] && state.items[frameId].mfr ? { borderLeftColor: getMfrColor(state.items[frameId].mfr) } : {}"
                     @mouseover="compareFrame = frameId; itemOver($event, state.items[frameId])"
                     @mouseleave="compareFrame = null; itemOut()">
                    <template v-if="state.items[frameId]">
                        <div class="hf-name">
                            <span v-if="getMfrIcon(state.items[frameId].mfr)" class="mfr-icon" :style="{ color: getMfrColor(state.items[frameId].mfr) }">{{ getMfrIcon(state.items[frameId].mfr) }}</span>
                            {{ state.items[frameId].name ? state.items[frameId].name.toUpperCase() : frameId }}
                        </div>
                        <div class="hf-cat">[{{ state.items[frameId].category ? state.items[frameId].category.toUpperCase() : '?' }}]
                            <span class="mfr-tag" v-if="getMfrName(state.items[frameId].mfr)" :style="{ color: getMfrColor(state.items[frameId].mfr) }">{{ getMfrName(state.items[frameId].mfr) }}</span>
                        </div>
                        <div class="hf-stats">
                            <span class="text-success">ATK:{{ state.items[frameId].baseStats ? state.items[frameId].baseStats.base_atk || '?' : '?' }}</span>
                            <span class="text-info">DEF:{{ state.items[frameId].baseStats ? state.items[frameId].baseStats.base_def || '?' : '?' }}</span>
                            <span class="text-warning">ENR:{{ state.items[frameId].baseStats ? state.items[frameId].baseStats.base_enr || '?' : '?' }}</span>
                        </div>
                        <div v-if="compareFrame === frameId && compareStats && frame?.chassisId !== frameId" class="hf-compare">
                            <span v-if="compareStats.atk !== 0" :class="compareStats.atk > 0 ? 'delta-pos' : 'delta-neg'">ATK{{ compareStats.atk > 0 ? '+' : '' }}{{ compareStats.atk.toFixed(1) }}</span>
                            <span v-if="compareStats.def !== 0" :class="compareStats.def > 0 ? 'delta-pos' : 'delta-neg'">DEF{{ compareStats.def > 0 ? '+' : '' }}{{ compareStats.def.toFixed(1) }}</span>
                            <span v-if="compareStats.enr !== 0" :class="compareStats.enr > 0 ? 'delta-pos' : 'delta-neg'">ENR{{ compareStats.enr > 0 ? '+' : '' }}{{ compareStats.enr.toFixed(1) }}</span>
                        </div>
                        <button class="hud-btn small" :disabled="frame?.chassisId === frameId" @click="equipFrame(frameId)">
                            {{ frame?.chassisId === frameId ? '◆ EQUIPPED' : 'EQUIP CHASSIS' }}
                        </button>
                    </template>
                </div>
            </div>
        </div>

        <!-- STORAGE TAB: Parts + Weapons with compact/card toggle -->
        <div v-else-if="activeSubTab === 'storage'" class="storage-view">

            <div class="storage-inner-tabs">
                <button :class="['storage-tab-btn', { active: storageActiveTab === 'parts' }]"
                        @click="storageActiveTab = 'parts'; storageSlotFilter = null">PARTS ({{ state.player.partsInventory ? state.player.partsInventory.length : 0 }})</button>
                <button :class="['storage-tab-btn', { active: storageActiveTab === 'weapons' }]"
                        @click="storageActiveTab = 'weapons'; storageSlotFilter = null">WEAPONS ({{ (state.player.inventory?.weapons || []).length }})</button>
                <div class="storage-view-toggle">
                    <button :class="['view-btn', { active: viewMode === 'compact' }]" @click="viewMode = 'compact'" title="Compact rows">▤</button>
                    <button :class="['view-btn', { active: viewMode === 'card' }]" @click="viewMode = 'card'" title="Card view">⊞</button>
                </div>
            </div>

            <!-- PARTS -->
            <div v-if="storageActiveTab === 'parts'">
                <div class="storage-filter-bar">
                    <span class="filter-label">SLOT:</span>
                    <button v-for="sf in [['ALL', null], ['TORSO', 'torso'], ['L ARM', 'left_arm'], ['R ARM', 'right_arm'], ['LEGS', 'legs']]"
                            :key="sf[0]"
                            :class="['slot-filter-btn', { active: storageSlotFilter === sf[1] }]"
                            @click="storageSlotFilter = sf[1]">{{ sf[0] }}</button>
                </div>

                <div v-if="!state.player.partsInventory || state.player.partsInventory.length === 0" class="empty-state">NO PARTS IN STORAGE</div>

                <!-- Compact rows mode -->
                <template v-if="viewMode === 'compact'">
                    <template v-for="(group, slotKey) in partsBySlot" :key="slotKey">
                        <template v-if="!storageSlotFilter || storageSlotFilter === slotKey">
                            <div v-if="group.parts.length > 0" class="storage-group-header">{{ group.label }} ({{ group.parts.length }})</div>
                            <div v-for="part in group.parts" :key="part.id"
                                 class="storage-row"
                                 :class="{ 'row-equipped': isPartEquipped.has(part.id) }"
                                 @mouseover="itemOverPart($event, part)" @mouseleave="itemOut()">
                                <span class="sr-name">
                                    <span v-if="isPartEquipped.has(part.id)" class="sr-equipped-dot">◆</span>
                                    {{ part.name ? part.name.toUpperCase() : part.id }}
                                </span>
                                <span class="sr-slot">[{{ part.slot ? part.slot.replace(/_/g, ' ').toUpperCase() : '' }}]</span>
                                <span class="sr-mfr" v-if="getPartMfrName(part)" :style="{ color: getPartMfrColor(part) }">{{ getPartMfrName(part) }}</span>
                                <span class="sr-cnd" :class="conditionClass(part.condition)">{{ conditionLabel(part.condition) }}</span>
                                <div class="sr-actions">
                                    <template v-if="_dismantleTarget === part.id">
                                        <span class="dismantle-confirm-label">OK?</span>
                                        <button class="hud-btn micro danger" @click="confirmDismantle(part)">YES</button>
                                        <button class="hud-btn micro" @click="_dismantleTarget = null">NO</button>
                                    </template>
                                    <template v-else>
                                        <button class="hud-btn micro" :disabled="isPartEquipped.has(part.id)" @click="equipPart(part.slot, part)">
                                            {{ isPartEquipped.has(part.id) ? 'INSTLD' : 'EQUIP' }}
                                        </button>
                                        <button class="hud-btn micro" @click="_dismantleTarget = part.id" title="Dismantle">✂</button>
                                    </template>
                                </div>
                            </div>
                        </template>
                    </template>
                </template>

                <!-- Card mode -->
                <template v-else>
                    <div class="inventory-grid">
                        <template v-for="(group, slotKey) in partsBySlot" :key="slotKey">
                            <template v-if="!storageSlotFilter || storageSlotFilter === slotKey">
                                <div v-if="group.parts.length > 0" class="slot-group-header">{{ group.label }} ({{ group.parts.length }})</div>
                                <div v-for="part in group.parts" :key="part.id"
                                     class="hud-task-card salvage-card"
                                     :style="getPartMfrStyle(part)"
                                     @mouseover="itemOverPart($event, part)" @mouseleave="itemOut()">
                                    <div class="hud-card-header">
                                        <span v-if="getPartMfrIcon(part)" class="mfr-icon" :style="{ color: getPartMfrColor(part) }">{{ getPartMfrIcon(part) }}</span>
                                        {{ part.name ? part.name.toUpperCase() : '' }}
                                    </div>
                                    <div class="salvage-meta" style="justify-content: space-between;">
                                        <span>[{{ part.slot ? part.slot.toUpperCase() : '' }}]</span>
                                        <span class="mfr-tag" v-if="getPartMfrName(part)" :style="{ color: getPartMfrColor(part) }">{{ getPartMfrName(part) }}</span>
                                        <span :class="conditionClass(part.condition)">{{ conditionLabel(part.condition) }}</span>
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
                        </template>
                    </div>
                </template>
            </div>

            <!-- WEAPONS -->
            <div v-else-if="storageActiveTab === 'weapons'">
                <div v-if="(state.player.inventory?.weapons || []).length === 0" class="empty-state">NO WEAPONS IN STORAGE</div>

                <!-- Compact rows mode -->
                <template v-if="viewMode === 'compact'">
                    <div v-for="weaponId in (state.player.inventory?.weapons || [])" :key="weaponId"
                         class="storage-row"
                         :class="{ 'row-equipped': installedWeaponIds.has(weaponId) }"
                         @mouseover="itemOver($event, state.items[weaponId])" @mouseleave="itemOut()">
                        <span class="sr-name">
                            <span v-if="installedWeaponIds.has(weaponId)" class="sr-equipped-dot">◆</span>
                            <span v-if="state.items[weaponId] && getMfrIcon(state.items[weaponId].mfr)" class="mfr-icon" :style="{ color: getMfrColor(state.items[weaponId].mfr), fontSize: '10px' }">{{ getMfrIcon(state.items[weaponId].mfr) }}</span>
                            {{ state.items[weaponId] && state.items[weaponId].name ? state.items[weaponId].name.toUpperCase() : weaponId }}
                        </span>
                        <span class="sr-slot" v-if="state.items[weaponId]">[{{ (state.items[weaponId].category || state.items[weaponId].slot || '').toUpperCase() }}]</span>
                        <span class="sr-mfr" v-if="state.items[weaponId] && getMfrName(state.items[weaponId].mfr)" :style="{ color: getMfrColor(state.items[weaponId].mfr) }">{{ getMfrName(state.items[weaponId].mfr) }}</span>
                        <span class="sr-cnd">{{ installedWeaponIds.has(weaponId) ? 'INSTALLED' : 'STORED' }}</span>
                        <div class="sr-actions">
                            <span v-if="installedWeaponIds.has(weaponId)" class="sr-hint">◆ IN RIG</span>
                            <span v-else class="sr-hint dim">Equip via RIG mounts</span>
                        </div>
                    </div>
                </template>

                <!-- Card mode -->
                <template v-else>
                    <div class="inventory-grid">
                        <div v-for="weaponId in (state.player.inventory?.weapons || [])" :key="weaponId"
                             class="hud-task-card salvage-card"
                             :class="{ 'is-installed': installedWeaponIds.has(weaponId) }"
                             :style="state.items[weaponId] && state.items[weaponId].mfr ? { borderLeftColor: getMfrColor(state.items[weaponId].mfr) } : {}"
                             @mouseover="itemOver($event, state.items[weaponId])" @mouseleave="itemOut()">
                            <template v-if="state.items[weaponId]">
                                <div class="hud-card-header">
                                    <span v-if="getMfrIcon(state.items[weaponId].mfr)" class="mfr-icon" :style="{ color: getMfrColor(state.items[weaponId].mfr) }">{{ getMfrIcon(state.items[weaponId].mfr) }}</span>
                                    {{ state.items[weaponId].name ? state.items[weaponId].name.toUpperCase() : weaponId }}
                                    <span v-if="installedWeaponIds.has(weaponId)" class="installed-badge">INSTALLED</span>
                                </div>
                                <div class="salvage-meta">
                                    <span>[{{ (state.items[weaponId].category || state.items[weaponId].slot || '').toUpperCase() }}]</span>
                                    <span class="mfr-tag" v-if="getMfrName(state.items[weaponId].mfr)" :style="{ color: getMfrColor(state.items[weaponId].mfr) }">{{ getMfrName(state.items[weaponId].mfr) }}</span>
                                </div>
                                <div class="salvage-hint" v-if="!installedWeaponIds.has(weaponId)" style="margin-top: 8px;">EQUIP VIA RIG MOUNT POINTS</div>
                                <div class="salvage-hint installed" v-else style="margin-top: 8px;">CURRENTLY INSTALLED IN RIG</div>
                            </template>
                        </div>
                    </div>
                </template>
            </div>

        </div>

    </section>
</template>

<style scoped>
.text-corruption { color: #c070ff; }

.energy-hint {
    font-size: var(--font-size-xxs);
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
    font-size: var(--font-size-xxs);
}

.dismantle-confirm-label {
    font-size: var(--font-size-xxs);
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
    font-size: var(--font-size-xxs);
    color: var(--text-dim);
    letter-spacing: 2px;
    padding: 4px 0 2px;
    border-bottom: 1px solid var(--border-dim);
    margin-bottom: 6px;
    margin-top: 10px;
}

/* Installed weapon badge */
.installed-badge {
    font-size: var(--font-size-micro);
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
.loadout-switcher {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
    padding: 4px 0;
    border-bottom: 1px solid #333;
}
.loadout-label {
    font-size: var(--font-size-xxs);
    color: #666;
    letter-spacing: 0.08em;
    margin-right: 4px;
}
.hud-btn.micro.active {
    background: #3a3a1a;
    border-color: #ffe066;
    color: #ffe066;
}
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
    font-size: var(--font-size-xxs);
    min-height: 70px;
    display: flex;
    flex-direction: column;
    gap: 3px;
}

.rig-cell-label {
    font-size: var(--font-size-xxs);
    color: var(--text-dim);
    letter-spacing: 2px;
    margin-bottom: 4px;
}

.rig-part-name {
    color: var(--text-bright, #fff);
    font-size: var(--font-size-xxs);
}

.rig-part-hp,
.rig-part-cnd {
    font-size: var(--font-size-xxs);
    color: var(--text-dim);
    font-family: var(--font-mono, monospace);
}

.cnd-good    { color: var(--secondary, #5f5); }
.cnd-worn    { color: #fa0; }
.cnd-damaged { color: #f55; }
.cnd-critical { color: #f55; animation: pulse 1.2s infinite; }

.rig-cell-empty {
    color: var(--text-dim);
    font-size: var(--font-size-xxs);
    font-style: italic;
}

.synergy-badge {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 8px;
    margin-bottom: 8px;
    background: rgba(255, 200, 50, 0.08);
    border: 1px solid rgba(255, 200, 50, 0.35);
    color: #ffc832;
    font-size: var(--font-size-xxs);
    letter-spacing: 0.06em;
}

.synergy-level {
    font-size: var(--font-size-xxs);
    color: rgba(255, 200, 50, 0.65);
}

.hud-btn.micro {
    font-size: var(--font-size-xxs);
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
    font-size: var(--font-size-xxs);
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
    font-size: var(--font-size-xxs);
    color: var(--secondary, #ff0);
    letter-spacing: 1px;
    padding: 4px 8px;
    border: 1px solid rgba(255, 220, 0, 0.3);
    margin-bottom: 8px;
}

/* ── Root: make pilot-console fill all available horizontal space ── */
.pilot-console {
    display: block;
    width: 100%;
    box-sizing: border-box;
    padding: 10px;
}

/* Mecha Sub-tabs nav */
.mecha-subtabs {
    display: flex;
    gap: 0;
    width: 100%;
    margin-bottom: 14px;
    border-bottom: 2px solid var(--border-dim);
    background: rgba(0,0,0,0.2);
    padding: 0 4px;
}
.msubt-btn {
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--text-dim);
    font-family: var(--font-mono, monospace);
    font-size: var(--font-size-xxs);
    letter-spacing: 1.5px;
    padding: 8px 20px;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s;
    margin-bottom: -2px;
    white-space: nowrap;
}
.msubt-btn:hover { color: var(--primary); }
.msubt-btn.active {
    color: var(--primary);
    border-bottom-color: var(--primary);
    font-weight: bold;
    background: rgba(0,255,170,0.04);
}

/* RIG tab 2-column layout */
.rig-layout {
    display: grid;
    grid-template-columns: 1fr minmax(220px, 300px);
    gap: 14px;
    align-items: start;
    width: 100%;
    min-width: 0;
}
.rig-left {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
    background: rgba(13,17,23,0.35);
    border: 1px solid var(--border-dim);
    padding: 12px;
}
.rig-right {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
}
.rig-right-section {
    background: rgba(13,17,23,0.4);
    border: 1px solid var(--border-dim);
    padding: 10px;
}
.rig-chassis-header { margin-bottom: 8px; }
.rig-chassis-name {
    font-size: var(--font-size-xs);
    font-weight: bold;
    color: var(--secondary);
    letter-spacing: 1px;
}
.rig-chassis-cat { color: var(--text-dim); font-weight: normal; font-size: var(--font-size-xxs); }
.rig-chassis-mfr { font-size: var(--font-size-xxs); color: var(--text-dim); letter-spacing: 0.5px; margin-top: 2px; }

/* CSS stat bars */
.rig-stats { margin-bottom: 10px; }
.rig-stat-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
}
.rig-stat-label {
    width: 30px;
    font-size: var(--font-size-xxs);
    letter-spacing: 1px;
    flex-shrink: 0;
}
.stat-atk { color: #f5c542; }
.stat-def { color: #00aaff; }
.stat-enr { color: #00ffaa; }
.stat-cor { color: #c070ff; }
.rig-stat-bar {
    flex: 1;
    max-width: 220px;
    height: 6px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
}
.rig-stat-fill { height: 100%; transition: width 0.3s; }
.fill-atk { background: #f5c542; }
.fill-def { background: #00aaff; }
.fill-enr { background: #00ffaa; }
.fill-cor { background: #c070ff; }
.rig-stat-val {
    width: 36px;
    text-align: right;
    font-size: var(--font-size-xxs);
    color: var(--text-dim);
}
.rig-synergy { margin-top: 0; }

/* HANGAR tab */
.hangar-view { width: 100%; min-width: 0; box-sizing: border-box; }
.hangar-active-strip {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    background: rgba(0,255,170,0.05);
    border: 1px solid rgba(0,255,170,0.2);
    margin-bottom: 4px;
    font-size: var(--font-size-xxs);
    flex-wrap: wrap;
}
.has-label { color: var(--primary); font-weight: bold; letter-spacing: 1px; font-size: var(--font-size-xxs); }
.has-name  { color: var(--secondary); font-weight: bold; letter-spacing: 1px; }
.has-mfr   { color: var(--text-dim); }
.has-stats { margin-left: auto; color: var(--text-dim); font-size: var(--font-size-xxs); display: flex; gap: 8px; }

.hangar-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
}
.hangar-frame-card {
    border: 1px solid var(--border-dim);
    border-left: 3px solid var(--border-dim);
    padding: 10px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    gap: 4px;
}
.hangar-frame-card:hover { border-color: var(--primary); background: rgba(0,255,170,0.04); }
.hangar-frame-card.is-active { border-left-color: var(--primary); background: rgba(0,255,170,0.05); }
.hf-name { font-size: var(--font-size-xxs); font-weight: bold; color: var(--text); }
.hf-cat  { font-size: var(--font-size-xxs); color: var(--text-dim); display: flex; gap: 5px; align-items: center; }
.hf-stats { display: flex; gap: 8px; font-size: var(--font-size-xxs); margin: 2px 0; }
.hf-compare { display: flex; gap: 6px; font-size: var(--font-size-xxs); font-family: var(--font-body); padding: 3px 0; }
.delta-pos { color: #4f4; }
.delta-neg { color: #f66; }

/* STORAGE tab */
.storage-view { width: 100%; min-width: 0; box-sizing: border-box; }
.storage-inner-tabs {
    display: flex;
    gap: 4px;
    margin-bottom: 8px;
    align-items: center;
}
.storage-tab-btn {
    background: transparent;
    border: 1px solid var(--border-dim);
    color: var(--text-dim);
    font-family: var(--font-mono, monospace);
    font-size: var(--font-size-xxs);
    letter-spacing: 1px;
    padding: 4px 10px;
    cursor: pointer;
    transition: all 0.15s;
}
.storage-tab-btn:hover { border-color: var(--primary); color: var(--primary); }
.storage-tab-btn.active { border-color: var(--primary); color: var(--primary); background: rgba(0,255,170,0.06); font-weight: bold; }
.storage-view-toggle { margin-left: auto; display: flex; gap: 3px; }
.view-btn {
    background: transparent;
    border: 1px solid var(--border-dim);
    color: var(--text-dim);
    font-size: var(--font-size-xxs);
    padding: 3px 6px;
    cursor: pointer;
    transition: all 0.15s;
}
.view-btn:hover { border-color: var(--primary); color: var(--primary); }
.view-btn.active { border-color: var(--primary); color: var(--primary); background: rgba(0,255,170,0.07); }

.storage-filter-bar {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--border-dim);
    flex-wrap: wrap;
}
.filter-label { font-size: var(--font-size-xxs); color: var(--text-dim); letter-spacing: 1px; margin-right: 4px; opacity: 0.6; }
.slot-filter-btn {
    background: transparent;
    border: 1px solid var(--border-dim);
    color: var(--text-dim);
    font-size: var(--font-size-xxs);
    padding: 2px 7px;
    cursor: pointer;
    letter-spacing: 0.5px;
    transition: all 0.15s;
}
.slot-filter-btn:hover { border-color: var(--primary); color: var(--primary); }
.slot-filter-btn.active { border-color: var(--primary); color: var(--primary); background: rgba(0,255,170,0.07); font-weight: bold; }

.storage-group-header {
    font-size: var(--font-size-xxs);
    color: var(--text-dim);
    letter-spacing: 2px;
    padding: 6px 0 2px;
    border-bottom: 1px solid var(--border-dim);
    margin-bottom: 2px;
    margin-top: 8px;
}
.storage-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 6px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    font-size: var(--font-size-xxs);
    font-family: var(--font-body);
    transition: background 0.15s;
}
.storage-row:hover { background: rgba(255,255,255,0.03); }
.storage-row.row-equipped { background: rgba(0,255,170,0.03); }
.sr-equipped-dot { color: var(--primary); margin-right: 3px; }
.sr-name { flex: 0 1 220px; color: var(--text); font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
.sr-slot { flex: 0 0 80px; color: #667; font-size: var(--font-size-xxs); letter-spacing: 0.5px; }
.sr-mfr  { flex: 0 0 120px; font-size: var(--font-size-xxs); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sr-cnd  { flex: 0 0 60px; font-size: var(--font-size-xxs); }
.sr-actions { display: flex; gap: 4px; align-items: center; flex-shrink: 0; }
.sr-hint { font-size: var(--font-size-xxs); color: var(--primary); letter-spacing: 0.5px; }
.sr-hint.dim { color: var(--text-dim); opacity: 0.5; }
.hud-btn.micro.danger { border-color: var(--error); color: var(--error); }
.hud-btn.micro.danger:hover { background: var(--error); color: #000; }

</style>
