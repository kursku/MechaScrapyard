import { reactive } from 'vue';
import { clamp } from '@/util/format';
import BipolarStat from '@/values/BipolarStat';

/**
 * GameState — central reactive state for all game data.
 *
 * Follows Arcanum's pattern: all game items are accessible via
 * state.get(id) which returns the GData item.
 *
 * Resources, upgrades, tasks, etc. are all stored here.
 */
export default class GameState {

    constructor() {
        /** @type {Object<string, Object>} all items indexed by id */
        this.items = {};

        /** Game-wide counters exposed to require expressions as `g.xxx` */
        this.g = reactive({});

        /** @type {BipolarStat} Morality axis: Idealist (+) ↔ Pragmatic (-) */
        this.morality = new BipolarStat(0);

        // Expose morality value to require expressions as g.morality
        Object.defineProperty(this.g, 'morality', {
            get: () => this.morality.value,
            configurable: true,
        });
        Object.defineProperty(this.g, 'moral_alignment', {
            get: () => this.morality.alignment,
            configurable: true,
        });

        this.player = reactive({
            name: 'Pilot_01', // Updated default name
            titles: ['Scrapper'], // Updated default titles
            // Combat Design §2.2 & §3.1 + GDD 3.4.1
            frame: {
                chassisId: 'frame_hayabusa_mk1', // Updated default chassis
                installedParts: {
                    torso: 'torso_hayabusa_mk1',
                    left_arm: 'arm_hayabusa_mk1_l',
                    right_arm: 'arm_hayabusa_mk1_r',
                    legs: 'legs_hayabusa_mk1'
                },
                installedEquip: {
                    left_hand: null,
                    right_hand: null,
                    backpack: null,
                    left_shoulder: null,
                    right_shoulder: null
                },
                parts: {
                    torso: { id: 'torso', name: 'Torso', integrity: 3, hp: 100, maxHp: 100, status: 'operational', condition: 1.0 },
                    left_arm: { id: 'left_arm', name: 'Left Arm', integrity: 2, hp: 50, maxHp: 50, status: 'operational', condition: 1.0 },
                    right_arm: { id: 'right_arm', name: 'Right Arm', integrity: 2, hp: 50, maxHp: 50, status: 'operational', condition: 1.0 },
                    legs: { id: 'legs', name: 'Legs', integrity: 2, hp: 60, maxHp: 60, status: 'operational', condition: 1.0 }
                },
                attributes: {
                    atk: 10,
                    def: 10,
                    enr: 50,
                    cor: 5
                },
                heat: 0,
                stress: 0,
                maneuvers: [],
                tokens: []
            },
            partsInventory: []
        });

        this.activeCombat = reactive({
            active: false,
            enemy: null,
            turn: 0,
            phase: 'idle', // 'idle', 'player_turn', 'enemy_turn', 'win', 'lose'
            log: []
        });

        this.android = reactive({
            active: false,
            name: 'K.I.T.A.',
            level: 1,
            xp: 0,
            xpToNext: 100,
            energy: 50,
            maxEnergy: 50,
            energyRate: 0.2,
            assignment: null,       // Current task ID
            efficiency: 1.0,        // Output multiplier
            modules: [],            // Installed upgrade IDs
            personality: 0,         // Evolves with usage
        });

        Object.defineProperty(this.g, 'android_active', {
            get: () => this.android.active ? 1 : 0,
            configurable: true,
        });
        Object.defineProperty(this.g, 'android_level', {
            get: () => this.android.level,
            configurable: true,
        });

        this.loaded = false;
    }

    /**
     * Register an item in the state.
     * @param {Object} item
     */
    register(item) {
        this.items[item.id] = item;

        // Expose to g. namespace for require expressions
        // Priority: completed (missions) > owned (upgrades) > val (resources/skills)
        if (item.completed !== undefined) {
            // Missions: g.msn_xxx returns completed count
            Object.defineProperty(this.g, item.id, {
                get: () => item.completed || 0,
                configurable: true,
            });
        } else if (item.owned !== undefined) {
            // Upgrades/furniture: g.xxx returns owned count
            Object.defineProperty(this.g, item.id, {
                get: () => item.owned || 0,
                configurable: true,
            });
        } else if (item.val !== undefined) {
            // Resources/skills: g.xxx returns current value
            Object.defineProperty(this.g, item.id, {
                get: () => item.val || 0,
                configurable: true,
            });
        }
    }

    /**
     * Get an item by id.
     */
    get(id) {
        return this.items[id];
    }

    /**
     * Get all items of a given type/group.
     */
    getByGroup(group) {
        return Object.values(this.items).filter(i => i.group === group);
    }

    /**
     * Get all items with a specific tag.
     */
    getByTag(tag) {
        return Object.values(this.items).filter(i =>
            i.tags && i.tags.includes(tag)
        );
    }

    /**
     * Apply a mod object to the state.
     * Format: { "resource.property": additiveValue }
     */
    applyMod(mod) {
        if (!mod) return;
        for (const [path, val] of Object.entries(mod)) {
            const [id, prop] = path.split('.');
            const item = this.items[id];
            if (item && prop && typeof val === 'number') {
                item[prop] = (item[prop] || 0) + val;
            }
        }
    }

    /**
     * Check if a resource cost can be afforded.
     * @param {Object} costs - { resourceId: amount }
     */
    canAfford(costs) {
        if (!costs) return true;
        return Object.entries(costs).every(([k, v]) => {
            const res = this.items[k];
            return res && res.val >= v;
        });
    }

    /**
     * Pay resource costs.
     * @param {Object} costs
     * @returns {boolean} whether payment succeeded
     */
    payCost(costs) {
        if (!this.canAfford(costs)) return false;
        for (const [k, v] of Object.entries(costs)) {
            const res = this.items[k];
            if (res) {
                const min = res.min ?? 0;
                res.val = clamp(res.val - v, min, res.max);
            }
        }
        return true;
    }

    /**
     * Award resources.
     * @param {Object} rewards - { resourceId: amount }
     */
    award(rewards) {
        if (!rewards) return;
        for (const [k, v] of Object.entries(rewards)) {
            const res = this.items[k];
            if (res) {
                // Automatically unlock reputation resources on first gain
                if (res.locked && k.startsWith('rep_') && v > 0) {
                    res.locked = false;
                }

                if (!res.locked) {
                    const min = res.min ?? 0;
                    res.val = clamp(res.val + v, min, res.max);
                }
            }
        }
    }

    /**
     * Recalculate effective frame stats based on category, parts, and pilot attributes.
     * GDD §3.4.7
     */
    recalculateFrameStats() {
        const frame = this.player.frame;
        const chassis = this.items[frame.chassisId];
        if (!chassis) return;

        // 1. Base Attributes from Chassis
        const base = chassis.baseStats;
        const attributes = {
            atk: base.base_atk || 0,
            def: base.base_def || 0,
            enr: base.base_enr || 0,
            cor: base.base_cor || 0
        };

        // 2. Add Pilot Contributions (§3.4.7)
        const mus = this.items['muscle']?.val || 1;
        const ref = this.items['reflex']?.val || 1;
        const grt = this.items['grit']?.val || 1;
        const foc = this.items['focus']?.val || 1;
        const neu = this.items['neuro']?.val || 1;
        const cha = this.items['charisma']?.val || 1;

        attributes.atk += (mus * 0.3) + (ref * 0.2);
        attributes.def += (grt * 0.4) + (mus * 0.1);
        attributes.enr += (foc * 0.3) + (neu * 0.2);
        attributes.cor += (grt * 0.2) + (cha * 0.3);

        // 3. Update Part Live State & Armor
        let totalArmor = 0;
        for (const [slot, partId] of Object.entries(frame.installedParts)) {
            const partTemplate = this.items[partId];
            if (!partTemplate) continue;

            if (!frame.parts[slot]) {
                frame.parts[slot] = {
                    id: slot,
                    name: partTemplate.name,
                    hp: partTemplate.hp,
                    maxHp: partTemplate.maxHp,
                    integrity: partTemplate.integrity,
                    status: 'operational',
                    condition: 1.0
                };
            } else {
                // Update templates (keeping current HP/integrity/status/condition)
                frame.parts[slot].name = partTemplate.name;
                frame.parts[slot].maxHp = partTemplate.hp;
                if (frame.parts[slot].condition === undefined) {
                    frame.parts[slot].condition = 1.0;
                }
            }

            // Armor contributes based on condition
            const condition = frame.parts[slot].condition || 1.0;
            totalArmor += (partTemplate.armor || 0) * condition;
        }

        attributes.def += totalArmor;

        // Round all attributes for display
        for (const k in attributes) {
            attributes[k] = Math.round(attributes[k] * 10) / 10;
        }

        frame.attributes = attributes;
    }

    /**
     * Serialize state to JSON.
     */
    toJSON() {
        const data = {};
        for (const [id, item] of Object.entries(this.items)) {
            const saved = { id };
            if (item.val !== undefined) saved.val = item.val;
            if (item.owned !== undefined) saved.owned = item.owned;
            if (item.locked !== undefined) saved.locked = item.locked;
            if (item.completed !== undefined) saved.completed = item.completed;
            if (item._lastKnownTier !== undefined) saved._lastKnownTier = item._lastKnownTier;
            data[id] = saved;
        }
        return {
            items: data,
            player: {
                name: this.player.name,
                titles: this.player.titles,
                frame: {
                    chassisId: this.player.frame.chassisId,
                    installedParts: this.player.frame.installedParts,
                    installedEquip: this.player.frame.installedEquip,
                    parts: this.player.frame.parts,
                    heat: this.player.frame.heat,
                    stress: this.player.frame.stress
                },
                partsInventory: this.player.partsInventory
            },
            android: {
                active: this.android.active,
                level: this.android.level,
                xp: this.android.xp,
                xpToNext: this.android.xpToNext,
                energy: this.android.energy,
                maxEnergy: this.android.maxEnergy,
                energyRate: this.android.energyRate,
                assignment: this.android.assignment,
                efficiency: this.android.efficiency,
                modules: this.android.modules,
                personality: this.android.personality
            }
        };
    }

    /**
     * Restore state from JSON.
     */
    fromJSON(json) {
        if (!json?.items) return;
        for (const [id, saved] of Object.entries(json.items)) {
            const item = this.items[id];
            if (!item) {
                // Restore flags that were dynamically created (like grandpa_dead)
                if (saved.type === 'flag' || (saved.val !== undefined && !saved.owned && !saved.completed)) {
                    this.items[id] = { id, val: saved.val || 0, type: saved.type || 'flag', locked: saved.locked };
                }
                continue;
            }
            if (saved.val !== undefined) item.val = saved.val;
            if (saved.owned !== undefined) item.owned = saved.owned;
            if (saved.locked !== undefined) item.locked = saved.locked;
            if (saved.completed !== undefined) item.completed = saved.completed;
            if (saved._lastKnownTier !== undefined) item._lastKnownTier = saved._lastKnownTier;
        }
        if (json.player) {
            this.player.name = json.player.name || this.player.name;
            if (json.player.titles) this.player.titles = json.player.titles;
            if (json.player.partsInventory) this.player.partsInventory = json.player.partsInventory;
            if (json.player.frame) {
                let loadedChassis = json.player.frame.chassisId || this.player.frame.chassisId;
                if (loadedChassis === 'frame_hayabusa_light') {
                    loadedChassis = 'frame_hayabusa_mk1';
                }
                this.player.frame.chassisId = loadedChassis;
                if (json.player.frame.installedParts) Object.assign(this.player.frame.installedParts, json.player.frame.installedParts);
                if (json.player.frame.installedEquip) Object.assign(this.player.frame.installedEquip, json.player.frame.installedEquip);
                if (json.player.frame.parts) Object.assign(this.player.frame.parts, json.player.frame.parts);
                this.player.frame.heat = json.player.frame.heat || 0;
                this.player.frame.stress = json.player.frame.stress || 0;
            }
        }

        if (json.android) {
            Object.assign(this.android, json.android);
        }

        // Restore morality from saved moralidade resource value
        const savedMoral = this.items.moralidade;
        if (savedMoral && savedMoral.val !== undefined) {
            this.morality = new BipolarStat(savedMoral.val);
            // Re-bind g. properties to new instance
            Object.defineProperty(this.g, 'morality', {
                get: () => this.morality.value,
                configurable: true,
            });
            Object.defineProperty(this.g, 'moral_alignment', {
                get: () => this.morality.alignment,
                configurable: true,
            });
        }
    }
}
