# Mecha Scrapyard — Missions & Narrative System Reference
## GDD Supplement: Story Missions, Patrols, and the Player Journey

---

## 1. Two Natures of Mission

Every mission the player encounters falls into one of two categories:

**Story Missions** are the spine. They happen once, advance the narrative, introduce new enemies and NPCs, and unlock new zones. The player remembers them by name. They have briefings, debriefings, emotional beats, and permanent consequences.

**Patrol Missions** are the muscle. They're repeatable, use encounter pools for variation, and provide the grinding loop for glory, creds, parts, and materials. They unlock when their associated story mission is complete.

The loop between them creates the game's rhythm:

```
STORY MISSION → complete → PATROL UNLOCKED → grind → requirements met → NEXT STORY MISSION
```

The player never wonders what to do. Story missions say "go here now." Patrols say "stay here while you grow." The next story mission appears when conditions are met, signaled in the UI.

---

## 2. Mission Counts

| Type | Phase 3 | Phase 4 | Phase 5 | Total |
|---|---|---|---|---|
| **Story** | 6 | 5 | 4 | **15** |
| **Patrol** | 3 | 3 | 2 | **8** |
| **Total** | 9 | 8 | 6 | **23** |

The structure is designed for expansion. Adding a new story mission means adding one JSON object with a `require` condition pointing to an existing mission and an `unlocks` array pointing to what it opens. Adding a new patrol means pointing it at an existing encounter pool. No code changes required.

---

## 3. The Story Chain

### Phase 3 — Combat Introduction

The player has just built the Garage and discovered Dad's frame.

```
Rogue Drone Patrol ──→ Scrapyard Scavengers ──→ The Dockyard Dispute
        │                                              │
   [Outskirts Patrol]                           [Docks Patrol]
                                                       │
                              Unwelcome Visitors ──→ Arena Registration
                                                       │
                                                  [Arena Amateur]
                                                       │
                                             Corporate Warning
                                          (requires skill_combat 2)
```

**Narrative arc:** From first flight to first real threat. The player meets drones, rats, workers, raiders, arena fighters, and corporate security — in that order. Each new enemy type teaches a mechanic. The Phase ends with a Corporate Security encounter that signals: the world is bigger and more dangerous than your scrapyard.

**Key beats:**
- Mission 1 (Rogue Drone): Grandpa watches. "You fight like him. That's not a compliment."
- Mission 3 (Dockyard): System narrator replaces Grandpa — the world expands beyond family.
- Mission 5 (Arena): New NPC (Arena Master) with comedic tone. A different world from the scrapyard.
- Mission 6 (Corporate): Aegis officer speaks. Cold, procedural. First taste of institutional power.

### Phase 4 — Escalation

The player has built the Operational Hangar and can field Medium frames.

```
Beyond the Perimeter ──→ The Taeyang Contract ──→ Bounty: [PLAYER]
        │                                              │         │
   [Corporate Patrol]                          Dad's Last Route  Arena Ranked
                                                    │            │
                                              [Bazaar Patrol]  [Arena Pro]
```

**Narrative arc:** The player becomes a known entity. Corporations notice them. A bounty is placed. The investigation into Dad's disappearance leads to the Neon Bazaar and the first contact with Phantom Works. The stakes are personal now.

**Key beats:**
- Mission 8 (Taeyang): Bazaar contact introduces the underground economy. Moral ambiguity.
- Mission 9 (Bounty): The fight comes to the scrapyard. Someone is paying for the player's head.
- Mission 11 (Dad's Last Route): The emotional core. Dad was working with Exiles. Grandpa didn't know.
  - Requires skill_investigation 2 — the player must be curious, not just violent.

### Phase 5 — Endgame

The player has the Massive Hangar and access to Heavy frames.

```
Restricted Access ──→ The Phantom Signal ──→ Arena Championship
        │                    │                      │
   [Restricted Patrol]    Dad's Secret        [Arena Championship]
```

**Narrative arc:** The final push. Military territory, Phantom Works contact, the Arena Championship, and Dad's Secret Lab. The story converges on one revelation: what Dad was building, and why.

**Key beats:**
- Mission 12 (Restricted): Military Patrol at high level. The hardest standard combat.
- Mission 13 (Phantom Signal): A Phantom operative who KNEW DAD. "You have his eyes."
- Mission 14 (Arena Championship): Grandpa in the crowd. Smiling. No words needed.
- Mission 15 (Dad's Secret): No combat. Pure narrative. Dad's voice. The emotional peak.

---

## 4. Encounter Modes

Story missions use one of three encounter modes:

| Mode | Behavior | Used By |
|---|---|---|
| `fixed` | Specific archetypes at specific levels. Handcrafted. | Most story missions |
| `pool` | Rolls on the zone's encounter pool from enemies.json. Variable. | Some mid/late story missions, all patrols |
| `none` | No combat. Pure narrative event. | Dad's Secret |

### Fixed Encounters

```json
"encounter": {
    "mode": "fixed",
    "enemies": [
        { "archetype": "bounty_hunter", "level": "high", "modifiers": ["veteran"] }
    ]
}
```

The `level` field (`low`, `mid`, `high`, `max`) tells the assembly system where in the archetype's tier range to select equipment. `low` picks the bottom, `max` picks the ceiling. Optional `modifiers` array forces specific modifiers.

### Pool Encounters

```json
"encounter": {
    "mode": "pool",
    "pool": "corporate_perimeter",
    "guaranteeArchetype": "corporate_security"
}
```

`guaranteeArchetype` is optional — ensures at least one specific archetype appears even when the pool roll doesn't select it. Used for story missions that need narrative coherence from pool-based encounters.

---

## 5. Narrative Structure

### Speakers

Each mission has a speaker who narrates briefings and debriefings:

| Speaker | Tone | Missions | Role |
|---|---|---|---|
| `grandpa` | Warm, worried, proud | 5 | Family, emotion, Dad's memory |
| `system` | Cold, factual, technical | 9 | Zone alerts, data, tactical info |
| `npc_arena_master` | Enthusiastic, comedic | 6 | Arena hype, comic relief |
| `npc_aegis_officer` | Cold, procedural | 1 | Corporate authority |
| `npc_bazaar_contact` | Pragmatic, shady | 1 | Underground economy |
| `npc_phantom_contact` | Mysterious, knowing | 1 | Dad's secret, endgame revelations |

Speaker distribution is intentional. Grandpa bookends the experience (first mission, last mission). System narrates the expanding world. Arena Master provides levity. NPCs appear once or twice for maximum impact.

### Dual Debriefings

Several story missions have both `debriefing_victory` and `debriefing_defeat`. This supports fail-forward design — the player learns something regardless of outcome:

| Mission | Victory Reveals | Defeat Reveals |
|---|---|---|
| Dockyard Dispute | More displaced workers spotted | Repairs needed, route still blocked |
| Corporate Warning | Aegis will send more patrols | Aegis logged your frame signature |
| Taeyang Contract | You have Taeyang weapons now | You know what Taeyang is moving |
| Bounty on Player | Bounty still active, need to find who | Hunter sold your combat data |
| Dad's Last Route | Phantom Works transponder found | Partial data: Dad pinged near Phantom relay |
| Restricted Access | Phantom responds: "We knew your father" | Faint signal: "...knew your father..." |
| Phantom Signal | Lab location revealed | "Come back when ready" |

The player ALWAYS advances the narrative. Defeat costs resources and time, not story progress.

---

## 6. Patrol Economy

### Diminishing Returns

Patrol missions use a diminishing returns curve to nudge players toward harder content:

```
Completions 1-5:    100% rewards (full farming window)
Completions 6-10:   75% rewards (gentle nudge)
Completions 11+:    50% rewards (still viable for materials)
```

Arena patrols have softer curves (100% until 10, 80% until 20, 60% floor) because the arena is designed as a glory farm.

### Reward Comparison

| Patrol | Phase | Glory | Creds | Scrap | Best For |
|---|---|---|---|---|---|
| Outskirts | 3 | 2 | 4 | 12 | Early scrap, light parts |
| Docks | 3 | 3 | 6 | 15 | Medium parts, ferrous scrap |
| Arena Amateur | 3 | 4 | 10 | 0 | Glory, creds |
| Corporate | 4 | 5 | 12 | 8 | Mixed rewards, Aegis drops |
| Bazaar | 4 | 5 | 14 | 6 | Phantom/Taeyang drops, creds |
| Arena Pro | 4 | 7 | 20 | 0 | Best glory farm mid-game |
| Restricted | 5 | 8 | 20 | 10 | Rare materials (ceramite), Kuroda drops |
| Arena Champ | 5 | 12 | 35 | 0 | Best glory farm endgame |

**Design pattern:** Combat patrols drop scrap + parts. Arena patrols drop glory + creds. The player chooses their farming priority.

---

## 7. Extensibility Guide

### Adding a Story Mission

Add one object to the missions array in `missions.json`:

```json
{
    "id": "msn_new_mission",
    "name": "New Mission Name",
    "desc": "Description of the mission.",
    "flavor": "Short atmospheric text.",
    "type": "story",
    "phase": 4,
    "zone": "neon_bazaar_backstreets",
    "difficulty": 6,
    "encounter": {
        "mode": "fixed",
        "enemies": [
            { "archetype": "bounty_hunter", "level": "mid" }
        ]
    },
    "narrative": {
        "speaker": "grandpa",
        "briefing": ["Line 1.", "Line 2."],
        "debriefing": ["Line 1.", "Line 2."]
    },
    "require": "g.msn_previous_mission>0",
    "rewards": { "glory": 5, "cred": 15, "scrap": 10 },
    "firstClearBonus": { "glory": 5, "cred": 10, "items": [] },
    "unlocks": ["msn_next_mission"],
    "maxCompletions": 1,
    "sortOrder": 215,
    "notes": "Design notes."
}
```

Then update the previous mission's `unlocks` array to include `"msn_new_mission"`. That's it.

### Adding a Patrol Mission

Same structure but with `type: "patrol"`, `encounter.mode: "pool"`, `maxCompletions: null`, and a `diminishingReturns` block.

### Adding a New Zone

1. Add the encounter pool to `enemies.json` (archetypes + weights)
2. Add a story mission that unlocks access to the zone
3. Add a patrol mission that uses the new pool
4. Set the story mission's `unlocks` to include the new patrol

### Adding a New Speaker

Just use a new string in `narrative.speaker`. The UI maps speakers to visual styles (color, icon, portrait). New speakers need a UI entry but no data changes.

### Branching Storylines

The `require` field supports `&&` (AND) conditions. For branching, two missions can share the same prerequisite but have different secondary conditions:

```json
// Branch A: requires combat focus
"require": "g.msn_bounty_on_player>0&&g.skill_combat>=5"

// Branch B: requires investigation focus
"require": "g.msn_bounty_on_player>0&&g.skill_investigation>=4"
```

Both appear in the mission list when their conditions are met. The player chooses which to pursue first.

---

## 8. Data Contract

### Mission Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | Unique ID, prefix `msn_` |
| `name` | string | yes | Display name |
| `desc` | string | yes | Full description |
| `flavor` | string | yes | Short atmospheric text |
| `type` | string | yes | `"story"` / `"patrol"` / `"arena"` / `"faction"` |
| `phase` | number | yes | Which Phase this mission belongs to (3-5) |
| `zone` | string | yes | Which encounter pool zone |
| `difficulty` | number | yes | 0-10 scale, affects assembly tier selection |
| `encounter` | object | yes | `{ mode, enemies[], pool?, guaranteeArchetype? }` |
| `narrative` | object | yes | `{ speaker, briefing[], debriefing[], debriefing_victory?, debriefing_defeat? }` |
| `require` | string | yes | Unlock condition expression |
| `rewards` | object | yes | `{ glory, cred, scrap }` base rewards |
| `firstClearBonus` | object\|null | no | Extra rewards on first completion |
| `unlocks` | string[] | yes | IDs of missions/features unlocked on completion |
| `maxCompletions` | number\|null | yes | `1` for story, `null` for infinite (patrol) |
| `diminishingReturns` | object | patrol only | `{ fullRewardUntil, reducedReward, minimumReward, minimumAt }` |
| `sortOrder` | number | yes | UI display order (100-199 = Phase 3 story, 200-299 = Phase 4, 300-399 = Phase 5, 500+ = patrols) |
| `notes` | string | no | Design notes (not shown to player) |

### Encounter Object

| Field | Type | Description |
|---|---|---|
| `mode` | string | `"fixed"` / `"pool"` / `"none"` |
| `enemies` | array | For fixed: `[{ archetype, level, modifiers? }]` |
| `pool` | string | For pool: encounter pool ID from enemies.json |
| `guaranteeArchetype` | string | For pool: ensure this archetype appears |

### Narrative Object

| Field | Type | Description |
|---|---|---|
| `speaker` | string | NPC/system ID for UI styling |
| `briefing` | string[] | Lines shown before combat (typewriter modal) |
| `debriefing` | string[] | Lines shown after victory (default) |
| `debriefing_victory` | string[] | Lines shown after victory (when dual debriefings exist) |
| `debriefing_defeat` | string[] | Lines shown after defeat (fail-forward narrative) |

---

## 9. Integration Map

### Missions ↔ Enemies

Story missions reference archetypes from `enemies.json`. Patrol missions reference encounter pools from `enemies.json`. The assembly system builds the actual combatant using frames, parts, and weapons from their respective JSONs.

### Missions ↔ Skills

Several story missions gate behind skill levels:
- Corporate Warning: `skill_combat >= 2`
- Bounty on Player: `skill_combat >= 3`
- Dad's Last Route: `skill_investigation >= 2`
- Phantom Signal: `skill_combat >= 6`

This ensures the player has practiced, not just grinded — skills grow by doing specific activities, not by repeating easy fights.

### Missions ↔ Scrapyard Progression

Story missions also gate behind structures:
- All combat: `garagem > 0` (Phase 3)
- Beyond the Perimeter: `hangar_operacional > 0` (Phase 4)
- Restricted Access: `hangar_massive > 0` (Phase 5)

This ties mission progression to scrapyard building — the player needs both combat skill AND infrastructure to advance.

### Missions ↔ Narrative Events

Missions are the PRIMARY source of narrative content. Each story mission's briefing and debriefing feed directly into the DialogueModal system described in the Sprint Briefing. The speaker field determines visual styling (Grandpa = warm amber, System = green terminal, NPCs = cool cyan).

The milestone system from the Sprint Briefing handles non-mission narrative (structure building, resource discovery, etc). Missions handle all combat-adjacent narrative.
