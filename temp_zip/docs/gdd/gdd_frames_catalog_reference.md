# Mecha Scrapyard — Frame Catalog Reference
## GDD Supplement: Complete Frame Roster

---

## 1. Catalog Overview

**Total frames:** 10 (1 existing + 9 new)
**Categories:** Light (3), Medium (4), Heavy (3)
**Manufacturers:** 6 (Hayabusa, Sora, Phantom Works, KZ Industrial, Aegis-Tac, Kuroda Heavy)
**Note:** Daewon Dynamics does NOT produce frames (parts and utilities only). This is a deliberate worldbuilding choice — they're the ambitious newcomer who hasn't cracked the full-frame market yet. Leaves room for a narrative milestone: "Daewon releases their first frame" as a late-game event.

---

## 2. Design Philosophy

### Frames Define the Ceiling, Parts Define the Floor

The GDD principle holds: "the Frame is the chassis, the Parts are the identity." Two players with the same Ironback can have wildly different builds depending on installed parts. The frame sets the *rules of engagement* — parts set the *strategy*.

### Each Frame Answers a Question

No filler. Every frame exists because it answers a specific player question:

| Frame | Question It Answers |
|---|---|
| Hayabusa Mk.I | "What can I do with what Dad left me?" |
| Sora Courier | "What if I want cheaper than the Hayabusa?" |
| Wraith | "What if I never want to get hit?" |
| Sora Workhorse | "What's the cheapest way into a Medium frame?" |
| KZ Ironback | "What if I want a Medium that can take a punch?" |
| AT-M4 Sentinel | "What's the most reliable Medium money can buy?" |
| Revenant | "What if I want Heavy offense without Heavy weight?" |
| KZ Goliath | "What's the cheapest way into a Heavy frame?" |
| Type 90 Fortress | "What's the best frame in the game?" |
| Leviathan | "What if I want to hit harder than anything else?" |

### Manufacturer Identity in Frames

Each manufacturer's statBias cascades from the manufacturers.json into how their frames feel:

| Manufacturer | Frame Identity | Stat Signature |
|---|---|---|
| **Hayabusa** | Balanced artisan quality | Reference stats for category, slight durability bonus |
| **Sora Motor** | Cheap, accessible, expendable | Below-average combat stats, above-average efficiency |
| **KZ Industrial** | Tanky, heavy, resource-hungry | Highest DEF in category, worst heat/supply efficiency |
| **Aegis-Tac** | Reliable, no surprises | Above-average across the board, no extremes |
| **Kuroda Heavy** | Military excellence at premium cost | Best overall stats, highest price, highest reputation gate |
| **Phantom Works** | Extreme tradeoffs, high risk/reward | Highest offense in category, lowest defense, brutal stress profiles |

---

## 3. Light Frames (3)

### Category Rules (from GDD §3.4.1)
- **Equip slots:** left_hand, right_hand, backpack (NO shoulders)
- **Integrity:** Torso 2 levels, Arms 1 level each, Legs 1 level
- **Identity:** Fast, fragile, efficient. Pilot attributes dominate.

### Comparison Table

| Stat | Hayabusa Mk.I | Sora Courier | Wraith |
|---|---|---|---|
| **ATK** | 2 | 1 | **4** |
| **DEF** | 2 | 2 | 1 |
| **ENR** | 6 | 5 | **7** |
| **COR** | 4 | 4 | 2 |
| **Heat Cap** | 80 | 75 | 70 |
| **Heat Gen** | 0.8× | **0.75×** | **0.7×** |
| **Heat Dissip** | 1.4× | **1.5×** | **1.6×** |
| **Stress/Turn** | **0.3** | **0.3** | 0.4 |
| **Stress/Crit** | 2.0 | 2.5 | **3.0** |
| **Supply Eff** | 1.2× | **1.3×** | 1.2× |
| **Tier** | 1 | 1 | 3 |
| **Value** | 0 (starter) | 40 | 200 |
| **Require** | Garage | — | Exile Rep 2 |

### Identity Profiles

**Hayabusa Mk.I — "The Legacy"**
The reference Light frame. Balanced for the category, no extreme strengths or weaknesses. The emotional anchor — the frame the player starts with and potentially returns to in endgame when their pilot stats are high enough to make it devastating. Cannot be sold.

**Sora C-100 Courier — "The Economy Car"**
Strictly worse combat stats than the Hayabusa (ATK 1 vs 2, ENR 5 vs 6) but the *best efficiency frame in the game*: supply efficiency 1.3×, heat dissipation 1.5×. This frame runs on fumes and never overheats. Ideal for sustained farming of low-level enemies where damage output doesn't matter but resource efficiency does. The player who buys a Courier is saying "I want to grind cheap."

Trade-off vs Hayabusa: Lower offense but lower operating costs. For early-game farming, Courier might actually be optimal despite having worse stats.

**Wraith — "The Glass Scalpel"**
Phantom Works extreme engineering. ATK 4 is *double* the Hayabusa's offense — and ENR 7 is the highest base_enr of any frame in the game. But DEF 1 and COR 2 make it the most fragile frame in the roster. stressPerCritHit 3.0 means three critical hits in a row would generate 9 stress — potentially enough for instant panic on a low-GRT pilot.

The Wraith is the frame for mastery players who have built a high-attribute pilot and want the ultimate "skill expression" chassis. Every fight is a coin flip between dominance and disaster.

---

## 4. Medium Frames (4)

### Category Rules (from GDD §3.4.1)
- **Equip slots:** left_hand, right_hand, left_shoulder, right_shoulder, backpack
- **Shoulder max tier:** 3
- **Integrity:** Torso 3 levels, Arms 2 levels each, Legs 2 levels
- **Identity:** Balanced, flexible, forgiving. The workhorse.

### Comparison Table

| Stat | Sora Workhorse | KZ Ironback | AT-M4 Sentinel | Revenant |
|---|---|---|---|---|
| **ATK** | 3 | 4 | 4 | **6** |
| **DEF** | 3 | **5** | **5** | 3 |
| **ENR** | **5** | 3 | 4 | **5** |
| **COR** | 4 | 4 | **5** | 3 |
| **Heat Cap** | 100 | **105** | 100 | 90 |
| **Heat Gen** | 1.0× | 1.05× | **0.95×** | 1.1× |
| **Heat Dissip** | **1.1×** | 0.95× | **1.05×** | **1.15×** |
| **Stress/Turn** | 0.5 | 0.55 | **0.45** | 0.6 |
| **Stress/Crit** | 1.0 | **0.8** | **0.9** | 1.5 |
| **Supply Eff** | **1.1×** | 0.95× | 1.0× | 0.9× |
| **Tier** | 2 | 2 | 3 | 3 |
| **Value** | 80 | 70 | 150 | 180 |
| **Require** | — | — | Police Rep 2 | Exile Rep 2 |

### Identity Profiles

**Sora M-300 Workhorse — "The First Upgrade"**
The player's likely first Medium frame. Available on the open market, no reputation required. Stats are below medium baseline (ATK/DEF 3 vs 4), but ENR 5 and supply efficiency 1.1× make it resource-friendly. The Workhorse is designed to feel like a meaningful upgrade from the starting Light frame without being so powerful that it trivializes early-mid content.

**KZ-7M Ironback — "The Poor Man's Tank"**
DEF 5 pushes this toward Heavy territory while staying in a Medium chassis. Higher weight ranges (torso 9-14) accept heavier parts that would mismatch on other Medium frames. The trade-off: worst heat dissipation of the Medium class (0.95×), worst supply efficiency (0.95×), and lower ENR (3). The Ironback is for players who want survivability and don't care about efficiency. Also the cheapest Medium at 70 creds.

The KZ origin means these are found everywhere — scrapyard salvage, NPC enemy loot, Neon Bazaar bulk dealers. The accessible tank.

**AT-M4 Sentinel — "The Best-in-Class"**
Aegis-Tac's engineering philosophy distilled into a frame: no weaknesses. Best COR in the Medium class (5), best stress/turn (0.45), best heat generation (0.95×). It doesn't excel at anything dramatically, but it never lets you down. The Sentinel is the frame that wins fights through consistency — the opponent runs out of resources or patience before the Sentinel runs out of durability.

Gated behind Police Rep 2 because Aegis-Tac doesn't sell to scrapyard kids. The player earns this through trust.

**Revenant — "The Wolf in Sheep's Clothing"**
ATK 6 in a Medium chassis is extraordinary — that's Heavy-class offense (Goliath has ATK 5). But DEF 3 and COR 3 make it fragile for the class, and stressPerCritHit 1.5 is the highest of any Medium. The Revenant is the Phantom Works philosophy crystallized: maximum offense, accept the consequences.

Heat profile is interesting — generates more than baseline (1.1×) but also dissipates faster (1.15×). It runs warm but cools quickly, rewarding burst-and-pause tactics. The frame for aggressive players who want shoulder mounts (which Light frames lack) without sacrificing offense.

---

## 5. Heavy Frames (3)

### Category Rules (from GDD §3.4.1)
- **Equip slots:** left_hand, right_hand, left_shoulder, right_shoulder, backpack
- **Shoulder max tier:** 5 (ALL weapons)
- **Integrity:** Torso 4 levels, Arms 2 levels each, Legs 3 levels
- **Identity:** Durable, powerful, expensive. The resource sink.

### Comparison Table

| Stat | KZ Goliath | Type 90 Fortress | Leviathan |
|---|---|---|---|
| **ATK** | 5 | **7** | **8** |
| **DEF** | **7** | **7** | 5 |
| **ENR** | 2 | 2 | **3** |
| **COR** | 4 | **6** | 4 |
| **Heat Cap** | 125 | **130** | 110 |
| **Heat Gen** | 1.25× | **1.15×** | 1.3× |
| **Heat Dissip** | 0.75× | **0.85×** | **0.9×** |
| **Stress/Turn** | 0.75 | **0.65** | 0.8 |
| **Stress/Crit** | 0.4 | **0.3** | 0.7 |
| **Supply Eff** | 0.75× | **0.8×** | 0.7× |
| **Tier** | 2 | 4 | 4 |
| **Value** | 120 | 350 | 280 |
| **Require** | — | Military Rep 3 | Exile Rep 3 |

### Identity Profiles

**KZ-9H Goliath — "The Accessible Fortress"**
The player's first Heavy. DEF 7 is tied for the highest of any frame, and the low price (120 creds) plus no reputation requirement means anyone can acquire one. But the Goliath pays for accessibility with the worst efficiency in the game: supply efficiency 0.75× and heat dissipation 0.75× mean every fight is expensive. ATK 5 is below heavy baseline (6), so fights take longer — compounding the resource drain.

The Goliath is designed as a progression trap: it feels amazing at first (invincible!), but the maintenance costs slowly pressure the player toward either optimizing (better parts, better pilot stats) or switching to a more efficient frame. It teaches the economic lesson that "bigger ≠ better" — one of the game's core themes.

**Type 90 Fortress — "The Apex Predator"**
The best frame in the game by raw stats. ATK 7 + DEF 7 + COR 6. Better heat profile than Goliath. Lowest stressPerCritHit in the game (0.3). The cockpit is so well-armored that critical hits barely register psychologically. The Fortress is what happens when a military-industrial zaibatsu builds a frame with unlimited budget.

Gated behind Military Rep 3 + 350 creds. This is a late-game reward that the player has earned through sustained engagement with the military faction. The Fortress should feel like *arriving* — the moment where the scrapyard kid is now piloting mil-spec hardware that rivals anything on the battlefield.

**Leviathan — "The Glass Cannon Heavy"**
ATK 8 is the highest base_atk of ANY frame. In a heavy chassis with shoulder mounts accepting all weapon tiers, the Leviathan can field the most devastating loadout in the game. But DEF 5 is below heavy baseline, supply efficiency 0.7× is the worst in the game, and stressPerTurn 0.8 is also the worst. The pilot accumulates 16 stress in a 20-turn fight from passive alone.

The Leviathan is the philosophical opposite of the Fortress: pure offense. It's for players who want to end fights in 8-10 turns through overwhelming firepower, accepting that longer fights become unsustainable. Pair it with Offensive stance for "The Berserker" — devastating burst damage that either wins fast or overheats and panics trying.

---

## 6. Progression Arcs

### The Natural Path (most players)

```
Phase 2: Hayabusa Mk.I (starter Light)
    │
    ├── Early upgrade: Sora Courier (sidegrade for farming)
    │
Phase 3: Sora Workhorse OR KZ Ironback (first Medium)
    │       └── Workhorse = efficiency      └── Ironback = durability
    │
    ├── Mid-game: AT-M4 Sentinel (police rep reward)
    │
Phase 4: KZ Goliath (first Heavy, accessible)
    │       └── Player learns Heavy costs are brutal
    │
    ├── Late-game faction choice:
    │   ├── Military path → Type 90 Fortress (best overall)
    │   └── Exile path   → Leviathan (highest offense)
    │                       OR Revenant (medium with heavy ATK)
    │                       OR Wraith (ultimate glass cannon)
    │
Phase 5: Return to Hayabusa (crafted Mk.III with veteran pilot)
         └── "The Progression Inversion" — Light bookends the journey
```

### The Phantom Path (specialist players)

Players who invest in Exile faction reputation unlock the three Phantom frames, each the most extreme version of its category:

| Category | Phantom Frame | What Makes It Extreme |
|---|---|---|
| Light | Wraith | Highest ATK and ENR of any Light. Lowest DEF and COR of any frame. |
| Medium | Revenant | Heavy-class ATK (6) in a Medium chassis. Below-average DEF and COR. |
| Heavy | Leviathan | Highest ATK of ANY frame (8). Below-average DEF for Heavy. Worst supply efficiency. |

The Phantom path is for players who want to push the system to its limits. Every Phantom frame rewards aggressive play and punishes mistakes. They're the "hard mode" option at every tier.

### The Efficient Path (optimizer players)

Players who prioritize resource efficiency follow a different curve:

```
Sora Courier (best supply efficiency in game: 1.3×)
    → Sora Workhorse (supply efficiency 1.1×, no rep needed)
        → AT-M4 Sentinel (best heat profile of any Medium)
            → Never buy Heavy (or Goliath + immediate downgrade back to Sentinel)
                → Endgame: Crafted Hayabusa Light with veteran pilot
```

This path never touches Heavy frames because the efficiency penalty is too steep. It's mechanically viable and thematically interesting — the player who masters Light/Medium combat is rewarded with lower costs and faster farming.

---

## 7. Data Contract: Frame JSON

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | Unique, prefix `frame_` |
| `name` | string | yes | Display name |
| `desc` | string | yes | Full description |
| `flavor` | string | yes | Short atmospheric text |
| `type` | string | yes | Always `"frame"` |
| `category` | string | yes | `"light"`, `"medium"`, `"heavy"` |
| `mfr` | string | yes | Manufacturer ID from manufacturers.json |
| `origin` | string | yes | Part origin system: `"custom"`, `"civilian"`, `"police"`, `"labor"`, `"military"`, `"exile"` |
| `tier` | number | yes | 1-5 progression tier |
| `slots` | object | yes | Structural slots (always all true) |
| `equipSlots` | object | yes | Equipment mount points (varies by category) |
| `baseStats` | object | yes | `{ base_atk, base_def, base_enr, base_cor }` |
| `heatCap` | number | yes | Maximum heat before shutdown |
| `heatGenMod` | number | yes | Heat generation multiplier |
| `heatDissipMod` | number | yes | Heat dissipation multiplier |
| `stressPerTurn` | number | yes | Passive stress accumulation per combat turn |
| `stressPerCritHit` | number | yes | Stress on receiving critical hits |
| `supplyEfficiency` | number | yes | Supply cost multiplier (higher = cheaper) |
| `weightRange` | object | yes | Expected weight per slot: `{ torso: [min,max], arm: [min,max], legs: [min,max] }` |
| `require` | string | yes | TechTree unlock condition (empty = always available) |
| `value` | number | yes | Price in creds (0 = not for sale) |
| `notes` | string | yes | Designer notes (not shown to player) |

---

## 8. Stat Extremes Quick Reference

| Record | Frame | Value |
|---|---|---|
| Highest ATK | Leviathan | 8 |
| Highest DEF | KZ Goliath / Type 90 Fortress | 7 (tied) |
| Highest ENR | Wraith | 7 |
| Highest COR | Type 90 Fortress | 6 |
| Best heat generation | Wraith | 0.7× |
| Best heat dissipation | Wraith | 1.6× |
| Best supply efficiency | Sora Courier | 1.3× |
| Lowest stress/turn | Hayabusa Mk.I / Sora Courier | 0.3 (tied) |
| Lowest stress/crit | Type 90 Fortress | 0.3 |
| Highest heat capacity | Type 90 Fortress | 130 |
| Cheapest frame | Sora Courier | 40 creds |
| Most expensive frame | Type 90 Fortress | 350 creds |

---

## 9. Frame × Weapon Synergy Map

| Frame | Best Weapon Loadout | Why |
|---|---|---|
| **Hayabusa** | Taeyang melee (fight) | Light dissipation offsets Taeyang heat. Supply efficiency keeps costs down. |
| **Courier** | Shibata P-7 + Mech Fist | Zero-supply weapons on highest-efficiency frame = infinite grinding. |
| **Wraith** | Taeyang Corona Edge + DW Tagger | Highest ATK × highest melee damage. Tagger marks, Corona kills. |
| **Workhorse** | Shibata Rattler + RC Lobber | Affordable loadout, shoulder mortar for extra damage. |
| **Ironback** | Shibata Enforcer + Shibata Hornet | Tanky frame + suppressive fire = war of attrition. |
| **Sentinel** | AT-15 + AT-300 + Valkyr Salvo | Full Aegis-Tac loadout. Reliable across all slots. |
| **Revenant** | Taeyang SolarFang + Shibata Hellmouth | Max offense: melee BURN+BREACH, flamethrower BURN, shoulder slots free. |
| **Goliath** | Any heavy weapons + Ammo Crate backpack | Needs the backpack supply bonus to offset 0.75× efficiency. |
| **Fortress** | Valletta Zenith + Kuroda Type 77 | Dual shoulder artillery. Best frame for "siege" build. |
| **Leviathan** | Taeyang Sunbreak + Kuroda Judgment | Highest ATK frame + highest damage weapons. Win in 6 turns or overheat. |

---

## 10. Future Expansion Slots

| Gap | Rationale |
|---|---|
| Hayabusa Mk.II / Mk.III | Player-crafted frame upgrades via blueprint system. Stats defined at crafting time. |
| Daewon DW-1 prototype | Narrative event: Daewon's first frame release. Would be Light or Medium with best heatMod in the game. |
| Aegis-Tac Heavy | Police heavy response unit. Would require very high police rep. |
| Kuroda Light | Military scout frame. Rare, exotic, extremely expensive Light frame with above-average DEF for the category. |
| Arena special frames | Tournament-exclusive frames with unique properties. Faction-locked. |
