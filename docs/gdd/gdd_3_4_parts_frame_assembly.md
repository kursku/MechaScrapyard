# 3.4 Parts & Frame Assembly System

This section defines how mechas are built, customized, and maintained. It is the mechanical heart of Mecha Scrapyard — the system that turns a scrapyard kid into a mecha engineer, and transforms a pile of junk into a war machine.

The core philosophy: **the Frame is the chassis, the Parts are the identity.** Two mechas of the same Frame model can play completely differently depending on what parts are installed. The player is always building a Frankenstein — and that's the point.

---

## 3.4.1 Frame — The Chassis

A Frame is the skeleton of a mecha. It defines the category (Light, Medium, or Heavy), the available equipment slots, and the base structural profile. Frames are not interchangeable mid-game — choosing or acquiring a new Frame is a major progression milestone.

### Frame Data Structure

```json
{
  "id": "frame_hayabusa_mk1",
  "name": "Hayabusa Mk.I",
  "desc": "Dad's first build. A lightweight patrol frame from another era.",
  "flavor": "Rusted, dented, held together by stubbornness and duct tape.",
  "category": "light",
  "slots": {
    "torso": true,
    "left_arm": true,
    "right_arm": true,
    "legs": true
  },
  "equipSlots": {
    "left_hand":     { "accepts": "hand",     "linkedPart": "left_arm" },
    "right_hand":    { "accepts": "hand",     "linkedPart": "right_arm" },
    "backpack":      { "accepts": "backpack", "linkedPart": "torso" }
  },
  "baseStats": {
    "base_atk": 2,
    "base_def": 2,
    "base_enr": 6,
    "base_cor": 4
  },
  "heatCap": 80,
  "heatGenMod": 0.8,
  "heatDissipMod": 1.4,
  "stressPerTurn": 0.3,
  "stressPerCritHit": 2.0,
  "supplyEfficiency": 1.2,
  "weightRange": {
    "torso": [4, 8],
    "arm": [2, 5],
    "legs": [3, 7]
  }
}
```

### The Three Categories

Every Frame belongs to one of three categories. Categories are not cosmetic — they create fundamentally different gameplay profiles that cascade through every system in the game.

---

#### LIGHT

**Identity:** Fast, fragile, efficient. A veteran's Frame.

**Narrative context:** The player's starting mecha is Light — Dad's old patrol Frame, rusted and rebuilt. In the early game, this is a liability (low base stats, fragile parts). In the late game, after the pilot's attributes grow, Light becomes the optimal choice for skilled players who can avoid damage.

**Equipment Slots:** `left_hand`, `right_hand`, `backpack`. No shoulder mounts. Compensated by 1.2× supply efficiency (weapons cost 20% less ammo).

**Structural Integrity:**

| Part | Integrity Levels | HP per Level | Total HP |
|------|-----------------|-------------|----------|
| Torso | 2 | ~30 | ~60 |
| Left Arm | 1 | ~25 | ~25 |
| Right Arm | 1 | ~25 | ~25 |
| Legs | 1 | ~30 | ~30 |

No intermediate "Heavily Damaged" state on arms and legs — they go from operational to destroyed in one health bar. Brutal, but coherent: Light depends on not being hit, not on absorbing damage.

**Thermal Profile:**
- Heat generation: 0.8× (less mass, less energy waste)
- Heat dissipation: +40% (low mass sheds heat fast)
- Heat capacity: 80 (lower ceiling — energy weapons push toward the limit faster)

*Implication:* Light suits sustained combat with energy weapons (dissipates faster than it accumulates). But a burst of heavy attacks can overheat quickly due to the low cap.

**Stress Profile:**
- Passive stress: +0.3/turn (agile cockpit, smoother ride)
- Stress per critical hit: +2.0 (no armor cushion — the pilot feels every impact)

*Implication:* Light pilots reach Panic via burst damage, not via duration. A few critical hits in a row can spike Stress dangerously. High-GRT pilots thrive here.

**Derived Stats:**
- Low `base_atk`, low `base_def`, high `base_enr`, moderate `base_cor`
- Pilot attributes matter more proportionally — REF and FOC are critical
- A novice pilot in a Light Frame is fragile; a veteran pilot in a Light Frame is devastating

---

#### MEDIUM

**Identity:** Balanced, flexible, forgiving. The workhorse.

**Narrative context:** The player's first upgrade target. Medium Frames become available through faction contacts, market purchases, or crafting after acquiring enough blueprints. Medium is the "sweet spot" where every playstyle is viable.

**Equipment Slots:** `left_hand`, `right_hand`, `left_shoulder`, `right_shoulder`, `backpack`. Shoulders accept weapons with `slot: "shoulder"` up to tier 3.

**Structural Integrity:**

| Part | Integrity Levels | HP per Level | Total HP |
|------|-----------------|-------------|----------|
| Torso | 3 | ~40 | ~120 |
| Left Arm | 2 | ~35 | ~70 |
| Right Arm | 2 | ~35 | ~70 |
| Legs | 2 | ~40 | ~80 |

The dual health bar from the Mechanized Body system works perfectly here — Bar 1 (Operational), Bar 2 (Critical + Stress on hit). Medium is the baseline all other categories are measured against.

**Thermal Profile:**
- Heat generation: 1.0× (baseline)
- Heat dissipation: standard
- Heat capacity: 100

**Stress Profile:**
- Passive stress: +0.5/turn (baseline)
- Stress per critical hit: +1.0 (baseline)

**Derived Stats:**
- Balanced `base_atk`, `base_def`, `base_enr`, `base_cor`
- Pilot attributes provide meaningful but not dominant contribution
- Functional with any pilot, excellent with a good one

---

#### HEAVY

**Identity:** Durable, powerful, expensive. A newbie's best friend and a resource sink.

**Narrative context:** Heavy Frames are rare and valuable. The player encounters them as enemies first (Rogue Labors, Corporate Security Units), then acquires one through faction reputation, crafting mastery, or a major story milestone. Heavy is the "easy mode" for combat — but the maintenance costs keep it from being universally optimal.

**Equipment Slots:** `left_hand`, `right_hand`, `left_shoulder`, `right_shoulder`, `backpack`. Shoulders accept weapons with `slot: "shoulder"` of **any tier** (including tier 4-5: launchers, artillery). This is the Heavy's defining advantage — access to the biggest weapons.

**Structural Integrity:**

| Part | Integrity Levels | HP per Level | Total HP |
|------|-----------------|-------------|----------|
| Torso | 4 | ~50 | ~200 |
| Left Arm | 2 | ~45 | ~90 |
| Right Arm | 2 | ~45 | ~90 |
| Legs | 3 | ~50 | ~150 |

Nearly indestructible torso in early-game encounters. Three-level legs make Heavy extremely difficult to immobilize. The trade-off: more integrity levels = higher repair costs between missions (see §8.4).

**Thermal Profile:**
- Heat generation: 1.2× (larger actuators consume more energy)
- Heat dissipation: -20% (mass retains heat)
- Heat capacity: 120 (higher absolute ceiling)

*Implication:* Heavy is a "thermal tank" — slow to heat, slow to cool. Suits burst combat (fire everything, win fast before heat accumulates). In prolonged combat, Heavy needs Cautious stance or periodic Vent Heat actions.

**Stress Profile:**
- Passive stress: +0.7/turn (strain of controlling massive machinery)
- Stress per critical hit: +0.5 (armor absorbs the psychological impact)

*Implication:* Heavy pilots reach Panic via duration, not via damage spikes. A 20-turn combat = 14 Stress from passive accumulation alone. High-GRT pilots are essential for Heavy operation.

**Derived Stats:**
- High `base_atk`, high `base_def`, low `base_enr`, high `base_cor`
- Frame is strong by default — pilot attributes are "cherry on top"
- A novice pilot in Heavy still functions decently; the Frame carries them

**Supply Profile:**
- Supply efficiency: 0.8× (weapons cost 25% more ammo)
- Pressures the player to carry Ammo Crate in backpack or be selective with weapons

---

### Category Comparison Summary

| Attribute | Light | Medium | Heavy |
|-----------|-------|--------|-------|
| **Equip Slots** | 3 (hands + backpack) | 5 (hands + shoulders + backpack) | 5 (hands + shoulders + backpack) |
| **Shoulder Max Tier** | — | Tier 3 | Tier 5 (all weapons) |
| **Total Integrity** | 5 levels | 9 levels | 11 levels |
| **Heat Gen** | 0.8× | 1.0× | 1.2× |
| **Heat Dissip** | +40% | Baseline | -20% |
| **Heat Cap** | 80 | 100 | 120 |
| **Stress/Turn** | +0.3 | +0.5 | +0.7 |
| **Stress/Crit Hit** | +2.0 | +1.0 | +0.5 |
| **Supply Efficiency** | 1.2× | 1.0× | 0.8× |
| **Base Stats** | Low ATK/DEF, High ENR | Balanced | High ATK/DEF, Low ENR |
| **Best For** | Veterans, sustained combat | All-rounders | Beginners, burst combat |
| **Maintenance Cost** | Low per-fight, high replacement | Moderate | High per-fight |

---

## 3.4.2 Parts — Modular Components

Parts are the individual components installed in each structural zone (torso, left_arm, right_arm, legs). Unlike the Frame (which is the persistent chassis), parts are **inventory items** that can be installed, removed, swapped, degraded, repaired, sold, or dismantled.

### Part Data Structure

```json
{
  "id": "torso_kz_industrial_mk1",
  "name": "KZ Industrial Torso Mk.I",
  "type": "frame_part",
  "slot": "torso",
  "origin": "labor",
  "category_compat": ["medium", "heavy"],
  "hp": 60,
  "maxHp": 60,
  "integrity": 3,
  "armor": 4,
  "heatMod": 0,
  "weight": 12,
  "slots_provided": [],
  "flavor": "Built for dockyard labor. Ugly, heavy, nearly indestructible."
}
```

### Part Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `slot` | string | Which structural zone: `torso`, `left_arm`, `right_arm`, `legs` |
| `origin` | string | Where it came from: `labor`, `police`, `military`, `civilian`, `exile`, `custom` |
| `category_compat` | string[] | Which Frame categories this part fits in |
| `hp` / `maxHp` | number | Hit points for this part (defines one integrity level's HP pool) |
| `integrity` | number | How many health bars this part has |
| `armor` | number | Contributes to frame DEF calculation |
| `heatMod` | number | Modifier to frame heat profile (positive = worse, negative = better) |
| `weight` | number | Affects mobility and compatibility with Frame's expected weight range |
| `slots_provided` | string[] | Some torsos provide additional equipment slots |
| `condition` | number | 0.0–1.0, representing cumulative wear (tracked per installed instance) |

### Part Origins

Each origin has a distinct personality that affects availability, stat distribution, and flavor:

| Origin | Stat Profile | Availability | Flavor |
|--------|-------------|-------------|--------|
| **Labor** | High HP, high weight, low precision | Common (scrapyard, Neon Bazaar) | Industrial workhorses repurposed for combat |
| **Civilian** | Balanced, low armor, light weight | Common (market) | Mass-produced commuter parts, cheap and replaceable |
| **Police** | Balanced, good armor, moderate weight | Uncommon (faction rep, combat loot) | Standardized patrol-grade equipment |
| **Military** | High armor, high everything, heavy | Rare (high faction rep, late-game missions) | Mil-spec hardware designed for actual warfare |
| **Exile** | Extreme variance, unique properties | Rare (Exile faction, special events) | Experimental tech, unpredictable but potentially exceptional |
| **Custom** | Player-defined via crafting | Crafted (blueprint + materials) | Built by the protagonist — the culmination of reverse engineering |

### Installed vs. Inventory

When a part is **installed** on a Frame, the frame's structural zone references it:

```json
{
  "parts": {
    "torso": { "partId": "torso_kz_industrial_mk1", "condition": 0.85 },
    "left_arm": { "partId": "arm_drone_manipulator", "condition": 0.62 },
    "right_arm": { "partId": "arm_police_servo_mk2", "condition": 0.91 },
    "legs": { "partId": "legs_labor_hydraulic", "condition": 0.74 }
  }
}
```

When a part is **in inventory**, it sits in the player's parts storage, waiting to be installed, sold, or dismantled. The Garage UI shows both installed parts and inventory parts, allowing drag-and-drop swaps.

---

## 3.4.3 Compatibility — The Frankenstein Rules

The player is encouraged to mix parts from different origins. A police torso with labor arms and military legs is not only possible — it's the *expected* playstyle for a scrapyard pilot. Compatibility is governed by two rules:

### Rule 1: Category Compatibility

Each part has a `category_compat` array defining which Frame categories it physically fits:

| Part Origin Category | Compatible With |
|---------------------|----------------|
| Light parts | Light, Medium |
| Medium parts | Medium, Heavy |
| Heavy parts | Heavy only |
| Custom parts | Defined by blueprint |

**Design rationale:** Medium Frames are the most flexible — they accept both Light and Medium parts. Heavy Frames accept Medium and Heavy. Light Frames are the most restrictive — Light parts only. This reinforces Medium as the "sweet spot" and gives Light an identity as the specialist's choice.

**Gameplay implication:** A player who builds a Medium Frame has the widest selection of available parts. A player who invests in a Light Frame must be more selective, but the parts they use are optimized for that category's strengths (low weight, high efficiency).

### Rule 2: Weight Mismatch

Each Frame defines an expected weight range per slot (e.g., torso expects weight 8–12). Installing a part outside this range is allowed but incurs a **-5% efficiency penalty** on that part's effective stats:

```
effectiveHp = part.maxHp × condition × (isWeightMismatch ? 0.95 : 1.0)
effectiveArmor = floor(part.armor × condition × (isWeightMismatch ? 0.95 : 1.0))
```

The penalty is mild by design — a weight-mismatched part with a useful special property is still worth installing. The penalty exists to make "perfect fit" parts feel satisfying, not to punish experimentation.

**When mismatch matters most:** In late-game optimization, where that 5% translates to meaningful HP differences across long combat chains. In early game, the player should grab whatever works and worry about optimization later.

---

## 3.4.4 Equipment Slots — Weapons and Utilities

Equipment slots are attachment points on the Frame where weapons and utilities are mounted. They are distinct from structural parts — a part defines the arm's integrity, while the equipment slot defines what weapon that arm carries.

### Slot Types

| Slot | Available On | Accepts | Linked Part |
|------|-------------|---------|-------------|
| `left_hand` | All categories | `hand` weapons | `left_arm` |
| `right_hand` | All categories | `hand` weapons | `right_arm` |
| `left_shoulder` | Medium, Heavy | `shoulder` weapons (tier ≤3 for Medium, all tiers for Heavy) | `torso` |
| `right_shoulder` | Medium, Heavy | `shoulder` weapons (same tier rules) | `torso` |
| `backpack` | All categories | `backpack` utility items | `torso` |

### Linked Part Rule

When a linked part is **destroyed** in combat, the equipment slot becomes disabled. If the left arm is destroyed, the left_hand weapon can no longer fire. Shoulder weapons are linked to the torso — they remain functional as long as the torso survives.

### Backpack — The Utility Slot

The backpack is a new slot type that does not carry weapons. Instead, it accepts utility items that modify Frame performance:

| Item | Type | Effect |
|------|------|--------|
| Extra Coolant Tank | backpack | heatCap +15 |
| Ammo Crate | backpack | +5 Supply at mission start |
| Field Repair Kit | backpack | Auto-repair 10 HP to most damaged part after combat |
| Sensor Array | backpack | Targeting accuracy +5% (flat bonus to targetPercent) |
| Stress Dampener | backpack | Stress/turn -0.2 |

Backpack items open a customization dimension that doesn't compete with weapons — the player isn't choosing between "more damage" and "utility" in the same slot.

---

## 3.4.5 Stance × Category Interactions

The four combat stances (Offensive, Balanced, Defensive, Cautious) interact with Frame categories to create emergent gameplay profiles. These combos are not hardcoded — they emerge naturally from the multiplication of modifiers:

### Key Emergent Combos

**Light + Cautious — "The Phantom"**
Heat dissipation stacks: +25% from Cautious stance + 40% from Light category = energy weapons with virtually no heat penalty. Trade-off: ATK -20% makes combats long, but the Light's efficiency keeps supply costs minimal. Ideal for sustained farming of weaker enemies.

**Light + Offensive — "Glass Cannon"**
Hit hard, die fast. High-risk, high-reward. Combats last 5–8 turns. If the Light's weapons are good, enemies fall before they can respond. If not, the Light's fragile parts collapse fast. Best paired with Tactical targeting (disable enemy weapons before they fire).

**Heavy + Offensive — "The Berserker"**
Devastating damage output (high `base_atk` + 15% stance bonus). But heat accumulates dangerously fast (1.2× generation, no dissipation bonus) and DEF -10% on a slow frame means every hit lands. This is sprint combat — win in 10 turns or overheat trying.

**Heavy + Defensive — "The Wall"**
Nearly unkillable against weaker enemies. But combats last 20+ turns, generating 14+ Stress from passive accumulation alone. Needs a high-GRT pilot or the Stress Dampener backpack item. Economically expensive (long combats = more part degradation).

**Medium + Balanced — "The Professional"**
No modifiers, no gimmicks. The Medium's flexibility means Balanced stance has no wasted potential. This is the "default good" option that works against everything but excels against nothing. Often the optimal choice when the player doesn't know what to expect.

**Medium + Cautious — "The Technician"**
Heat dissipation bonus on a frame with standard heat generation means the Medium can freely use energy weapons that would overheat a Heavy. Combined with Tactical targeting, this creates a "surgeon" playstyle focused on dismantling enemies piece by piece.

---

## 3.4.6 Targeting × Category Interactions

Targeting policies have different effectiveness against different Frame categories, creating a layer of tactical awareness:

**Versus Heavy targets:**
- Aggressive targeting (torso 60%) is **inefficient** — the Heavy's torso has 4 integrity levels. Burning through all of them takes many turns.
- Tactical targeting (arms 70%) is **smart** — disabling the Heavy's arms removes its firepower advantage. Without weapons, the Heavy is just a slow, expensive target.

**Versus Light targets:**
- Any targeting works (few integrity levels on all parts), but Aggressive is **most efficient** — the Light's torso has only 2 levels. Go for the kill shot.
- Defensive targeting (legs 55%) is **wasteful** — Light legs have only 1 integrity level. One focused hit destroys them, so the weight allocation is overkill.

**Enemy AI implication:** Intelligent enemies could use category-aware targeting against the player. Corporate Security Units might prioritize arms against a player in a Heavy frame. Scrap Drones would use Aggressive against a Light frame. This makes enemy behavior feel reactive rather than random.

---

## 3.4.7 Derived Stats — How Category Shapes Combat Math

Frame stats are calculated from a combination of the Frame's base values and the pilot's attributes:

```
ATK = base_atk + (MUS × 0.3) + (REF × 0.2)
DEF = base_def + (GRT × 0.4) + (MUS × 0.1)
ENR = base_enr + (FOC × 0.3) + (NEU × 0.2)
COR = base_cor + (GRT × 0.2) + (CHA × 0.3)
```

Category defines the `base_*` values, which creates a fundamental asymmetry:

| Stat | Light Base | Medium Base | Heavy Base | Implication |
|------|-----------|-------------|-----------|-------------|
| `base_atk` | Low (2) | Mid (4) | High (6) | Heavy hits hard by default |
| `base_def` | Low (2) | Mid (4) | High (6) | Heavy shrugs off hits by default |
| `base_enr` | High (6) | Mid (4) | Low (2) | Light has more energy for specials |
| `base_cor` | Mid (4) | Mid (4) | High (5) | Heavy resists panic better at base |

**The Progression Inversion:** A novice pilot (low attributes) in a Heavy Frame functions adequately because the Frame's high base stats carry them. The same novice in a Light Frame struggles — low base stats + low attributes = poor combat performance. But a veteran pilot (high attributes) in a Light Frame outperforms the Heavy because the pilot's contribution dominates the base values, and the Light's efficiency bonuses (heat, supply, speed) compound the advantage.

This creates a natural arc: Start with Light (Dad's old Frame, struggle through early fights) → Upgrade to Medium (first major power spike) → Eventually return to Light when the pilot is strong enough to make it shine. The Light Frame bookends the player's journey — from weakness to mastery.

---

## 3.4.8 Part Acquisition — Three Paths

Parts enter the player's inventory through three distinct channels, each with its own personality:

### Salvage — Combat Loot

Defeated enemies can drop specific parts based on what they were equipped with. A Scrap Drone might drop a "Drone Manipulator Arm" (weak, light, cheap). A Rogue Labor might drop a "Hydraulic Press Arm" (heavy, high ATK base, labor origin). A Corporate Security Unit might drop "Police-Grade Leg Actuators" (balanced, good armor).

The loot system uses the existing per-mission loot tables. Parts drop alongside resource loot (scrap, creds), with drop chance based on mission difficulty and enemy type. Higher-difficulty enemies drop better-origin parts.

### Market — Faction Vendors

Different factions sell parts from different origins:

| Vendor | Origin | Price Range | Requirement |
|--------|--------|------------|-------------|
| Neon Bazaar | Civilian, Labor | Cheap (20–80 Creds) | Zone explored |
| Underground Contacts | Custom, Recycled | Variable (30–100 Creds) | Underground rep |
| Corporate Suppliers | Premium factory | Expensive (150–500 Creds) | Corporate rep |
| Police Surplus | Police-grade | Moderate (80–200 Creds) | Police rep |
| Exile Traders | Experimental | Expensive, unpredictable | Exile rep |

Vendor catalogs rotate periodically (market events), and reputation gates ensure the player must engage with faction systems to access better parts.

### Crafting — Blueprint Fabrication

The player fabricates parts using blueprints and refined materials (see §8.3 for the blueprint economy). Crafted parts have origin "custom" and can be tuned during crafting to favor specific stats. This is the endgame acquisition path — the most powerful parts in the game are player-crafted, using knowledge accumulated from dismantling hundreds of salvaged parts.

---

## 3.4.9 Part Lifecycle — From Acquisition to Retirement

Every part follows a lifecycle that drives the idle game loop:

```
ACQUIRE (salvage / buy / craft)
    ↓
INVENTORY (stored in garage)
    ↓
INSTALL (equip on Frame structural zone)
    ↓
COMBAT USE (condition degrades per fight)
    ↓
CONDITION CHECK
    ↓
┌─────────────────────────────────────┐
│ Condition > 0.6 → Continue using    │
│ Condition 0.2–0.6 → Restore (task) │
│ Condition < 0.2 → Decision point:  │
│   → Restore (expensive, slow)      │
│   → Replace (swap from inventory)  │
│   → Dismantle (materials + knowledge)│
└─────────────────────────────────────┘
```

### The Triage Decision

Every time a part's condition drops below the comfort threshold, the player faces a triage:

- **Restore** if the part is high-quality (military/custom origin, good stats). Worth the investment.
- **Replace** if the player has a spare in inventory. Quick and free (if the spare exists).
- **Dismantle** if the part is common (labor/civilian origin) and the materials or knowledge are more valuable than the part itself.

This decision is the engine of the idle cycle. The player is always evaluating: "Is this part worth saving, or is it worth more as scrap?" That question drives engagement.

### Reverse Engineering

Dismantling parts accumulates knowledge by origin and slot type. When knowledge reaches a threshold, a new blueprint is unlocked (see §8.3). This means every dismantled part is an investment in future crafting capability.

```
Dismantle police arm (origin: police, slot: arm) → knowledge_police_arm += 1
knowledge_police_arm >= 3 → Unlock "BP: Police-Grade Arm Servo"
Player can now CRAFT police-grade arms using own materials
```

The thematic hook: the protagonist teaches himself to build military-grade equipment by taking apart what he finds in the scrapyard. Grandpa's workshop notes provide flavor text as each knowledge threshold is reached — the old man couldn't make sense of modern tech, but the kid can.

---

## 3.4.10 Nomenclature Reference

The game uses different words for the same concept depending on context:

| Term | Context | Usage |
|------|---------|-------|
| **Frame** | Technical / code / engineering | Internal systems, data structures, documentation |
| **Labor** | Civilian / industrial | NPCs and world lore referring to work mechas |
| **Mecha** | Generic | General conversation, marketing, genre reference |
| **Rig** | Street slang / scrapyard | Protagonist, Grandpa, Underground characters |
| **Unit** | Military / police | Faction communications, mission briefings |

Code always uses "Frame" internally. Player-facing text adapts based on who's speaking.

---

## 3.4.11 Implementation Priority

The Parts & Frame Assembly system should be implemented in five incremental phases, each building on the previous:

**Phase 1 — Data & Structure:** Create `parts.json` (part templates by origin) and `frames.json` (chassis definitions with category, slots, base stats). Add loaders to `game.js`.

**Phase 2 — Parts Inventory:** Transform parts from inline stats to inventory item references. Add condition tracking. Implement Garage UI for viewing installed parts and inventory.

**Phase 3 — Acquisition Channels:** Wire up combat loot to drop specific parts. Add vendor catalogs to market. Connect crafting blueprints to part fabrication.

**Phase 4 — Lifecycle:** Implement condition degradation per combat. Add Restore Part task. Add dismantle-for-materials flow. The idle maintenance loop begins.

**Phase 5 — Reverse Engineering:** Implement knowledge counters per origin/slot. Add blueprint unlocks at knowledge thresholds. The loop closes: combat → part → dismantle → knowledge → blueprint → better part → harder combat.

Each phase delivers playable value independently. Phase 1 alone enables different Frame categories. Phase 2 alone enables part swapping. The full system only requires all five phases.
