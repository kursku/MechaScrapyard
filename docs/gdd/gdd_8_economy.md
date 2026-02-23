# 8.0 Economy & Balancing

This section describes the complete economic model of Mecha Scrapyard, covering all currencies, resource flows, progression gates, and the balancing philosophy that ties them together. The economy is designed to support both active and idle gameplay, ensuring the player always has a clear reason to collect, process, and spend.

---

## 8.1 Economic Philosophy

The economy follows three core principles drawn from the best idle/incremental games:

**Every resource has a visible destination.** The moment a player accumulates material without knowing what it's for is the moment they stop playing. Every resource — from raw Scrap to Glory — must point toward a concrete, desirable goal at all times.

**Time is always rewarded.** Whether the player is actively playing or returning after hours offline, progress must be tangible. The Fail Forward philosophy applies to the economy as much as to combat: even suboptimal resource spending yields partial value.

**Depth through chains, not through volume.** Rather than adding dozens of unique resources, depth comes from transformation chains — raw materials become classified materials become refined materials become parts. Each transformation step is a decision point for the player.

---

## 8.2 Currency Overview

The game operates on four distinct currency tiers, each serving a different role in the progression loop.

### Tier 0 — Base Commodities

These are gathered directly through idle tasks and exploration. They are abundant, constantly flowing, and exist to be _spent_, not hoarded.

| Resource        | Source                                            | Primary Sink                               |
| --------------- | ------------------------------------------------- | ------------------------------------------ |
| **Scrap Metal** | Scrapyard collection, exploration, combat salvage | Refinement, repairs, upgrades              |
| **Creds**       | Jobs, selling parts/materials, mission rewards    | Purchasing parts, blueprints, market goods |
| **Energy**      | Passive generation (workshop), upgrades           | Mission deployment cost, task fuel         |

### Tier 1 — Refined Materials

Produced by processing Scrap through the Refinery. Each material is gated behind a narrative milestone (see §8.5). These are the building blocks of crafting and advanced upgrades.

| Resource              | Refined From                    | Primary Use                   | Unlock Trigger                   |
| --------------------- | ------------------------------- | ----------------------------- | -------------------------------- |
| **Nano Infra**        | Scrap (ferrous)                 | General-purpose crafting base | Refinery repair mission          |
| **Nanofiber Fabric**  | Scrap (polymer)                 | Lightweight armor, conduits   | Neon Bazaar specialist contact   |
| **Ceramite Plating**  | Scrap (ferrous) + Nano Infra    | Heavy armor, structural parts | Combat loot → Research unlock    |
| **Fusion Cells**      | Scrap (electronic)              | Energy systems, power cores   | Industrial Wasteland exploration |
| **Quantum Circuitry** | Scrap (electronic) + Nano Infra | Advanced tech, AI components  | Downtown hacking mission         |

### Tier 2 — Progression Currencies

These currencies drive character and squad advancement. They are earned, never bought, and represent the player's growing reputation in New Tokyo.

| Currency       | Source                                                      | Sinks                                                                    |
| -------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Glory**      | Combat (primary), mission completion                        | Rank advancement, repairs, part purchases, maneuvers, cross-class skills |
| **Reputation** | Mission completion, faction interactions, career milestones | Faction catalog access, mission unlocks, market prices                   |
| **Data Chips** | Hacking missions, exploration, research                     | Blueprint unlocks, research tree, story progression                      |

### Tier 3 — Prestige Currency

| Currency           | Source                     | Sinks                                        |
| ------------------ | -------------------------- | -------------------------------------------- |
| **Respect Points** | Prestige reset ("Respect") | Permanent upgrades, meta-progression bonuses |

---

## 8.3 Glory — The Dual XP/Currency System

Glory is the beating heart of the combat economy. Adapted from the Front Mission RPG system, it functions simultaneously as experience points and as a spendable currency, forcing the player to constantly choose between advancement and immediate power.

### 8.3.1 Earning Glory

Glory is earned exclusively through combat and combat-adjacent activities. It cannot be bought, crafted, or traded.

| Action                                             | Glory Earned                      |
| -------------------------------------------------- | --------------------------------- |
| Survive a combat encounter                         | +1                                |
| Destroy an enemy Frame                             | +2 per Frame                      |
| Destroy a drone/vehicle                            | +1                                |
| Complete mission objective                         | +1 to +3 (scales with difficulty) |
| First clear of a mission                           | +3 (one-time bonus)               |
| Tactical bonus (no parts destroyed + Stress < 25%) | +2                                |
| Save an ally in danger (squad missions)            | +1                                |

**Fail Forward:** Even failed missions award partial Glory (typically 1-2), plus salvage materials. The player always walks away with something.

### 8.3.2 Spending Glory

This is the core tension: every point of Glory spent on repairs is a point not spent on rank advancement.

| Use                              | Cost                    | Notes                                            |
| -------------------------------- | ----------------------- | ------------------------------------------------ |
| Advance Rank (Position)          | 4–40 (escalating)       | See Rank Progression table below                 |
| Full Frame restoration (HP)      | 1 Glory                 | Restores HP on all non-destroyed parts           |
| Restore a Disabled part          | 1 Glory                 | Brings destroyed part back to operational        |
| Purchase structural part (new)   | 5 × Integrity levels    | Premium cost for brand-new parts                 |
| Unlock Maneuver (combat ability) | 3–15 Glory              | Scales with rank requirement                     |
| Cross-class skill transition     | 8 Glory + training time | Enables learning abilities from another Position |

### 8.3.3 Rank Progression (Positions)

The player's combat career follows one of four Positions (classes), each with 10 Ranks. Advancing in Rank requires spending Glory — creating a permanent choice between spending on power now vs. investing in long-term growth.

| Rank | Title (Fighter example) | Glory Cost   | Cumulative |
| ---- | ----------------------- | ------------ | ---------- |
| 1    | Recruit                 | 0 (starting) | 0          |
| 2    | Brawler                 | 4            | 4          |
| 3    | Scrapper                | 6            | 10         |
| 4    | Pit Fighter             | 9            | 19         |
| 5    | Veteran                 | 12           | 31         |
| 6    | Enforcer                | 16           | 47         |
| 7    | Champion                | 20           | 67         |
| 8    | Warlord                 | 26           | 93         |
| 9    | Ace                     | 34           | 127        |
| 10   | Legend                  | 40           | 167        |

Each Rank unlocks a new Maneuver (combat ability) specific to the Position. The four Positions are:

- **Fighter:** Close-range specialist. Maneuvers focus on counter-attacks, damage spikes, and stress resilience.
- **Commander:** Tactical leader. Maneuvers focus on squad buffs, targeting efficiency, and morale management.
- **Gunner:** Ranged specialist. Maneuvers focus on called shots, supply efficiency, and heat management.
- **Scout:** Evasion specialist. Maneuvers focus on dodge, critical targeting, and reconnaissance intel.

### 8.3.4 The Glory Tension

A player completing early missions earns roughly 5-8 Glory per successful run. After a difficult fight, they might need 1-2 Glory just to repair. Rank 3 costs 6 Glory. This creates the defining idle-game question: _"Do I repair and run more missions, or do I save up and rank up?"_

The answer changes based on the player's Frame category:

- **Heavy Frame** players spend more Glory on repairs (more integrity levels = more damage to restore) but earn more per mission (tankier, more consistent victories). The tax is higher but the income is steadier.
- **Light Frame** players spend less on repairs but earn less consistently (more volatile outcomes). They hoard Glory faster when things go well, but bad runs can wipe progress.
- **Medium Frame** players sit in the balanced middle, making them ideal for learning the Glory economy before committing to a specialization.

---

## 8.4 Parts as Intermediate Currency

Parts are the most valuable "commodity" in the game's economy. While Scrap and Creds flow freely, **parts are what the player actually needs**. This gives purpose to both the combat loop (which produces salvaged parts) and the crafting loop (which produces custom parts).

### 8.4.1 Part Value Hierarchy

Not all parts are equal. Their value depends on origin, condition, and compatibility:

| Part Quality           | Source                            | Typical Condition | Value Profile                                           |
| ---------------------- | --------------------------------- | ----------------- | ------------------------------------------------------- |
| **Salvaged (Junk)**    | Combat loot, scrapyard finds      | 0.3–0.5           | Disposable. Use once, dismantle for materials.          |
| **Salvaged (Decent)**  | Mid-difficulty combat loot        | 0.5–0.7           | Usable for several combats before needing restoration.  |
| **Purchased (Market)** | Neon Bazaar, faction vendors      | 0.8–1.0           | Reliable but generic. Costs Creds.                      |
| **Crafted (Custom)**   | Player fabrication via blueprints | 1.0               | Best stats, tailored to build. Costs refined materials. |
| **Reverse-Engineered** | Crafted after studying salvage    | 1.0               | Combines high quality with faction-specific bonuses.    |

### 8.4.2 The Part Lifecycle Economy

Every part follows a lifecycle that generates economic activity at each stage:

```text
ACQUIRE → INSTALL → USE (combat) → DEGRADE → DECISION POINT
                                                  ↓
                                    ┌──────────────┼──────────────┐
                                    ↓              ↓              ↓
                               RESTORE         DISMANTLE       REPLACE
                            (materials +     (→ materials +   (→ buy/craft
                             task time)       knowledge)       new part)
```

**Acquisition costs:** Creds (market), Glory (premium), materials + time (crafting), or free (combat loot, but with low condition).

**Maintenance costs:** Restoring a worn part costs Scrap + refined materials + task time. This is cheaper than replacing but only works while condition > 0.

**Disposal value:** Dismantling a part returns a fraction of its materials based on origin. A police-origin part returns Scrap + Ceramite. A civilian part returns Scrap + Nanofiber. This creates a secondary income stream from unwanted parts.

**Knowledge value:** Dismantling also grants origin-specific knowledge points. Every 3 dismantles of the same origin + slot combination unlocks a reverse-engineering blueprint. This is the most valuable "invisible currency" in the game — it converts junk into permanent crafting capability.

### 8.4.3 Part Economy by Game Phase

| Phase                | Part Source                                       | Player Behavior                                                         |
| -------------------- | ------------------------------------------------- | ----------------------------------------------------------------------- |
| **Early (0–1h)**     | Father's old parts (pre-installed, low condition) | Survive. No replacements available. Repair what you have.               |
| **Mid-Early (1–3h)** | Combat salvage + first market purchases           | Frankenstein builds. Mix salvage origins. Dismantle junk for materials. |
| **Mid (3–8h)**       | Faction catalogs + first crafted parts            | Specialize. Choose origin affinity. Start reverse engineering.          |
| **Late (8–15h)**     | Full crafting capability + rare drops             | Optimize. Build purpose-specific loadouts for different mission types.  |
| **Endgame (15h+)**   | Reverse-engineered premium parts                  | Perfect builds. Min-max condition management. Pre-prestige cleanup.     |

---

## 8.5 Resource Unlock Progression

Resources are unlocked through narrative milestones, not menus. Each unlock is a discovery that expands the player's economic capability while advancing the story.

### 8.5.1 Unlock Sequence

| Phase       | Unlock                                            | Trigger                                | What It Enables                          |
| ----------- | ------------------------------------------------- | -------------------------------------- | ---------------------------------------- |
| **Start**   | Scrap Metal, Creds                                | Game begins                            | Basic collection, simple purchases       |
| **Phase 1** | Energy                                            | Workshop restoration                   | Powering tasks, mission deployment       |
| **Phase 2** | Scrap Classification (ferrous/polymer/electronic) | Sorting Station built                  | Directed collection, processing choices  |
| **Phase 2** | Nano Infra                                        | Refinery repair + blueprint purchase   | First refined material, basic crafting   |
| **Phase 2** | Nanofiber Fabric                                  | Neon Bazaar specialist contact         | Lightweight components, conduits         |
| **Phase 3** | Ceramite Plating                                  | Combat loot fragments → Research       | Heavy armor, structural reinforcement    |
| **Phase 3** | Glory                                             | First combat mission (Garage unlocked) | Combat progression, rank advancement     |
| **Phase 3** | Mecha Parts (as items)                            | Garage fully restored                  | Part inventory, installation, loadouts   |
| **Phase 4** | Fusion Cells                                      | Industrial Wasteland exploration       | Power cores, energy weapons              |
| **Phase 4** | Quantum Circuitry                                 | Downtown hacking mission               | AI systems, advanced electronics         |
| **Phase 4** | Data Chips                                        | Research Table + hacking capability    | Blueprint unlocks, research acceleration |
| **Phase 5** | Reverse-Eng. Blueprints                           | Dismantle 3+ parts of same origin/slot | Crafting faction-quality parts           |

### 8.5.2 The Scrap Classification Layer

When the player builds the Sorting Station (Scrapyard Phase 2), raw Scrap stops being a single resource and gains sub-categories. This doesn't add new resources — it adds decision depth to the existing one.

**Before Sorting Station:**

```text
Scrap → Refine → Nano Infra (flat conversion)
```

**After Sorting Station:**

```text
Scrap → Sort → Ferrous Scrap  → Ceramite Plating
                               → Nano Infra (primary path)
             → Polymer Scrap   → Nanofiber Fabric
             → Electronic Scrap → Quantum Circuitry
                                → Fusion Cells
```

Each scavenging zone has a different yield profile:

| Zone                     | Ferrous | Polymer | Electronic | Risk      | Unlock        |
| ------------------------ | ------- | ------- | ---------- | --------- | ------------- |
| Scrapyard (home)         | 60%     | 25%     | 15%        | None      | Start         |
| Industrial Wasteland     | 45%     | 15%     | 40%        | Low       | Exploration   |
| Slums & Black Market     | 20%     | 50%     | 30%        | Medium    | Reputation    |
| Downtown District        | 10%     | 20%     | 70%        | High      | Story mission |
| High-Tech Corporate Zone | 5%      | 30%     | 65%        | Very High | Late-game     |

This creates the Kittens Game-style decision: "I need Ceramite for armor, which needs Ferrous Scrap, so I should scavenge the Industrial Wasteland. But I also need Quantum Circuitry for my next blueprint, which needs Electronic Scrap from Downtown…" The player must balance collection priorities against risk and availability.

---

## 8.6 Economic Loops

The game has three interlocking economic loops, each operating at a different timescale.

### 8.6.1 The Survival Loop (Minutes)

The tightest loop, governing moment-to-moment resource pressure.

```text
Collect Scrap → Refine Materials → Repair/Restore Parts → Deploy to Combat
      ↑                                                          ↓
      └──────────── Salvage from Combat ←────────────────────────┘
```

**Timescale:** 2–5 minutes per cycle.
**Player Question:** "Can I afford to run another mission, or do I need to repair first?"
**Tension:** Energy cost to deploy vs. Glory/loot reward. Parts degradation vs. restoration cost.

### 8.6.2 The Growth Loop (Hours)

The medium loop, governing progression and capability expansion.

```text
Earn Glory → Advance Rank → Unlock Maneuver → Tackle Harder Missions
     ↑                                                ↓
     └──── More Glory + Better Loot + New Zones ←──────┘

Dismantle Parts → Gain Knowledge → Unlock Blueprint → Craft Better Parts
      ↑                                                      ↓
      └────────── Install → Combat → More Salvage ←──────────┘
```

**Timescale:** 1–4 hours per meaningful upgrade.
**Player Question:** "Do I spend Glory on Rank 5 or save it for repairs while I farm the Rogue Labor mission?"
**Tension:** Vertical progression (ranks, maneuvers) vs. horizontal progression (new parts, new blueprints).

### 8.6.3 The Legacy Loop (Sessions / Days)

The widest loop, governing long-term goals and prestige.

```text
Progress Story → Unlock Districts → Access Faction Catalogs → Build Reputation
      ↑                                                            ↓
      └──── Prestige (Respect) → Retain Blueprints → Faster Rebuild ←──┘
```

**Timescale:** Multiple play sessions.
**Player Question:** "Should I prestige now to get Respect Points, or push further into the Corporate Zone first?"
**Tension:** Reset cost vs. permanent meta-upgrades. Blueprint retention means second runs skip the discovery phase entirely.

---

## 8.7 Prestige Integration (Respect System)

The Respect system provides long-term replayability by offering a voluntary reset with permanent benefits.

### 8.7.1 What Resets

- All resources (Scrap, Creds, Energy, refined materials)
- Scrapyard phase (returns to Phase 1)
- Frame and installed parts
- Glory and Rank
- Map exploration and faction reputation
- Story progress (missions reset to uncompleted)

### 8.7.2 What Persists

- **All discovered Blueprints.** This is the most powerful retention. On a second run, the player skips the entire reverse-engineering discovery phase and jumps straight to crafting. A player who dismantled dozens of police parts to learn "Police-Grade Arm Servo" keeps that knowledge forever.
- **Respect Points.** Earned based on total progress at the moment of prestige (Glory earned, missions completed, story chapters cleared, parts crafted).
- **Pilot Attribute bonuses.** Small permanent bonuses to starting attributes from Respect upgrades.
- **Meta-knowledge.** The player knows which zones yield which materials, which builds work, which missions to prioritize. This soft knowledge dramatically accelerates re-runs.

### 8.7.3 Respect Point Sinks

| Upgrade                 | Cost  | Effect                                               |
| ----------------------- | ----- | ---------------------------------------------------- |
| Scrap Magnet I–III      | 1/2/4 | +10/20/30% base Scrap collection rate                |
| Inherited Tools         | 2     | Start with Sorting Station already built             |
| Grandfather's Notes     | 3     | Start with Refinery already built                    |
| Veteran's Instinct      | 3     | +1 starting value to all pilot attributes            |
| Market Connections      | 2     | Neon Bazaar available from game start                |
| Salvage Expertise I–III | 1/2/4 | +10/20/30% material yield from dismantling           |
| Combat Muscle Memory    | 5     | Start at Rank 2 instead of Rank 1                    |
| Father's Legacy         | 8     | Start with a Medium Frame chassis (instead of Light) |
| The Old Network         | 10    | Start with 1 faction reputation at "Trusted" level   |

### 8.7.4 Prestige Pacing

The first prestige should feel natural around the 10–15 hour mark, when the player has:

- Reached Scrapyard Phase 4
- Advanced to Rank 5–6
- Discovered 60–70% of blueprints
- Hit a difficulty wall that feels more like "I need stronger fundamentals" than "I need to grind more"

The second run, with blueprints retained and Respect bonuses active, should reach the same point in roughly 4–6 hours. Each subsequent run compresses further, pushing the player deeper into endgame content (Corporate Zone, City's Nexus, Father's Lab).

---

## 8.8 Balancing Guidelines

### 8.8.1 Resource Flow Targets

These are target rates for a player in the mid-game (Scrapyard Phase 3, Rank 3–4), actively playing:

| Resource          | Earn Rate                              | Primary Sink Rate              | Target Surplus                                  |
| ----------------- | -------------------------------------- | ------------------------------ | ----------------------------------------------- |
| Scrap             | ~120/hour (idle) to ~300/hour (active) | Refinement: ~200/hour          | Slight surplus when idle, deficit when crafting |
| Creds             | ~80/hour (jobs + sales)                | Market purchases: ~60/hour     | Slow accumulation toward big purchases          |
| Energy            | ~15/hour (passive)                     | Mission deployment: ~12/hour   | Just enough for ~1 mission per cycle            |
| Glory             | ~6–10/hour (active combat)             | Repairs: ~2/hour, Rank: banked | Meaningful accumulation toward next Rank        |
| Refined Materials | ~4–6 units/hour                        | Part crafting: ~2–3 units/hour | Builds a stockpile between crafting sessions    |

### 8.8.2 Cost Scaling Philosophy

**Linear for consumables.** Repair costs, mission energy, and material refinement scale linearly. A mid-game repair shouldn't cost exponentially more than an early-game repair.

**Exponential for permanent upgrades.** Rank costs, scrapyard phase costs, and blueprint research costs scale exponentially. This prevents the player from "buying everything" and maintains the Rank tension.

**Flat for exploration.** Accessing new zones costs story progress and reputation, not resources. The player should never feel priced out of discovering new content.

### 8.8.3 The "Never Wasted" Rule

Every action the player takes must produce value. Specific applications:

- **Failed missions** award partial Glory + salvage materials. Never zero reward.
- **Unwanted parts** can always be dismantled for materials + knowledge. There are no truly useless drops.
- **Excess materials** can always be sold for Creds, or stored for post-prestige benefit (via blueprints retained).
- **Idle time** always produces Scrap (base rate) + Energy (passive generation). The player returns to _something_.
- **Overleveled content** still awards Glory (reduced) and provides condition-free farming for parts.

### 8.8.4 Anti-Frustration Measures

- **Scrap never hits zero.** The base collection rate from the Scrapyard is always active. Even with no Energy and no missions available, Scrap trickles in.
- **Glory repairs are always available.** 1 Glory for full HP restoration prevents the player from being stuck in a loop of "too damaged to fight, too poor to repair."
- **Blueprint discovery is deterministic.** 3 dismantles = 1 blueprint. No RNG on the most important progression mechanic.
- **Market prices don't inflate.** Faction catalogs have fixed prices. The player's purchasing power grows over time, never shrinks.

---

## 8.9 Squad Economy (Late-Game)

When the player unlocks squad management (recruiting NPC pilots), three collective resources emerge:

| Attribute            | Source                            | Effect                                                                    |
| -------------------- | --------------------------------- | ------------------------------------------------------------------------- |
| **Squad Reputation** | Collective Glory investment       | Unlocks faction missions, improves base rewards, media attention          |
| **War Funds**        | Collective Creds + Glory pool     | Determines tech tier ceiling, supply distribution across squad            |
| **Connections**      | Story progression + faction trust | Reveals hidden missions, provides pre-mission intel, unlocks rare vendors |

These scale on a die progression (d6 → d8 → d10 → d12) with investment costs of 10/20/35/50 points respectively. High Squad Reputation means better mission availability. High War Funds means access to premium parts for the whole squad. High Connections means the player sees enemy composition before deploying — a massive tactical advantage.

---

## 8.10 Economy Summary — What Flows Where

```text
                    ┌─────────────────────────────────────────────┐
                    │              RESOURCE SOURCES                │
                    │                                             │
                    │  Scrapyard ──→ Scrap (idle)                 │
                    │  Zones ──────→ Classified Scrap (active)    │
                    │  Combat ─────→ Glory + Salvaged Parts       │
                    │  Jobs ───────→ Creds                        │
                    │  Missions ───→ Mixed rewards                │
                    │  Prestige ───→ Respect Points               │
                    └───────────────────┬─────────────────────────┘
                                        ↓
                    ┌─────────────────────────────────────────────┐
                    │            PROCESSING LAYER                  │
                    │                                             │
                    │  Sorting Station: Scrap → Classified        │
                    │  Refinery: Classified → Refined Materials   │
                    │  Workshop: Materials → Crafted Parts        │
                    │  Dismantling: Parts → Materials + Knowledge │
                    └───────────────────┬─────────────────────────┘
                                        ↓
                    ┌─────────────────────────────────────────────┐
                    │              RESOURCE SINKS                  │
                    │                                             │
                    │  Frame Assembly: Parts installed on mecha   │
                    │  Repairs: Scrap + Materials → HP restored   │
                    │  Rank Advancement: Glory → Combat power     │
                    │  Scrapyard Upgrades: Mixed → New capability │
                    │  Market Purchases: Creds → Parts/Blueprints │
                    │  Prestige Upgrades: Respect → Permanents    │
                    │  Squad Investment: Glory/Creds → Collective │
                    └─────────────────────────────────────────────┘
```

The economy is healthy when all three loops (Survival, Growth, Legacy) are active simultaneously — the player is always collecting, always spending, always progressing toward a visible goal. The moment any resource pools without purpose, the economy needs rebalancing.
