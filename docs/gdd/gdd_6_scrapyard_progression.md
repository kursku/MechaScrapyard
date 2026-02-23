# 6.0 The Player's Base: The Scrapyard

The Scrapyard is the player's home, workshop, factory, and fortress. Inherited from Grandpa, it begins as a ruin and evolves into the most important location in New Tokyo — not because of its size, but because of what the player builds inside it.

Every mechanical system in the game is gated behind a Scrapyard structure. The player doesn't read a tutorial that says "now you can refine materials." Instead, they repair the Refinery, and refinement becomes available. The Scrapyard's physical evolution *is* the player's progression — visible, tangible, and narratively grounded.

---

## 6.1 Design Philosophy

**The Scrapyard as progressive disclosure engine.** New systems are never menu-presented. They are discovered through building, repairing, and exploring the Scrapyard itself. The player at minute 0 sees a junkyard with one working bench. The player at hour 10 sees a buzzing operations hub. The transformation is gradual, deliberate, and always tied to a narrative beat.

**Every structure serves a system.** No cosmetic buildings. Every structure the player constructs unlocks or enhances a core gameplay loop. If a structure doesn't open a new verb for the player ("now I can refine," "now I can dismantle," "now I can research"), it doesn't exist.

**Visual progression = emotional progression.** The Scrapyard's state reflects the story. Phase 1 is abandonment and grief. Phase 3 is hope and momentum. Phase 5 is legacy — the player has surpassed both Grandpa and Dad.

---

## 6.2 Structure Catalog

Before detailing each phase, here is the complete catalog of Scrapyard structures and the systems they gate:

| Structure | Phase | System Unlocked | GDD Reference |
|-----------|-------|----------------|---------------|
| Grandpa's Workshop | 1 (start) | Basic tasks, manual scrap collection, simple repairs | §3.1 Core Loop |
| Scrap Piles | 1 (start) | "Scavenge Scrap" perpetual task | §3.1 Core Loop |
| Sorting Station | 2 | Scrap classification (ferrous/polymer/electronic), improved collection rate, "Search for Parts" task | §8.2 Resource Chains |
| Workshop Upgrade (Lvl 2) | 2 | Energy capacity increase, Delivery Run task, zone exploration tasks, prerequisite for Refinery & Garage | §3.1 Core Loop |
| Scrap Compressor (repeatable ×3) | 2+ | Scrap storage capacity increase (+40 per level, scaling cost) | §8.8 Anti-patterns (storage caps) |
| Refinery | 3 | Material refinement (Scrap → Nano Infra, classified scrap → advanced materials), MARKET tab (buy Blueprints), REFINERY tab | §8.2 Resource Chains |
| Garage | 3 | Frame storage, part installation/swapping, loadout configuration (weapons + stances + targeting), story event: discover Dad's mecha | §3.4 Parts & Frame Assembly |
| Research Bench | 3 | Research tree access, blueprint study, Ceramite research (after Armor Fragments), Fabrication & Research skill trees | §4.3 Skill Trees |
| Hangar (Partial) | 3 | Multi-part storage, visual preview of Frame assembly, prerequisite for Hangar Operational | §3.4.2 Parts as Inventory |
| Hangar (Operational) | 4 | Medium Frame assembly, advanced weapon fabrication, part condition restoration task, NPC mechanic hire | §3.4 Frame Categories |
| Cybernetic Bench | 4 | Hacking/Cybernetics skill tree, pilot augmentation, neural interface upgrades | §4.3 Skill Trees |
| Dismantling Bay | 4 | Dedicated part dismantling (faster than Refinery), reverse engineering knowledge tracking, knowledge UI panel | §8.3 Blueprint Economy |
| AI Workshop | 5 | Automated crafting queues (idle fabrication), recipe optimization, passive resource conversion | §8.2 Layer 3 |
| Massive Hangar | 5 | Heavy Frame assembly, multiple Frame storage, squad Frame management | §3.4.1 Heavy Category |
| Dad's Secret Lab | 5 | Final story arc trigger, prototype Frame blueprint, endgame research, connection to City's Nexus | §7.1 Main Quest |

---

## 6.3 Phase Progression

### Phase 1: Abandoned Beginnings

**Condition:** Available from game start.

**Atmosphere:** Dust, rust, and broken tools. The power flickers. Grandpa is here, but he's old and the place is falling apart. This is rock bottom — and the player can only go up.

**Structures Available:**

| Structure | Function | Mechanical Impact |
|-----------|----------|------------------|
| **Grandpa's Workshop** | Basic repairs, simple item crafting | Enables: "Odd Jobs" task (earn Creds), basic repair of found items |
| **Scrap Piles** | Manual scrap collection | Enables: "Scavenge Scrap" perpetual task (the game's first verb) |

**Resources Visible:** Scrap Metal, Energy (regenerating), Creds (from jobs).

**Player Verbs:** Scavenge, Work, Wait.

**Narrative Beats:**
- Grandpa's dialogue introduces the world: the scrapyard, Dad's disappearance, the confiscation.
- "I found something in the back pile" — first hint of the locked Garage.
- Objective tracker shows: "Collect 30 Scrap" → "Earn 15 Creds" → "Build the Sorting Station."

**What the player learns:** The core idle loop. Start a task, wait (or do something else), collect reward. Energy gates activity. Scrap and Creds are the foundation of everything.

**Advancement Trigger:** Build the Sorting Station (30 Scrap + 15 Creds).

---

### Phase 2: Functional Outpost

**Condition:** Unlocked after building the Sorting Station.

**Atmosphere:** Lights work. Machines sputter to life. The place still looks rough, but there's a sense of momentum. Grandpa starts sharing stories about Dad — small fragments that build curiosity.

**New Structures:**

| Structure | Cost | Function | Mechanical Impact |
|-----------|------|----------|------------------|
| **Sorting Station** | 30 Scrap, 15 Creds | Sort and classify incoming scrap | Enables: scrap classification (ferrous/polymer/electronic subtypes), +0.1 scrap/s passive rate, unlocks "Search for Parts" task |
| **Workshop Upgrade** | 60 Scrap, 40 Creds | Restore workshop to full operation | Enables: +20 max Energy, +0.1 Energy regen, +100 max Creds, unlocks Delivery Run + Neon Bazaar exploration + Refinery + Garage prerequisites |
| **Scrap Compressor** | 50 Scrap, 30 Creds (×1.5 scaling) | Increase scrap storage | +40 Scrap max per level (repeatable ×3) |

**New Resources Visible:** Classified scrap subtypes appear in the resource bar after Sorting Station is built (ferrous, polymer, electronic — shown as sub-indicators under Scrap Metal).

**New Tasks Available:**
- "Search for Parts" (deeper scrapyard scavenging, better scrap rate + occasional Creds)
- "Delivery Run" (after Workshop Upgrade — better Creds income)
- "Search Neon Bazaar" (after Workshop Upgrade — exploration with 35% chance to find Nanofiber Loom blueprint)

**Player Verbs (new):** Classify, Explore, Deliver.

**Narrative Beats:**
- Workshop Upgrade triggers Grandpa memory: "Your dad used to work right here. He was building something... I never understood what."
- Sorting Station completion: "Order from chaos. Grandpa would approve."
- First Delivery Run introduces a contact NPC who hints at the wider world.

**What the player learns:** Resources have subtypes. Exploration yields rare discoveries (blueprints). The world outside the scrapyard has its own economy.

**Advancement Trigger:** Build the Refinery (100 Scrap + 60 Creds) OR Restore the Garage (80 Scrap + 50 Creds). Both require Workshop Upgrade. The player can pursue them in any order — this is the game's first meaningful branching decision.

**Design Note:** Refinery-first teaches crafting and materials. Garage-first reveals the Frame and opens combat. Neither path blocks the other — both are needed for Phase 3 completion. But the *order* creates different early-game experiences that players can compare in community discussions.

---

### Phase 3: Restored Hub

**Condition:** Unlocked after building both the Refinery AND restoring the Garage. The main generator is restored as part of the Garage quest (narrative prerequisite).

**Atmosphere:** The Scrapyard hums with energy. Forges glow. The Garage doors are open and Dad's mecha stands inside — rusted, broken, waiting. This is where the game shifts from "survival idle" to "mecha RPG."

**New Structures:**

| Structure | Cost | Function | Mechanical Impact |
|-----------|------|----------|------------------|
| **Refinery** | 100 Scrap, 60 Creds | Process raw/classified scrap into refined materials | Enables: REFINERY tab, MARKET tab (buy blueprints), material refinement tasks, Nano Infra production |
| **Garage** | 80 Scrap, 50 Creds | Frame storage, part management, loadout config | Enables: GARAGE tab, Frame part viewing/swapping, weapon equipping, stance/targeting selection, Glory resource visibility. Story event: discover Dad's Light Frame (Hayabusa Mk.I) |
| **Research Bench** | 120 Scrap, 30 Creds, 5 Nano Infra | Research tree access | Enables: RESEARCH tab, blueprint study, Ceramite research (once Armor Fragments are found), Fabrication & Research skill trees |
| **Hangar (Partial)** | 150 Scrap, 50 Creds | Expanded storage area | Enables: multi-part inventory storage (up to 20 parts), visual assembly preview, reveals potential for larger Frames |

**New Resources Visible:** Nano Infra (first refined material), Glory (appears after first combat), Mecha Parts (combat loot), Data Chips (after Research Bench).

**Major Unlock — Combat:**
Restoring the Garage triggers the discovery of Dad's Frame and the game's first combat mission ("Rogue Drone Patrol"). From this point forward, the combat loop is active: select mission → configure loadout (stance, targeting, weapons) → auto-resolve combat → earn Glory + loot → repair → repeat.

**Major Unlock — Crafting Chain:**
With both Refinery and Research Bench, the full material chain opens:
```
Scrap → Sorting Station → Classified Scrap → Refinery + Blueprint → Refined Material
                                                                        ↓
                                                    Research Bench → Study Blueprint → New Recipe
```

**New Tasks Available:**
- Refine: Nano Infra (15 Scrap → 1 Nano Infra)
- Refine: Armor Plating (20 Ferrous Scrap + 5 Nano Infra → 1 Ceramite) — requires blueprint + research
- Refine: Nanofiber Fabric (15 Polymer Scrap + 3 Nano Infra → 1 Nanofiber) — requires blueprint from Bazaar
- Repair Frame (3 Parts + 10 Scrap → restore HP on all operational parts)
- Combat missions (Rogue Drone Patrol, then harder missions as skill/glory progress)

**Player Verbs (new):** Refine, Research, Fight, Repair, Configure (loadout).

**Narrative Beats:**
- Garage discovery: "Inside the garage you find it — your father's first mecha. Rusted, broken... but repairable."
- First combat victory: Grandpa watches the log feed. "You fight like him. That's not a compliment — he was reckless."
- Research Bench built: "Dad's notes are scattered everywhere. Most are encrypted, but some schematics are readable."
- Story hooks branch: invitation to the Arena (combat path), corporate scout approaches (corporate path), data trail leads to the Slums (investigation path).

**What the player learns:** Combat is configuration, not reaction. Choosing the right stance, targeting, and loadout before a fight matters more than anything during the fight. Materials have purpose — they become parts and weapons. The scrapyard is becoming something real.

**Advancement Trigger:** Progress in any major mission line (Arena, Corporate, or Slums investigation). Reaching combat skill level 2 or spending 15+ Glory signals readiness for Phase 4.

---

### Phase 4: Advanced Production

**Condition:** Unlocked after progressing in a major mission line AND upgrading the Hangar to Operational.

**Atmosphere:** The Scrapyard is now a known location. Faction NPCs visit. A hired mechanic NPC manages background tasks. Enemies occasionally probe the perimeter (defense events). The player is no longer a scrapyard kid — they're a small-time operator with a reputation.

**New Structures:**

| Structure | Cost | Function | Mechanical Impact |
|-----------|------|----------|------------------|
| **Hangar (Operational)** | 300 Scrap, 100 Creds, 15 Nano Infra, 10 Ceramite | Full assembly hangar | Enables: Medium Frame assembly (if blueprint acquired), advanced weapon crafting, part condition restoration task ("Restore Part Condition": 15 Scrap + 2 Nano Infra, 20s), NPC mechanic hire (passive repair) |
| **Cybernetic Bench** | 200 Scrap, 80 Creds, 10 Nano Infra, 5 Quantum Circuitry | Pilot augmentation station | Enables: Hacking & Cybernetics skill tree, pilot neural upgrades, interface efficiency boosts |
| **Dismantling Bay** | 150 Scrap, 60 Creds, 8 Nano Infra | Dedicated dismantling facility | Enables: faster part dismantling (8s vs 12s at Refinery), reverse engineering knowledge tracking with UI panel showing progress per origin/slot, knowledge threshold notifications |

**Critical System Unlock — Parts Lifecycle:**
Phase 4 is where the full parts economy activates. The player now has:
1. **Acquisition** — Combat loot + market + early crafting
2. **Installation** — Garage loadout (from Phase 3)
3. **Degradation** — Condition loss per combat (visible since Phase 3, now manageable)
4. **Restoration** — "Restore Part Condition" task at Operational Hangar
5. **Dismantling** — Dedicated bay for material recovery + knowledge accumulation
6. **Reverse Engineering** — Knowledge counters track toward blueprint unlocks

The idle maintenance loop is now fully operational: fight → parts degrade → restore or dismantle → materials feed crafting → better parts → harder fights.

**Critical System Unlock — Frame Categories:**
The Operational Hangar enables Medium Frame assembly. The player can build or acquire their first Medium chassis, gaining access to shoulder weapon mounts and the balanced stat profile. This is typically the player's first major power spike — moving from Dad's battered Light Frame to a purpose-built Medium.

**New Tasks Available:**
- Restore Part Condition (deep maintenance on worn parts)
- Dismantle Part (at Dismantling Bay — faster, with knowledge tracking)
- Fabricate Part (if blueprint owned — uses refined materials)
- Advanced combat missions (Corporate Incursion difficulty and above)
- Faction-specific missions tied to career choice

**Player Verbs (new):** Restore, Dismantle, Fabricate (parts), Augment (pilot).

**Narrative Beats:**
- "Steel Legacy" mission — discover Dad's encrypted diary in a hidden compartment during Hangar renovation.
- Dismantling Bay construction triggers Grandpa: "I never could figure out how those police rigs worked. But you... you're taking them apart like it's nothing."
- First reverse-engineering unlock: "Knowledge gained. You now understand how [police/military/etc] builds their [arms/torso/legs]. Blueprint unlocked."
- Faction reputation milestones: visitors start arriving at the Scrapyard — contacts, clients, rivals.

**What the player learns:** Parts are investments with lifecycles, not permanent equipment. The scrapyard isn't just where you store things — it's where you *learn*. Knowledge compounds over time. Every part dismantled is a step toward mastery.

**Advancement Trigger:** Progress in "Steel Legacy" mission (Dad's diary). Reach combat skill level 4+. Accumulate 60+ total Glory.

---

### Phase 5: Legendary Legacy

**Condition:** Final stage. Unlocked after advancing in "Steel Legacy" and meeting story prerequisites.

**Atmosphere:** A fusion of past and future. Grandpa's rustic workshop sits beside an AI-controlled fabrication line. Dad's Light Frame — now fully restored and upgraded — shares the Massive Hangar with military-grade machines. The Scrapyard has become a symbol: either a resistance headquarters (high morality) or a corporate-aligned war factory (low morality).

**New Structures:**

| Structure | Cost | Function | Mechanical Impact |
|-----------|------|----------|------------------|
| **AI Workshop** | 500 Scrap, 200 Creds, 20 Nano Infra, 15 Nanofiber, 10 Quantum Circuitry | Automated fabrication | Enables: crafting queue (set recipes to loop idle), recipe optimization (reduced material costs with repetition), passive resource conversion (auto-refine classified scrap), maximum idle efficiency |
| **Massive Hangar** | 800 Scrap, 300 Creds, 25 Ceramite, 15 Fusion Cells | Heavy Frame capacity | Enables: Heavy Frame assembly, multiple Frame storage (up to 3 active Frames), squad Frame management (assign Frames to NPC squad members) |
| **Dad's Secret Lab** | Story unlock (no resource cost — discovered, not built) | Hidden basement laboratory | Enables: final story arc, prototype Frame blueprint ("Phantom" — a unique custom Frame with narrative significance), endgame research projects, direct connection to City's Nexus mission chain |

**Critical System Unlock — Automation:**
The AI Workshop transforms the idle game. Before this, the player manually queues each crafting task. After this, they configure recipes that repeat automatically while offline. Refined materials accumulate, parts fabricate, condition restores — all running in the background. This is the payoff for every system the player has built: the scrapyard runs itself.

**Critical System Unlock — Heavy Frames & Squads:**
The Massive Hangar enables Heavy Frame assembly and multi-Frame management. Combined with the squad system (recruiting NPC pilots), the player now fields a team of up to 4 mechas. Each squad member can be assigned a Frame with its own loadout. The economy scales to support this: more Frames = more maintenance, more Glory spent on squad advancement, more parts needed.

**Critical System Unlock — Endgame Narrative:**
Dad's Secret Lab is not built — it's *discovered*, hidden beneath the original Workshop foundation. Inside, the player finds Dad's real project: not the patrol Frame in the Garage, but something far more ambitious. This discovery connects the Scrapyard directly to the City's Nexus and the final mission chain. The lab contains the last blueprints the player will ever need — but understanding them requires everything they've learned.

**Player Verbs (new):** Automate, Command (squad), Discover (final story).

**Narrative Beats:**
- AI Workshop completion: "The machines talk to each other now. Grandpa watches them work, says nothing for a long time, then: 'He would have loved this.'"
- Massive Hangar opening: "The neighbors stare. The local gangs keep their distance. The corporations send another scout. You are no longer invisible."
- Dad's Secret Lab discovery: "Beneath the workshop floor, behind a biometric lock that responds to your DNA. He built this for you. He knew you'd come looking."
- Morality fork visualization: the Scrapyard's appearance changes based on morality score. High morality: community garden, refugee shelter wing, open gates. Low morality: fortified walls, corporate logos, armed drones on patrol.

**What the player learns:** Mastery isn't about doing more — it's about building systems that do it for you. The Scrapyard is the player's greatest creation, not any individual Frame or weapon. And Dad's legacy isn't the mecha he built — it's the knowledge he left behind.

---

## 6.4 Progression Timeline

Expected pacing for a first playthrough (active play, not pure idle):

| Phase | Estimated Time | Key Milestone | Glory Range |
|-------|---------------|--------------|-------------|
| **Phase 1** | Minutes 0–15 | First Scavenge cycle, first Cred earned | 0 |
| **Phase 2** | Minutes 15–60 | Sorting Station + Workshop Upgrade, first Bazaar exploration | 0 |
| **Phase 3** | Hours 1–3 | Garage opened, Dad's Frame found, first combat, first refinement | 0–15 |
| **Phase 4** | Hours 3–8 | Medium Frame built, parts lifecycle active, faction reputation building | 15–60 |
| **Phase 5** | Hours 8–12+ | AI automation, Heavy Frame, Dad's Lab discovered, endgame begins | 60–120+ |

**Prestige (Respect) impact:** On subsequent runs, Prestige upgrades can skip phases. "Grandpa's Legacy" (15 PP) starts the player at Phase 2. Retained blueprints mean Phase 3's crafting chain activates immediately upon building the Refinery. A well-optimized Prestige run can reach Phase 4 in under 2 hours.

---

## 6.5 Structure Dependency Graph

```
Phase 1 (Start)
  │
  ├─ Grandpa's Workshop ──────────────────────────────┐
  │                                                     │
  └─ Scrap Piles                                        │
       │                                                │
       ▼                                                │
  Sorting Station ─────────────────┐                    │
       │                           │                    │
       ▼                           ▼                    │
  Workshop Upgrade          Scrap Compressor (×3)       │
       │                                                │
       ├──────────────┬─────────────────┐               │
       ▼              ▼                 ▼               │
  Refinery         Garage          (Zone Exploration)   │
       │              │                                 │
       │              └── Story: Dad's Frame found      │
       │                  └── COMBAT unlocked           │
       ▼                                                │
  Research Bench ◄──────────────────────────────────────┘
       │
       ▼
  Hangar (Partial)
       │
       ├──────────────┬────────────────────┐
       ▼              ▼                    ▼
  Hangar          Cybernetic           Dismantling
  (Operational)   Bench                Bay
       │              │                    │
       │              └── Hacking tree     └── Reverse Engineering
       │
       ├──────────────┬────────────────────┐
       ▼              ▼                    ▼
  AI Workshop    Massive Hangar     Dad's Secret Lab
       │              │                    │
       │              └── Squad system     └── Final story arc
       └── Idle automation
```

---

## 6.6 Repeatable Upgrades

Some structures have repeatable upgrades that provide incremental benefits with scaling costs:

| Upgrade | Base Cost | Scale | Max Level | Effect per Level |
|---------|-----------|-------|-----------|-----------------|
| Scrap Compressor | 50 Scrap, 30 Creds | ×1.5 | 3 | +40 Scrap max |
| Energy Capacitor | 40 Scrap, 25 Creds | ×1.4 | 5 | +10 max Energy |
| Storage Rack | 80 Scrap, 20 Creds | ×1.3 | 5 | +5 part inventory slots |
| Refinery Efficiency | 60 Scrap, 40 Creds, 5 Nano Infra | ×1.6 | 3 | -10% refine time |
| Workshop Tools | 50 Scrap, 30 Creds | ×1.5 | 3 | -10% repair/restore time |
| Perimeter Fence | 100 Scrap, 50 Creds | ×2.0 | 2 | Reduces random enemy probe events |

Repeatable upgrades follow the formula: `actualCost = baseCost × (scale ^ owned)`. They provide the "always something to buy" pressure that idle games need between major milestones.

---

## 6.7 Morality Impact on the Scrapyard

The Scrapyard's visual identity and available options shift based on the player's morality score at Phase 4+:

### High Morality (Idealist) — "The Haven"

- Community members visit for free repairs (generates reputation + small Glory passive)
- Refugee housing wing provides +1 task slot (extra worker)
- Open gates: more vendor visits, better market prices
- Aesthetic: plants growing through metal, children's drawings on walls, warm lighting
- Phase 5 name: "The People's Forge"

### Low Morality (Pragmatic) — "The Fortress"

- Corporate contracts provide steady Cred income (passive)
- Fortified perimeter eliminates random enemy probes entirely
- Black market access directly from Scrapyard (no travel needed)
- Aesthetic: reinforced walls, surveillance cameras, corporate insignias, cold lighting
- Phase 5 name: "Iron Crown Industries"

### Neutral Morality — "The Workshop"

- Balanced visitor mix (some community, some corporate)
- No extreme bonuses but no restrictions either
- Most flexible faction access
- Aesthetic: functional, practical, Grandpa's spirit preserved
- Phase 5 name: "The Old Man's Yard"

These are not permanent locks — the morality meter can shift as the player makes different choices. The Scrapyard adapts gradually, not suddenly.

---

## 6.8 Implementation Notes

The Scrapyard progression maps directly to the Arcanum engine's existing systems:

- **Phases** = sequential upgrades with `require` conditions (each phase gates on the previous)
- **Structures** = `furniture` items with `slot` assignments (Workshop = slot "workshop", Garage = slot "garage", etc.)
- **Repeatable upgrades** = standard upgrades with `max > 1` and `costScale`
- **Phase transitions** = narrative events triggered by `require` conditions combining upgrade ownership + quest completion + resource thresholds
- **Morality visuals** = conditional UI rendering based on `g.moralidade` value ranges

The `homes.json` pattern is adapted: instead of interchangeable homes, the Scrapyard is a single persistent home that evolves. Each phase is an upgrade that increases `space.max`, unlocking slots for new structures. Phase 1 has 3 slots. Phase 5 has 15+.
