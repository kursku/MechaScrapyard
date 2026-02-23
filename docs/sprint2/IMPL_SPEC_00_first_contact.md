# MECHA SCRAPYARD — Implementation Spec: First Contact
## Sprint 2.5 — The First 5 Minutes

**From:** Design (Claude)
**To:** Implementation (Antigravity)
**Priority:** 🔴 CRITICAL — Everything built so far depends on a player who *stays*
**Estimated effort:** ~2-3 hours
**Prerequisites:** None. This is data-level surgery + one small component.

---

## WHY THIS BEFORE JOBS

Reclaim-01 (Morale) ✅ and Reclaim-03 (K.I.T.A.) ✅ are built. But both systems are *delivered* to the player through milestones that fire AFTER Sorting Station and Workshop. If the player bounces in the first 3 minutes, they never see the morale system, never meet K.I.T.A., and never reach the Garage discovery that gates Jobs (Reclaim-02), combat missions, and every system that follows.

The current first 5 minutes:

1. Grandpa says "scavenge what you can" → good ✅
2. Player sees Scrapyard tab with Scavenge + Odd Jobs + Sorting Station → good ✅
3. Player clicks PROFILE tab → sees 4 training tasks + a moral choice task → **bad** ❌
4. Player can click "Scout Local Sector" → thrown into combat with zero context → **bad** ❌
5. Player accumulates scrap with no micro-feedback on progress → **flat** ⚠️
6. Player builds Sorting Station → Grandpa fires, new tasks unlock → good ✅ (but 50+ seconds away)

This spec fixes steps 3-5. The fixes are surgical: data changes, one require-gate audit, and one new lightweight UI component.

---

## PART 1: REQUIRE GATE AUDIT

### The Problem

Several items are `locked: false` with no `require` condition, making them available from second zero. They shouldn't be.

### 1.1 Gate training tasks behind Sorting Station

**Why:** Training pilot stats (Muscle, Neuro, Reflex, Grit) has no narrative justification before the player has organized their scrapyard. The player doesn't even have a mecha yet — why train combat reflexes? Gating behind `triagem` creates a clean Phase 2 unlock: "You've organized the scrap. Now organize yourself."

**File:** `data/mecha/tasks.json`

Add `"require": "g.triagem>0"` to these 4 tasks:

```
train_muscle    → "require": "g.triagem>0"
train_neuro     → "require": "g.triagem>0"
train_reflex    → "require": "g.triagem>0"
train_grit      → "require": "g.triagem>0"
```

Each task also needs `"locked": true` added (the TechTree evaluates `require` only on locked items).

**Result:** PROFILE tab at game start shows only player stats + morality display. After Sorting Station: 4 training tasks appear. Clean progression.

### 1.2 Gate Scout Local Sector behind Garage

**Why:** This task has `"locked": false` and no `require`. It triggers `trigger_combat: mission_scrap_drone`. A brand new player can click it, spend 10 energy, and enter combat with zero narrative framing — no Garage discovery, no Grandpa speech about Dad's mecha, no "first flight, first fight."

This breaks the entire combat introduction arc that GDD §6.3 Phase 3 and IMPL_SPEC_03 depend on.

**File:** `data/mecha/tasks.json`

```json
{
    "id": "mission_scout",
    ...
    "locked": true,
    "require": "g.garagem>0",
    ...
}
```

**Result:** Combat is properly gated behind the Garage discovery. The player's first fight is `msn_rogue_drone_patrol` — narratively framed by Grandpa, contextually earned.

### 1.3 Remove duplicate Scrap Thief task

**Why:** `choice_scrap_thief` exists in `tasks.json` as a 2-option task sitting in the PROFILE tab from second zero. But `evt_moral_scrap_thief` in `events.json` is the *real* version — a rich 4-option moral choice with Grandpa as speaker, resource effects, permanent mods, and morality shifts. The milestone system already triggers this richer version after `triagem`.

Having both means:
- The player might encounter the shallow task version *before* the rich event fires
- The PROFILE tab is cluttered with a context-free choice at game start
- Two systems compete to deliver the same narrative beat

**File:** `data/mecha/tasks.json`

**Delete** the entire `choice_scrap_thief` entry. The milestone in `game.js` (line ~1359) already handles this event correctly via `presentChoice(evt_moral_scrap_thief)`.

Alternatively, if deletion feels risky: set `"locked": true, "require": "NEVER"` to effectively disable it.

### 1.4 Summary of changes

| Item | Current State | Change | Effect |
|------|--------------|--------|--------|
| `train_muscle` | `locked: false`, no require | Add `locked: true, require: "g.triagem>0"` | Hidden until Phase 2 |
| `train_neuro` | `locked: false`, no require | Add `locked: true, require: "g.triagem>0"` | Hidden until Phase 2 |
| `train_reflex` | `locked: false`, no require | Add `locked: true, require: "g.triagem>0"` | Hidden until Phase 2 |
| `train_grit` | `locked: false`, no require | Add `locked: true, require: "g.triagem>0"` | Hidden until Phase 2 |
| `mission_scout` | `locked: false`, no require | Add `locked: true, require: "g.garagem>0"` | Combat gated to Phase 3 |
| `choice_scrap_thief` | `locked: false`, group: pilot | **Remove entirely** | Eliminates duplicate |

**Estimated time:** 15 minutes. Pure data edits.

---

## PART 2: EARLY MORAL HOOK

### The Problem

The first moral choice (`evt_moral_scrap_thief`) requires `g.triagem>0` — it fires after the Sorting Station. Gemini's advice to front-load morality is correct: the player should feel the weight of choice BEFORE they've invested 60 seconds. But moving the Scrap Thief earlier doesn't work — it references polymer scrap, which doesn't exist until Phase 2.

### The Solution

Create a **micro-event** that fires ~90 seconds into play. It's small, personal, and teaches the morality system without requiring any infrastructure.

**Add to `data/mecha/events.json`:**

```json
{
    "id": "evt_moral_first_find",
    "name": "First Find",
    "speaker": "grandpa",
    "require": "g.scrap>=10",
    "desc": "While digging through a pile, you find a toolbox wedged under a beam. Good tools — worth real creds on the market. But the initials 'R.M.' are scratched into the lid. Someone's personal kit.",
    "choices": [
        {
            "id": "keep",
            "label": "Keep the tools — finders keepers",
            "desc": "They're not coming back for them. You need this more.",
            "morality": -5,
            "effect": { "creds": 8 },
            "log": "Grandpa shrugs. 'Practical. Like your father.'"
        },
        {
            "id": "ask_around",
            "label": "Ask the neighbors if anyone lost a toolbox",
            "desc": "Someone might still be looking for these.",
            "morality": 10,
            "effect": { "creds": 3 },
            "log": "No one claims it, but word gets around — the Hayashi kid is honest."
        },
        {
            "id": "sell_fast",
            "label": "Sell it at the bazaar before anyone asks questions",
            "desc": "Quick creds, no trace.",
            "morality": -10,
            "effect": { "creds": 12 },
            "log": "Cash in hand. Grandpa watches. Says nothing."
        }
    ]
}
```

**Add milestone in `game.js milestoneCheck()`:**

Insert BEFORE the `welcome` milestone (or immediately after, with lower delay):

```js
{
    id: 'first_moral_hook',
    condition: () => (this.state.items.scrap?.val || 0) >= 10,
    delay: 3000,
    action: () => this.presentChoice(this.state.items.evt_moral_first_find)
},
```

**Why `g.scrap>=10`:** At 0.6 scrap/s, the player reaches 10 scrap in ~17 seconds of scavenging. Combined with the 3-second delay, this fires at roughly the 20-second mark — early enough to be surprising, late enough that the player has started scavenging and understands what scrap is.

**Why this works:**
- No infrastructure dependency — just "you found something while digging"
- Grandpa reacts to each choice, establishing him as moral witness
- Small stakes (3-12 creds) teach the mechanic without overwhelming
- Three options establish the spectrum: moral, practical, shady
- The "Like your father" line on the pragmatic choice plants narrative seed
- ~20 seconds in = before the player gets bored, before they build anything

**Estimated time:** 20 minutes. One event entry, one milestone.

---

## PART 3: OBJECTIVE TRACKER (Current Directive)

### The Problem

After Grandpa says "scavenge what you can," the player has no visible goal. They can read the Sorting Station cost (30 Scrap, 15 Creds) if they scroll down to BASE INFRASTRUCTURE, but there's no persistent indicator of "here's what you're working toward."

GDD §6.3 Phase 1 explicitly specifies this: *"Objective tracker shows: 'Collect 30 Scrap' → 'Earn 15 Creds' → 'Build the Sorting Station.'"*

### The Solution

A lightweight `DirectiveTracker` rendered in the left sidebar, above the resource monitor. It reads from a sequential directive list and automatically advances when conditions are met.

### 3.1 Directive data

Directives are hardcoded in a computed property (not JSON) because they're tightly coupled to the early game flow and change rarely. Later phases can extend this array.

**Add to `TerminalUI.vue` computed properties:**

```js
currentDirective() {
    this.renderTick; // Force reactivity

    const g = this.state.g;
    const items = this.state.items;

    const directives = [
        {
            id: 'gather_scrap',
            text: 'Scavenge scrap from the piles.',
            detail: 'Click SCAVENGE SCRAP to start collecting.',
            condition: () => (items.scrap?.val || 0) >= 30,
            progress: () => Math.floor(items.scrap?.val || 0),
            target: 30,
            unit: 'SCRAP'
        },
        {
            id: 'earn_creds',
            text: 'Earn Creds from Odd Jobs.',
            detail: 'Run ODD JOBS to earn currency.',
            condition: () => (items.creds?.val || 0) >= 15,
            progress: () => Math.floor(items.creds?.val || 0),
            target: 15,
            unit: 'CREDS'
        },
        {
            id: 'build_sorting',
            text: 'Build the Sorting Station.',
            detail: 'Scroll down to BASE INFRASTRUCTURE.',
            condition: () => (items.triagem?.owned || 0) > 0,
            progress: () => (items.triagem?.owned || 0) > 0 ? 1 : 0,
            target: 1,
            unit: 'BUILT'
        },
        {
            id: 'upgrade_workshop',
            text: 'Upgrade the Workshop.',
            detail: 'Restore grandpa\'s workshop to full power.',
            condition: () => (items.oficina_nivel2?.owned || 0) > 0,
            progress: () => (items.oficina_nivel2?.owned || 0) > 0 ? 1 : 0,
            target: 1,
            unit: 'BUILT'
        },
        {
            id: 'restore_garage',
            text: 'Restore the Garage.',
            detail: 'Something from the past awaits inside.',
            condition: () => (items.garagem?.owned || 0) > 0,
            progress: () => (items.garagem?.owned || 0) > 0 ? 1 : 0,
            target: 1,
            unit: 'BUILT'
        },
    ];

    // Return first incomplete directive
    for (const d of directives) {
        if (!d.condition()) return d;
    }

    // All done — no directive (tracker hides)
    return null;
},
```

### 3.2 Template

Insert inside `<aside class="terminal-resource-list ...">`, BEFORE the resource loop (`<div v-for="res in resources">`):

```vue
<!-- CURRENT DIRECTIVE -->
<div class="directive-tracker" v-if="currentDirective">
    <div class="directive-header">> CURRENT DIRECTIVE</div>
    <div class="directive-text">{{ currentDirective.text }}</div>
    <div class="directive-detail">{{ currentDirective.detail }}</div>
    <div class="directive-progress">
        <span class="directive-count">
            {{ currentDirective.progress() }}/{{ currentDirective.target }} {{ currentDirective.unit }}
        </span>
        <div class="directive-bar">
            <div class="directive-fill" 
                 :style="{ width: Math.min(100, (currentDirective.progress() / currentDirective.target) * 100) + '%' }">
            </div>
        </div>
    </div>
</div>
```

### 3.3 Styles

Add to the `<style>` section:

```css
/* Directive Tracker */
.directive-tracker {
    background: rgba(0, 255, 65, 0.04);
    border: 1px solid var(--color-success, #0f0);
    border-left: 3px solid var(--color-success, #0f0);
    padding: 12px;
    margin-bottom: 20px;
    position: relative;
    font-family: var(--font-mono);
}
.directive-tracker::after {
    content: "TRACKING";
    position: absolute;
    top: -8px;
    right: 8px;
    background: var(--bg-deep, #0a0a0a);
    padding: 0 6px;
    font-size: 9px;
    color: var(--color-success, #0f0);
    letter-spacing: 2px;
}
.directive-header {
    font-size: 11px;
    color: var(--text-dim, #666);
    letter-spacing: 1px;
    margin-bottom: 6px;
}
.directive-text {
    font-size: 13px;
    font-weight: bold;
    color: var(--color-success, #0f0);
    line-height: 1.3;
    margin-bottom: 4px;
}
.directive-detail {
    font-size: 11px;
    color: var(--text-dim, #666);
    margin-bottom: 8px;
}
.directive-count {
    font-size: 11px;
    color: var(--text, #ccc);
    display: block;
    text-align: right;
    margin-bottom: 3px;
}
.directive-bar {
    height: 3px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid var(--border-dim, #333);
    width: 100%;
}
.directive-fill {
    height: 100%;
    background: var(--color-success, #0f0);
    box-shadow: 0 0 4px var(--color-success, #0f0);
    transition: width 0.3s ease;
}
```

### 3.4 Self-hiding behavior

The tracker automatically hides when `currentDirective` returns `null` (all Phase 1-2 objectives complete). It reappears naturally if you add Phase 3+ directives later. The `v-if="currentDirective"` handles this.

**Estimated time:** 1-1.5 hours. One computed property, template block, CSS.

---

## PART 4: GRANDPA MICRO-FEEDBACK (Optional, ~30 minutes)

### The Problem

Between "Start scavenging" and "Build Sorting Station" (50+ seconds), nothing happens narratively. The player watches numbers tick up.

### The Solution

Add 2 lightweight milestones that fire during the accumulation gap:

```js
// In milestoneCheck(), insert after 'welcome':
{
    id: 'scrap_progress_hint',
    condition: () => (this.state.items.scrap?.val || 0) >= 15 && (g.triagem?.owned || 0) === 0,
    action: () => {
        Log.add("💬 Grandpa: 'Keep going. Once you've got enough, we'll set up proper sorting.'", 'story');
    }
},
{
    id: 'first_creds_earned',
    condition: () => (this.state.items.creds?.val || 0) >= 8,
    action: () => {
        Log.add("💬 Grandpa: 'First creds. Don't spend them all in one place.'", 'story');
    }
},
```

**Note:** These use `Log.add` instead of `showDialogue` — they're gentle log messages, not modal interruptions. The player sees them in the activity log without being stopped.

**Estimated time:** 15 minutes. Two log-only milestones.

---

## PART 5: TAB EMERGENCE INDICATOR (Optional, ~20 minutes)

### The Problem

When the Sorting Station is built, new tasks appear and training unlocks. But if the player isn't on the right tab, they might not notice.

### The Solution

Not Gemini's lock icons (your tabs already self-hide). Instead, a simple "NEW" pulse on tabs that have freshly unlocked content.

**Add to TerminalUI data():**

```js
data() {
    return {
        ...
        _seenCategories: new Set(['pilot', 'scrapyard']),  // Known tabs at start
    };
},
```

**Add computed:**

```js
isNewTab(cat) {
    if (this._seenCategories.has(cat)) return false;
    // Mark as seen when clicked
    return true;
},
```

**Modify tab click handler:**

```js
@click="selectedCategory = cat; _seenCategories.add(cat)"
```

**Add to tab template:**

```vue
<span v-if="!_seenCategories.has(cat)" class="tab-new-badge">NEW</span>
```

**CSS:**

```css
.tab-new-badge {
    font-size: 9px;
    color: var(--color-success);
    margin-left: 4px;
    animation: pulse-new 1.5s ease-in-out infinite;
}
@keyframes pulse-new {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
}
```

**Estimated time:** 20 minutes.

---

## VERIFICATION CRITERIA

### Must-Pass (Parts 1-3)

- [ ] Training tasks (×4) not visible at game start
- [ ] Training tasks appear after building Sorting Station
- [ ] Scout Local Sector not visible at game start
- [ ] Scout Local Sector appears after restoring Garage
- [ ] `choice_scrap_thief` task removed from PROFILE tab
- [ ] `evt_moral_scrap_thief` still fires via milestone after Sorting Station
- [ ] First Find moral event fires at ~20 seconds of play
- [ ] First Find morality shifts apply correctly
- [ ] Directive Tracker visible in sidebar at game start
- [ ] Directive advances: Scrap → Creds → Sorting Station → Workshop → Garage
- [ ] Directive hides after Garage is restored
- [ ] Progress bar fills in real-time during scavenging

### Nice-to-Pass (Parts 4-5)

- [ ] Grandpa log messages fire at 15 scrap and 8 creds
- [ ] NEW badge appears on tabs with fresh content
- [ ] NEW badge disappears after clicking the tab

---

## FILE REFERENCE

| File | Action | Part |
|------|--------|------|
| `data/mecha/tasks.json` | MODIFY — add require gates, remove scrap thief task | 1 |
| `data/mecha/events.json` | MODIFY — add `evt_moral_first_find` | 2 |
| `src/game.js` | MODIFY — add `first_moral_hook` + feedback milestones | 2, 4 |
| `src/ui/TerminalUI.vue` | MODIFY — add directive tracker computed + template + CSS | 3, 5 |

---

## HOW THIS CHANGES THE FIRST 5 MINUTES

**Before (current):**

```
0:00  Grandpa: "Scavenge what you can"
0:05  Player sees everything at once. Clicks around confused.
0:15  Maybe starts scavenging. Maybe clicks Scout and gets thrown into combat.
0:30  Numbers tick up. No feedback.
1:00  If still playing, builds Sorting Station. Game opens up.
```

**After (with Sprint 2.5):**

```
0:00  Grandpa: "Scavenge what you can"
      Directive Tracker: "Scavenge scrap from the piles. 0/30 SCRAP"
      Only Scavenge + Odd Jobs visible. Clean, focused.

0:05  Player clicks Scavenge. Bar fills. Scrap counter moves.
      Directive progress bar animates in real-time.

0:17  Scrap hits 10. Grandpa: "Keep going."

0:20  ★ FIRST FIND event fires.
      "You found a toolbox... Someone's personal kit."
      Player makes their first moral choice. Stakes are low, impact is real.
      Morality shifts. They understand: choices matter here.

0:25  Directive: "Earn Creds from Odd Jobs. 0/15 CREDS"
      Player discovers Odd Jobs task.

0:35  First creds earned. "First creds. Don't spend them all in one place."

0:50  Directive: "Build the Sorting Station."
      Player scrolls to Infrastructure, builds it.

0:52  ★ SORTING STATION MILESTONE fires.
      Grandpa: "A sorting station. Smart."
      New resources appear. Training tasks unlock. NEW badge pulses.

1:00  ★ SCRAP THIEF event fires (8-second delay after triagem).
      The real moral choice — 4 options, deeper consequences.
      Player is already primed by the First Find choice.

1:15  Directive: "Upgrade the Workshop."
      The game opens up. Player has context, investment, direction.
```

**Every second has purpose. Every milestone is earned.**

---

## RELATIONSHIP TO RECLAIM SPRINT

This spec slots BETWEEN Reclaim-03 (K.I.T.A., ✅ done) and Reclaim-02 (Jobs, next).

```
Reclaim-01: Morale System ◄── DONE
Reclaim-03: K.I.T.A. Android ◄── DONE
Sprint 2.5: First Contact ◄── THIS SPEC (2-3 hours)
Reclaim-02: Job Progression ◄── NEXT (benefits from solid early game)
Reclaim-05: Faction Alliances
Reclaim-04: City Zones
Reclaim-06: Deep Skill Trees
```

After Sprint 2.5, the Job System (Reclaim-02) lands in a game where:
- The player has already made 2 moral choices (First Find + Scrap Thief)
- They understand morality shifts (so job path branching makes sense)
- They've followed a directed path through infrastructure building
- Combat was properly introduced via the Garage narrative
- The first mission (`msn_rogue_drone_patrol`) was emotionally framed
- Job enrollment (`g.garagem>0 && g.msn_rogue_drone_patrol>0`) feels *earned*

Jobs become the Phase 2→3 reward, not an isolated system dropped into chaos.

---

*Sprint 2.5: 2-3 hours. No new systems. No engine changes. Just the right gates, the right words, at the right moments.*
