# Mecha Scrapyard — Pilot Progression System Reference
## GDD Supplement: Stats → Skills → Maneuvers

---

## 1. System Architecture

The pilot's progression has three interconnected layers:

```
STATS (who the pilot IS)
  │  6 attributes, scale 1-10 (augmented to 15)
  │  Grow by use (idle) + attribute points (level-up)
  │  Feed directly into combat formulas
  │
  ▼
SKILLS (what the pilot HAS PRACTICED)
  │  7 proficiencies, scale 1-10
  │  Grow by performing associated activities
  │  Gate combat features + provide efficiency bonuses
  │  skill_combat gates maneuver slots, stances, targeting
  │
  ▼
MANEUVERS (what the pilot DOES in combat)
    20 abilities across 4 positions
    Unlocked by stat requirements + glory cost
    Equipped pre-combat (2-4 slots based on skill_combat)
    Execute automatically via triggers during auto-combat
```

**Design principle:** The player never makes decisions DURING combat. All skill expression is in pre-combat configuration: which stats to grow, which maneuvers to equip, which stance/targeting/loadout to pair them with. Combat is the test. Configuration is the game.

---

## 2. Stats (Pilot Attributes)

### Scale & Growth

**Base range:** 1-10. Each point is perceptible and meaningful.
**Augmented range:** Up to 15 via cybernetic augments (gated by skill_hacking 10).
**Starting values:** All stats begin at 1. The pilot is a scrapyard kid, not a soldier.

**Growth model (hybrid):**
1. **Grow-by-use:** Each stat has associated activities. Performing those activities grants XP toward the next point. Rate: ~0.02 per relevant action (50 actions ≈ 1 stat point). Charisma grows slower (0.015).
2. **Level-up points:** Each pilot level grants 1 attribute point to distribute freely. Level cap 30 = 29 points total. Combined with grow-by-use, a maxed pilot reaches ~8-10 in primary stats and ~4-6 in secondaries.

This means: the idle grind guarantees progress (grow-by-use), but level-ups give the player agency to accelerate the stats they care about.

### The Six Attributes

| Stat | Icon | Primary Combat Role | Primary Idle Role | Growth Activities |
|---|---|---|---|---|
| **Muscle** | 💪 | ATK ×0.3, DEF ×0.1, melee damage | Scrap gathering rate | Melee combat, heavy gathering, manual labor |
| **Reflex** | 🤸 | ATK ×0.2, +2 accuracy/pt, +1 initiative/pt | Event reaction time | Ranged combat, evasion, arena fights |
| **Focus** | 🎯 | ENR ×0.3, targeting precision | Craft speed -3%/pt | Crafting, research, long-range combat |
| **Grit** | 🛡️ | DEF ×0.4, COR ×0.2, stress cap | Long task endurance | Taking damage, long missions, stress recovery |
| **Neuro** | 🧠 | ENR ×0.2, hack/repair/dismantle bonus | Research speed -3%/pt | Hacking, research, dismantling, repair |
| **Charisma** | 🗣️ | COR ×0.3, buy -2%/pt, sell +3%/pt | Rep gain +5%/pt | Social events, trading, arena |

### Derived Combat Stats (from Combat Design Doc §2.1)

Frame stats are calculated from the frame's base values plus pilot attribute contributions:

```
ATK = base_atk + (MUS × 0.3) + (REF × 0.2)
DEF = base_def + (GRT × 0.4) + (MUS × 0.1)
ENR = base_enr + (FOC × 0.3) + (NEU × 0.2)
COR = base_cor + (GRT × 0.2) + (CHA × 0.3)
```

### Stat Contribution Matrix

| Derived Stat | Largest Contributor | Secondary | Tertiary |
|---|---|---|---|
| **ATK** | Muscle (×0.3) | Reflex (×0.2) | — |
| **DEF** | Grit (×0.4) | Muscle (×0.1) | — |
| **ENR** | Focus (×0.3) | Neuro (×0.2) | — |
| **COR** | Charisma (×0.3) | Grit (×0.2) | — |

**Key insight — no stat is useless.** Muscle contributes to both ATK and DEF. Grit contributes to both DEF and COR. Every stat touches at least 2 derived stats or provides essential non-combat utility.

### The Progression Inversion (from GDD §3.4.7)

| Pilot | In Hayabusa Mk.I (Light) | In KZ Goliath (Heavy) |
|---|---|---|
| Novice (all stats 2) | ATK 3.0, DEF 3.0 — struggles | ATK 6.0, DEF 8.0 — carried by frame |
| Veteran (MUS 7, REF 6, GRT 6) | ATK 5.3, DEF 5.1 — competitive | ATK 8.3, DEF 9.1 — overkill |
| Master (MUS 10, REF 8) | ATK 6.6, DEF — Light efficiency shines | ATK 9.6 — diminishing returns |

Light frames are weak early, devastating late. Heavy frames are safe early, inefficient late. The pilot's stats determine when the crossover happens.

---

## 3. Skills (Proficiencies)

### Scale & Growth

**Range:** 1-10. Each level is a meaningful milestone.
**Growth:** Skills level up by performing associated activities. No attribute points spent on skills — they grow purely by practice.

### Skill ↔ Stat Connections

Each skill has primary and secondary stats. These connections serve two purposes:
1. **Thematic coherence** — the player understands WHY a skill uses certain stats
2. **Build direction** — a player who invests in muscle/reflex will naturally excel at combat

| Skill | Primary Stats | Secondary | Unlocked By |
|---|---|---|---|
| **Combat** | Muscle, Reflex | Grit | Garage built |
| **Gathering** | Muscle, Grit | Focus | Sorting Station built |
| **Mecha Tech** | Neuro, Focus | Muscle | Garage built |
| **Crafting** | Focus, Neuro | Grit | Refinery built |
| **Hacking** | Neuro | Focus, Reflex | Research Bench built |
| **Investigation** | Focus, Neuro | Charisma | Workshop Lv2 built |
| **Social** | Charisma | Grit, Focus | Workshop Lv2 built |

### skill_combat — The Combat Gatekeeper

skill_combat is special. It progressively unlocks combat configuration options:

| Level | Maneuver Slots | Feature Unlocked |
|---|---|---|
| 1 | 1 slot | Basic combat. 1 maneuver, locked to Balanced stance, locked to Balanced targeting |
| 2 | 1 slot | — |
| 3 | **2 slots** | Access to Tier 2 maneuvers |
| 4 | 2 slots | — |
| 5 | 2 slots | **Stance selection unlocked** (Offensive, Defensive, Cautious available) |
| 6 | **3 slots** | Access to Tier 3 maneuvers (capstones) |
| 7 | 3 slots | — |
| 8 | 3 slots | **Targeting mode selection unlocked** (Aggressive, Defensive, Tactical available) |
| 9 | **4 slots** | Maximum maneuver capacity |
| 10 | 4 slots | **Master Combat:** all positions unlocked, +10% crit chance |

**Design rationale:** The player starts with minimal control (1 maneuver, Balanced everything). As skill_combat grows, they gradually gain more configuration options. By level 10, they have full control over 4 maneuver slots + stance + targeting. This prevents information overload at game start while ensuring a satisfying power curve.

### Other Skill Milestones

| Skill | Level 5 Milestone | Level 10 Milestone |
|---|---|---|
| **Gathering** | Deep scavenging (access to buried materials) | Master Gatherer: double rare material chance |
| **Mecha Tech** | Field repair during combat | Master Mechanic: -20% decay, Hayabusa Mk.II blueprint |
| **Crafting** | Reverse engineering (study enemy parts) | Master Crafter: all Hayabusa blueprints, crafted parts +1 tier |
| **Hacking** | System intrusion (disable enemy weapon 2 turns) | Master Hacker: guaranteed ERROR token, cybernetic augments |
| **Investigation** | Intelligence gathering (reveal boss loadouts) | Master Investigator: all zone secrets, Dad's encrypted journal |
| **Social** | Black market access (Exile vendors, no rep needed) | Master Diplomat: all faction vendors, free NPC mechanic |

Every skill level 10 has both a **mechanical** payoff (concrete game benefit) and a **narrative** payoff (story advancement or world-building).

---

## 4. Maneuvers (Combat Abilities)

### Core Concepts

**What they are:** Pre-programmed combat behaviors. The player equips them before a fight; they execute automatically when their trigger conditions are met during auto-combat.

**How many:** 20 total. 5 per position, spread across 3 tiers.

**How they're acquired:** Spend glory (earned from combat) to purchase. Each maneuver also requires minimum stat values — the player's build determines which maneuvers are accessible.

**How they're equipped:** 1-4 slots based on skill_combat level. Any maneuver from any position can fill any slot. The player is NOT locked to one position — a Striker maneuver and a Support maneuver in the same loadout is valid and encouraged.

### Maneuver Types

| Type | Trigger Timing | Player Experience |
|---|---|---|
| **Reaction** | When a specific event occurs (hit received, part destroyed) | "My frame reacted automatically" |
| **Instinct** | At turn start, if a condition is true | "My pilot's training kicked in" |
| **Maneuver** | Replaces normal attack action | "I used my ability instead of attacking" |

**Reactions** are defensive/responsive. **Instincts** are passive buffs/heals. **Maneuvers** are active choices (the combat AI decides when to use them based on conditions).

### The Four Positions

#### STRIKER — Destruction

**Identity:** Hit harder. Hit again. End fights fast.
**Primary stats:** Muscle, Reflex
**Synergies:** Offensive stance, fight-category weapons, Taeyang heat blades, Light/Medium frames

| Maneuver | Type | Tier | Trigger | Effect | Glory |
|---|---|---|---|---|---|
| Mech Brawl | Reaction | 1 | Hit received (melee) | Counter-attack at 50% damage | 3 |
| Power Strike | Maneuver | 1 | Replaces attack | +80% melee damage, +10 heat | 3 |
| Relentless Assault | Reaction | 2 | Destroy enemy part | Bonus attack at 60% damage | 8 |
| Berserker Protocol | Instinct | 2 | Stress >60% | +20% ATK, -15% DEF | 6 |
| **Pile Bunker Strike** | Maneuver | 3 | Replaces attack | **+150% melee damage**, +15 heat, +50% vs BREACH | 12 |

**The Striker fantasy:** A Leviathan with Colossus Core (ATK 10) + Taeyang Corona heat blade + Pile Bunker Strike. One attack deals enough damage to destroy a medium torso outright. The heat cost means you get maybe 3 Pile Bunkers before shutdown — so make them count.

#### DEFENDER — Endurance

**Identity:** Outlast everything. Never panic. Never fall.
**Primary stats:** Grit, Muscle
**Synergies:** Defensive stance, Heavy frames, KZ/Kuroda parts, high-armor loadouts

| Maneuver | Type | Tier | Trigger | Effect | Glory |
|---|---|---|---|---|---|
| Brace for Impact | Reaction | 1 | Hit received | -25% damage, -1 stress | 3 |
| Iron Will | Instinct | 1 | Stress >40% | -2 stress per turn | 4 |
| Emergency Repair | Reaction | 2 | Part <25% HP | Heal 15% max HP (4 uses) | 8 |
| Fortress Protocol | Instinct | 2 | Combat start | -20% ATK, +30% DEF, -50% stress gain | 10 |
| **Last Stand** | Instinct | 3 | Torso on last bar | **+40% all stats for 3 turns**, stress frozen | 15 |

**The Defender fantasy:** A Type 90 Fortress with full Kuroda Type 88 parts + Fortress Protocol + Brace for Impact. Every hit is reduced by 25% before armor. DEF is boosted 30%. The pilot sits in Calm the entire fight. When the torso finally cracks, Last Stand activates — Grandpa's voice, +40% everything, three turns of unstoppable counterattack. The cockpit never breaks.

#### TACTICIAN — Control

**Identity:** Information wins. Precision kills. Set up the domino chain.
**Primary stats:** Reflex, Focus
**Synergies:** Balanced stance, long-category weapons, Valletta sniper rifles, Daewon sensor arms, targeting modes

| Maneuver | Type | Tier | Trigger | Effect | Glory |
|---|---|---|---|---|---|
| Aimed Shot | Maneuver | 1 | Replaces attack | -30% damage, +40% accuracy, hits chosen part | 3 |
| Exploit Weakness | Instinct | 1 | Enemy has BREACH | +50% damage vs breached part | 5 |
| System Scan | Instinct | 2 | Combat start | Reveal enemy loadout, +5 accuracy all combat | 6 |
| Mark Target | Maneuver | 2 | Replaces attack | Apply 2 TARGET_LOCK + 1 BREACH | 8 |
| **Suppressing Fire** | Maneuver | 3 | Replaces attack | **Hit ALL parts**, 40% damage each, apply SUPPRESS | 14 |

**The Tactician fantasy:** An AT-M4 Sentinel with DW-S2 Interface Arms (accuracy +3) + Valletta VSR-7 sniper (accuracy +20) + System Scan + Mark Target + Exploit Weakness. Turn 1: System Scan reveals everything. Turn 2: Mark Target applies BREACH. Turn 3+: Exploit Weakness gives +50% damage to the cracked part while Aimed Shot ensures every shot lands exactly where you want it. Clinical. Surgical. Inevitable.

#### SUPPORT — Efficiency

**Identity:** Keep the machine running. Turn problems into advantages.
**Primary stats:** Neuro, Focus
**Synergies:** Cautious stance, backpack utilities, Daewon thermal parts, energy weapon builds

| Maneuver | Type | Tier | Trigger | Effect | Glory |
|---|---|---|---|---|---|
| Coolant Flush | Instinct | 1 | Heat >50% | Vent 15 heat per turn | 3 |
| Field Patch | Maneuver | 1 | Replaces attack | Heal 20% HP on lowest part, -1 supply | 5 |
| Overclock | Instinct | 2 | Combat start | +15% all stats, +stress/turn, +20% heat gen | 8 |
| Ammo Conservation | Instinct | 2 | Passive (always) | All supply costs -1 (minimum 0) | 10 |
| **Neural Override** | Instinct | 3 | Heat >75% | **Ignore heat penalties**, +2% damage per heat above 75 | 14 |

**The Support fantasy:** A Wraith with Null Core (heatMod -5, +3 dissipation) + Taeyang Sunbreak plasma repeater + Coolant Flush + Neural Override. The frame runs hot on purpose. At heat 90 with heatCap 100, Neural Override provides +30% bonus damage while ignoring all heat penalties. Combined with Coolant Flush venting 15/turn, the frame oscillates between 75-90 heat — a sweet spot where most frames shut down but the Support pilot thrives. The cockpit is a sauna. The pilot doesn't care.

---

## 5. Position Synergy Matrix

Positions are NOT classes. The player mixes maneuvers from any position. Common combinations:

| Combo | Maneuvers | Build | Why It Works |
|---|---|---|---|
| **Glass Cannon** | Power Strike + Berserker + Coolant Flush | Striker/Support | Taeyang melee + thermal management. Hit hard, stay cool. |
| **Immortal Wall** | Brace + Iron Will + Fortress Protocol + Field Patch | Defender/Support | Reduce damage, manage stress, heal parts. Never dies. Never kills. |
| **Precision Burst** | System Scan + Mark Target + Pile Bunker | Tactician/Striker | Scan → Mark (BREACH) → Pile Bunker (+150% +50% vs BREACH). Three-turn kill chain. |
| **Attrition** | Brace + Ammo Conservation + Exploit Weakness | Defender/Support/Tact | Take hits cheaply, attack cheaply, exploit openings. Wins by patience. |
| **Berserker Tank** | Berserker + Last Stand + Emergency Repair | Striker/Defender | Gets stronger as it takes damage. When torso cracks, becomes unstoppable. |
| **Heat Monster** | Neural Override + Overclock + Coolant Flush | Support × 3 | All Support. Overclocked frame that converts heat penalties into damage. Pure tech. |
| **Control Denial** | Suppressing Fire + System Scan + Aimed Shot + Ammo Conservation | Tactician/Support | Suppress all parts, conserve ammo, pick off weakened parts with precision. |

---

## 6. Economy — Glory Flow

### Earning Glory

| Source | Glory per Instance | Frequency |
|---|---|---|
| Defeat fodder enemy | 1-2 | Very common |
| Defeat common enemy | 2-4 | Common |
| Defeat elite enemy | 4-7 (up to 12 for arena) | Uncommon |
| Defeat threat enemy | 6-10 | Rare |
| Failed mission (fail-forward) | 30-50% of base | Always |
| Modifier: Veteran | ×1.5 | ~15% of encounters |

### Spending Glory

| Purchase | Glory Cost | When Available |
|---|---|---|
| Tier 1 maneuver | 3-5 | skill_combat 1+ |
| Tier 2 maneuver | 6-10 | skill_combat 3+ |
| Tier 3 maneuver (capstone) | 12-15 | skill_combat 6+ |
| **All 20 maneuvers** | **148 total** | — |

**Pacing estimate:** At 5-8 glory per mid-game mission, buying all Tier 1 maneuvers (8 × ~4 avg = 32 glory) takes ~5-6 missions. The player can access their first maneuver after 1-2 fights. Full Tier 1 coverage takes an hour of active play. Tier 3 capstones are late-game investments.

**Specialization pressure:** 148 glory for everything is expensive. A player who buys every Tier 1 (32 glory) and one position's Tier 2-3 (~30 glory) has spent 62 glory — enough for a focused build. Buying across all positions requires significantly more grinding, creating natural specialization in mid-game that opens up in late-game.

---

## 7. Stat Requirements — Build Archetypes

Maneuvers require minimum stat values. This creates natural build identities:

### What Stats Gate What

| Stat | Maneuvers Gated | Position Affinity |
|---|---|---|
| **Muscle** | 7 maneuvers | Striker + Defender |
| **Grit** | 7 maneuvers | Defender + Striker |
| **Neuro** | 6 maneuvers | Support + Defender |
| **Focus** | 6 maneuvers | Tactician + Support |
| **Reflex** | 5 maneuvers | Tactician + Striker |
| **Charisma** | 0 maneuvers | Economy (no combat gate) |

**Charisma intentionally gates zero maneuvers.** It's the economic/social stat — buy prices, sell prices, reputation gain, faction access. A high-charisma pilot is rich and well-connected but not a better fighter. This prevents charisma from being mandatory and preserves its identity as the "alternate progression" stat.

### Example Builds at Level 20

**The Brawler** (MUS 8, REF 5, GRT 5, FOC 2, NEU 2, CHA 3)
- Access: All Striker, most Defender
- Locked out: Suppressing Fire (focus 5), Neural Override (neuro 6), Ammo Conservation (focus 5)
- Loadout: Power Strike + Relentless Assault + Brace for Impact
- Frame: Revenant or Leviathan (high ATK, low DEF = glass cannon with safety net)

**The Technician** (NEU 7, FOC 6, GRT 4, MUS 2, REF 3, CHA 3)
- Access: All Support, most Tactician
- Locked out: Pile Bunker (muscle 6), Last Stand (grit 7), Relentless (muscle 4)
- Loadout: Coolant Flush + Neural Override + System Scan + Mark Target
- Frame: Wraith or Sentinel (high ENR, thermal efficiency)

**The Commander** (GRT 7, MUS 5, CHA 5, REF 3, FOC 3, NEU 2)
- Access: All Defender, most Striker
- Locked out: Suppressing Fire (reflex 5, focus 5), Ammo Conservation (focus 5)
- Loadout: Fortress Protocol + Last Stand + Brace for Impact + Iron Will
- Frame: Type 90 Fortress (maximum DEF, stress resilience)

---

## 8. Integration with Existing Systems

### Stats ↔ Enemies

Enemy archetypes use the same stat names (MUS, REF, FOC, GRT, TEC, CHA) with ranges defined in `enemies.json`. The assembly system generates enemy pilot stats within these ranges. A Corporate Security unit with REF [4,6] faces the player's own reflex stat in accuracy calculations.

### Stats ↔ Frames

The derived stat formulas connect player stats to frame base values from `frames.json`. Each frame's `baseStats` (ATK, DEF, ENR, COR) are the foundation; pilot stats add on top.

### Stats ↔ Parts

Part special properties interact with stats: DW-S2 Interface Arm's `accuracy_3` stacks with reflex's `+2 accuracy/point`. Type 88 Combat Arm's `stability_3` stacks the same way. The systems are additive.

### Skills ↔ Scrapyard Progression

Skills unlock at specific Phase milestones (GDD §6.3):
- Phase 2: Gathering (sorting station), Investigation, Social (workshop lv2)
- Phase 3: Combat, Mecha Tech (garage), Crafting (refinery), Hacking (research bench)

### Maneuvers ↔ Combat Runner

Maneuvers are processed in the combat loop at specific phases:
1. `on_combat_start` — Fortress Protocol, System Scan, Overclock
2. `turn_start` — Iron Will, Berserker, Coolant Flush, Exploit Weakness, Neural Override, Ammo Conservation
3. `action_replace` — Power Strike, Pile Bunker, Aimed Shot, Mark Target, Suppressing Fire, Field Patch
4. `on_hit_received` — Mech Brawl, Brace for Impact
5. `on_part_critical` — Emergency Repair, Last Stand
6. `on_kill_part` — Relentless Assault

### Maneuvers ↔ Stances

| Stance | Best Maneuver Synergies |
|---|---|
| Offensive | Berserker (+ATK stacks), Power Strike, Relentless (faster kills) |
| Defensive | Brace (+DEF stacks), Fortress Protocol (+DEF stacks), Iron Will |
| Balanced | System Scan (info advantage), Aimed Shot (precision), Mark Target |
| Cautious | Coolant Flush (thermal), Field Patch (sustain), Ammo Conservation |

---

## 9. Data Contract Summary

### player.json Fields

| Field | Type | New? | Description |
|---|---|---|---|
| `max` | number | changed | 10 (was 100) |
| `augMax` | number | **new** | Maximum with cybernetic augments (15) |
| `growthActivity` | string[] | **new** | Which activities grant XP toward this stat |
| `growthRate` | number | **new** | XP per relevant action |
| `derived` | object | **new** | Named derived stats with formulas |
| `mod` | object | exists | Direct modifier effects on game systems |

### skills.json Fields

| Field | Type | New? | Description |
|---|---|---|---|
| `max` | number | changed | 10 (was 20) |
| `primaryStats` | string[] | **new** | Which stats this skill uses primarily |
| `secondaryStats` | string[] | **new** | Which stats this skill uses secondarily |
| `growthSource` | string | **new** | Which activity grows this skill |
| `effects` | object | **new** | Per-level bonuses with formulas |
| `milestones` | object | **new** | Level → unlock description mapping |

### maneuvers.json Fields

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique ID, prefix `mnvr_` |
| `name` | string | Display name |
| `desc` | string | Full description |
| `flavor` | string | Atmospheric text |
| `type` | string | Always `"maneuver"` |
| `maneuverType` | string | `"reaction"` / `"instinct"` / `"maneuver"` |
| `trigger` | string | When it activates |
| `triggerCondition` | string\|null | Additional condition expression |
| `position` | string | `"striker"` / `"defender"` / `"tactician"` / `"support"` |
| `tier` | number | 1-3, gates by skill_combat level |
| `require` | string | TechTree unlock condition |
| `cost` | object | `{ glory: N }` to purchase |
| `statRequire` | object | Minimum stat values needed |
| `effect` | object | Mechanical effect (parsed by CombatRunner) |
