# MECHA SCRAPYARD — Implementation Spec: Faction Alliance System
## Sprint: Reclaim-05 — Allegiance & Consequence

**From:** Design (Claude)
**To:** Implementation (Antigravity)
**Priority:** 🟡 HIGH — Factions + Morale = exponential narrative branches
**Estimated effort:** ~5-7 hours
**Prerequisites:** Reclaim-01 (Morale), beneficial with Reclaim-04 (Zones)

---

## WHY FACTIONS

`factions.json` already has 5 rich factions (NTPD, Kuroda, Taeyang, Exile Network, Underground Syndicate) with reputation tiers, vendor catalogs, and narrative hooks. But the current engine doesn't:

- Track rep changes from player actions
- Gate vendors by rep tier
- Create faction TENSION (helping one hurts another)
- Use moral alignment to modify faction interactions

This spec wires the existing data into gameplay systems.

---

## CURRENT STATE (WHAT EXISTS)

✅ `data/mecha/factions.json` — 5 factions with repTiers (0/10/25/50/75/100), vendorCatalog, repSources
✅ `resources.json` — `rep_police`, `rep_corporate`, `rep_underground`, `rep_exile`, `rep_military`
✅ `game.js _loadFactions()` — Loads and registers factions
✅ `game.js _checkRepTierTransitions()` — Detects when rep crosses tier thresholds
✅ Faction rep already awarded in some mission rewards

❌ No vendor system gated by rep
❌ No faction RIVALRY (gaining rep with one doesn't cost rep with another)
❌ No moral alignment modifiers on rep gains
❌ No faction mission boards
❌ No alliance/hostility state

---

## PART 1: FACTION RIVALRY MATRIX

### 1.1 Rivalry data

When you gain rep with one faction, rivals lose rep. This creates meaningful choice.

**Add to each faction in `factions.json`, new field `rivalries`:**

```json
// faction_ntpd:
"rivalries": {
  "faction_exile_network": -0.3,
  "faction_underground": -0.2
}

// faction_kuroda_command:
"rivalries": {
  "faction_exile_network": -0.5,
  "faction_underground": -0.1
}

// faction_taeyang:
"rivalries": {
  "faction_exile_network": -0.4,
  "faction_underground": -0.3
}

// faction_exile_network:
"rivalries": {
  "faction_ntpd": -0.2,
  "faction_kuroda_command": -0.5,
  "faction_taeyang": -0.4
}

// faction_underground:
"rivalries": {
  "faction_ntpd": -0.3,
  "faction_taeyang": -0.2
}
```

Meaning: gaining +10 rep with NTPD costs -3 with Exile and -2 with Underground.

### 1.2 Apply rivalries in engine

**In `game.js`, create a method and call it whenever rep changes:**

```js
/**
 * Award faction rep with rivalry spillover.
 * @param {string} factionId - e.g. 'faction_ntpd'
 * @param {number} amount - rep gained (positive or negative)
 */
awardFactionRep(factionId, amount) {
    const faction = this.state.items[factionId];
    if (!faction || !faction.repId) return;

    // Apply primary rep
    const repRes = this.state.items[faction.repId];
    if (repRes) {
        repRes.val = Math.max(0, Math.min(100, (repRes.val || 0) + amount));
    }

    // Apply rivalry spillover (only on positive gains)
    if (amount > 0 && faction.rivalries) {
        for (const [rivalId, ratio] of Object.entries(faction.rivalries)) {
            const rival = this.state.items[rivalId];
            if (rival && rival.repId) {
                const rivalRep = this.state.items[rival.repId];
                if (rivalRep) {
                    const loss = Math.abs(amount * ratio);
                    rivalRep.val = Math.max(0, (rivalRep.val || 0) - loss);
                }
            }
        }
    }

    // Check tier transitions
    this._checkRepTierTransitions();

    // Log
    if (amount > 0) {
        Log.add(`▲ ${faction.shortName} rep +${amount}`, 'faction');
    } else {
        Log.add(`▼ ${faction.shortName} rep ${amount}`, 'faction');
    }
},
```

### 1.3 Morality modifier on rep gains

Idealist players gain bonus rep with lawful factions. Pragmatic players gain bonus with underground.

```js
// Inside awardFactionRep, before applying primary rep:
const morality = this.state.morality?.value || 0;
let moralMod = 1.0;

if (faction.alignment === 'lawful' && morality >= 30) moralMod = 1.2;    // Idealists +20% with law
if (faction.alignment === 'lawful' && morality <= -30) moralMod = 0.8;    // Pragmatists -20% with law
if (faction.alignment === 'criminal' && morality <= -30) moralMod = 1.2;  // Pragmatists +20% with criminal
if (faction.alignment === 'criminal' && morality >= 30) moralMod = 0.8;   // Idealists -20% with criminal

amount = Math.round(amount * moralMod);
```

---

## PART 2: VENDOR SYSTEM

### 2.1 Rep-gated shops

Each faction's `vendorCatalog` is tier-gated. When the player visits a faction's vendor, they see items for their current tier and below.

**Add method to `game.js`:**

```js
/**
 * Get available vendor items for a faction based on current rep.
 * @param {string} factionId
 * @returns {Object} { parts: [], weapons: [], blueprints: [], backpacks: [] }
 */
getFactionVendor(factionId) {
    const faction = this.state.items[factionId];
    if (!faction || !faction.vendorCatalog) return { parts: [], weapons: [], blueprints: [], backpacks: [] };

    const repRes = this.state.items[faction.repId];
    const currentRep = repRes?.val || 0;

    const result = { parts: [], weapons: [], blueprints: [], backpacks: [] };

    // Collect all items from tiers at or below current rep
    for (const [tierStr, catalog] of Object.entries(faction.vendorCatalog)) {
        const tier = parseInt(tierStr);
        if (currentRep >= tier) {
            if (catalog.parts) result.parts.push(...catalog.parts);
            if (catalog.weapons) result.weapons.push(...catalog.weapons);
            if (catalog.blueprints) result.blueprints.push(...catalog.blueprints);
            if (catalog.backpacks) result.backpacks.push(...catalog.backpacks);
        }
    }

    // Deduplicate
    for (const key of Object.keys(result)) {
        result[key] = [...new Set(result[key])];
    }

    return result;
},
```

### 2.2 Vendor UI

In the MARKET section or a new FACTION sub-panel:

```vue
<div v-for="faction in discoveredFactions" :key="faction.id" class="faction-vendor">
  <div class="vendor-header">
    {{ faction.icon }} {{ faction.shortName }} Vendor
    <span class="rep-display">Rep: {{ currentRep(faction) }} ({{ currentTierName(faction) }})</span>
  </div>

  <div v-if="vendorItems(faction.id).parts.length" class="vendor-category">
    <div class="cat-header">Parts</div>
    <div v-for="partId in vendorItems(faction.id).parts" :key="partId" class="vendor-item">
      {{ getItemName(partId) }} — {{ getItemCost(partId) }} creds
      <button @click="buyFromVendor(partId)">Buy</button>
    </div>
  </div>

  <!-- Same for weapons, blueprints, backpacks -->
</div>
```

### 2.3 Buy from vendor

```js
buyFromVendor(itemId) {
    const item = this.state.items[itemId];
    if (!item) { Log.add('Item not found in catalog.', 'error'); return; }

    const cost = item.value || item.cost?.creds || 50;
    const creds = this.state.items.creds;
    if (!creds || creds.val < cost) {
        Log.add(`✗ Not enough creds (need ${cost}).`, 'error');
        return;
    }

    creds.val -= cost;

    // Add to inventory based on item type
    if (item.type === 'part') {
        this.state.player.partsInventory.push(item.id);
    } else if (item.type === 'weapon') {
        // Add to weapon inventory
        if (!this.state.player.weaponInventory) this.state.player.weaponInventory = [];
        this.state.player.weaponInventory.push(item.id);
    }
    // blueprints: unlock the blueprint
    else if (item.type === 'blueprint' || itemId.startsWith('bp_')) {
        const bp = this.state.items[itemId];
        if (bp) { bp.locked = false; bp.owned = 1; }
    }

    Log.add(`✦ Purchased: ${item.name || itemId}`, 'action');
},
```

---

## PART 3: FACTION MISSION BOARD

### 3.1 Faction-specific missions

Missions already have faction reward patterns. Formalize with a `factionSource` field:

```json
{
  "id": "msn_ntpd_patrol_docks",
  "title": "NTPD Patrol: Dockyard Sweep",
  "factionSource": "faction_ntpd",
  "require": "g.rep_police>=10",
  "rewards": { "creds": 30, "rep_police": 3, "glory": 5 },
  "..."
}
```

### 3.2 Mission board per faction in zone

Each zone's faction missions show in the zone detail. Filter:

```js
factionMissions(factionId) {
    return Object.values(this.game.state.items)
        .filter(i => i.type === 'mission' && i.factionSource === factionId && !i.locked);
}
```

### 3.3 Route rep rewards through awardFactionRep

Currently, mission rewards apply rep directly. Change to use the new method:

In `_onCombatEnd` (victory handler), when applying rewards:

```js
// Replace direct rep application:
// OLD: if (rewards.rep_police) { repRes.val += rewards.rep_police; }

// NEW:
for (const [key, amount] of Object.entries(rewards)) {
    if (key.startsWith('rep_')) {
        // Find faction by repId
        const faction = Object.values(this.state.items)
            .find(i => i.type === 'faction' && i.repId === key);
        if (faction) {
            this.awardFactionRep(faction.id, amount);
        }
    }
}
```

---

## PART 4: FACTION STATUS DISPLAY

### 4.1 Faction overview panel

Show all faction relationships at a glance. In the map or a dedicated FACTIONS tab:

```vue
<div class="faction-overview">
  <div v-for="f in allFactions" :key="f.id" class="faction-row">
    <span class="faction-icon">{{ f.icon }}</span>
    <span class="faction-name">{{ f.shortName }}</span>
    <div class="rep-bar">
      <div class="rep-fill" :style="{ width: repPct(f) + '%', background: f.color }"></div>
    </div>
    <span class="rep-tier">{{ currentTierName(f) }}</span>
    <span class="rep-val">{{ Math.floor(repVal(f)) }}/100</span>
  </div>
</div>
```

### 4.2 Rep tier transition notifications

The existing `_checkRepTierTransitions()` fires when rep crosses thresholds. Enhance it:

```js
_checkRepTierTransitions() {
    const factions = Object.values(this.state.items).filter(i => i.type === 'faction');
    for (const f of factions) {
        const repRes = this.state.items[f.repId];
        if (!repRes) continue;
        const currentVal = repRes.val || 0;

        // Find current tier
        const tiers = Object.keys(f.repTiers).map(Number).sort((a, b) => b - a);
        let currentTier = 0;
        for (const t of tiers) {
            if (currentVal >= t) { currentTier = t; break; }
        }

        // Check if tier changed
        if (currentTier !== (f._lastKnownTier || 0)) {
            const tierInfo = f.repTiers[currentTier];
            const direction = currentTier > (f._lastKnownTier || 0) ? '▲' : '▼';
            f._lastKnownTier = currentTier;

            Log.add(`${direction} ${f.shortName}: ${tierInfo.name}`, 'faction');
            this.showDialogue('system', [
                `FACTION STATUS CHANGE: ${f.name}`,
                `New standing: ${tierInfo.name}`,
                tierInfo.desc,
                ...(tierInfo.unlocks ? [`Unlocked: ${tierInfo.unlocks.join(', ')}`] : [])
            ]);

            // Unlock tier-specific items
            if (tierInfo.unlocks) {
                for (const unlockId of tierInfo.unlocks) {
                    const item = this.state.items[unlockId];
                    if (item) { item.locked = false; }
                }
            }
        }
    }
},
```

---

## PART 5: ALLIANCE STATE

### 5.1 Faction relationship labels

Based on rep value, display relationship state:

```js
getFactionRelationship(factionId) {
    const f = this.state.items[factionId];
    const repRes = this.state.items[f?.repId];
    const val = repRes?.val || 0;

    if (val >= 75) return { label: 'Allied', color: '#4f4' };
    if (val >= 50) return { label: 'Friendly', color: '#8f8' };
    if (val >= 25) return { label: 'Neutral', color: '#ff8' };
    if (val >= 10) return { label: 'Wary', color: '#fa8' };
    return { label: 'Unknown', color: '#888' };
}
```

---

## VERIFICATION CRITERIA

- [ ] Gaining rep with NTPD costs rep with Exile/Underground (rivalry)
- [ ] Morality modifies rep gains (+20%/-20% based on alignment match)
- [ ] `awardFactionRep` is used for all rep changes (missions, events)
- [ ] Faction vendors show items gated by current rep tier
- [ ] Buying from vendor deducts creds and adds to inventory
- [ ] Tier transition triggers notification + unlocks
- [ ] Faction overview panel shows all 5 factions with rep bars
- [ ] Faction-specific missions filter correctly
- [ ] Rep persists across save/load (already via resources)
- [ ] `g.rep_police>=25` works in require strings (already functional)

## FILE REFERENCE

| File | Action |
|------|--------|
| `data/mecha/factions.json` | MODIFY — add `rivalries` field |
| `src/game.js` | MODIFY — `awardFactionRep`, `getFactionVendor`, `buyFromVendor`, enhance `_checkRepTierTransitions` |
| `src/ui/TerminalUI.vue` | MODIFY — faction overview panel, vendor UI |

---

*Depends on: Reclaim-01 (Morale for moral modifiers). Feeds into: all mission rewards, zone access, vendor catalogs.*
