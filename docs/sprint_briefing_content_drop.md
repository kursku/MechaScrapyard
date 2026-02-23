<!-- markdownlint-disable MD024 -->

# MECHA SCRAPYARD — Sprint Briefing: Content Drop

**Date:** February 20, 2026
**From:** Design (Claude, via GDD sessions)
**To:** Implementation (Antigravity)
**Subject:** Massive content expansion — new data files, systems, and narrative alignment
**Depends on:** Previous sprint briefing (Priorities 1-5) should be at least partially complete

---

## CONTEXT

The previous sprint briefing (`sprint_briefing_antigravity.md`) addressed the foundation: resource alignment, scrapyard Phase 1→2, minimal narrative, garage as combat gate, and combat Phase 3. That work establishes the core loop.

This briefing delivers the **content layer** that sits on top of that foundation. Over multiple design sessions, we produced:

- 11 new or significantly updated JSON data files
- 1 new narrative foundation document (narrative_bible.md)
- 6 handcrafted boss encounters with phase mechanics
- 5 faction systems with reputation tiers and vendor catalogs
- 22 faction-gated crafting blueprints
- 6 new scrapyard structures (Phase 3-5)
- Complete narrative alignment across all data (backstory, dialogue, cross-references)
- Engine audit with 8 critical/important fixes applied

**Everything described here is ready as data.** The JSON files are complete, cross-referenced, and validated. Implementation means wiring them into the engine, not designing them.

---

## FILE MANIFEST

### Replace These Files (updated versions)

| File | What Changed | Priority |
| --- | --- | --- |
| `resources.json` | +1 resource (rep_military). Now 23 total. | HIGH — deploy immediately |
| `upgrades.json` | +6 structures (hangars, cybernetic bench, security, secret lab). Now 16 total. | HIGH — needed for Phase 3-5 |
| `modules.json` | +4 registered modules (manufacturers, factions, blueprints, combat_config). Now 21. | HIGH — engine won't load new files without this |
| `equipslots.json` | Rewritten. 9 GDD-aligned slots replacing old 10. See §EQUIP SLOTS below. | MEDIUM — needed before mecha assembly works correctly |
| `missions.json` | All narrative rewritten. Backstory-aligned briefings/debriefings. Scrapyard Siege + Dad's Secret fully written. | MEDIUM — narrative quality, no mechanical change |
| `enemies.json` | +6 bosses with phase mechanics. All boss dialogue rewritten for backstory alignment. | MEDIUM — bosses are late-game content |
| `manufacturers.json` | Hayabusa Engineering rewritten as personal legacy. 11 manufacturers with full lore. | LOW — reference data, no mechanical impact |
| `parts.json` | +15 backpack utility items. 49 parts total. | LOW until backpack system is implemented |

### New Files (add to project)

| File | What It Is | Priority |
| --- | --- | --- |
| `factions.json` | 5 factions with rep tiers, vendor catalogs, blueprints, rep sources/penalties. | HIGH — new system |
| `blueprints.json` | 22 crafting recipes gated by faction rep. Types: part_mod, craft_frame, weapon_mod, etc. | HIGH — new system |
| `narrative_bible.md` | Master narrative document. Not loaded by engine — reference for content decisions. | REFERENCE ONLY |

### Files NOT Changed (verified compatible)

`combat_config.json`, `events.json`, `furniture.json`, `homes.json`, `sections.json`, `tags.json`, `tasks.json`, `frames.json`, `weapons.json`, `maneuvers.json`, `player.json`, `skills.json`

---

## IMPLEMENTATION PRIORITIES

```text
PRIORITY 6 ── Deploy Updated Data Files (~1 hour)
    │          Replace 8 files, add 2 new files, verify engine loads them
    │
    ▼
PRIORITY 7 ── Faction Reputation System (~4-6 hours)
    │          Rep resources visible in UI, gain/loss from missions, tier unlocks
    │
    ▼
PRIORITY 8 ── Blueprint/Crafting System (~4-6 hours)
    │          Faction-gated recipes in the Refinery/Workshop, material consumption
    │
    ▼
PRIORITY 9 ── Scrapyard Phase 3-5 Structures (~3-4 hours)
    │          6 new upgrades purchasable, phase transitions, narrative events
    │
    ▼
PRIORITY 10 ── Boss Encounter System (~6-8 hours)
    │           Phase mechanics, fixed loadouts, unique dialogue, special drops
    │
    ▼
PRIORITY 11 ── Equip Slot Migration (~2-3 hours)
               New 9-slot system, shoulder mounts, backpack slot

```

Each priority is independent and delivers testable value. Deploy in order for smoothest integration, but any can be done standalone.

---

## PRIORITY 6: Deploy Updated Data Files

### Goal

Get all new/updated JSON files into the project and verify the engine loads them without errors.

### What to Do

#### Step 6.1 — Replace files

Copy these files from the design output into `data/mecha/`:

```text
resources.json      ← 23 resources (was 22, added rep_military)
upgrades.json       ← 16 upgrades (was 10, added 6 Phase 3-5 structures)
modules.json        ← 21 modules (was 17, added manufacturers/factions/blueprints/combat_config)
equipslots.json     ← 9 slots (rewritten, see §EQUIP SLOTS)
missions.json       ← narrative rewritten, chain validated
enemies.json        ← +6 bosses added
manufacturers.json  ← Hayabusa lore updated
parts.json          ← +15 backpacks added

```

#### Step 6.2 — Add new files

```text
factions.json       ← NEW: 5 faction definitions
blueprints.json     ← NEW: 22 crafting recipes

```

#### Step 6.3 — Add to docs/gdd/

```text
narrative_bible.md  ← NEW: Master narrative reference (12 sections, ~30KB)

```

#### Step 6.4 — Verify engine startup

After deploying, verify:

- [ ] Game loads without JSON parse errors
- [ ] `modules.json` registers all 21 modules
- [ ] New resources appear in correct state (rep_military: locked, hidden until quest flag)
- [ ] New upgrades appear in upgrade list when requirements are met
- [ ] No console errors from undefined references

### Critical ID Fixes Already Applied

These were caught in our audit and fixed in the data files. Noting them here so you know they're resolved:

| Issue | Was | Now | Files Affected |
| --- | --- | --- | --- |
| Blueprint currency ID | `cred` | `creds` | blueprints.json (22 entries) |
| Blueprint material ID | `quantum_circuitry` | `quantum_circuits` | blueprints.json (3 entries) |
| Blueprint material ID | `damaged_parts` | `parts` | blueprints.json (1 entry) |
| Missing faction rep | — | `rep_military` added | resources.json |
| Mission require typo | `hangar_operacional` | `hangar_operational` | missions.json (1 entry) |

---

## PRIORITY 7: Faction Reputation System

### Goal

Players earn reputation with 5 factions through missions, combat, and choices. Rep unlocks vendor catalogs and blueprints at tier thresholds.

### Reference Documents

📎 `factions.json` — Complete faction definitions with rep tiers, vendors, rep sources
📎 `narrative_bible.md` §5 — Each faction's relationship to the father's story
📎 `resources.json` — Rep resources (rep_police, rep_military, rep_corporate, rep_underground, rep_exile)

### Data Structure (factions.json)

Each faction has:

```json
{
  "id": "faction_ntpd",
  "shortName": "NTPD",
  "repId": "rep_police",           ← links to resources.json resource ID
  "repTiers": {
    "unknown":      { "min": 0,  "perks": [...] },
    "acquaintance": { "min": 10, "perks": [...] },
    "trusted":      { "min": 25, "perks": [...], "unlocksBlueprints": [...] },
    "allied":       { "min": 50, "perks": [...], "unlocksBlueprints": [...] },
    "honored":      { "min": 75, "perks": [...], "unlocksBlueprints": [...] },
    "legend":       { "min": 100,"perks": [...] }
  },
  "repSources": [...],             ← how to gain rep
  "repPenalties": [...],           ← how to lose rep
  "vendorCatalog": {
    "parts": [...],                ← part IDs available at this vendor
    "weapons": [...],
    "frames": [...]
  }
}

```

### What to Build

#### Step 7.1 — Rep display in UI

Add a "Factions" section (or tab) showing:

- Faction name + current rep value + tier name
- Progress bar to next tier
- Rep is already tracked via resources.json (rep_police etc.), just needs UI

#### Step 7.2 — Rep gain from missions

Each story mission should award rep to the relevant faction. This data is in `factions.json` → `repSources`. Implementation:

```text
On mission complete:

  - Check mission zone/type
  - Award rep to appropriate faction
  - Example: completing msn_dockyard_dispute → rep_underground +3
  - Boss kills have specific rep awards (in bosses → rewards)

```

Suggested rep awards per mission (not in data yet — wire these or add to missions.json):

| Mission | Faction | Rep Award |
| --- | --- | --- |
| msn_rogue_drone_patrol | Underground | +2 |
| msn_scrapyard_scavengers | Underground | +2 |
| msn_dockyard_dispute | Underground | +3 |
| msn_unwelcome_visitors | Underground | +3 |
| msn_corporate_warning | NTPD | +3 |
| msn_beyond_perimeter | Kuroda | +3 |
| msn_taeyang_contract | Taeyang | +4 |
| msn_bounty_on_player | Underground | +4 |
| msn_dads_last_route | Phantom | +5 |
| msn_restricted_access | Kuroda | +5 |
| msn_phantom_signal | Phantom | +8 |
| Boss: Iron Volk | Underground | +10 |
| Boss: Crimson Nail | Taeyang | +12 |
| Boss: Deadlock | NTPD | +5 |
| Boss: Commander Steele | Kuroda | +15 |
| Boss: Null | Phantom | +20 |
| Boss: Kingpin | Underground | +8 |

#### Step 7.3 — Tier threshold checks

When rep crosses a tier threshold, trigger:

1. A notification/event ("You are now TRUSTED with the Underground")
2. Unlock any blueprints gated at that tier
3. Unlock vendor catalog items for that tier

#### Step 7.4 — Vendor access (optional, can defer)

Each faction has a `vendorCatalog` listing parts, weapons, and frames available for purchase. This requires a shop/vendor UI. Can be deferred if the Market tab doesn't support faction-specific shops yet.

### Verification Criteria

- [ ] All 5 rep resources visible in UI when unlocked
- [ ] Completing missions awards faction rep
- [ ] Tier transitions trigger notification
- [ ] Blueprints unlock at correct rep thresholds
- [ ] Rep values persist across saves

---

## PRIORITY 8: Blueprint/Crafting System

### Goal

Faction-gated crafting recipes that consume materials and produce upgrades, parts, or frames.

### Reference Documents

📎 `blueprints.json` — 22 complete recipe definitions
📎 `factions.json` — Which blueprints unlock at which rep tier
📎 `resources.json` — All material IDs for cost validation

### Data Structure (blueprints.json)

Each blueprint:

```json
{
  "id": "bp_at_shield_coating",
  "name": "Aegis Shield Coating",
  "type": "part_mod",                    ← recipe category
  "faction": "faction_ntpd",
  "repTierRequired": "trusted",          ← min rep tier to unlock
  "materials": {
    "ceramite": 3,
    "ferrous_scrap": 10,
    "creds": 50
  },
  "skillRequirements": {
    "skill_crafting": 3
  },
  "craftTime": 120,                      ← seconds
  "result": {
    "type": "part_mod",
    "target": "any_aegis_part",
    "effects": { "defMod": 2, "integrityBonus": 1 }
  }
}

```

Blueprint types in the game:

| Type | Count | What It Produces |
| --- | --- | --- |
| `part_mod` | 7 | Modification applied to existing part (+stats) |
| `craft_frame` | 4 | Complete new frame (endgame content) |
| `craft_item` | 3 | Consumable or utility item |
| `weapon_mod` | 3 | Modification applied to weapon |
| `frame_mod` | 3 | Modification applied to frame |
| `recycle` | 1 | Convert damaged parts into functional ones |
| `craft_weapon` | 1 | Create new weapon |

### What to Build

#### Step 8.1 — Blueprint registry

Load `blueprints.json` at startup. Each blueprint starts locked. Unlock when:

- Player has reached the required `repTierRequired` with the linked `faction`
- Player meets `skillRequirements` (checked at craft time, not at unlock)

#### Step 8.2 — Crafting UI

Add to the Refinery or Workshop tab (wherever crafting lives):

- List of unlocked blueprints
- Each shows: name, materials needed (with current/required counts), craft time, result description
- "Craft" button enabled when all materials are available AND skill requirements met
- Crafting takes `craftTime` seconds (fits idle pattern — start craft, wait, collect)

#### Step 8.3 — Material consumption and result

On craft completion:

- Deduct materials from resources
- Produce result based on `result.type`:
  - `part_mod` → Apply stat modification to target part
  - `craft_frame` → Add new frame to player's frame inventory
  - `weapon_mod` → Apply stat modification to target weapon
  - `craft_item` → Add item to inventory
  - `recycle` → Convert input parts into output part

#### Step 8.4 — Endgame frame crafting (Hayabusa Mk.II)

The ultimate blueprint (`bp_hayabusa_mk2`) requires:

- Phantom Collective rep 75 (Honored tier)
- skill_crafting ≥ 9, skill_mecha_tech ≥ 7, skill_combat ≥ 6
- 10 quantum_circuits, 10 ceramite, 20 nanofiber, 30 ferrous_scrap, 15 polymer_scrap, 15 electronic_scrap, 8 data_chips, 500 creds
- 1200 second craft time (20 minutes)

This is the game's aspirational goal. The player sees it early (when Phantom rep unlocks), but can't craft it until mastering nearly every system. It doesn't need special engine work — it's just a blueprint with high requirements.

### Verification Criteria

- [ ] Blueprints load from JSON and display in crafting UI
- [ ] Blueprints lock/unlock based on faction rep tier
- [ ] Crafting consumes correct materials
- [ ] Craft timer runs and produces result on completion
- [ ] Skill requirements checked at craft time (not at display time)
- [ ] Crafted frames appear in frame inventory
- [ ] Hayabusa Mk.II craftable when all requirements are met

---

## PRIORITY 9: Scrapyard Phase 3-5 Structures

### Goal

The 6 new structures in `upgrades.json` complete the scrapyard progression from Phase 3 through Phase 5.

### Reference Documents

📎 `upgrades.json` — Complete structure definitions with costs and requirements
📎 `gdd_6_scrapyard_progression.md` — Phase design philosophy and narrative beats
📎 `homes.json` — Phase transitions (space.max scaling)
📎 `narrative_bible.md` §6, §9 — Scrapyard as narrative space, Grandpa's death

### New Structures

| ID | Name | Require | Phase | Purpose |
| --- | --- | --- | --- | --- |
| `hangar_basic` | Restore Hangar | garagem + refinaria | 3 | Parts storage, larger projects |
| `hangar_operational` | Operational Hangar | hangar_basic + mesa_pesquisa | 4 | Medium/Heavy frame assembly, faction NPCs appear |
| `hangar_massive` | Massive Hangar | hangar_operational | 5 | Multiple full-size frames, AI diagnostics |
| `cybernetic_bench` | Cybernetic Workbench | mesa_pesquisa + hangar_basic | 4 | Pilot augmentation system |
| `security_perimeter` | Security Perimeter | hangar_basic | 3-4 | Scrapyard defense, passive scrap rate |
| `secret_lab` | Dad's Secret Lab | msn_dads_secret quest | 5 | Story unlock, not purchasable — auto-granted on mission completion |

### What to Build

#### Step 9.1 — Structures appear in upgrade list

All 6 are already in `upgrades.json` with correct `require` conditions. They should appear naturally in the upgrades/structures UI when requirements are met. Verify the require parser handles compound conditions:

```text
"require": "g.garagem>0&&g.refinaria>0"        ← hangar_basic
"require": "g.hangar_basic>0&&g.mesa_pesquisa>0" ← hangar_operational
"require": "g.msn_dads_secret>0"                 ← secret_lab (quest flag)

```

#### Step 9.2 — Phase transitions

`homes.json` already defines 5 phases with space.max scaling. Verify that buying these structures pushes the player into the correct phase:

```text
Phase 3: refinery + garagem                → space.max 20
Phase 4: mesa_pesquisa + scrapyard_phase3  → space.max 35
Phase 5: scrapyard_phase4                  → space.max 50

```

The new structures consume space (their `mod.space` values are already set), so the player needs the phase transition to have room.

#### Step 9.3 — Secret Lab special handling

`secret_lab` has `"cost": {}` (free) and `"require": "g.msn_dads_secret>0"`. It's not purchased — it's **discovered** as a story reward. When `msn_dads_secret` completes:

- Auto-grant `secret_lab` upgrade
- Trigger the narrative event (already written in missions.json debriefing)
- Unlock data_chips.max +30

#### Step 9.4 — Narrative events for new structures

Add milestone events (same pattern as Priority 3 from previous briefing):

```js
{
  id: 'hangar_restored',
  condition: () => g.hangar_basic > 0,
  once: true,
  action: () => showDialogue('grandpa', [
    "A hangar. A real hangar.",
    "I drew plans for this forty years ago. Never had the resources.",
    "Your father would have loved this."
  ])
},
{
  id: 'hangar_operational',
  condition: () => g.hangar_operational > 0,
  once: true,
  action: () => showDialogue('system', [
    "HANGAR STATUS: Fully operational.",
    "Medium and Heavy class frames can now be assembled and maintained.",
    "Faction contacts have begun requesting meetings at the scrapyard gate."
  ])
},
{
  id: 'security_online',
  condition: () => g.security_perimeter > 0,
  once: true,
  action: () => showDialogue('grandpa', [
    "Turrets, sensors, reinforced fencing.",
    "This scrapyard isn't an easy target anymore.",
    "...Should have built this years ago."
  ])
}

```text

### Verification Criteria

- [ ] All 6 structures appear when requirements are met
- [ ] Structures consume correct materials
- [ ] Phase transitions fire when structure combos are met
- [ ] Secret Lab auto-grants on msn_dads_secret completion
- [ ] Narrative events fire on structure purchase
- [ ] Space management works (structures consume space, phases increase space.max)

---

## PRIORITY 10: Boss Encounter System

### Goal

6 handcrafted boss fights with phase mechanics, fixed loadouts, narrative dialogue, and unique rewards.

### Reference Documents

📎 `enemies.json` → `bosses[]` — Complete boss definitions
📎 `missions.json` — Boss-linked missions (each boss has a `linkedMission`)
📎 `combat_design_document.md` §15 — Boss mechanics design

### Boss Data Structure

Each boss in `enemies.json → bosses[]`:

```json
{
  "id": "boss_commander_steele",
  "name": "Commander Steele",
  "difficulty": 9,
  "loadout": {
    "frame": "frame_type90_fortress",
    "weapons": ["wpn_heaven_gate", "wpn_mg440", "wpn_iron_fist", "wpn_scatter_cannon"],
    "parts": { "torso": "part_krd_torso_t4", "legs": "part_krd_legs_t3", ... }
  },
  "pilotStats": { "MUS": 5, "REF": 5, "NEU": 4, "GRT": 8, "CHA": 3, "FOC": 5 },
  "bossPhases": [
    { "phase": 1, "name": "Standard Protocol", "trigger": "combat_start", ... },
    { "phase": 2, "name": "Lethal Force", "trigger": "hp_below_60", ... },
    { "phase": 3, "name": "Last Order", "trigger": "torso_hp_below_25", ... }
  ],
  "narrative": {
    "intro": [...],
    "defeat": [...],
    "player_defeat": [...],
    "dialogue": [{ "trigger": "combat_start", "text": "..." }, ...]
  },
  "rewards": { "glory": 25, "scrap": 120, ... },
  "uniqueDrop": { "id": "steeles_authorization_code", ... }
}

```text

### What to Build

#### Step 10.1 — Boss combat mode

When a mission triggers a boss encounter (vs regular encounter pool), the combat system needs to:

- Load the boss's fixed loadout (frame + weapons + parts) instead of generating from a pool
- Use the boss's `pilotStats` for all combat rolls
- Display boss name and title in the combat UI

#### Step 10.2 — Phase mechanic

Each boss has 2-3 `bossPhases` with trigger conditions:

- `combat_start` → Phase 1 always active
- `torso_hp_below_50` → Check boss torso HP percentage
- `heat_above_60` → Check boss heat percentage
- `hp_below_60` → Check total boss HP percentage
- `after_3_player_hits` → Count successful player attacks

When a phase triggers:

1. Display the phase dialogue (short combat log text)
2. Apply phase effects (stat mods like `atkMod: +0.2`, `evasion: 0.2`)
3. Phase effects stack (Phase 2 adds to Phase 1, Phase 3 adds to both)

#### Step 10.3 — Boss narrative integration

Before combat:

- Display `narrative.intro[]` as a dialogue sequence (same DialogueModal from Priority 3)

After combat (boss defeated):

- Display `narrative.defeat[]`

After combat (player defeated):

- Display `narrative.player_defeat[]`

During combat:

- `narrative.dialogue[]` entries fire when their `trigger` condition matches

#### Step 10.4 — Unique drops

Each boss has a `uniqueDrop` — a one-time story item. These are narrative flags, not equipment:

| Boss | Drop | Effect |
| --- | --- | --- |
| Iron Volk | Volk's Insignia | Raiders won't attack in Outskirts |
| Crimson Nail | Taeyang Thermal Coating blueprint | Unlocks crafting recipe |
| Deadlock | Deadlock's Dossier | Reveals who placed the bounty |
| Commander Steele | Steele's Authorization Code | Unlocks Phantom Signal mission path |
| Null | Dad's Lab Key | Unlocks Dad's Secret mission |
| Kingpin | Arena Champion Belt | +10% glory permanent, 15% vendor discount |

Implementation: set a game flag (`g.drop_xxx > 0`) on first boss kill. Unique drops are one-time only.

#### Step 10.5 — Boss difficulty curve

Bosses are designed with escalating stat totals:

```text
Iron Volk    (Diff 5)  → 22 total stats, 2 weapons, 2 phases
Crimson Nail (Diff 7)  → 27 total stats, 2 weapons, 3 phases (heat mechanic)
Deadlock     (Diff 8)  → 28 total stats, 2 weapons, 3 phases (tactical AI)
Steele       (Diff 9)  → 35 total stats, 4 weapons, 3 phases (the wall)
Kingpin      (Diff 9)  → 34 total stats, 3 weapons, 3 phases (arena)
Null         (Diff 10) → 37 total stats, 2 weapons, 3 phases + 20% evasion
```

No special balancing needed — the stats are already tuned in the data.

### Verification Criteria

- [ ] Boss fights load fixed loadout (not random pool)
- [ ] Phase transitions trigger at correct HP/heat thresholds
- [ ] Phase dialogue displays in combat log
- [ ] Phase stat mods apply correctly (stacking)
- [ ] Boss intro/defeat/player_defeat narratives display via DialogueModal
- [ ] Unique drops award on first kill only
- [ ] All 6 bosses are reachable through mission chain

---

## PRIORITY 11: Equip Slot Migration

### Goal

Migrate from the old 10-slot system to the new 9-slot GDD-aligned system.

### Reference Document

📎 `equipslots.json` — New slot definitions with type annotations

### Slot Mapping (Old → New)

```text
REMOVED:
  mecha_core          → not used in GDD (no head/core parts designed)
  mecha_head          → not used in GDD

RENAMED:
  mecha_lleg + mecha_rleg  → mecha_legs (merged into single slot)
  mecha_weapon_main        → mecha_weapon_rhand
  mecha_weapon_sub         → mecha_weapon_lhand
  mecha_module             → mecha_backpack (reduced from max:2 to max:1)

UNCHANGED:
  mecha_torso         → mecha_torso
  mecha_larm          → mecha_larm
  mecha_rarm          → mecha_rarm

NEW:
  mecha_weapon_rshoulder   → Heavy mount (Medium/Heavy frames only)
  mecha_weapon_lshoulder   → Heavy mount (Heavy frames only)

```

### What to Build

#### Step 11.1 — Update equipment renderer

The mecha assembly screen should show these 9 slots:

```text
        [Left Shoulder]   [Right Shoulder]
               \          /
    [Left Arm] ─ [Torso] ─ [Right Arm]
               \    |    /
    [Left Hand]  [Legs]  [Right Hand]
                  |
              [Backpack]
```

Shoulder slots only appear if the equipped frame supports them:

- Light frames: 0 shoulder slots
- Medium frames: 1 shoulder slot (right only)
- Heavy frames: 2 shoulder slots

This is defined per-frame in `frames.json` → `equipSlots`:

```json
"equipSlots": {
  "left_hand": true,
  "right_hand": true,
  "left_shoulder": false,    ← Light frame, no shoulders
  "right_shoulder": false
}

```text

#### Step 11.2 — Backpack slot

The backpack slot accepts items from `parts.json` where `type: "backpack"`. There are 19 backpack utilities (4 original + 15 new). Each has passive effects defined in `effect`:

```json
{
  "id": "part_util_field_repair",
  "name": "Field Repair Module",
  "type": "backpack",
  "effect": { "repairPerTurn": 2, "scope": "lowestHpPart" }
}

```text

The combat system needs to read the equipped backpack's effects and apply them. Each backpack has a different mechanic (repair, ammo, heat management, etc.). Implementation complexity varies — start with simple stat-bonus backpacks, defer complex ones.

#### Step 11.3 — Save/load migration

If players have existing saves with old slot IDs, map them:
```js
const slotMigration = {
  'mecha_weapon_main': 'mecha_weapon_rhand',
  'mecha_weapon_sub': 'mecha_weapon_lhand',
  'mecha_lleg': 'mecha_legs',
  'mecha_rleg': null,  // merged into mecha_legs
  'mecha_module': 'mecha_backpack',
  'mecha_core': null,  // removed
  'mecha_head': null    // removed
};

```

### Verification Criteria

- [ ] Mecha assembly screen shows 9 slots in correct layout
- [ ] Shoulder slots appear/hide based on frame category
- [ ] Backpack slot accepts backpack-type parts
- [ ] At least one backpack effect works in combat (e.g., Field Repair)
- [ ] Old saves migrate slot IDs without losing equipped items

---

## PORTUGUESE vs ENGLISH ID REFERENCE

Legacy structures (already in engine) use Portuguese IDs. New structures use English. Both are valid — the engine evaluates `g.xxx` flags regardless of language.

| Engine ID (actual) | GDD Reference (docs) | Phase |
| --- | --- | --- |
| `triagem` | Sorting Station | 1 |
| `oficina_nivel2` | Workshop Upgrade | 1-2 |
| `refinaria` | Refinery | 2 |
| `garagem` | Garage | 2-3 |
| `mesa_pesquisa` | Research Bench | 3 |
| `scrap_compressor` | Scrap Compressor ×3 | 1+ |
| `energy_capacitor` | Energy Capacitor ×5 | 1+ |
| `hangar_basic` | Restore Hangar | 3 |
| `hangar_operational` | Operational Hangar | 4 |
| `hangar_massive` | Massive Hangar | 5 |
| `cybernetic_bench` | Cybernetic Workbench | 4 |
| `security_perimeter` | Security Perimeter | 3-4 |
| `secret_lab` | Dad's Secret Lab | 5 |

All `require` fields in missions.json and upgrades.json use the **engine IDs** (Portuguese for legacy, English for new). This has been validated — zero broken references.

---

## NARRATIVE INTEGRATION NOTES

### The Father's Backstory (for dialogue consistency)

All mission briefings, boss dialogues, and faction descriptions have been rewritten to reflect:

- **Kazuo Hayashi** was a decorated NTPD police officer AND self-taught mecha engineer
- He was **accused of corruption** (fabricated charges) for investigating illegal Taeyang weapons shipments
- He **disappeared before trial** — the government seized the family home and assets
- The player was **forced to move in** with Grandfather at the scrapyard
- He was secretly working with the **Phantom Collective**, building the Hayabusa Mk.II
- The **Scrapyard Siege** (msn_scrapyard_siege) results in Grandpa's death — he sacrifices himself to protect the hidden lab entrance
- **Dad's recorded message** ends with "Take care of Grandpa" — the most devastating line because the player can't fulfill it

📎 Full details in `narrative_bible.md` — read §2 (The Three Hayashis) and §9 (Death of Ichiro Hayashi) before implementing any narrative events.

### Speaker Voice Reference

When writing NEW dialogue or events:

- **Grandpa:** Short sentences. Gruff. Shows love through worry. "Don't let it go to your head."
- **System:** ALL CAPS alerts. Technical. Cold. No emotion.
- **Arena Master:** Exclamation marks. Performative. Calls player "kid."
- **Null:** Modulated voice. Patient. Knowing. "Finally."
- **Steele:** Military. Clipped. Respectful underneath. "That's a compliment. From me."

### Post-Siege Rule

After `msn_scrapyard_siege` completes, **Grandpa never speaks again**. No new events, no new dialogue, no new missions use him as speaker. The silence is the point. Any new content set after the siege uses System narrator or NPC speakers.

---

## COMPLETE DATA FILE REFERENCE

All design data produced across all sessions:

| File | Items | Description |
| --- | --- | --- |
| `manufacturers.json` | 11 | Frame/weapon manufacturers with lore and tier catalogs |
| `weapons.json` | 28 | All weapons across 5 tiers, 5 damage types |
| `frames.json` | 10 | Light/Medium/Heavy frames with full stat blocks |
| `parts.json` | 49 | 30 structural parts + 19 backpack utilities |
| `enemies.json` | 32 | 10 archetypes + 8 encounter pools + 8 modifiers + 6 bosses |
| `player.json` | 6 | Pilot stats (MUS/REF/NEU/GRT/CHA/FOC) |
| `skills.json` | 7 | Skill trees with 10 milestones each |
| `maneuvers.json` | 20 | Combat maneuvers gated by stats and skills |
| `missions.json` | 23 | 15 story missions + 8 patrol missions |
| `factions.json` | 5 | Faction systems with rep tiers and vendor catalogs |
| `blueprints.json` | 22 | Faction-gated crafting recipes |
| `resources.json` | 23 | All game resources including faction rep |
| `upgrades.json` | 16 | All scrapyard structures Phase 1-5 |
| `equipslots.json` | 9 | Mecha equipment slots |
| `modules.json` | 21 | Engine module registry |
| `combat_config.json` | — | Combat config (glory awards, loot table) |
| `events.json` | 7 | Narrative events (expand in Priority 9) |
| `furniture.json` | 7 | Scrapyard furniture items |
| `homes.json` | 5 | Scrapyard phase definitions |
| `sections.json` | 12 | UI tab definitions |
| `tags.json` | 8 | Tag system |
| `tasks.json` | 18 | Idle tasks (scavenge, refine, train, etc.) |

### GDD Documents

| Document | What It Contains |
| --- | --- |
| `narrative_bible.md` | **Master narrative reference.** Backstory, timeline, mystery layers, faction relationships, speaker voices, thematic pillars. |
| `combat_design_document.md` | Combat mechanics, heat/stress, stances, targeting, glory economy |
| `gdd_3_4_parts_frame_assembly.md` | Frame categories, integrity levels, slot definitions |
| `gdd_6_scrapyard_progression.md` | Scrapyard phases, progressive disclosure, structure catalog |
| `gdd_8_economy.md` / `GDD_8_Economy_and_Balancing.md` | Currency tiers, resource chains, prestige system |
| `resource_catalog_unlock_logic.md` | Resource unlock conditions and JSON definitions |
| `gdd_*_reference.md` (7 files) | Human-readable catalogs for each data file |

---

*Briefing prepared February 20, 2026. This covers all content produced through the boss/faction/blueprint/narrative sessions. Next content drop will include the Job System (6 career paths) and Events Expansion.*
