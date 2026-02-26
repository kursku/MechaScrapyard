# SPEC: Zone Exploration — Phase 3 / Rank 2

**Type:** `feat(zones/p3)`
**Effort:** Medium — ~3 hours, zones.json + runner.js + ZonePanel.vue (new or existing)
**Depends on:** Phase 1 SPEC_data_blockers (zone IDs must be clean)
**Blocks:** Phase 3 SPEC_phase3_missions (zone unlocks gate some missions)

---

## Why This Matters

The zone system is defined in `data/mecha/zones.json` but has no player-facing loop:
players cannot unlock new zones, scout them for intel, or progress into harder territory.
Without zone progression, the world feels like a single room.

---

## Files Changed

- `data/mecha/zones.json`
- `src/modules/runner.js` (or a new `zoneRunner.js`)
- `src/game.js` (expose zone unlock action)
- `src/ui/sections/ScrapyardPanel.vue` or a new `ZonePanel.vue`

---

## Zone Progression Model

Each zone has three states:
1. **LOCKED** — not visible until a gate condition is met
2. **SCOUTED** — player knows it exists; can run scout task to gather intel
3. **UNLOCKED** — full mission and patrol access

Zones unlock in a linear chain: `zone_scrapyard` → `zone_ruins` → `zone_industrial` → etc.

---

## zones.json Shape Updates

Add `status`, `scoutCost`, and `scoutReward` fields:

```json
{
    "id": "zone_scrapyard",
    "name": "The Scrapyard",
    "status": "unlocked",
    "description": "Your home turf. Dense with salvage and territorial drones.",
    "availableMissions": ["msn_salvage_run_01", "msn_rogue_drone_patrol", "msn_rival_gang_01", "msn_corrupted_sentinel"],
    "unlocksZone": "zone_ruins",
    "unlockRequire": "g.glory>=10"
},
{
    "id": "zone_ruins",
    "name": "The Ruins",
    "status": "locked",
    "description": "Pre-war district. High danger, higher salvage density.",
    "scoutCost": { "energy": 15, "intel": 5 },
    "scoutReward": { "intel": 20, "scrap": 30 },
    "require": "g.glory>=10",
    "availableMissions": ["msn_fathers_debt_01"],
    "unlocksZone": "zone_industrial",
    "unlockRequire": "g.intel>=30"
}
```

---

## Game Action: `game.js`

```js
scoutZone(zoneId) {
    const zone = this.state.items[zoneId];
    if (!zone || zone.status !== 'locked') return;
    const cost = zone.scoutCost || {};
    // Check & deduct costs
    for (const [res, amount] of Object.entries(cost)) {
        if ((this.state.items[res]?.val || 0) < amount) return; // insufficient
        this.state.items[res].val -= amount;
    }
    // Apply rewards
    for (const [res, amount] of Object.entries(zone.scoutReward || {})) {
        if (this.state.items[res]) this.state.items[res].val += amount;
    }
    zone.status = 'scouted';
    this._checkZoneUnlocks();
},

unlockZone(zoneId) {
    const zone = this.state.items[zoneId];
    if (!zone || zone.status !== 'scouted') return;
    if (zone.unlockRequire) {
        const ok = new Function('g', `return !!(${zone.unlockRequire})`)(this.state.g);
        if (!ok) return;
    }
    zone.status = 'unlocked';
},

_checkZoneUnlocks() {
    for (const item of Object.values(this.state.items)) {
        if (item.type !== 'zone') continue;
        if (item.status === 'locked' && item.require) {
            const ok = new Function('g', `return !!(${item.require})`)(this.state.g);
            if (ok) item.status = 'scouted'; // auto-reveal, still needs unlock action
        }
    }
},
```

---

## UI: Zone List Panel

Add a ZONES section (can live inside ScrapyardPanel or as a new tab):

```vue
<div v-for="zone in visibleZones" :key="zone.id" class="zone-card"
     :class="zone.status">
    <div class="zone-header">
        {{ zone.name.toUpperCase() }}
        <span class="zone-status-badge">{{ zone.status.toUpperCase() }}</span>
    </div>
    <div class="zone-desc">{{ zone.description }}</div>
    <div class="zone-actions" v-if="zone.status === 'locked'">
        <button class="hud-btn small"
                :disabled="!canAffordScout(zone)"
                @click="$emit('action', { type: 'scoutZone', zoneId: zone.id })">
            SCOUT ({{ formatCost(zone.scoutCost) }})
        </button>
    </div>
    <div class="zone-actions" v-else-if="zone.status === 'scouted'">
        <button class="hud-btn small"
                :disabled="!canUnlock(zone)"
                @click="$emit('action', { type: 'unlockZone', zoneId: zone.id })">
            UNLOCK ZONE
        </button>
    </div>
</div>
```

```js
computed: {
    visibleZones() {
        return Object.values(this.state.items)
            .filter(i => i.type === 'zone')
            .sort((a, b) => (a.order || 0) - (b.order || 0));
    },
},
methods: {
    canAffordScout(zone) {
        const cost = zone.scoutCost || {};
        return Object.entries(cost).every(([r, amt]) => (this.state.items[r]?.val || 0) >= amt);
    },
    canUnlock(zone) {
        if (!zone.unlockRequire) return true;
        return new Function('g', `return !!(${zone.unlockRequire})`)(this.state.g);
    },
    formatCost(cost) {
        return Object.entries(cost || {}).map(([r, v]) => `${v} ${r.toUpperCase()}`).join(', ');
    },
},
```

---

## Serialization

Zone status must be persisted. In `game.js serialize()`:
```js
zones: Object.fromEntries(
    Object.values(this.state.items)
        .filter(i => i.type === 'zone')
        .map(i => [i.id, { status: i.status }])
),
```

And in `deserialize()`:
```js
for (const [id, data] of Object.entries(saved.zones || {})) {
    if (this.state.items[id]) this.state.items[id].status = data.status;
}
```

---

## Test Checklist

- [ ] Zone list shows all zones with correct status badges
- [ ] SCOUT button disabled when resources insufficient
- [ ] Scouting deducts energy/intel and awards scrap/intel
- [ ] Zone transitions: locked → scouted → unlocked
- [ ] Unlocked zone missions are accessible
- [ ] Zone status persists across save/reload
- [ ] `npm run build` passes

---

## Commit Message

```
feat(zones/p3): zone scout/unlock loop, status persistence, zone UI
```
