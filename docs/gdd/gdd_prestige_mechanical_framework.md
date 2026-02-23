# MECHA SCRAPYARD — Prestige Mechanical Framework
## GDD Addendum — Replaces gdd_8_economy.md §8.7

**Version:** 1.0  
**Status:** Design Lock (mechanical structure)  
**Dependencies:** gdd_8_economy.md, narrative_bible.md, gdd_6_scrapyard_progression.md  
**Supersedes:** §8.7 "Respect" prestige system (old model: voluntary, Rank 8+, Prestige Points)

---

## 1. Core Philosophy

The prestige system in Mecha Scrapyard is **story-gated, mandatory, and accumulative**. It is not an optimization tool the player triggers when efficiency demands it. It is the mechanism through which the narrative advances — the player cannot continue the story without resetting.

**Design pillars:**

1. **Story drives prestige, not math.** The player prestiges because a story mission demands it, not because a spreadsheet says it's optimal.
2. **Each cycle feels different.** Alignment choices (Paragon/Shadow/Pragmatist) change income sources, jobs, gear, factions, and K.I.T.A. behavior.
3. **Two tracks of power.** Glory Pool (unspent) strengthens the pilot. Glory Spent strengthens the world. Both matter.
4. **Compounding, not exponential.** Glory numbers stay in the hundreds-to-low-thousands range. The player can do mental math.
5. **Knowledge persists, materials don't.** The kid remembers everything. The scrapyard resets.

**Reference games:**
- Trimps — Helium as accumulative prestige currency, compounding multiplier
- Realm Grinder — Faction choice per cycle changes playstyle completely
- Hades — Mandatory "death" (prestige) advances the narrative each time
- Idle Ore Incremental — Pool-based threshold boosts with progressive unlock tiers
- NGU Idle — System unlocks via accumulated prestige currency

---

## 2. Cycle Structure

### 2.1 No Fixed Cycle Count

There is no predetermined number of cycles. The game does not track "Cycle 3" as a mechanical concept. Instead, cycles are defined by **story mission gates** — specific missions that, once completed, unlock the prestige option and block further story progression until the player resets.

The player's progression is measured by:
- **Story Layer** — which narrative revelation they've reached (Layer 1–5+)
- **Total Glory Earned (Lifetime)** — cumulative across all cycles
- **Glory Pool** — current unspent balance
- **Alignment History** — which alignments completed in past cycles

### 2.2 Story Mission Gates

Each story layer has a **gate mission**. Completing the gate mission:
1. Triggers the prestige UI ("Glory Reset Available")
2. Prevents further story missions from appearing (soft cap)
3. Allows the player to continue farming freely (no forced reset)
4. Applies diminishing returns on Glory gain after gate (incentivizes resetting)

```
Story Layer 1: Gate mission at ~Phase 3 content
  → Player learns the surface truth about Dad
  → First prestige. Tutorial prestige — guided experience.
  
Story Layer 2: Gate mission at ~Phase 4 content  
  → Player discovers the investigation
  → Glory upgrades make Phase 1-3 faster
  
Story Layer 3: Gate mission at ~Phase 5 content
  → Player uncovers the conspiracy network
  
Story Layer 4: Gate mission at Phase 5 (deeper content)
  → Player finds the alliance (Phantom connection)
  → New missions only available at this layer
  
Story Layer 5: Gate mission at Phase 5 (endgame content)
  → Player finds the truth (Dad's lab, the message)
  → Post-story cycles available for optimization

Layer 6+: No gate. Open-ended prestige for achievement/optimization.
```

**Note:** Gate missions are defined in narrative design (Bloco 2). This document defines only the mechanical trigger behavior.

### 2.3 Phase Access

All phases (1–5) are accessible in every cycle. There is no phase cap per cycle. The gate missions are tied to story layers, not phases. However, Glory upgrades progressively compress early phases:

```
First cycle:   Phase 1-2 takes days → Phase 3 gate mission
Later cycles:  Phase 1-3 takes hours → Phase 4-5 is where real time is spent
```

This compression is entirely driven by Glory Spent upgrades (cheaper infrastructure, starting resources, K.I.T.A. acceleration).

### 2.4 Post-Gate Farming

After completing the gate mission, the player CAN continue playing in the current cycle:
- Resource farming continues normally
- Combat missions available
- Glory gain rate reduces by ~50% (diminishing returns signal)
- No new story content until prestige

This allows players who want to "finish one more thing" before resetting, without penalizing players who reset immediately.

---

## 3. Glory — The Prestige Currency

### 3.1 Earning Glory

Glory is earned through gameplay during a cycle. It is calculated at prestige time as a lump sum based on accomplishments.

**Base Glory formula (structure, not final values):**

```
Base Glory = (phase_bonus) + (mission_bonus) + (combat_bonus) + (economy_bonus)

Where:
  phase_bonus   = points per highest phase reached
  mission_bonus = points per story/side mission completed
  combat_bonus  = points per enemy defeated (diminishing per type)
  economy_bonus = points based on total resources earned (very small coefficient)
```

**Alignment multiplier:**

```
Alignment Multiplier (applied to Base Glory):

  Paragon  (morale ≥ +40):  1.0 + f(idle_time)
    → Rewards time played. The longer the cycle ran, the higher.
    
  Shadow   (morale ≤ -40):  1.0 + f(actions_taken) 
    → Rewards engagement. More clicks/decisions = higher.
    
  Pragmatist (|morale| < 40): 1.0 + f(balanced_metric)
    → Rewards flexibility. Moderate bonus from both.
```

**Consistency bonus:**

```
Stayed in same alignment zone all cycle: ×1.15
Shifted alignment once during cycle:     ×1.05  
Shifted multiple times:                  ×1.00
```

**First prestige bonus:** ×1.5 (generous introduction to the system)

### 3.2 Glory Dual Track

Glory exists in two states: **Pool** (unspent) and **Spent** (invested in upgrades).

```
Lifetime Glory = Pool + Spent

Pool  = Lifetime Glory − Spent
Spent = sum of all upgrade purchases (permanent, never lost)
```

**Spending reduces Pool.** This is the core tension. The player must decide at each prestige how much to invest in world upgrades vs. how much to retain for pilot multipliers.

---

## 4. Glory Pool — Pilot Multiplier System

### 4.1 Threshold-Based Boosts

The Glory Pool provides passive multipliers to pilot-related systems. Boosts unlock at specific pool thresholds and scale with pool size above that threshold.

**Universal Boosts (available to all players):**

```
Threshold │ Boost Unlocked           │ Affected System
──────────┼──────────────────────────┼─────────────────────────
0+        │ XP Gain                  │ Pilot leveling speed
0+        │ Scrap Rate               │ Base scrap collection
──────────┼──────────────────────────┼─────────────────────────
50+       │ Skill Growth             │ All 7 skill categories
──────────┼──────────────────────────┼─────────────────────────
150+      │ Energy Rate              │ Energy regeneration
150+      │ Creds Rate               │ Credit income
──────────┼──────────────────────────┼─────────────────────────
300+      │ Crafting Speed           │ Crafting task duration
300+      │ Reputation Gain          │ Faction rep accumulation
──────────┼──────────────────────────┼─────────────────────────
500+      │ Research Speed           │ Research task duration
500+      │ Hacking Speed            │ Hacking task duration
──────────┼──────────────────────────┼─────────────────────────
1000+     │ Glory Gain               │ Meta-compounding
1000+     │ Prestige Efficiency      │ Less time needed per cycle
──────────┼──────────────────────────┼─────────────────────────
2500+     │ ALL boosts enhanced      │ Bonus tier on everything
```

### 4.2 Scaling Formula

Each boost, once unlocked at its threshold, scales with the total pool:

```
Boost Multiplier = 1.0 + ln(1 + (pool - threshold) × coefficient) × scale_factor
```

- **Below threshold:** boost is locked (shows as 🔒 in UI)
- **At threshold:** boost activates at base value (~1.0×)
- **Above threshold:** boost grows logarithmically (fast at first, diminishing)

The logarithmic curve ensures:
- First 100 Glory above threshold = significant jump
- Next 100 = noticeable but smaller
- Eventually plateaus — incentivizes spending on upgrades instead of hoarding

### 4.3 Alignment-Specific Pool Boosts

These boosts only appear in the pool panel after the player has completed at least one cycle in the corresponding alignment.

```
PARAGON BOOSTS (requires 1+ Paragon cycle in history):
  Pool 200+ → Idle Accumulation Rate
  Pool 400+ → Passive Energy Regeneration  
  Pool 800+ → Community Trust (reputation floor — rep never starts at 0)

SHADOW BOOSTS (requires 1+ Shadow cycle in history):
  Pool 200+ → Active Event Reward Bonus
  Pool 400+ → Burst Income Ceiling
  Pool 800+ → Black Market Access Speed

PRAGMATIST BOOSTS (requires 1+ Pragmatist cycle in history):
  Pool 200+ → Alignment Flexibility (shift cost reduced)
  Pool 400+ → Brokering Margins
  Pool 800+ → Dual Faction Access
```

### 4.4 Veteran Pool Boosts

Require cycles in **multiple** alignments:

```
Pool 500+  AND 2 different alignments played → Adaptability Bonus
Pool 1000+ AND all 3 alignments played      → Legend Multiplier
```

### 4.5 Pool Boost UI

The player sees a dedicated panel showing all boosts:

```
┌─────────────────────────────────────────────────┐
│ GLORY POOL: 470                                 │
│                                                 │
│ PILOT BOOSTS                                    │
│ ✅ XP Gain .................. ×1.95             │
│ ✅ Scrap Rate ............... ×1.71             │
│ ✅ Skill Growth ............. ×1.52             │
│ ✅ Energy Rate .............. ×1.42             │
│ ✅ Creds Rate ............... ×1.35             │
│ ✅ Crafting Speed ........... ×1.12             │
│ ✅ Reputation Gain .......... ×1.09             │
│ 🔒 Research Speed ... Unlocks at 500 (30 away) │
│ 🔒 Hacking Speed .... Unlocks at 500 (30 away) │
│ 🔒 Glory Gain ....... Unlocks at 1000          │
│                                                 │
│ PARAGON BOOSTS (1 cycle completed)              │
│ ✅ Idle Accumulation ........ ×1.18             │
│ ✅ Passive Energy ........... ×1.11             │
│ 🔒 Community Trust .. Unlocks at 800           │
│                                                 │
│ SHADOW BOOSTS                                   │
│ 🔒 Not yet available — complete a Shadow cycle  │
└─────────────────────────────────────────────────┘
```

This panel makes the trade-off visible. The player sees exactly what they gain from keeping Glory in the pool and what they lose by spending.

---

## 5. Glory Spent — World Upgrades

### 5.1 Upgrade Categories

Glory Spent purchases permanent upgrades that improve starting conditions and world state for all future cycles.

**ACCELERATION TREE** — Makes early phases faster

```
Starting Scrap +50         │ Cost: TBD │ Repeatable (escalating)
Starting Creds +25         │ Cost: TBD │ Repeatable (escalating)
Sorting Station cost −20%  │ Cost: TBD │ One-time
Workshop cost −20%         │ Cost: TBD │ One-time
Phase 2 infra cost −15%    │ Cost: TBD │ One-time
Phase 3 infra cost −15%    │ Cost: TBD │ One-time
```

**AUTOMATION TREE** — Enhances idle systems

```
K.I.T.A. starts at level 2   │ Cost: TBD │ One-time
K.I.T.A. starts at level 3   │ Cost: TBD │ One-time (requires above)
Auto-scavenge from minute 1   │ Cost: TBD │ One-time
Furniture unlock speed +10%   │ Cost: TBD │ Repeatable (max 5)
```

**POWER TREE** — Enhances pilot growth

```
Starting stat bonus +1 all    │ Cost: TBD │ One-time
Stat growth rate +10%          │ Cost: TBD │ Repeatable (max 5)
Skill growth rate +10%         │ Cost: TBD │ Repeatable (max 5)
Starting with 1 blueprint      │ Cost: TBD │ One-time
```

**PARAGON TREE** — Requires 1+ Paragon cycle

```
Idle income ×1.1               │ Cost: TBD │ Repeatable (max 5)
Community NPC appears Phase 1  │ Cost: TBD │ One-time
Automation unlocks 1 tier early│ Cost: TBD │ One-time
Passive energy regen +10%      │ Cost: TBD │ Repeatable (max 3)
```

**SHADOW TREE** — Requires 1+ Shadow cycle

```
Active event rewards ×1.2      │ Cost: TBD │ Repeatable (max 5)
Black Market prices −15%       │ Cost: TBD │ One-time
Burst income frequency +10%    │ Cost: TBD │ Repeatable (max 3)
Timed event windows +5 sec     │ Cost: TBD │ One-time
```

**PRAGMATIST TREE** — Requires 1+ Pragmatist cycle

```
Brokering margins +10%         │ Cost: TBD │ Repeatable (max 3)
Alignment shift costs halved   │ Cost: TBD │ One-time
Both faction shops accessible  │ Cost: TBD │ One-time
All income sources +5%         │ Cost: TBD │ Repeatable (max 5)
```

**VETERAN TREE** — Requires multiple alignment cycles

```
"Seen It All"        │ 2+ different alignments │ Starting resources ×2
"True Survivor"      │ 1 of each alignment     │ Special starting event
"Master of None"     │ 5 total cycles          │ Glory gain +15% permanent
"Legend of New Tokyo" │ 3 of each alignment     │ Endgame questline + Dad's full story
```

### 5.2 Upgrade Persistence

All purchased upgrades are **permanent and irrevocable**. They apply to every future cycle. The Glory spent on them is gone from the Pool — reducing the pilot multiplier.

---

## 6. Reset and Persistence Rules

### 6.1 What Resets (returns to starting state)

```
ALL resources          → 0 (scrap, creds, energy, materials, data_chips)
Scrapyard phase        → Phase 1 (Abandoned Beginnings)
All infrastructure     → Nothing built (Sorting Station, Workshop, etc.)
All furniture          → Empty scrapyard (no furniture installed)
Pilot level            → 1
Pilot stats            → Starting values (base + Glory upgrade bonuses)
Pilot skills           → Starting values (base + Glory upgrade bonuses)
All faction reputation → 0 (modified by Glory Pool rep boost + Glory upgrades)
Mecha parts inventory  → Empty (only starter frame)
Frame                  → Hayabusa Mk.I (Dad's original mecha)
Weapons inventory      → Starting weapon only
Personal gear          → Nothing equipped
Morale                 → 0 (neutral)
Mission completion     → All missions reset (can be replayed)
```

### 6.2 What Persists (permanent across all cycles)

```
Glory (lifetime total)       → Accumulated forever
Glory Pool                   → Carries over (minus any spent at prestige)
Glory Spent upgrades         → All purchased upgrades permanent
Alignment history            → Record of each cycle's alignment
Story layer unlocked         → Narrative progress never regresses
Blueprint knowledge          → All discovered blueprints remain KNOWN
                               (but must be crafted again with resources)
Reverse engineering counters → Knowledge of how to dismantle persists
Memory Log                   → All narrative entries persist
Veteran achievements         → Tracked permanently
Cycle count                  → Increments (for veteran tree tracking)
Player name                  → Fixed (chosen once)
```

### 6.3 K.I.T.A. Partial Persistence

K.I.T.A. (android companion) has a unique persistence model:

```
RESETS:
  - K.I.T.A. operational level → base (or Glory upgrade level)
  - K.I.T.A. task assignments → cleared
  - K.I.T.A. physical upgrades → removed

PERSISTS:
  - K.I.T.A. personality development → carries over
  - K.I.T.A. dialogue history → remembered
  - K.I.T.A. relationship with player → maintained
  - K.I.T.A. knowledge of previous cycles → acknowledged in dialogue
```

K.I.T.A. is the only NPC who explicitly remembers previous cycles. She comments on déjà vu, references past events, and becomes a narrative anchor across resets. Her personality evolves permanently — a K.I.T.A. shaped by Paragon choices has different dialogue than one shaped by Shadow choices, even in future cycles.

### 6.4 Blueprint Persistence Detail

```
Blueprints follow the rule: KNOWLEDGE PERSISTS, MATERIALS DON'T.

Cycle 1: Player dismantles 5 KZ arms → learns KZ Arm blueprint.
         Player crafts 1 KZ Arm using materials.
         
PRESTIGE → Materials gone. Crafted arm gone. Parts gone.
           But: "KZ Arm Blueprint: KNOWN" persists.

Cycle 2: Player can craft KZ Arm immediately once they have materials.
         No need to re-dismantle. No need to re-learn.
         The kid REMEMBERS how to build it.
```

This is the single most impactful persistence mechanic. In later cycles, the player skips the entire discovery phase and goes straight to production.

---

## 7. Morale-Alignment System (Approach C — Hybrid)

### 7.1 During the Cycle (Emergent)

Morale moves organically based on player decisions (moral choices, job selection, faction interactions). As morale crosses thresholds, systems unlock:

```
DIRECTION  │ THRESHOLD │ SYSTEM UNLOCKED
───────────┼───────────┼─────────────────────────────
Positive   │ +20       │ Community resources (passive income source)
Positive   │ +40       │ Cooperative jobs (idle-optimized income)
Positive   │ +60       │ K.I.T.A. Full Autonomy (expanded automation)
Positive   │ +80       │ Paragon-exclusive mission chain
───────────┼───────────┼─────────────────────────────
Negative   │ -20       │ Black Market Terminal (timed trade windows)
Negative   │ -40       │ Smuggling jobs (active burst income)
Negative   │ -60       │ Fence Network (sell burst events)
Negative   │ -80       │ Shadow-exclusive mission chain
───────────┼───────────┼─────────────────────────────
Neutral    │ |m| < 30  │ Brokering system (buy from either side)
Neutral    │ sustained │ Pragmatist-exclusive content
```

The player doesn't "select" an alignment. They *become* one through decisions.

### 7.2 At Prestige (Snapshot)

When the player prestiges, their morale at reset time determines the **alignment snapshot** for the cycle:

```
Morale ≥ +40 at prestige  → Cycle recorded as PARAGON
Morale ≤ -40 at prestige  → Cycle recorded as SHADOW
|Morale| < 40 at prestige → Cycle recorded as PRAGMATIST
```

This snapshot is recorded in the **Alignment History** and determines:
- Which alignment-specific Glory trees become available
- Which pool boosts unlock
- Progress toward Veteran achievements

### 7.3 Alignment Impact Summary

```
SYSTEM        │ PARAGON (Idle)          │ SHADOW (Active)         │ PRAGMATIST (Hybrid)
──────────────┼─────────────────────────┼─────────────────────────┼────────────────────────
Income model  │ Steady passive rates    │ Burst events, timed     │ Moderate both
Jobs          │ Legal careers           │ Grey/black market       │ Access to both (weaker)
Furniture     │ Automation-focused      │ Burst-production        │ Flexible options
Personal gear │ Durable, passive buffs  │ Volatile, peak buffs    │ Balanced items
Factions      │ Freeborn, NTPD          │ Syndicate, Exiles       │ Both (limited)
K.I.T.A.      │ Full automation         │ Limited auto, manual    │ Adaptive behavior
Glory formula │ Time-weighted           │ Action-weighted         │ Balanced formula
```

---

## 8. Prestige Flow — Player Experience

### 8.1 First Prestige (Tutorial)

The first prestige is a guided, hand-held experience:

1. Player completes Layer 1 gate mission (~Phase 3)
2. Story event introduces the prestige concept narratively
3. UI shows Glory Summary with explanation tooltips
4. Glory Shop opens with recommended purchases highlighted
5. Player spends (or saves) Glory
6. Confirmation screen: "Everything will reset. Your knowledge remains."
7. Reset executes. Phase 1 begins again.
8. Immediate differences visible: starting resources, K.I.T.A. remembers, new dialogue

### 8.2 Subsequent Prestiges

1. Player completes current layer's gate mission
2. "GLORY RESET AVAILABLE" banner appears (non-intrusive)
3. Player continues farming if desired (diminishing Glory returns)
4. When ready: opens Glory Summary screen
5. Reviews Pool vs Spend trade-off
6. Makes purchases in Glory Shop
7. Confirms prestige
8. Reset. New cycle begins with accumulated advantages.

### 8.3 Glory Summary Screen

```
┌─────────────────────────────────────────────────┐
│ CYCLE COMPLETE                                  │
│                                                 │
│ Story Layer: 2 → 3 (NEW LAYER UNLOCKED)         │
│ Alignment: Shadow (morale: -52)                 │
│ Phase reached: 5                                │
│                                                 │
│ ── GLORY EARNED THIS CYCLE ──                   │
│ Phase bonus ............... 90                   │
│ Mission bonus ............. 45                   │
│ Combat bonus .............. 32                   │
│ Economy bonus ............. 18                   │
│ ─────────────────────────────                   │
│ Subtotal .................. 185                  │
│ × Shadow multiplier ....... ×1.12               │
│ × Consistency bonus ....... ×1.15               │
│ ─────────────────────────────                   │
│ GLORY EARNED: 238                               │
│                                                 │
│ ── POOL STATUS ──                               │
│ Previous Pool: 340                              │
│ + Earned:      238                              │
│ = Available:   578                              │
│                                                 │
│ [View Pool Boosts]  [Open Glory Shop]  [Reset]  │
└─────────────────────────────────────────────────┘
```

---

## 9. Narrative Integration Points

### 9.1 Memory Log

A persistent journal of narrative fragments, unlocked through gameplay. Persists across all cycles. Categories:

- **[BEFORE]** — Flashbacks from life before the scrapyard
- **[SCRAPYARD]** — Key moments in the scrapyard
- **[INVESTIGATION]** — Clues about Dad's disappearance
- **[PEOPLE]** — Relationships and NPC interactions

Each entry is short (2-4 paragraphs), written in first person (kid's voice). New entries appear based on story layer, cycle count, alignment, and specific achievements.

### 9.2 K.I.T.A. as Cycle Anchor

K.I.T.A. is the only character who acknowledges the time loop:
- Cycle 1: Normal introduction
- Cycle 2: "My logs indicate temporal anomaly. Filing under 'weird.'"
- Cycle 3+: References specific events from past cycles
- Her personality evolves based on alignment history

### 9.3 NPC Dialogue Layers

NPCs have dialogue pools that expand with story layers:
- Layer 1 NPCs: Basic interactions
- Layer 3 NPCs: Reference events the kid "shouldn't know yet"
- Layer 5 NPCs: Deep lore, hidden connections, Dad's colleagues

---

## 10. Cross-Reference to Existing Systems

| System | How Prestige Affects It | Document |
|--------|------------------------|----------|
| Scrapyard phases | Reset to Phase 1; Glory upgrades compress early phases | gdd_6_scrapyard_progression.md |
| Economy/resources | All reset to 0; Pool boosts accelerate re-earning | gdd_8_economy.md |
| Combat/Glory earning | Glory earning formula replaces §8.5 rank-based system | combat_design_document.md |
| Parts/frame assembly | Parts reset; blueprint knowledge persists | gdd_3_4_parts_frame_assembly.md |
| Furniture/space | All furniture removed; must rebuild | gdd_furniture_space_system.md |
| Personal gear | All gear removed; alignment-gated items may unlock faster | TBD (personal gear GDD) |
| Morale | Resets to 0; alignment snapshot recorded | resource_catalog_unlock_logic.md |
| K.I.T.A. | Partial persistence (see §6.3) | IMPL_SPEC_03_android_companion.md |
| Skill trees | Reset; Pool boosts accelerate regrowth | IMPL_SPEC_06_deep_skill_trees.md |
| Missions | All reset; new missions available per story layer | gdd_missions_narrative_reference.md |

---

## 11. Open Items (Deferred to Future Blocks)

| Item | Deferred To | Why |
|------|-------------|-----|
| Exact Glory values per phase/mission/combat | Balancing pass | Needs playtesting |
| Pool threshold exact numbers | Balancing pass | Needs playtesting |
| Glory Shop costs | Balancing pass | Needs playtesting |
| Scaling formula coefficients | Balancing pass | Needs playtesting |
| Gate mission definitions | Bloco 2 (Cycle Narrative Outline) | Depends on story design |
| Backstory integration | Bloco 3 (Backstory Bible Update) | Narrative detail |
| Morale threshold exact values | Bloco 4 (Morale-Alignment System) | Depends on job/faction design |
| Personal gear alignment items | Personal Gear GDD | Depends on gear system design |

---

## 12. Design Validation Checklist

Before implementation, verify:

- [ ] A player who never spends Glory still progresses (pool boosts carry them)
- [ ] A player who spends all Glory still progresses (world upgrades carry them)
- [ ] The first prestige feels rewarding, not punishing
- [ ] Phase 1-2 compression is noticeable by cycle 3
- [ ] Each alignment feels mechanically distinct (not just cosmetic)
- [ ] The Pragmatist path is viable and has exclusive content
- [ ] K.I.T.A. dialogue acknowledges the loop without breaking immersion
- [ ] Blueprint persistence eliminates the worst repetition (re-discovery grind)
- [ ] Memory Log grows meaningfully across 5+ cycles
- [ ] Pool threshold 1000 (Glory Gain boost) is reachable by cycle 5-7
- [ ] The "Legend of New Tokyo" veteran achievement is aspirational but achievable

---

*Document version 1.0 — February 2026*
*Replaces: gdd_8_economy.md §8.7 "Respect" system*
*Next: Bloco 2 — Cycle Narrative Outline (story gates definition)*
