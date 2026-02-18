import { reactive } from 'vue';
import { clamp } from '@/util/format';

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

        this.player = reactive({
            name: 'Pilot',
            titles: [],
            // Combat Design §2.2 & §3.1
            frame: {
                parts: {
                    torso: { id: 'torso', name: 'Torso', integrity: 3, hp: 100, maxHp: 100, status: 'operational' },
                    left_arm: { id: 'left_arm', name: 'Left Arm', integrity: 2, hp: 50, maxHp: 50, status: 'operational' },
                    right_arm: { id: 'right_arm', name: 'Right Arm', integrity: 2, hp: 50, maxHp: 50, status: 'operational' },
                    legs: { id: 'legs', name: 'Legs', integrity: 2, hp: 60, maxHp: 60, status: 'operational' }
                },
                attributes: {
                    atk: 10,
                    def: 10,
                    enr: 50,
                    cor: 5
                },
                heat: 0,
                stress: 0
            }
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
        if (item.val !== undefined) {
            Object.defineProperty(this.g, item.id, {
                get: () => item,
                configurable: true,
            });
        } else if (item.owned !== undefined) {
            // For upgrades, expose owned count
            Object.defineProperty(this.g, item.id, {
                get: () => item.owned || 0,
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
            if (res) res.val = clamp(res.val - v, 0, res.max);
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
            if (res && !res.locked) {
                res.val = clamp(res.val + v, 0, res.max);
            }
        }
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
            data[id] = saved;
        }
        return {
            items: data,
            player: { ...this.player },
        };
    }

    /**
     * Restore state from JSON.
     */
    fromJSON(json) {
        if (!json?.items) return;
        for (const [id, saved] of Object.entries(json.items)) {
            const item = this.items[id];
            if (!item) continue;
            if (saved.val !== undefined) item.val = saved.val;
            if (saved.owned !== undefined) item.owned = saved.owned;
            if (saved.locked !== undefined) item.locked = saved.locked;
        }
        if (json.player) {
            Object.assign(this.player, json.player);
        }
    }
}
