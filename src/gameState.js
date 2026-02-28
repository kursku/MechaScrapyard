import { reactive } from 'vue';
import { clamp } from '@/util/format';
import BipolarStat from '@/values/BipolarStat';
import { getCanonicalAliases, resolveItemId } from '@/schema/idAliases';

/**
 * Manufacturer synergy bonuses — applied in recalculateFrameStats() when
 * 3 (partial) or 4 (full) equipped parts share the same manufacturer.
 * Values are stat multipliers stacked after condition penalties.
 */
const SYNERGY_BONUSES = {
    kz_industrial:   { partial: { def: 1.05 },              full: { def: 1.10, atk: 1.05 } },
    sora_motor:      { partial: { enr: 1.05 },              full: { enr: 1.10, atk: 1.03 } },
    aegis_tac:       { partial: { def: 1.03, atk: 1.03 },  full: { def: 1.05, atk: 1.05 } },
    kuroda_heavy:    { partial: { atk: 1.08 },              full: { atk: 1.12, def: 1.05 } },
    phantom_works:   { partial: { enr: 1.08 },              full: { enr: 1.10, atk: 1.10 } },
    hayabusa_eng:    { partial: { atk: 1.05, enr: 1.03 },  full: { atk: 1.10, enr: 1.05 } },
    daewon_dynamics: { partial: { enr: 1.08 },              full: { enr: 1.12, atk: 1.03 } },
};

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

        /** @type {BipolarStat} Morality axis: Paragon (+) ↔ Shadow (-), Pragmatist (neutral) */
        this.morality = new BipolarStat(0);

        /** Pragmatist timer — seconds spent with |morale| < 40 */
        this.pragmatistTimer = 0;

        // Expose morality value to require expressions as g.morality
        Object.defineProperty(this.g, 'morality', {
            get: () => this.morality.value,
            configurable: true,
        });
        Object.defineProperty(this.g, 'moral_alignment', {
            get: () => this.morality.alignmentBase,
            configurable: true,
        });
        Object.defineProperty(this.g, 'pragmatist_time', {
            get: () => this.pragmatistTimer,
            configurable: true,
        });

        const starterPartsInventory = [];
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
                    right_hand: 'mech_fist',
                    backpack: null,
                    left_shoulder: null,
                    right_shoulder: null
                },
                parts: {
                    torso: { id: 'torso_hayabusa_mk1', name: 'Hayabusa Mk.I Torso', integrity: 3, hp: 40, maxHp: 40, status: 'operational', condition: 1.0 },
                    left_arm: { id: 'arm_hayabusa_mk1_l', name: 'Hayabusa Left Arm', integrity: 2, hp: 20, maxHp: 20, status: 'operational', condition: 1.0 },
                    right_arm: { id: 'arm_hayabusa_mk1_r', name: 'Hayabusa Right Arm', integrity: 2, hp: 20, maxHp: 20, status: 'operational', condition: 1.0 },
                    legs: { id: 'legs_hayabusa_mk1', name: 'Hayabusa Legs', integrity: 2, hp: 30, maxHp: 30, status: 'operational', condition: 1.0 }
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
            inventory: {
                frames: ['frame_hayabusa_mk1'],
                parts: starterPartsInventory,
                weapons: ['mech_fist']
            },
            // Legacy alias used by existing UI/components.
            partsInventory: starterPartsInventory
        });
        this.g.inventory = this.player.inventory;

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

        /** District Threat Level — corporate pressure tracker */
        this.dtl = reactive({
            level: 0,          // 0–5
            points: 0,         // accumulator (100 = level up)
            lastChange: 0,     // timestamp for UI pulse
            layLowCooldown: 0, // seconds before Lay Low is usable again
        });

        Object.defineProperty(this.g, 'dtl_level', {
            get: () => this.dtl.level,
            configurable: true,
        });

        /** Prestige system — persists across resets (GDD §2+§3+§6) */
        this.prestige = reactive({
            gloryPool: 0,
            glorySpent: 0,
            lifetimeGlory: 0,
            storyLayer: 1,
            cycleCount: 0,
            gateCompleted: false,
            alignmentHistory: [],
            knownBlueprints: [],
            seenBriefings: [],
            gloryShop: {},  // { [itemId]: ownedCount }
        });

        this.loadouts = reactive({
            active: 'primary',
            primary: {
                name: 'Primary',
                installedParts: {},
                installedEquip: {},
            },
            secondary: {
                name: 'Secondary',
                installedParts: {},
                installedEquip: {},
            },
        });

        this.salvage = reactive({
            show: false,
            options: [],   // [{ slot, partId, partName, tier, condition, breakdown }]
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
        const bindGetter = (id, getter) => {
            Object.defineProperty(this.g, id, {
                get: getter,
                configurable: true,
            });
        };
        const canonicalAliases = getCanonicalAliases(item.id);

        if (item.completed !== undefined) {
            // Missions: g.msn_xxx returns completed count
            bindGetter(item.id, () => item.completed || 0);
            canonicalAliases.forEach(alias => bindGetter(alias, () => item.completed || 0));
        } else if (item.owned !== undefined) {
            // Upgrades/furniture: g.xxx returns owned count
            bindGetter(item.id, () => item.owned || 0);
            canonicalAliases.forEach(alias => bindGetter(alias, () => item.owned || 0));
        } else if (item.val !== undefined) {
            // Resources/skills: g.xxx returns current value
            bindGetter(item.id, () => item.val || 0);
            canonicalAliases.forEach(alias => bindGetter(alias, () => item.val || 0));
        }
    }

    /**
     * Get an item by id.
     */
    get(id) {
        return this.items[resolveItemId(id)];
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
     * Formats:
     *   "resource.property": additiveValue  — e.g. "scrap.max": 30
     *   "statId": additiveValue             — e.g. "space": 2, "recipe_speed": 0.15
     */
    applyMod(mod) {
        if (!mod) return;
        for (const [path, val] of Object.entries(mod)) {
            if (typeof val !== 'number') continue;
            const dotIdx = path.indexOf('.');
            if (dotIdx !== -1) {
                const id = path.slice(0, dotIdx);
                const prop = path.slice(dotIdx + 1);
                const item = this.items[resolveItemId(id)];
                if (item && prop) item[prop] = (item[prop] || 0) + val;
            } else {
                // Simple key — for stat_cache items, accumulate into _base so that
                // _applySkillMods can merge skill contributions on top each tick.
                // For regular resource items (e.g. "space"), add directly to val.
                const item = this.items[path];
                if (item) {
                    if (item.type === 'stat_cache') {
                        item._base = (item._base || 0) + val;
                        item.val = item._base; // will be updated by _applySkillMods next tick
                    } else {
                        item.val = (item.val || 0) + val;
                    }
                }
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
            const res = this.items[resolveItemId(k)];
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
            const res = this.items[resolveItemId(k)];
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
            const actualId = resolveItemId(k);
            const res = this.items[actualId];
            if (res) {
                // Automatically unlock reputation resources on first gain
                if (res.locked && actualId.startsWith('rep_') && v > 0) {
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
                if (frame.parts[slot].condition === undefined) {
                    frame.parts[slot].condition = 1.0;
                }
            }

            // Weight mismatch penalty (GDD 3.4.3)
            let efficiency = 1.0;
            if (chassis.weightRange && chassis.weightRange[slot]) {
                const [minW, maxW] = chassis.weightRange[slot];
                if (partTemplate.weight < minW || partTemplate.weight > maxW) {
                    efficiency = 0.95;
                }
            }

            const condition = frame.parts[slot].condition || 1.0;

            // Apply condition and weight mismatch efficiency
            frame.parts[slot].maxHp = Math.floor((partTemplate.maxHp || partTemplate.hp) * condition * efficiency);
            if (frame.parts[slot].hp > frame.parts[slot].maxHp) {
                frame.parts[slot].hp = frame.parts[slot].maxHp;
            }

            // Armor contributes based on condition and efficiency
            totalArmor += Math.floor((partTemplate.armor || 0) * condition * efficiency);
        }

        attributes.def += totalArmor;

        // Condition penalties — worst part drives the penalty (weakest link).
        // HP is already affected by the per-part condition multiplier above.
        // These penalties apply to aggregate ATK/DEF/ENR.
        const conditionValues = Object.values(frame.parts)
            .filter(p => p)
            .map(p => Math.round((p.condition ?? 1.0) * 100));
        if (conditionValues.length > 0) {
            const minCond = Math.min(...conditionValues);
            if (minCond < 10) {
                // Broken: part provides no benefit — zero out its contribution (treat as 0.3× all)
                attributes.def *= 0.80; attributes.atk *= 0.80; attributes.enr *= 0.80;
            } else if (minCond < 30) {
                // Critical: –20% all stats
                attributes.def *= 0.80; attributes.atk *= 0.80; attributes.enr *= 0.80;
            } else if (minCond < 50) {
                // Damaged: –8% DEF, –5% ATK
                attributes.def *= 0.92; attributes.atk *= 0.95;
            } else if (minCond < 70) {
                // Worn: –3% DEF
                attributes.def *= 0.97;
            }
        }

        // Manufacturer synergy — 3+ (partial) or 4 (full) same-mfr parts grant bonuses.
        const mfrCounts = {};
        for (const partId of Object.values(frame.installedParts)) {
            const mfr = this.items[partId]?.mfr;
            if (mfr) mfrCounts[mfr] = (mfrCounts[mfr] || 0) + 1;
        }
        let synMfr = null, synCount = 0;
        for (const [mfr, count] of Object.entries(mfrCounts)) {
            if (count > synCount) { synCount = count; synMfr = mfr; }
        }
        if (synMfr && synCount >= 3) {
            const level = synCount >= 4 ? 'full' : 'partial';
            const b = SYNERGY_BONUSES[synMfr]?.[level] || {};
            if (b.atk) attributes.atk *= b.atk;
            if (b.def) attributes.def *= b.def;
            if (b.enr) attributes.enr *= b.enr;
        }

        // Skill combat bonus (frame_atk_bonus synthetic stat, set by _applySkillMods)
        attributes.atk += this.items['frame_atk_bonus']?.val || 0;

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
            // Job-specific fields
            if (item.type === 'job') {
                saved.enrolled = item.enrolled;
                saved.currentTier = item.currentTier;
                saved.currentPath = item.currentPath;
            }
            // Zone-specific fields
            if (item.type === 'zone') {
                saved.discovered = item.discovered;
                saved.explored = item.explored;
                saved.status = item.status;
            }
            // Contact-specific fields
            if (item.type === 'contact') {
                saved.loyalty = item.loyalty;
                saved._benefitNotified = item._benefitNotified;
            }
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
                inventory: {
                    frames: [...(this.player.inventory?.frames || [])],
                    parts: this.player.inventory?.parts || this.player.partsInventory,
                    weapons: [...(this.player.inventory?.weapons || [])]
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
            },
            loadouts: {
                active: this.loadouts.active,
                primary: { ...this.loadouts.primary },
                secondary: { ...this.loadouts.secondary },
            },
            pragmatistTimer: this.pragmatistTimer,
            dtl: { level: this.dtl.level, points: this.dtl.points },
            prestige: {
                gloryPool: this.prestige.gloryPool,
                glorySpent: this.prestige.glorySpent,
                lifetimeGlory: this.prestige.lifetimeGlory,
                storyLayer: this.prestige.storyLayer,
                cycleCount: this.prestige.cycleCount,
                gateCompleted: this.prestige.gateCompleted,
                alignmentHistory: [...this.prestige.alignmentHistory],
                knownBlueprints: [...this.prestige.knownBlueprints],
                seenBriefings: [...this.prestige.seenBriefings],
                gloryShop: { ...this.prestige.gloryShop },
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
            // Job-specific fields
            if (item.type === 'job' && saved.enrolled !== undefined) {
                item.enrolled = saved.enrolled;
                item.currentTier = saved.currentTier || 0;
                item.currentPath = saved.currentPath || null;
            }
            // Zone-specific fields
            if (item.type === 'zone' && saved.discovered !== undefined) {
                item.discovered = saved.discovered;
                item.explored = saved.explored || 0;
                if (saved.status) item.status = saved.status;
            }
            // Contact-specific fields
            if (item.type === 'contact' && saved.loyalty !== undefined) {
                item.loyalty = saved.loyalty;
                item._benefitNotified = saved._benefitNotified || false;
            }
        }
        if (json.player) {
            this.player.name = json.player.name || this.player.name;
            if (json.player.titles) this.player.titles = json.player.titles;
            if (!this.player.inventory) {
                this.player.inventory = { frames: [], parts: [], weapons: [] };
            }

            if (json.player.inventory) {
                this.player.inventory.frames = Array.isArray(json.player.inventory.frames) ? json.player.inventory.frames : [];
                this.player.inventory.parts = Array.isArray(json.player.inventory.parts) ? json.player.inventory.parts : [];
                this.player.inventory.weapons = Array.isArray(json.player.inventory.weapons) ? json.player.inventory.weapons : [];
            } else if (json.player.partsInventory) {
                // Backward compatibility with saves created before inventory.* existed.
                this.player.inventory.parts = json.player.partsInventory;
            }

            // Legacy alias remains bound for current UI usage.
            this.player.partsInventory = this.player.inventory.parts;
            this.g.inventory = this.player.inventory;

            if (json.player.frame) {
                let loadedChassis = json.player.frame.chassisId || this.player.frame.chassisId;
                if (loadedChassis === 'frame_hayabusa_light') {
                    loadedChassis = 'frame_hayabusa_mk1';
                }
                this.player.frame.chassisId = loadedChassis;
                if (json.player.frame.installedParts) Object.assign(this.player.frame.installedParts, json.player.frame.installedParts);
                if (json.player.frame.installedEquip) Object.assign(this.player.frame.installedEquip, json.player.frame.installedEquip);
                if (json.player.frame.equip) Object.assign(this.player.frame.installedEquip, json.player.frame.equip);
                if (json.player.frame.parts) Object.assign(this.player.frame.parts, json.player.frame.parts);
                this.player.frame.heat = json.player.frame.heat || 0;
                this.player.frame.stress = json.player.frame.stress || 0;
            }

            if (!this.player.inventory.frames.includes(this.player.frame.chassisId)) {
                this.player.inventory.frames.push(this.player.frame.chassisId);
            }
        }

        if (json.android) {
            Object.assign(this.android, json.android);
        }

        if (json.loadouts) {
            Object.assign(this.loadouts, json.loadouts);
        }

        // Restore morality from saved morality resource value
        const savedMoral = this.get('morality');
        if (savedMoral && savedMoral.val !== undefined) {
            this.morality = new BipolarStat(savedMoral.val);
            // Re-bind g. properties to new instance
            Object.defineProperty(this.g, 'morality', {
                get: () => this.morality.value,
                configurable: true,
            });
            Object.defineProperty(this.g, 'moral_alignment', {
                get: () => this.morality.alignmentBase,
                configurable: true,
            });
        }

        // Restore pragmatist timer
        if (json.pragmatistTimer !== undefined) {
            this.pragmatistTimer = json.pragmatistTimer;
        }

        if (json.prestige) {
            Object.assign(this.prestige, json.prestige);
        }
        if (json.dtl) {
            Object.assign(this.dtl, json.dtl);
        }
    }
}
