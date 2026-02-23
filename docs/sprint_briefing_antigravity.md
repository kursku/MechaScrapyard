# MECHA SCRAPYARD — Sprint Briefing for Antigravity

**Date:** February 2026
**From:** Design (Claude, via GDD sessions)
**To:** Implementation (Antigravity)
**Subject:** Priority correction — what to build next and why

---

## THE PROBLEM

The `combat_implementation_plan.md` Phase 3 (Heat thresholds, passive Stress recovery, dynamic Heat dissipation) is technically correct as the next item in the combat checklist. But the combat checklist was written assuming the idle loop and narrative systems were already in place. **They are not.**

If a player opens the game today, they experience:
- A terminal UI where they scavenge scrap and do odd jobs ✓
- Building a few upgrades (Sorting Station, Workshop, Refinery, Garage) ✓
- A combat system against drones and security units ✓

What they DON'T experience:
- Classified scrap types appearing when Sorting Station is built
- New resources unlocking visually when structures are constructed
- Any narrative context (no Grandpa dialogue, no tutorial, no milestone reactions)
- The Garage discovery as a dramatic story beat leading into combat
- Progressive disclosure — the sense that the world is expanding as they build

**The game has mechanics but no experience.** Adding Heat shutdown thresholds polishes a combat system that players reach without context or emotional investment.

---

## REVISED PRIORITY ORDER

```
PRIORITY 1 ── Resource System Alignment (data work, ~2-4 hours)
    │          Make resources.json match the GDD resource catalog
    │
    ▼
PRIORITY 2 ── Scrapyard Phase 1→2 Complete (data + small logic, ~3-5 hours)
    │          Classified scrap, progressive disclosure, structure → resource unlock chain
    │
    ▼
PRIORITY 3 ── Minimal Narrative System (~4-6 hours)
    │          DialogueModal, event triggers on milestones, Grandpa's voice
    │
    ▼
PRIORITY 4 ── Garage as Combat Gate (narrative + existing combat, ~2-3 hours)
    │          Story beat when Garage is built, combat framed narratively
    │
    ▼
PRIORITY 5 ── Combat Phase 3 (the original plan, ~2-3 hours)
               Heat thresholds, passive Stress recovery, dynamic dissipation
```

Each priority delivers playable value independently. Priority 1-2 together create a 30-minute idle game. Priority 3-4 transform it into a game with a story. Priority 5 refines combat that now has context.

---

## PRIORITY 1: Resource System Alignment

### Goal
Make `data/mecha/resources.json` match the canonical resource catalog so that progressive disclosure works.

### Reference Document
📎 `resource_catalog_unlock_logic.md` — Contains the complete JSON for every resource.

### What to Do

**Step 1.1 — Update `resources.json` with new resources**

The current `resources.json` has the basics (scrap, creds, energy, nano_infra, ceramite, nanofiber) plus some combat resources added during Sprint 2. It's missing:

| Resource ID | Group | Unlock Condition | Why It Matters |
|------------|-------|-----------------|----------------|
| `ferrous_scrap` | classified | `g.triagem>0` | Scrap classification — core Phase 2 mechanic |
| `polymer_scrap` | classified | `g.triagem>0` | Scrap classification |
| `electronic_scrap` | classified | `g.triagem>0` | Scrap classification |
| `fusion_cells` | refined | `g.quest_industrial_wasteland>0` | Late-game refined material |
| `quantum_circuits` | refined | `g.quest_hack_downtown>0` | Late-game refined material |
| `supply` | combat | `g.garagem>0` | Ammo system for combat (auto-reload) |
| `rep_police` | faction | `g.quest_police_contact>0` | Multi-faction reputation |
| `rep_corporate` | faction | `g.quest_corporate_contact>0` | Multi-faction reputation |
| `rep_underground` | faction | `g.quest_underground_contact>0` | Multi-faction reputation |
| `rep_exile` | faction | `g.quest_exile_contact>0` | Multi-faction reputation |
| `moralidade` | meta | always (hidden until first choice) | Morality system |
| `prestige_points` | meta | `g.prestige_available>0` | Prestige currency |

Copy the JSON definitions directly from `resource_catalog_unlock_logic.md`. Each resource has the complete entry ready to paste.

**Step 1.2 — Add `hideWhen` support (optional, small)**

The `scrap` resource should become hidden in the UI after the Sorting Station is built (`g.triagem>0`). The resource catalog defines a `hideWhen` field for this.

Implementation options (choose the simplest):
- **Option A (recommended):** In the resource bar renderer, add a `v-if` check: if the resource has a `hideWhen` string, evaluate it against game state. If true, don't render the bar.
- **Option B (no engine change):** After buying `triagem`, set `scrap.sortOrder = 999` to push it to the bottom of the list. Cosmetic but functional.

**Step 1.3 — Verify resource group colors in UI**

The resource bar currently color-codes by group. Verify these mappings match:

```
player   → #0af (cyan)
base     → #0fa (green)
currency → #ff0 (yellow)
classified → #6d8 (muted green)  ← NEW GROUP
refined  → #f0a (pink)
combat   → #f5c (gold/amber)
research → #bf8 (lime)
faction  → #8af (blue)           ← NEW GROUP
meta     → #aaa (grey)           ← NEW GROUP
```

### Verification Criteria
- [ ] All 22 resources exist in `resources.json`
- [ ] Classified scrap (3 types) unlocks when Sorting Station is built
- [ ] Raw scrap hides (or sorts to bottom) when Sorting Station is built
- [ ] New group colors render correctly in UI
- [ ] Resources that should be locked at game start ARE locked

---

## PRIORITY 2: Scrapyard Phase 1→2 Complete

### Goal
The player's first 15-60 minutes should feel like a complete game loop: scavenge → build → unlock new resources → explore → build more → discover crafting.

### Reference Documents
📎 `gdd_6_scrapyard_progression.md` §6.3 (Phase 1 and Phase 2)
📎 `resource_catalog_unlock_logic.md` (unlock conditions)
📎 `gdd_8_economy.md` §8.2 (resource chains)

### What to Do

**Step 2.1 — Scavenge tasks produce classified scrap after Sorting Station**

Currently, "Scavenge Scrap" always produces generic `scrap`. After the Sorting Station is built, scavenging should produce classified scrap instead.

**Approach A (new tasks):** Create 3 zone-specific scavenge tasks that unlock with Sorting Station:

```json
{
  "id": "scavenge_industrial",
  "name": "Scavenge Industrial Zone",
  "desc": "Dig through factory ruins. Heavy on metals.",
  "flavor": "Rust and rebar. The bones of old industry.",
  "locked": true,
  "require": "g.triagem>0",
  "perpetual": true,
  "run": { "energy": 0.2 },
  "effect": { "ferrous_scrap": 0.5, "polymer_scrap": 0.1, "electronic_scrap": 0.1 },
  "group": "scrapyard"
},
{
  "id": "scavenge_tech_district",
  "name": "Scavenge Tech District",
  "desc": "Salvage from abandoned server farms and workshops.",
  "flavor": "Dead screens. Live circuits.",
  "locked": true,
  "require": "g.triagem>0",
  "perpetual": true,
  "run": { "energy": 0.2 },
  "effect": { "electronic_scrap": 0.5, "polymer_scrap": 0.2 },
  "group": "scrapyard"
},
{
  "id": "scavenge_residential",
  "name": "Scavenge Residential Ruins",
  "desc": "Pick through collapsed apartment blocks.",
  "flavor": "People leave behind more than they think.",
  "locked": true,
  "require": "g.triagem>0",
  "perpetual": true,
  "run": { "energy": 0.18 },
  "effect": { "polymer_scrap": 0.4, "ferrous_scrap": 0.2, "electronic_scrap": 0.1 },
  "group": "scrapyard"
}
```

The original "Scavenge Scrap" task remains available (still produces generic scrap for Nano Infra), but the new zone tasks are what the player will prefer since classified scrap is needed for advanced refining.

**Approach B (modify existing task):** If creating new tasks is heavy, modify "Scavenge Scrap" to produce a mix of classified scrap when `g.triagem>0`. Use `effect_require` pattern if the engine supports conditional effects, or duplicate the task with a `require` gate.

**Step 2.2 — Refinery tasks consume classified scrap**

When the Refinery is built, refining tasks should consume classified scrap (not generic):

| Recipe | Input | Output | Requires |
|--------|-------|--------|----------|
| Refine Nano Infra | 15 scrap (generic) | 1 nano_infra | Refinery + Blueprint |
| Refine Nanofiber | 15 polymer_scrap + 3 nano_infra | 1 nanofiber | Refinery + bp_nanofiber |
| Refine Ceramite | 20 ferrous_scrap + 5 nano_infra | 1 ceramite | Refinery + research_armor |
| Refine Fusion Cells | 20 electronic_scrap + 5 nano_infra + 2 ceramite | 1 fusion_cells | Refinery + quest flag |
| Refine Quantum Circuits | 25 electronic_scrap + 8 nano_infra | 1 quantum_circuits | Refinery + quest flag |

Note: Nano Infra intentionally uses GENERIC scrap (the universal resource). All other refined materials use classified scrap. This makes Nano Infra the "entry point" to refining and gives raw scrap a purpose even after classification exists.

**Step 2.3 — Upgrade structure costs aligned with GDD**

Verify existing upgrade costs match the GDD (from `gdd_6_scrapyard_progression.md` §6.3):

| Structure | Cost (GDD) | Current (Sprint 1) | Action |
|-----------|-----------|-------------------|--------|
| Sorting Station | 30 Scrap + 15 Creds | 30 Scrap + 15 Creds | ✓ Match |
| Workshop Upgrade | 60 Scrap + 40 Creds | 60 Scrap + 40 Creds | ✓ Match |
| Refinery | 100 Scrap + 60 Creds | 100 Scrap + 60 Creds | ✓ Match |
| Garage | 80 Scrap + 50 Creds | 80 Scrap + 50 Creds | ✓ Match |
| Research Bench | 120 Scrap + 30 Creds + 5 Nano Infra | NOT YET IMPLEMENTED | Add |
| Scrap Compressor ×3 | 50 Scrap + 30 Creds (×1.5 scale) | 50 Scrap + 30 Creds | ✓ Match |
| Energy Capacitor ×5 | 40 Scrap + 20 Creds (×1.4 scale) | NOT YET IMPLEMENTED | Add |

**Step 2.4 — Add Research Bench and Energy Capacitor upgrades**

```json
{
  "id": "mesa_pesquisa",
  "name": "Build Research Bench",
  "desc": "Set up a workstation for studying schematics and fragments.",
  "flavor": "Knowledge is the one thing they can't take from you.",
  "cost": { "scrap": 120, "creds": 30, "nano_infra": 5 },
  "max": 1,
  "owned": 0,
  "locked": true,
  "require": "g.refinaria>0",
  "mod": {},
  "log": "The Research Bench is ready. Now you can study what you find."
},
{
  "id": "energy_capacitor",
  "name": "Energy Capacitor",
  "desc": "Install additional power storage banks.",
  "flavor": "More juice. More work. More progress.",
  "cost": { "scrap": 40, "creds": 20 },
  "max": 5,
  "owned": 0,
  "locked": true,
  "require": "g.triagem>0",
  "mod": { "energy.max": 10 },
  "costScale": 1.4,
  "log": "Energy storage expanded."
}
```

### Verification Criteria
- [ ] Building Sorting Station → 3 classified scrap resources appear + 3 zone scavenge tasks unlock
- [ ] Zone tasks produce different ratios of classified scrap
- [ ] Building Refinery → refinement tasks available (consume classified scrap)
- [ ] Nano Infra refinement uses generic scrap (not classified)
- [ ] Research Bench purchasable after Refinery
- [ ] Energy Capacitor is repeatable (×5) with scaling cost
- [ ] Player can reach Phase 2 completion in 15-30 minutes of active play

---

## PRIORITY 3: Minimal Narrative System

### Goal
The player hears Grandpa's voice. Structures trigger story moments. The game has *context*, not just mechanics.

### Reference Documents
📎 `gdd_6_scrapyard_progression.md` §6.3 (narrative beats per phase)
📎 The original `inicial.html` prototype (if accessible — had typewriter effect modals)
📎 `data/mecha/events.json` (has narrative content that is never displayed)

### What to Do

**Step 3.1 — Create a DialogueModal component**

A simple modal overlay that displays narrative text with a typewriter effect. This is the single most impactful UI addition possible — it transforms "system log messages" into "story moments."

```
┌──────────────────────────────────────┐
│                                      │
│  ┌────────────────────────────────┐  │
│  │ [GRANDPA]                      │  │
│  │                                │  │
│  │ "Your father built his first   │  │
│  │  Frame right here. He was      │  │
│  │  building something... I never │  │
│  │  understood what."             │  │
│  │                                │  │
│  │              [Continue ▸]      │  │
│  └────────────────────────────────┘  │
│                                      │
└──────────────────────────────────────┘
```

**Requirements:**
- Dark semi-transparent overlay (matches terminal aesthetic)
- Speaker name at top (e.g., "GRANDPA", "SYSTEM", "???")
- Text appears character by character (~30ms per char, skippable on click)
- "Continue" button advances to next dialogue page or closes
- Multiple pages supported (array of strings)
- Speaker portrait optional (can be just a colored icon/initial)
- Can be triggered from game.js via a method like `game.showDialogue(speakerId, pages[])`

**Styling:** Should match the existing terminal/CRT aesthetic. Green-on-dark for system, warm amber for Grandpa, cool cyan for other NPCs.

**Step 3.2 — Create a narrative event trigger system**

The existing `events.json` has content. What's missing is the trigger mechanism — something that watches game state and fires narrative events when conditions are met.

**Minimal implementation:**

```js
// In game.js, add a milestoneCheck() called periodically (every 5 seconds, or on upgrade purchase):

milestoneCheck() {
  const milestones = [
    {
      id: 'welcome',
      condition: () => this.state.totalTicks < 10, // First few seconds
      once: true,
      action: () => this.showDialogue('grandpa', [
        "So... you've come to see the old scrapyard.",
        "It's not much. But it's ours. Your father grew up here.",
        "Start by scavenging what you can. There's still good metal in those piles."
      ])
    },
    {
      id: 'first_sorting',
      condition: () => this.state.items.triagem?.owned > 0,
      once: true,
      action: () => this.showDialogue('grandpa', [
        "A sorting station. Smart.",
        "Now you'll see what's really in that scrap — ferrous, polymer, electronic. Each one has its uses.",
        "Your father was methodical like this too."
      ])
    },
    {
      id: 'workshop_restored',
      condition: () => this.state.items.oficina_nivel2?.owned > 0,
      once: true,
      action: () => this.showDialogue('grandpa', [
        "The workshop hums again. Haven't heard that sound in years.",
        "Your father used to work right here. He was building something... I never understood what.",
        "There's a locked garage out back. We'll get to it. When you're ready."
      ])
    },
    {
      id: 'garage_discovery',
      condition: () => this.state.items.garagem?.owned > 0,
      once: true,
      action: () => this.showDialogue('grandpa', [
        "...",
        "There it is. Your father's Frame.",
        "The Hayabusa Mk.I. Light class. Fast, fragile, beautiful.",
        "He never got to finish it. But you... you could.",
        "This changes everything, kid."
      ])
    },
    {
      id: 'refinery_online',
      condition: () => this.state.items.refinaria?.owned > 0,
      once: true,
      action: () => this.showDialogue('system', [
        "REFINERY ONLINE. Material processing capabilities restored.",
        "Raw scrap can now be refined into Nano Infra — the universal fabrication substrate.",
        "Check the MARKET tab for available schematics."
      ])
    },
    {
      id: 'first_combat_available',
      condition: () => this.state.items.garagem?.owned > 0 && !this.combatRunner?.active,
      once: true,
      delay: 3000, // 3 seconds after garage, so dialogue finishes first
      action: () => this.showDialogue('system', [
        "FRAME DETECTED: Hayabusa Mk.I — Status: Damaged but operational.",
        "Basic weapons and sensors are functional.",
        "A rogue scrap drone has been harassing the neighborhood. This could be a good first test.",
        "Select a MISSION when ready."
      ])
    }
  ];

  for (const m of milestones) {
    if (this._completedMilestones?.has(m.id)) continue;
    if (m.condition()) {
      this._completedMilestones = this._completedMilestones || new Set();
      this._completedMilestones.add(m.id);
      if (m.delay) {
        setTimeout(() => m.action(), m.delay);
      } else {
        m.action();
      }
      break; // Only fire one milestone per check (queue them)
    }
  }
}
```

This is NOT a full NarrativeEngine — it's a milestone checker with dialogue triggers. It can be refactored later into a proper event system, but this gets narrative into the game TODAY.

**Step 3.3 — Persist completed milestones**

Add `completedMilestones` to the save/load system:

```js
// serialize:
completedMilestones: Array.from(this._completedMilestones || [])

// restore:
this._completedMilestones = new Set(saveData.completedMilestones || [])
```

### Verification Criteria
- [ ] Game starts with Grandpa's welcome dialogue (first seconds)
- [ ] Building Sorting Station triggers Grandpa dialogue about classification
- [ ] Building Workshop triggers hint about the locked garage
- [ ] Building Garage triggers the emotional discovery moment (Dad's Frame)
- [ ] Building Refinery triggers system message about material processing
- [ ] After Garage, system message introduces first mission possibility
- [ ] Dialogues only fire once (persist across saves)
- [ ] Dialogue can be skipped (click to complete text, click again to advance)

---

## PRIORITY 4: Garage as Combat Gate

### Goal
Combat should feel like a milestone, not a default. The Garage discovery IS the player's first combat moment.

### Reference Documents
📎 `gdd_6_scrapyard_progression.md` §6.3 (Phase 3 — Garage)
📎 `combat_design_document.md` §12 (Glory economy)
📎 `resource_catalog_unlock_logic.md` (combat group resources)

### What to Do

**Step 4.1 — Lock missions behind Garage**

Missions should have `"require": "g.garagem>0"` (most already do in `missions.json`). Verify this and ensure the COMBAT/MISSIONS tab is not visible until Garage is built.

**Step 4.2 — First mission discovery flow**

After the Garage milestone dialogue (Priority 3, Step 3.2), the first mission should appear in the mission list. The flow:

```
Player builds Garage
  → Grandpa dialogue (emotional, about Dad's Frame)
  → 3 seconds later: System message (Frame status, first mission available)
  → MISSIONS tab appears in the UI
  → One mission available: "Rogue Drone Patrol" (difficulty 1)
```

**Step 4.3 — Post-combat narrative**

After winning the first combat, trigger a narrative event:

```js
{
  id: 'first_victory',
  condition: () => this.state.items.mission_scrap_drone?.completed > 0,
  once: true,
  action: () => this.showDialogue('grandpa', [
    "You did it. You actually did it.",
    "That Frame... it responded to you. Just like it did for your father.",
    "This is just the beginning. There are people out there who need help. And worse — people who'll come for us.",
    "Keep building. Keep fighting. Keep the legacy alive."
  ])
}
```

This closes the narrative loop: discovery → first fight → emotional payoff → motivation to continue.

**Step 4.4 — Glory and Parts become visible**

After first combat completion:
- `glory` resource appears in the UI (earned from combat)
- `parts` resource appears (if loot was gained)
- `supply` resource appears in the combat/loadout panel

These should already be gated by `g.garagem>0` from Priority 1.

### Verification Criteria
- [ ] No missions visible before Garage is built
- [ ] Building Garage triggers discovery narrative → first mission appears
- [ ] Winning first mission triggers Grandpa's pride dialogue
- [ ] Glory/Parts/Supply appear in UI after first combat
- [ ] The experience from "new game" to "first combat victory" feels like a coherent story

---

## PRIORITY 5: Combat Phase 3 (Original Plan)

### Goal
NOW we add Heat thresholds and Stress recovery. The player has context, the loop works, combat has narrative weight.

### Reference Documents
📎 `combat_implementation_plan.md` §7 (Phase 3 steps 12-16)
📎 `combat_design_document.md` §7 (Heat & Stress)
📎 `gdd_3_4_parts_frame_assembly.md` §3.4.1 (category-specific thermal/stress profiles)

### What to Do

This is exactly what was originally proposed. Now it makes sense:

**Step 5.1 — Heat Shutdown (Step 12 from combat_implementation_plan)**

When Heat reaches the Frame's heat cap (Light: 80, Medium: 100, Heavy: 120), combat ends as defeat. The player now understands what Heat IS because they've been fighting for a reason.

**Step 5.2 — Stress Collapse (Step 12 continued)**

When Stress reaches pilot cap (20 + GRT × 2), combat ends as defeat. Stress matters because the PILOT matters — the player has heard Grandpa talk about Dad, they care about the character.

**Step 5.3 — Passive Stress Recovery (Step 13)**

Between missions, Stress recovers at `GRT × 0.1` per second. This creates the idle cycle from §14.3:

```
Fight → Stress high → Can't fight again immediately → Idle recovery
  → While recovering, scavenge/refine/build → Stress recovers → Fight again
```

This interplay between combat downtime and idle production is the core game loop. It only works if both the idle loop (Priority 2) and combat (Priority 4) are in place.

**Step 5.4 — Dynamic Heat Dissipation**

Replace hardcoded `BASE_HEAT_DISSIP = 15` with:

```js
const heatDissip = (playerFrame.enr / 20) * stanceModifiers[this.stance].heatDissipMod;
```

Where `stanceModifiers` come from §4.3 (Cautious has +heat dissipation bonus).

**Step 5.5 — Integrity Persistence Verification**

Confirm that structural damage persists between missions (Heat resets, Stress persists, Integrity persists). The player should need to repair before the next fight if they took damage — this feeds the maintenance economy from `gdd_8_economy.md` §8.4.

### Verification Criteria
- [ ] Heat reaching cap → combat defeat with appropriate log message
- [ ] Stress reaching cap → combat defeat with appropriate log message
- [ ] Stress recovers passively between missions at GRT-based rate
- [ ] Heat dissipation varies by Frame ENR stat and current Stance
- [ ] Structural damage persists between missions
- [ ] Repair task (3 parts + 10 scrap) is available and functional

---

## SUMMARY: What Changes vs Original Plan

| Original Next Step | Revised Next Step | Why |
|-------------------|-------------------|-----|
| Phase 3: Heat thresholds | Priority 1: Resource alignment | Resources are the backbone of every system |
| Phase 3: Stress recovery | Priority 2: Scrapyard Phase 1→2 | The idle loop must work before combat refinement |
| Phase 3: Dynamic dissipation | Priority 3: Narrative system | A game without story is a spreadsheet |
| — | Priority 4: Garage as combat gate | Combat needs narrative context |
| (then Phase 3) | Priority 5: Heat/Stress (same work, now in context) | Same implementation, now meaningful |

**Total estimated effort:** ~15-20 hours across all 5 priorities.
**Same effort as the original Phase 3 plan? No — it's more work total. But the output is a playable game instead of a polished subsystem.**

---

## FILE REFERENCE

All design decisions referenced in this briefing are documented in:

| Document | What It Contains |
|----------|-----------------|
| `resource_catalog_unlock_logic.md` | Complete JSON for all 22 resources, unlock conditions, group colors |
| `gdd_3_4_parts_frame_assembly.md` | Frame categories, integrity levels, thermal/stress profiles |
| `gdd_6_scrapyard_progression.md` | Scrapyard phases, structure catalog, narrative beats |
| `gdd_8_economy.md` | Currency tiers, Glory economy, maintenance costs, prestige |
| `combat_design_document.md` v1.1 | Combat mechanics with cross-references to all above |
| `combat_implementation_plan.md` | Original implementation plan (Phase 3 = Priority 5 here) |

**When in doubt about a design decision, check `resource_catalog_unlock_logic.md` first — it has the most recent locked decisions.**

---

*Briefing prepared February 2026. Review after Priority 2 completion to reassess ordering.*
