# Mecha Scrapyard — Enemies & Encounter System Reference
## GDD Supplement: Dynamic Encounter Generation

---

## 1. System Overview

The encounter system uses **three layers** to generate infinite variation from a compact data set:

```
Layer 1: Encounter Pool (WHO appears WHERE)
  → Roll on weighted table for Phase × Zone
  → Roll for 0-N modifiers

Layer 2: Archetype (WHAT kind of enemy)
  → Identity, faction, stance, targeting behavior
  → Equipment preference rules (not fixed loadouts)

Layer 3: Assembly (HOW they're built)
  → Pick frame from archetype's pool
  → Pick parts from mfr/tier preferences
  → Pick weapons from category/tier preferences
  → Generate pilot stats within range
  → Apply modifiers
  → Output: complete combatant with real equipment
```

**Key principle:** Enemies are assembled from the same equipment the player uses. A Rogue Labor's KZ Crane Arm is the same `arm_kz_crane_mk1` from `parts.json`. When the player wins, the loot IS the enemy's gear. No separate loot tables needed — the equipment tells the story.

**Counts:** 10 archetypes, 8 encounter pools, 8 modifiers. Bosses reserved for future development when combat system and narrative are more advanced.

---

## 2. Archetypes (10)

### Threat Tier Hierarchy

| Tier | Archetypes | Player Experience |
|---|---|---|
| **Fodder** | Scrap Rat, Rogue Drone | Dies fast. Teaches that combat works. |
| **Common** | Rogue Labor, Scrapyard Raider | The grind. Drops useful parts. Takes effort. |
| **Elite** | Corporate Security, Bounty Hunter, Taeyang Enforcer, Arena Fighter | Real threat. Requires loadout planning. |
| **Threat** | Military Patrol, Exile Operative | Endgame walls. Tests the player's best build. |

### Archetype Profiles

**Scrap Rat** — Phase 3 only. Sora Courier frame, tier 1 weapons, terrible pilot stats. Exists to die and drop scrap. The tutorial enemy that makes the player feel powerful.

**Rogue Drone** — Phase 3-4. No pilot (GRT 99 = immune to stress/panic). Accurate (REF 3-4) but one-dimensional (single weapon, no melee). Drops electronic scrap. The "predictable grind" enemy — safe to farm, consistent rewards.

**Rogue Labor** — Phase 3-4. KZ Ironback or Sora Workhorse with KZ parts. Offensive stance, targets strongest part. The first enemy that feels like a real fight — medium frames with 2+ integrity bars take actual effort to dismantle. Drops the player's first medium-category parts.

**Scrapyard Raider** — Phase 3-4. Mixed frames, Red Creek weapons (inconsistent accuracy, occasionally dangerous). Targets weakest part — smart and annoying. Highest equipDrop of common enemies (0.25) because they carry stolen goods. The "wildcard" that keeps early grinding interesting.

**Corporate Security** — Phase 3-5. Aegis Sentinel with Aegis parts. Balanced stance, tactical targeting (disables arms first). Professional stats (REF/GRT 4-6). Very low equipDrop (0.10) because Aegis-Tac recovers their equipment — but high cred drops. The first enemy that punishes lazy loadouts.

**Bounty Hunter** — Phase 4-5. Widest frame pool (KZ, Aegis, Phantom, Heavy). Widest weapon range (tier 2-4). Adaptive stance. Every encounter is different — the player never knows what loadout to expect. The "miniboss-lite" with highest glory of non-boss enemies.

**Taeyang Enforcer** — Phase 4-5. ALL weapons are Taeyang Forge (heat blades, plasma, thermal lances). Daewon torsos for cooling (lore-accurate: both Korean corps). Offensive stance, high MUS for melee. The player's gateway to energy weapon builds — defeating Enforcers drops Taeyang gear.

**Military Patrol** — Phase 4-5. Kuroda Type 90 or KZ Goliath with tier 3-4 parts and tier 3-5 weapons. Defensive stance makes them extremely hard to crack — requires BREACH tokens or sustained DPS. Lowest equipDrop (0.08) but drops rare crafting materials (ceramite, nano infra). The "are you ready for endgame?" check.

**Exile Operative** — Phase 4-5. Phantom Wraith or Revenant with Phantom parts. REF up to 8 (highest of any archetype) but GRT only 3-5 (can panic under pressure). Glass cannon that kills fast or dies fast. Drops Phantom parts and quantum circuitry. The enemy that demands respect.

**Arena Fighter** — Phase 3-5. Scales with everything: any manufacturer, tier 1-5 weapons, wide stat ranges. No equipDrop (arena rules forbid salvage) but highest glory and cred rewards. Adaptive stance and targeting. The "pure combat challenge" with no loot incentive beyond glory and money.

---

## 3. Assembly Logic

### How an Enemy is Built at Runtime

```
Input:  archetype + currentPhase + modifiers[]
Output: complete combatant (frame + parts + weapons + pilotStats)

Step 1: SELECT FRAME
  → Random pick from archetype.framePool

Step 2: SELECT PARTS (for each slot: torso, left_arm, right_arm, legs)
  → Filter parts.json by:
    - mfr IN archetype.partsPreference.mfr (or "any")
    - tier IN archetype.partsPreference.tierRange
    - category_compat includes frame.category
  → Random pick from filtered pool
  → If no match: fallback to any part matching category + tier

Step 3: SELECT WEAPONS (up to archetype.weaponPreference.maxWeapons)
  → Filter weapons.json by:
    - category IN archetype.weaponPreference.categories
    - mfr IN archetype.weaponPreference.mfr (or "any")
    - tier IN archetype.weaponPreference.tierRange
    - slot fits frame.equipSlots
  → Random pick, respecting slot availability
  → Ensure at least 1 weapon (combat needs it)

Step 4: GENERATE PILOT STATS
  → For each stat (MUS, REF, FOC, GRT, TEC, CHA):
    - Roll uniform random in archetype.pilotStatRange[stat]
  → Apply modifier effects (e.g., Veteran: ×1.2)

Step 5: APPLY MODIFIERS
  → Damaged: multiply all part HP by 0.7
  → Well-Armed: increase weapon tier by +1
  → Desperate: lock stance to Offensive
  → Prototype: boost one random item +2 tiers
  → Pack: generate additional Scrap Rat combatant
  → Ambush: set initiative to enemy_first
  → Scavenger: append bonus material drops
  → Veteran: multiply pilot stats by 1.2

Step 6: CALCULATE DERIVED STATS
  → Total HP per part (part.hp × condition)
  → Frame effective stats (baseStats + part bonuses)
  → Heat profile (frame mods + part heatMod sum)
  → Set stance and targeting from archetype bias
```

### Phase Scaling

The archetype's `tierRange` fields naturally scale encounters across phases. The assembly system doesn't need explicit Phase scaling — it just picks from the available tier range:

| Phase | Typical Equipment Tier | What the Player Faces |
|---|---|---|
| 3 | Tier 1-2 | Sora/KZ parts, basic Shibata weapons |
| 4 | Tier 2-3 | Aegis/Daewon parts, Taeyang/Valletta weapons |
| 5 | Tier 3-5 | Kuroda/Phantom parts, all weapon tiers |

For archetypes that span multiple phases (e.g., Corporate Security Phase 3-5), the assembly system should bias toward the lower end of the tier range in earlier phases and higher end in later phases. Simple formula:

```
effectiveTierMin = archetype.tierRange[0]
effectiveTierMax = min(archetype.tierRange[1], currentPhase)
```

### The "any" Keyword

When `mfr` contains `"any"`, the assembly system picks freely from all available equipment matching the other filters. Used by Arena Fighter and Bounty Hunter to create maximum variety.

---

## 4. Encounter Pools (8)

### Pool Structure

Each pool defines weighted encounter tables for a specific Phase × Zone. When the player enters combat in a zone, the system rolls on the table to determine which archetype appears.

### Phase 3 (Combat Introduction)

| Zone | Primary Enemies | Danger Level | Modifier Chance |
|---|---|---|---|
| **Scrapyard Outskirts** | 85% fodder (Scrap Rat + Drone) | Tutorial | 15% |
| **Industrial Docks** | 40% Rogue Labor, 10% Corp Security | First real fights | 20% |
| **Arena — Amateur** | 70% Arena Fighter | Controlled environment | 25% |

### Phase 4 (Escalation)

| Zone | Primary Enemies | Danger Level | Modifier Chance |
|---|---|---|---|
| **Corporate Perimeter** | 35% Corp Security, 5% Military | Professional opposition | 30% |
| **Neon Bazaar Backstreets** | 25% Bounty Hunter, 10% Exile Op | Chaotic, dangerous | 30% |
| **Arena — Professional** | 80% Arena Fighter (scaled up) | Ranked competition | 35% |

### Phase 5 (Endgame)

| Zone | Primary Enemies | Danger Level | Modifier Chance |
|---|---|---|---|
| **Restricted Military Zone** | 40% Military, 15% Exile | Maximum threat | 40% |
| **Arena — Championship** | 60% Arena Fighter (full range) | Peak challenge | 50% |

### Modifier Chance Curve

The modifier chance increases with Phase, creating more variation as the player advances:

```
Phase 3:  15% → 20% → 25%    (mostly clean encounters)
Phase 4:  30% → 30% → 35%    (frequent twists)
Phase 5:  40% → 50%           (almost always modified)
```

This means early game is learnable and predictable. Late game is chaotic and demanding.

---

## 5. Modifiers (8)

### Modifier Selection

When a modifier triggers (based on pool's `modifierChance`), the system rolls on the modifier weight table. Multiple modifiers can stack (up to pool's `maxModifiers`). Some combinations create emergent difficulty:

- **Veteran + Ambush** = high-stat enemy that strikes first. Brutal.
- **Desperate + Well-Armed** = locked Offensive with tier+1 weapons. Glass cannon.
- **Damaged + Scavenger** = easy fight, great material drops. The "lucky find."
- **Prototype + Pack** = one enemy has a +2 tier weapon, another Scrap Rat flanks. Chaotic.

### Modifier Table

| ID | Icon | Rarity | Weight | Combat Effect | Loot Effect |
|---|---|---|---|---|---|
| **Veteran** | ⭐ | Uncommon | 15.6% | Pilot stats ×1.2 | Glory ×1.5, loot chance ×1.3 |
| **Damaged** | 🔧 | Common | 19.5% | HP ×0.7 | Parts at 30-60% condition. Glory ×0.7 |
| **Well-Armed** | 🔫 | Uncommon | 11.7% | Weapon tier +1 | Guaranteed weapon drop. Glory ×1.3 |
| **Desperate** | 💀 | Uncommon | 11.7% | Offensive lock, stress immune | Stats ×1.1 |
| **Ambush** | ⚡ | Uncommon | 11.7% | Enemy acts first + free attack | Glory ×1.2 |
| **Pack** | 👥 | Rare | 7.8% | +1 Scrap Rat enemy | Glory ×1.5 |
| **Prototype** | 🔬 | Rare | 6.2% | One item +2 tiers, heat gen ×1.3 | Loot chance ×1.5 |
| **Scavenger** | 🎒 | Common | 15.6% | No combat change | Bonus scrap + ferrous + electronic |

### Modifier Restrictions

- **Pack** should not apply to fodder-tier archetypes (no Scrap Rat + Scrap Rat)
- **Prototype** should not push items beyond tier 5
- **Desperate** is redundant on archetypes with stanceBias "offensive" (still valid, just less impactful)
- **Damaged** reduces glory reward — prevents it from being pure upside

---

## 6. Loot System Integration

### Equipment Drops

Each archetype has an `equipDrop` chance (0.0 to 0.25). When triggered, the system drops one random item from the enemy's actual loadout:

```
Roll < equipDrop?
  → Yes: pick random from [frame_parts + weapons] that enemy had equipped
  → Dropped item retains condition (or modifier-adjusted condition)
  → Player sees: "Salvaged: KZ Crane Arm Mk.I (condition: 74%)"
```

This creates the core loop: **fight enemy → recognize their gear → want their gear → beat them → get their gear**. The loot is narratively coherent because it's literally what the enemy was using.

### Equipment Drop Rates by Archetype

| Archetype | equipDrop | Why |
|---|---|---|
| Scrap Rat | 15% | Junk parts, but free |
| Rogue Drone | 20% | Electronic components |
| Rogue Labor | 20% | KZ medium parts — progression fuel |
| Scrapyard Raider | 25% | Carrying stolen goods |
| Corporate Security | 10% | Aegis recovers their gear |
| Bounty Hunter | 20% | Mixed loadout, any drop is interesting |
| Taeyang Enforcer | 15% | Taeyang weapons are the real prize |
| Military Patrol | 8% | Military recovers everything |
| Exile Operative | 12% | Phantom parts are rare by nature |
| Arena Fighter | 0% | Arena rules: no salvage |

### Bonus Drops

Every archetype has guaranteed bonus drops (scrap, creds, materials) independent of equipment drops. These scale with threat tier and ensure every fight provides SOME reward — fail-forward philosophy.

---

## 7. Targeting Behaviors

Each archetype has a `targetingBias` that determines how the enemy selects which part of the player's frame to attack:

| Bias | Behavior | Used By |
|---|---|---|
| `random` | Equal chance on all parts | Scrap Rat (unskilled) |
| `nearest` | Prioritizes legs → torso → arms | Rogue Drone (proximity sensors) |
| `strongest_part` | Targets highest-HP part | Rogue Labor, Taeyang Enforcer (brute force) |
| `weakest_part` | Targets lowest-HP part | Scrapyard Raider, Exile Operative (opportunistic) |
| `tactical` | Targets arms first (disables weapons) | Corp Security, Bounty Hunter, Military Patrol |
| `adaptive` | Varies per encounter | Arena Fighter (unpredictable) |

These create distinct combat "feels" without complex AI. The player learns patterns: "Corporate Security always goes for my arms — I should equip my best weapon on my strongest arm."

---

## 8. Future Expansion Slots

| Feature | When | What |
|---|---|---|
| **Bosses** | When combat + narrative are more advanced | 4-6 preset artesanal encounters with fixed loadouts, dialogue, unique rewards |
| **Multi-enemy encounters** | After Pack modifier is proven | Dedicated 2v1 and 3v1 pools for late-game zones |
| **Named enemies** | Narrative milestones | Recurring NPCs with fixed identity but scaling equipment |
| **Defense events** | Phase 4+ base defense | Scrapyard perimeter encounters with different pool composition |
| **Raid bosses** | Phase 5 endgame | Squad-based encounters requiring multiple frames |

---

## 9. Data Contract Summary

### Archetype Fields

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique identifier |
| `name` | string | Display name |
| `desc` | string | Full description |
| `flavor` | string | Short atmospheric text |
| `faction` | string\|null | Faction alignment (null = none) |
| `origin` | string | Part origin system alignment |
| `threatTier` | string | fodder / common / elite / threat |
| `phaseRange` | [number, number] | Which Phases this archetype appears in |
| `pilotStatRange` | object | Min/max per pilot stat |
| `framePool` | string[] | Frame IDs to pick from |
| `partsPreference` | object | `{ mfr[], tierRange[] }` |
| `weaponPreference` | object | `{ categories[], mfr[], tierRange[], maxWeapons }` |
| `stanceBias` | string | offensive / balanced / defensive / adaptive |
| `targetingBias` | string | random / nearest / strongest / weakest / tactical / adaptive |
| `lootProfile` | object | `{ equipDrop, bonusDrops[] }` |
| `gloryReward` | [number, number] | Min/max glory on defeat |

### Encounter Pool Fields

| Field | Type | Description |
|---|---|---|
| `phase` | number | Which Phase this pool belongs to |
| `zone` | string | Zone identifier |
| `name` | string | Display name |
| `desc` | string | Zone description |
| `encounters` | array | `[{ archetype, weight }]` — weighted table |
| `modifierChance` | number | 0.0-1.0 chance of rolling a modifier |
| `maxModifiers` | number | Maximum modifiers per encounter |

### Modifier Fields

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique identifier |
| `name` | string | Display name |
| `desc` | string | Short description |
| `icon` | string | Emoji icon for UI |
| `effect` | object | Modifier-specific effect parameters |
| `rarity` | string | common / uncommon / rare |
| `weight` | number | Relative probability weight |
