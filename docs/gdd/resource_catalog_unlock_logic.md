# Resource Catalog & Unlock Logic

This document defines every resource in the game, organized by unlock tier and group. It serves as both the design reference and the direct source for `data/mecha/resources.json`.

---

## Design Decisions (Locked)

1. **Scrap classification:** 3 separate resources (ferrous, polymer, electronic). Raw scrap becomes hidden in UI after Sorting Station is built but persists as input for Nano Infra.
2. **Supply:** Global resource with paid auto-reload. After each mission ends, supply auto-refills toward max, consuming scrap proportionally. No idle regen.
3. **Reputation:** Multi-faction (4 separate counters). Each faction is an independent resource with its own gates and vendor catalogs.

---

## Resource Groups (UI Organization)

Resources are organized into groups that control how they render in the interface. The UI should display groups in this order, hiding any group where all members are still locked:

| Group | UI Color | Display Location | Visible When |
|-------|----------|-----------------|-------------|
| `player` | `#0af` (cyan) | Top bar, always prominent | Always |
| `base` | `#0fa` (green) | Top bar | Always (scrap hides after triagem, see notes) |
| `currency` | `#ff0` (yellow) | Top bar | Always |
| `classified` | `#6d8` (muted green) | Top bar, replaces raw scrap visually | Sorting Station built |
| `refined` | `#f0a` (pink) | Resource detail panel | Any member unlocked |
| `combat` | `#f5c` (gold/amber) | Combat panel / loadout area | Garage restored |
| `research` | `#bf8` (lime) | Research panel | Research Bench built |
| `faction` | `#8af` (blue) | Faction/reputation panel | Any faction encountered |
| `meta` | `#aaa` (grey) | Settings / prestige panel | Varies |

---

## Complete Resource Catalog

### GROUP: `player` — Action Fuel

```json
{
  "id": "energy",
  "name": "Energy",
  "desc": "Your stamina for tasks, exploration, and missions.",
  "flavor": "Sleep is optional. Energy is not.",
  "group": "player",
  "icon": "⚡",
  "color": "#0af",
  "val": 50,
  "max": 50,
  "rate": 0.3,
  "locked": false,
  "sortOrder": 1
}
```

**Unlock:** Always visible from minute 0.
**Modified by:** Workshop Upgrade (+20 max, +0.1 rate), Energy Capacitor repeatable (+10 max per level).
**Consumed by:** Every task (as `run` cost per second for perpetual tasks, or `cost` for one-shot tasks), mission entry costs.
**Design note:** Energy is the universal idle gate. It limits *throughput*, not access. The player can always *start* any unlocked task — energy determines how long they can sustain it.

---

### GROUP: `base` — Raw Materials

```json
{
  "id": "scrap",
  "name": "Scrap Metal",
  "desc": "Unsorted junkyard salvage. The foundation of everything.",
  "flavor": "One man's trash. Literally.",
  "group": "base",
  "icon": "⚙",
  "color": "#0fa",
  "val": 0,
  "max": 100,
  "rate": 0,
  "locked": false,
  "sortOrder": 10,
  "hideWhen": "g.triagem>0"
}
```

**Unlock:** Always visible from minute 0. **Hidden in UI** after Sorting Station is built (field `hideWhen`). Still exists internally as a resource — Nano Infra refining consumes raw scrap.
**Source:** "Scavenge Scrap" task (pre-Sorting Station), residual from zone tasks that don't classify.
**Consumed by:** Building structures, Nano Infra refinement, Supply auto-reload cost.
**Modified by:** Sorting Station (+50 max, +0.1 rate), Scrap Compressor (+40 max per level).

**Design note on `hideWhen`:** This is a new field not in the Arcanum base engine. If implementing `hideWhen` is too costly, alternative: set `sortOrder` to 999 after triagem is built, pushing it to bottom of the list. Or simply leave it visible — the player will understand "raw scrap" vs classified quickly enough.

---

### GROUP: `currency` — Money

```json
{
  "id": "creds",
  "name": "Creds",
  "desc": "New Tokyo's digital currency. Accepted everywhere that matters.",
  "flavor": "Credits make the neon world go round.",
  "group": "currency",
  "icon": "¢",
  "color": "#ff0",
  "val": 0,
  "max": 200,
  "rate": 0,
  "locked": false,
  "sortOrder": 20
}
```

**Unlock:** Always visible from minute 0 (first earned via "Odd Jobs" task).
**Source:** Jobs, deliveries, selling salvage/parts, mission rewards.
**Consumed by:** Blueprints, market purchases, structure costs, faction vendor transactions.
**Modified by:** Workshop Upgrade (+100 max).

---

### GROUP: `classified` — Sorted Scrap

These three resources appear simultaneously when the Sorting Station is built. They replace raw scrap as the player's primary collection focus.

```json
{
  "id": "ferrous_scrap",
  "name": "Ferrous Scrap",
  "desc": "Sorted metallic salvage. Structural alloys, plating fragments, rebar.",
  "flavor": "Heavy, rusty, and full of potential.",
  "group": "classified",
  "icon": "⛏",
  "color": "#c97",
  "val": 0,
  "max": 60,
  "rate": 0,
  "locked": true,
  "require": "g.triagem>0",
  "sortOrder": 30
}
```

```json
{
  "id": "polymer_scrap",
  "name": "Polymer Scrap",
  "desc": "Sorted synthetic salvage. Plastics, rubber seals, insulation.",
  "flavor": "Flexible in every sense of the word.",
  "group": "classified",
  "icon": "⬡",
  "color": "#7ca",
  "val": 0,
  "max": 60,
  "rate": 0,
  "locked": true,
  "require": "g.triagem>0",
  "sortOrder": 31
}
```

```json
{
  "id": "electronic_scrap",
  "name": "Electronic Scrap",
  "desc": "Sorted circuit salvage. Chips, wiring, capacitors, sensors.",
  "flavor": "Somewhere in this tangle is a working processor.",
  "group": "classified",
  "icon": "⧉",
  "color": "#ad8",
  "val": 0,
  "max": 60,
  "rate": 0,
  "locked": true,
  "require": "g.triagem>0",
  "sortOrder": 32
}
```

**Unlock:** All three appear when Sorting Station is built (`g.triagem>0`).
**Source:** Zone-specific scavenging tasks. Industrial sector yields more ferrous. Tech district yields more electronic. General scrapyard yields a mix. Proportions depend on zone, not player choice.
**Consumed by:** Refinery recipes (ferrous → Ceramite, polymer → Nanofiber, electronic → Quantum Circuitry).
**Design note:** The Sorting Station doesn't *create* new materials — it reveals what was always in the scrap pile. The narrative framing matters: "You're not finding new things. You're learning to see what was already there."

---

### GROUP: `refined` — Processed Materials

Each refined material has a unique narrative unlock. They appear one at a time as the player engages with different game systems.

```json
{
  "id": "nano_infra",
  "name": "Nano Infra",
  "desc": "Nano-scale infrastructure substrate. The universal crafting base.",
  "flavor": "Invisible to the eye. Essential to everything.",
  "group": "refined",
  "icon": "◈",
  "color": "#a6f",
  "val": 0,
  "max": 20,
  "rate": 0,
  "locked": true,
  "require": "g.refinaria>0",
  "sortOrder": 100
}
```

**Unlock:** Build the Refinery. First refined material the player produces.
**Source:** Refine from raw (unclassified) scrap: 15 scrap → 1 Nano Infra.
**Consumed by:** Almost every advanced recipe as a base ingredient. The "flour" of the crafting economy.

```json
{
  "id": "nanofiber",
  "name": "Nanofiber Fabric",
  "desc": "Ultra-light synthetic weave. Used in cockpit lining and flexible armor.",
  "flavor": "Stronger than steel. Lighter than silk. Uglier than both.",
  "group": "refined",
  "icon": "≋",
  "color": "#6ce",
  "val": 0,
  "max": 20,
  "rate": 0,
  "locked": true,
  "require": "g.bp_nanofiber>0",
  "sortOrder": 110
}
```

**Unlock:** Find the Nanofiber Loom blueprint in the Neon Bazaar (35% per exploration run). Teaches exploration-for-loot.
**Source:** Refine from polymer scrap: 15 polymer + 3 Nano Infra → 1 Nanofiber.

```json
{
  "id": "ceramite",
  "name": "Ceramite Plating",
  "desc": "Ceramic-metal composite. Heavy armor for frames that expect to get hit.",
  "flavor": "The difference between a scratch and a crater.",
  "group": "refined",
  "icon": "◆",
  "color": "#e96",
  "val": 0,
  "max": 20,
  "rate": 0,
  "locked": true,
  "require": "g.research_armor>0",
  "sortOrder": 120
}
```

**Unlock:** Research "Improvised Armor Techniques" at the Research Bench. Requires collecting Armor Fragments from combat loot first. Teaches combat-feeds-economy.
**Source:** Refine from ferrous scrap: 20 ferrous + 5 Nano Infra → 1 Ceramite.

```json
{
  "id": "fusion_cells",
  "name": "Fusion Cells",
  "desc": "Miniature fusion power units. Required for energy weapons and advanced systems.",
  "flavor": "Handle with extreme care. And maybe tongs.",
  "group": "refined",
  "icon": "⚛",
  "color": "#fe6",
  "val": 0,
  "max": 20,
  "rate": 0,
  "locked": true,
  "require": "g.quest_industrial_wasteland>0",
  "sortOrder": 130
}
```

**Unlock:** Complete the Industrial Wasteland exploration mission (discover abandoned factory). Teaches zone exploration.
**Source:** Refine from electronic scrap: 20 electronic + 5 Nano Infra + 2 Ceramite → 1 Fusion Cell.

```json
{
  "id": "quantum_circuits",
  "name": "Quantum Circuitry",
  "desc": "Quantum-coherent processing modules. The bleeding edge of New Tokyo tech.",
  "flavor": "It's both working and broken until you open the case.",
  "group": "refined",
  "icon": "◇",
  "color": "#bf8",
  "val": 0,
  "max": 20,
  "rate": 0,
  "locked": true,
  "require": "g.quest_hack_downtown>0",
  "sortOrder": 140
}
```

**Unlock:** Complete the Downtown hacking mission (corporate terminal infiltration). Teaches hacking/netrunning. Last standard material to unlock.
**Source:** Refine from electronic scrap: 25 electronic + 8 Nano Infra → 1 Quantum Circuit.

---

### GROUP: `combat` — Battle Resources

These resources appear together when the Garage is restored and combat begins.

```json
{
  "id": "glory",
  "name": "Glory",
  "desc": "Combat experience and prestige. Dual currency: spend on advancement or maintenance.",
  "flavor": "Every scar tells a story. Every story earns respect.",
  "group": "combat",
  "icon": "⚔",
  "color": "#f5c542",
  "val": 0,
  "max": 500,
  "rate": 0,
  "locked": true,
  "require": "g.garagem>0",
  "sortOrder": 200
}
```

**Unlock:** Restore the Garage (triggers first combat).
**Source:** Exclusively from combat (see §8.1 Glory earning table).
**Consumed by:** Rank advancement, Glory Repair, part purchases, cross-class maneuvers, squad attribute investment.

```json
{
  "id": "parts",
  "name": "Mecha Parts",
  "desc": "Generic salvaged components. Used for basic repairs and trades.",
  "flavor": "One frame's trash is another frame's arm.",
  "group": "combat",
  "icon": "⊞",
  "color": "#8cf",
  "val": 0,
  "max": 30,
  "rate": 0,
  "locked": true,
  "require": "g.garagem>0",
  "sortOrder": 210
}
```

**Unlock:** Restore the Garage.
**Source:** Combat loot, dismantling.
**Consumed by:** "Repair Frame" task (3 parts + 10 scrap).
**Design note:** This is the *generic* parts counter for basic repairs. Specific named parts (e.g., "KZ Industrial Torso Mk.I") are inventory items, not resources. The `parts` resource represents small interchangeable components — bolts, cables, actuator pins.

```json
{
  "id": "supply",
  "name": "Supply",
  "desc": "Ammunition, fuel cells, and expendable combat materials.",
  "flavor": "Bullets aren't free. Neither is survival.",
  "group": "combat",
  "icon": "▸",
  "color": "#fa5",
  "val": 10,
  "max": 10,
  "rate": 0,
  "locked": true,
  "require": "g.garagem>0",
  "sortOrder": 220,
  "special": "auto_reload"
}
```

**Unlock:** Restore the Garage.
**Source:** Auto-reload at mission end (costs scrap). Ammo Crate backpack item (+5 at mission start).
**Consumed by:** Weapon attacks during combat. Each weapon has a `supplyCost` per use (d4 weapons: 0.33/use, d12 weapons: 3/use).
**Modified by:** Frame category supply efficiency (Light 1.2×, Medium 1.0×, Heavy 0.8×), Ammo Crate backpack item.

**Auto-reload mechanic:**
```
Mission ends → Supply at X out of max
Reload amount = max - X
Reload cost = reload_amount × 2 scrap
If player has enough scrap:
  → Supply restored to max, scrap deducted
  → Log: "RESUPPLY: [cost] scrap → [max]/[max] ✓"
If player has partial scrap:
  → Supply restored proportionally
  → Log: "RESUPPLY: [available] scrap → [partial]/[max] (LOW)"
If player has 0 scrap:
  → Supply unchanged
  → Log: "⚠ RESUPPLY FAILED — No scrap available"
```

The reload cost (2 scrap per point) creates a natural tension: Heavy frames burn ~25% more supply per mission and thus pay ~25% more scrap to reload. Over many missions, this adds up as the "operational tax" that balances Heavy's combat superiority.

---

### GROUP: `research` — Knowledge

```json
{
  "id": "data_chips",
  "name": "Data Chips",
  "desc": "Encrypted data modules. Required for research projects and schematics.",
  "flavor": "Information is the most expensive commodity in New Tokyo.",
  "group": "research",
  "icon": "◇",
  "color": "#bf8",
  "val": 0,
  "max": 20,
  "rate": 0,
  "locked": true,
  "require": "g.mesa_pesquisa>0",
  "sortOrder": 300
}
```

**Unlock:** Build the Research Bench.
**Source:** Combat loot (higher-difficulty missions), exploration rewards, specific quest completions.
**Consumed by:** Research projects, advanced blueprint study, Cybernetic Bench augmentations.

---

### GROUP: `faction` — Reputation Counters

Four independent reputation tracks. Each unlocks vendor catalogs, mission lines, and narrative branches. Reputation can be negative (hostile) in future design, but starts as 0-based for simplicity.

```json
{
  "id": "rep_police",
  "name": "Police Rep",
  "desc": "Standing with New Tokyo's law enforcement.",
  "flavor": "Badge or no badge, they know your name.",
  "group": "faction",
  "icon": "⊕",
  "color": "#68f",
  "val": 0,
  "max": 100,
  "rate": 0,
  "locked": true,
  "require": "g.quest_police_contact>0",
  "sortOrder": 400
}
```

```json
{
  "id": "rep_corporate",
  "name": "Corporate Rep",
  "desc": "Standing with New Tokyo's corporate powers.",
  "flavor": "They don't respect you. They respect your usefulness.",
  "group": "faction",
  "icon": "⊕",
  "color": "#f86",
  "val": 0,
  "max": 100,
  "rate": 0,
  "locked": true,
  "require": "g.quest_corporate_contact>0",
  "sortOrder": 410
}
```

```json
{
  "id": "rep_underground",
  "name": "Underground Rep",
  "desc": "Standing with the scrapyard networks and black market.",
  "flavor": "Down here, trust is the only currency that matters.",
  "group": "faction",
  "icon": "⊕",
  "color": "#ca6",
  "val": 0,
  "max": 100,
  "rate": 0,
  "locked": true,
  "require": "g.quest_underground_contact>0",
  "sortOrder": 420
}
```

```json
{
  "id": "rep_exile",
  "name": "Exile Rep",
  "desc": "Standing with the outcasts beyond New Tokyo's walls.",
  "flavor": "They left the city. The city hasn't forgotten them.",
  "group": "faction",
  "icon": "⊕",
  "color": "#c8f",
  "val": 0,
  "max": 100,
  "rate": 0,
  "locked": true,
  "require": "g.quest_exile_contact>0",
  "sortOrder": 430
}
```

**Unlock:** Each faction appears when the player first encounters that faction's contact NPC (through narrative quests). They don't all appear at once — the Underground is typically first (Neon Bazaar exploration), Police comes through story missions, Corporate through Arena or deliveries, Exile is latest (mid-to-late game).

**Source:** Faction-specific missions, dialogue choices, trade volume with faction vendors.
**Consumed by:** Not "spent" — reputation acts as a gate (`require: "g.rep_police>=10"`). Higher rep unlocks better vendor catalogs and exclusive missions. Some purchases may reduce opposing faction rep (buying corporate parts might cost Underground rep).

**Reputation thresholds:**

| Rep Level | Threshold | Access |
|-----------|-----------|--------|
| Unknown | 0 | Faction visible but no services |
| Acquaintance | 10 | Basic vendor catalog, tier 1 missions |
| Trusted | 25 | Full vendor catalog, tier 2 missions |
| Allied | 50 | Exclusive parts/blueprints, tier 3 missions |
| Honored | 75 | Faction-unique Frame blueprints, career specializations |
| Legend | 100 | Endgame faction content |

---

### GROUP: `meta` — System Resources

```json
{
  "id": "space",
  "name": "Space",
  "desc": "Available building space in the scrapyard.",
  "flavor": "Real estate in the junkyard. Premium, apparently.",
  "group": "meta",
  "icon": "▢",
  "color": "#aaa",
  "val": 3,
  "max": 3,
  "rate": 0,
  "locked": false,
  "sortOrder": 900
}
```

**Unlock:** Always exists (starts with 3 slots for Phase 1 structures).
**Source:** Scrapyard phase upgrades increase `max`. Phase 2: +3, Phase 3: +4, Phase 4: +3, Phase 5: +3.
**Consumed by:** Each structure occupies 1 space. Repeatable upgrades (Scrap Compressor, etc.) do NOT consume space — they modify existing structures.
**Design note:** Space is visible in the Scrapyard build UI, not in the main resource bar. It's a construction budget, not a production resource.

```json
{
  "id": "moralidade",
  "name": "Morality",
  "desc": "Your moral compass. Idealist (+) vs Pragmatic (-).",
  "flavor": "Every choice is a mirror.",
  "group": "meta",
  "icon": "⚖",
  "color": "#ddd",
  "val": 0,
  "min": -100,
  "max": 100,
  "rate": 0,
  "locked": false,
  "sortOrder": 910,
  "special": "bipolar"
}
```

**Unlock:** Always exists internally, but only displayed in UI after the player's first moral choice (typically Phase 2, first dialogue).
**Source:** Dialogue choices, mission outcomes, faction interactions.
**Consumed by:** Not spent — acts as gate for career branching, Scrapyard morality variants, and narrative paths.
**Technical note:** The Arcanum engine doesn't natively support `min` as a negative value. Implementation options: (a) use two separate resources `idealism` and `pragmatism` that counter-balance, or (b) add `min` field support to the resource system. Option (b) is a small engine change with high design payoff.

```json
{
  "id": "prestige_points",
  "name": "Prestige Points",
  "desc": "Permanent currency earned through Respect resets. Survives all prestige cycles.",
  "flavor": "What remains when everything else is stripped away.",
  "group": "meta",
  "icon": "★",
  "color": "#ffd700",
  "val": 0,
  "max": 999,
  "rate": 0,
  "locked": true,
  "require": "g.prestige_available>0",
  "sortOrder": 999,
  "special": "persistent"
}
```

**Unlock:** Visible after reaching Rank 8+ in any Position (prestige becomes available).
**Source:** Earned on each Prestige reset (base 1 PP + bonuses per rank/career/morality).
**Consumed by:** Prestige upgrades (see §8.7).
**Special:** `persistent` flag means this resource (and its upgrades) survives the Prestige reset. Everything else in the game resets; this does not.

---

## Unlock Timeline Summary

```
MINUTE 0 ─── energy, scrap, creds (3 visible)
    │
    ▼
PHASE 2 ──── ferrous_scrap, polymer_scrap, electronic_scrap (6 visible)
(Sorting)     scrap becomes hidden in UI
    │
    ▼
PHASE 3a ─── nano_infra (7 visible)
(Refinery)
    │
PHASE 3b ─── glory, parts, supply (10 visible)
(Garage)
    │
PHASE 3c ─── data_chips (11 visible)
(Research)
    │
    ▼
PHASE 3+ ─── nanofiber (via Bazaar blueprint, 12 visible)
(Narrative)   ceramite (via Research + Armor Fragments, 13)
              rep_underground (first faction contact, 14)
              rep_police (story mission, 15)
    │
    ▼
PHASE 4 ──── fusion_cells (Industrial Wasteland quest, 16)
(Missions)    quantum_circuits (Downtown hack quest, 17)
              rep_corporate, rep_exile (18-19)
    │
    ▼
PHASE 5 ──── prestige_points (after Rank 8+, 20)
(Endgame)
```

**Maximum simultaneous new resources per phase:**
- Phase 1→2: +3 (classified scrap types)
- Phase 2→3: +4 (nano_infra, glory, parts, supply) — spread across Refinery and Garage milestones
- Phase 3 ongoing: +1 at a time (each refined material is a separate narrative discovery)
- Phase 4+: +1 at a time (quests unlock materials individually)

At no point does the player see more than 4 new resources at once, and those 4 are spread across different UI areas (classified in top bar, combat in loadout panel).

---

## Resource Count by Group

| Group | Count | Phase Available |
|-------|-------|----------------|
| `player` | 1 | Phase 1 |
| `base` | 1 (hidden after Phase 2) | Phase 1 |
| `currency` | 1 | Phase 1 |
| `classified` | 3 | Phase 2 |
| `refined` | 5 | Phase 3–4 (staggered) |
| `combat` | 3 | Phase 3 |
| `research` | 1 | Phase 3 |
| `faction` | 4 | Phase 3–4 (staggered) |
| `meta` | 3 | Varies |
| **Total** | **22** | |

---

## Custom Fields (Engine Extensions Needed)

Three resources use fields not present in the base Arcanum engine:

| Field | Used By | Purpose | Implementation |
|-------|---------|---------|---------------|
| `hideWhen` | scrap | Hide resource in UI when condition is true | UI-only: `v-if="!hideCondition"` in resource bar renderer |
| `min` (negative) | moralidade | Allow bipolar -100 to +100 range | Engine: add `min` field to resource processing, default 0 |
| `special: "persistent"` | prestige_points | Survive prestige reset | Prestige system: skip this resource during reset sweep |
| `special: "auto_reload"` | supply | Trigger paid reload at mission end | CombatRunner: call reload logic in `endCombat()` |
| `special: "bipolar"` | moralidade | UI renders as bipolar gauge instead of bar | UI-only: render as centered gauge with +/- labels |
