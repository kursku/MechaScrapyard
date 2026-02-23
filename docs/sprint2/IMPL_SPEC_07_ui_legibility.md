# MECHA SCRAPYARD — Implementation Spec: UI Legibility Pass
## Sprint 2.7 — The Readability Overhaul

**From:** Design (Claude)
**To:** Implementation (Antigravity)
**Priority:** 🔴 CRITICAL — Players can't engage with systems they can't read
**Estimated effort:** ~4-6 hours
**Prerequisites:** Sprint 2.5 (First Contact) completed

---

## WHY THIS MATTERS

The game engine works. Morale shifts, K.I.T.A. assigns, resources accumulate, milestones fire. But the **visual layer** between the engine and the player has three compounding problems:

1. **Icon illegibility:** Resource icons use thin unicode math symbols (◈ ⧉ ≋ ⬡) that VT323 can't render — they fall to inconsistent system fonts at unpredictable sizes
2. **No visual hierarchy:** Task cards, upgrade cards, and resource rows all share the same visual weight — dim borders on dark backgrounds, same text sizes, no category indicators
3. **Progress readability:** ASCII bars `[||||.....]` are charming but unreadable at a glance — no capacity display (val/max), no color coding, no smooth animation

The fix is **NOT a redesign**. The CRT industrial aesthetic is strong. This spec upgrades individual elements within the existing visual language — same palette, same font stack, same grid layout. Just clearer.

---

## PART 1: RESOURCE ICON CONTAINERS (Badge System)

### 1.1 The Problem

Current `.res-icon` is a bare unicode glyph floating at `font-size: var(--font-size-xl)`:

```css
.res-icon { font-size: var(--font-size-xl); color: var(--res-color); text-shadow: 0 0 5px var(--res-color); }
```

Unicode symbols like `⧉`, `◈`, `≋`, `⬡` are mathematical/geometric — designed for academic typesetting. VT323 has zero coverage for them. Each one falls back to a different system font (Segoe UI Symbol on Windows, Apple Symbols on Mac) at inconsistent weights and rendering sizes.

### 1.2 The Solution — Periodic Table Badges

Replace bare glyphs with **letter-based abbreviations inside colored containers**. This is 100% font-safe — VT323 renders all Latin characters perfectly.

**Add `abbr` field to each resource in `data/mecha/resources.json`:**

```json
{ "id": "energy",           "abbr": "E",  "icon": "⚡", ... }
{ "id": "scrap",            "abbr": "S",  "icon": "⚙", ... }
{ "id": "creds",            "abbr": "¢",  "icon": "¢", ... }
{ "id": "ferrous_scrap",    "abbr": "Fe", "icon": "⛏", ... }
{ "id": "polymer_scrap",    "abbr": "Po", "icon": "⬡", ... }
{ "id": "electronic_scrap", "abbr": "El", "icon": "⧉", ... }
{ "id": "nano_infra",       "abbr": "Ni", "icon": "◈", ... }
{ "id": "nanofiber",        "abbr": "Nf", "icon": "≋", ... }
{ "id": "ceramite",         "abbr": "Ce", "icon": "◆", ... }
{ "id": "fusion_cells",     "abbr": "Fu", "icon": "⚛", ... }
{ "id": "quantum_circuits", "abbr": "Qc", "icon": "◇", ... }
{ "id": "glory",            "abbr": "G",  "icon": "⚔", ... }
{ "id": "parts",            "abbr": "P",  "icon": "⊞", ... }
{ "id": "supply",           "abbr": "Sp", "icon": "▸", ... }
{ "id": "data_chips",       "abbr": "Dc", "icon": "◇", ... }
{ "id": "rep_police",       "abbr": "RP", "icon": "🛡️", ... }
{ "id": "rep_military",     "abbr": "RM", "icon": "⚔️", ... }
{ "id": "rep_underground",  "abbr": "RU", "icon": "🔧", ... }
{ "id": "rep_corporate",    "abbr": "RC", "icon": "🔥", ... }
{ "id": "rep_exile",        "abbr": "RE", "icon": "👁️", ... }
{ "id": "prestige_points",  "abbr": "★",  "icon": "★", ... }
```

**Rationale:** Periodic-table-style abbreviations are a natural fit for a scrapyard crafting game. `Fe` for Ferrous is *literally* the chemical symbol for iron. `Po` for Polymer, `El` for Electronic, `Ni` for Nano Infra, `Qc` for Quantum Circuits — these read as in-world scientific labels.

### 1.3 Template Change

**File:** `src/ui/TerminalUI.vue`, resource row template (line ~375)

Replace:
```vue
<span class="res-icon">{{ res.icon || '•' }}</span>
```

With:
```vue
<span class="res-badge" :style="{ 
    '--badge-color': res.color || 'var(--primary)',
    borderColor: (res.color || 'var(--primary)') + '60',
    background: (res.color || 'var(--primary)') + '12'
}">
    {{ res.abbr || res.icon || '•' }}
</span>
```

### 1.4 CSS Change

Replace the existing `.res-icon` rule:

```css
/* OLD:
.res-icon { font-size: var(--font-size-xl); color: var(--res-color); text-shadow: 0 0 5px var(--res-color); }
*/

/* NEW: Periodic-table badge container */
.res-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    min-width: 32px;
    border: 1px solid;
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
    font-weight: bold;
    color: var(--badge-color, var(--res-color));
    text-shadow: 0 0 6px var(--badge-color, var(--res-color));
    letter-spacing: -0.5px;
    line-height: 1;
}

/* Single-char badges are slightly larger */
.res-badge:has(+ .res-info) {
    font-size: var(--font-size-base);
}
```

Also update the rate animation selectors (line ~1214-1215):

```css
/* OLD: .rate-pos .res-icon, .rate-neg .res-icon */
.rate-pos .res-badge { animation: flow-up 1.5s infinite linear; }
.rate-neg .res-badge { animation: flow-down 1.5s infinite linear; }
```

### 1.5 Fallback

Keep `res.icon` in the data. The template uses `res.abbr || res.icon` — if `abbr` is missing for any future resource, it falls back to the unicode glyph. No breaking change.

### 1.6 Update `resourceIcon()` helper

The `resourceIcon(id)` method (line ~91) is used for cost displays in upgrade cards and rate deltas. Update it to return the abbreviation:

```js
resourceIcon(id) {
    const res = this.state?.items?.[id];
    if (res && res.abbr) return res.abbr;
    // Fallback to static map
    const ICONS = { 
        energy: 'E', scrap: 'S', creds: '¢',
        ferrous_scrap: 'Fe', polymer_scrap: 'Po', electronic_scrap: 'El',
        nano_infra: 'Ni', nanofiber: 'Nf', ceramite: 'Ce', 
        fusion_cells: 'Fu', quantum_circuits: 'Qc',
        glory: 'G', parts: 'P', supply: 'Sp', data_chips: 'Dc',
        rep_police: 'RP', rep_military: 'RM', rep_underground: 'RU',
        rep_corporate: 'RC', rep_exile: 'RE',
        moralidade: '⚖', prestige_points: '★'
    };
    return ICONS[id] || '•';
},
```

---

## PART 2: RESOURCE BAR UPGRADE (ASCII → CSS)

### 2.1 The Problem

`renderBar(val, max, width)` produces ASCII: `[||||||||.......]`. It's on-brand aesthetically but:
- No smooth animation (jumps between characters)
- No capacity display — a bar at 50% could mean 15/30 or 100/200
- All bars are the same color regardless of fullness
- Occupies a full line of text that could show actual information

### 2.2 The Solution — Hybrid CSS Bars

Replace the ASCII bar with a thin CSS progress bar, and add `val/max` readout to the value display.

**Template change** (line ~386-388):

Replace:
```vue
<div class="hud-ascii-bar" :style="{ color: res.color }">
    {{ renderBar(res.val, res.max, 15) }}
</div>
```

With:
```vue
<div class="res-progress-bar">
    <div class="res-progress-fill" :style="{ 
        width: Math.min(100, (res.val / (res.max || 1)) * 100) + '%',
        backgroundColor: res.color || 'var(--primary)',
        boxShadow: '0 0 6px ' + (res.color || 'var(--primary)') + '80'
    }"></div>
</div>
```

**Also update the resource value display** (line ~383) to include `/max`:

Replace:
```vue
<span class="res-val">{{ Math.floor(res.val) }}</span>
```

With:
```vue
<span class="res-val">{{ Math.floor(res.val) }}</span>
<span class="res-max">/{{ res.max }}</span>
```

### 2.3 CSS

```css
/* Resource progress bar */
.res-progress-bar {
    height: 3px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--border-dim);
    margin-top: 5px;
    overflow: hidden;
}

.res-progress-fill {
    height: 100%;
    transition: width 0.4s ease;
}

.res-max {
    color: var(--text-faint);
    font-size: var(--font-size-xxs);
}
```

### 2.4 Keep `renderBar()` for task cards

The ASCII bar function is still useful for task progress inside cards (especially the Scrapyard tab where the terminal feel matters most). Don't delete it — just stop using it for resources.

---

## PART 3: TASK CARD VISUAL HIERARCHY

### 3.1 The Problem

Every task card looks identical:
- 4×4px status dot (nearly invisible)
- Same border color (dark gray)
- Same font weight
- No category indicator
- No visual separation between "active" and "available"

The player scans a grid of identically-styled rectangles and has to read every label to find what they want.

### 3.2 Status Dot → Status Pip

Enlarge and add shape language:

```css
/* OLD:
.status-dot { width: 4px; height: 4px; background: var(--text-faint); }
*/

/* NEW: Larger, with border */
.status-dot {
    width: 8px;
    height: 8px;
    border: 1px solid var(--text-faint);
    background: transparent;
    flex-shrink: 0;
}

/* Active state: filled + glow */
.hud-task-card.running .status-dot,
.hud-task-card[style*="border-color: var(--primary)"] .status-dot {
    background: var(--primary);
    border-color: var(--primary);
    box-shadow: 0 0 8px var(--primary);
}
```

### 3.3 Left Border Accent

Add a colored left border to indicate category/state:

```css
.hud-task-card {
    /* ... existing styles ... */
    border-left: 3px solid var(--border-dim);  /* Add this line */
}

.hud-task-card.running,
.hud-task-card[style*="border-color: var(--primary)"] {
    border-left-color: var(--primary) !important;
}
```

### 3.4 Active Task Label

When a task is running, show explicit status. In the task card template (line ~629-631), change:

```vue
<!-- Replace the header line -->
<div class="hud-card-header">
    <span class="status-dot" :style="isRunning(task) ? 'background-color: var(--primary); border-color: var(--primary); box-shadow: 0 0 8px var(--primary)' : ''"></span>
    <span class="list-card__name" :style="isRunning(task) ? 'color: var(--primary)' : 'color: var(--text)'">{{ task.name.toUpperCase() }}</span>
    <span v-if="isRunning(task)" class="task-active-label">▶ ACTIVE</span>
</div>
```

CSS:
```css
.task-active-label {
    font-size: var(--font-size-xxs);
    color: var(--primary);
    margin-left: auto;
    letter-spacing: 2px;
    animation: pulse-label 2s ease-in-out infinite;
}

@keyframes pulse-label {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
}
```

---

## PART 4: UPGRADE CARD DIFFERENTIATION

### 4.1 The Problem

Upgrade cards (`BASE INFRASTRUCTURE` section) use the exact same `.hud-task-card` class as operation tasks. A new player cannot visually distinguish "things I click to do" from "things I build permanently."

### 4.2 The Solution — Accent Color + Built Indicator

Add a new class modifier for upgrade cards in the template (line ~656-658):

```vue
<div v-for="upg in upgrades" :key="upg.id"
     :class="['hud-task-card', 'upgrade-card', { 'upgrade-maxed': (upg.owned || 0) >= (upg.max || 1) }]"
     @click="tryItem(upg)">
```

CSS:
```css
/* Upgrade cards: secondary accent color */
.hud-task-card.upgrade-card {
    border-left: 3px solid var(--secondary);
}

.hud-task-card.upgrade-card .list-card__name {
    color: var(--secondary);
}

/* Already built / maxed out */
.hud-task-card.upgrade-maxed {
    opacity: 0.5;
    border-left-color: var(--text-faint);
    pointer-events: none;
}

.hud-task-card.upgrade-maxed::after {
    content: "✓ BUILT";
    position: absolute;
    top: 8px;
    right: 10px;
    font-size: var(--font-size-xxs);
    color: var(--color-success);
    letter-spacing: 2px;
}
```

### 4.3 Cost Tag Visual Upgrade

The cost display inside upgrade cards currently uses `resourceIcon(id)` which returns the unicode glyph. After Part 1, it will return the abbreviation. But the cost row itself needs better styling.

Current cost display (line ~665-669):

```vue
<div v-if="upg.cost" class="hud-cost-list">
    <span v-for="(amt, id) in upg.cost" :key="id"
          :class="['cost-item', canAfford(id, amt * Math.pow(upg.costScale || 1, upg.owned || 0)) ? '' : 'text-danger']">
        {{ resourceIcon(id) }} {{ Math.floor(amt * Math.pow(upg.costScale || 1, upg.owned || 0)) }}
    </span>
</div>
```

Add CSS for cost items (if not already present):

```css
.hud-cost-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;
}

.cost-item {
    font-family: var(--font-mono);
    font-size: var(--font-size-xs);
    padding: 2px 8px;
    border: 1px solid var(--border-dim);
    background: rgba(0, 0, 0, 0.3);
    color: var(--text);
    letter-spacing: 0.5px;
}

.cost-item.text-danger {
    border-color: var(--color-danger);
    color: var(--color-danger);
}
```

---

## PART 5: SECTION HEADERS & VISUAL RHYTHM

### 5.1 The Problem

Section titles like `> LOCAL OPERATIONS`, `> BASE INFRASTRUCTURE`, `> PILOT MORPHOLOGY` all render identically — same color, size, weight. There's no visual rhythm to the page. The player scrolls through a monotone stream.

### 5.2 The Solution — Section Dividers with Color Coding

Update `.hud-section-title`:

```css
.hud-section-title {
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
    color: var(--text-dim);
    letter-spacing: 2px;
    text-transform: uppercase;
    padding-bottom: 8px;
    margin-bottom: 16px;
    border-bottom: 1px solid var(--border-dim);
    position: relative;
}

/* Colored accent bar under title */
.hud-section-title::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    width: 60px;
    height: 1px;
    background: var(--primary);
}
```

For the infrastructure title specifically (which already has inline `color: var(--secondary)`), the `::after` accent will inherit the primary color. You can scope it:

```css
.infra-fragment .hud-section-title::after {
    background: var(--secondary);
}
```

---

## PART 6: SIDEBAR FLOW IMPROVEMENTS

### 6.1 Resource Groups

Currently, all resources render in a flat list. When the player has 15+ resources unlocked, the sidebar becomes a wall of identically-styled rows. Add visual grouping by resource tier.

**In the `resources` computed property** (or wherever the resource list is filtered), ensure resources are sorted by group/tier. Then in the template, add optional group dividers:

```vue
<!-- Add divider between primary and refined resources -->
<template v-for="res in resources" :key="res.id">
    <div v-if="res.id === 'ferrous_scrap' && resources[0]?.id !== 'ferrous_scrap'" 
         class="res-group-divider">
        <span>── REFINED ──</span>
    </div>
    <div v-if="res.id === 'glory'" class="res-group-divider">
        <span>── COMBAT ──</span>
    </div>
    <div class="hud-resource-btn" ...>
        <!-- existing resource row -->
    </div>
</template>
```

CSS:
```css
.res-group-divider {
    text-align: center;
    font-size: 9px;
    color: var(--text-faint);
    letter-spacing: 3px;
    padding: 6px 0 4px;
    margin: 4px 0;
}
```

### 6.2 Sidebar Scrollable

When many resources are unlocked, the sidebar can overflow. Ensure it scrolls independently:

```css
.side-panel {
    /* ... existing ... */
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--border-dim) transparent;
}
```

---

## PART 7: ENERGY NET-RATE INDICATOR

### 7.1 The Problem (from Sprint 2.5 analysis)

Energy is the player's primary anxiety resource. During scavenging, the bar visually drops — but regen (0.3/s) exceeds cost (0.15/s), so it's actually sustainable. The player can't see this.

### 7.2 The Solution

Add a one-word stability indicator next to the energy value when net rate is positive during active task:

**In the resource value display:**

```vue
<span v-if="res.id === 'energy' && getNetRate(res) > 0" class="energy-stable-tag">STABLE</span>
<span v-if="res.id === 'energy' && getNetRate(res) < -0.01" class="energy-drain-tag">DRAIN</span>
```

CSS:
```css
.energy-stable-tag {
    font-size: 9px;
    color: var(--color-success);
    letter-spacing: 2px;
    padding: 1px 4px;
    border: 1px solid var(--color-success);
    margin-left: 4px;
}

.energy-drain-tag {
    font-size: 9px;
    color: var(--color-danger);
    letter-spacing: 2px;
    padding: 1px 4px;
    border: 1px solid var(--color-danger);
    margin-left: 4px;
    animation: pulse-label 1s ease-in-out infinite;
}
```

---

## IMPLEMENTATION ORDER

For minimal risk and maximum incremental testing:

```
Step 1: resources.json — add "abbr" field to all 22 resources    (~15 min)
Step 2: .res-icon → .res-badge — template + CSS swap              (~30 min)
         TEST: Verify all resources render badges correctly
Step 3: ASCII bar → CSS bar + val/max readout                     (~20 min)
         TEST: Verify all resource bars animate, show capacity
Step 4: Status dot enlargement + task left-border accent           (~15 min)
Step 5: Upgrade card differentiation + cost tag styling            (~20 min)
         TEST: Verify upgrade cards visually distinct from task cards
Step 6: Section header accents                                     (~10 min)
Step 7: Energy stability indicator                                 (~10 min)
Step 8: Resource group dividers + sidebar scroll                   (~20 min)
         TEST: Full playthrough — verify visual flow from start
```

**Total: ~2.5 hours of focused work.**

---

## VISUAL SUMMARY: BEFORE → AFTER

```
BEFORE                              AFTER
─────────────────                   ─────────────────
⧉  ELECTRONIC SCRAP     5          [El] ELECTRONIC SCRAP   5/60
   [||...........]                       ████░░░░░░░░░░░░

◈  NANO INFRA           3          [Ni] NANO INFRA         3/20
   [||...........]                       █████░░░░░░░░░░░

• 4px dot  SCAVENGE SCRAP           █ 8px pip  SCAVENGE SCRAP  ▶ ACTIVE
  Dig through the junkyard...       │ Dig through the junkyard...
  [||||||||.......]                 │ ████████████░░░░░░░░░░░░░░

• 4px dot  SORTING STATION          █ SORTING STATION         [0/1]
  A basic sorting table...          │ A basic sorting table...
  ⧉ 15   ◈ 5   ¢ 30               │ [El] 15  [Ni] 5  [¢] 30
```

---

## WHAT THIS DOES NOT CHANGE

- **Grid layout** — same 2-column sidebar + main panel
- **Color palette** — same CRT industrial variables
- **Font stack** — same VT323 + Courier New + monospace
- **Tab navigation** — same dynamic hide/show + NEW badge from Sprint 2.5
- **K.I.T.A. panel** — already well-styled (blue accent, battery bar, stats)
- **Combat panel** — separate component, out of scope
- **Dialogue modals** — already functional, out of scope
- **ASCII bar in task cards** — kept for terminal flavor (resources only switch to CSS)

---

## VERIFICATION CRITERIA

- [ ] All 22 resources render badge containers with `abbr` text
- [ ] Badge containers are consistent size (32×32) across all platforms
- [ ] Resource bars show smooth CSS animation, not ASCII
- [ ] Resource values show `val/max` format
- [ ] Status dots are 8×8px with visible border
- [ ] Active tasks show `▶ ACTIVE` label and colored left border
- [ ] Upgrade cards have secondary-colored left border
- [ ] Maxed upgrades show `✓ BUILT` and reduced opacity
- [ ] Cost tags have bordered pill styling
- [ ] Section headers have colored accent underline
- [ ] Energy shows `STABLE` or `DRAIN` tag during active tasks
- [ ] Resource group dividers appear between categories
- [ ] Sidebar scrolls independently when resources overflow
- [ ] Rate animations (flow-up/flow-down) still work on `.res-badge`
- [ ] `resourceIcon(id)` returns abbreviation in cost displays
- [ ] No visual regressions on mobile layout (≤900px breakpoint)

---

## FILE REFERENCE

| File | Action | Part |
|------|--------|------|
| `data/mecha/resources.json` | MODIFY — add `"abbr"` field to all 22 resources | 1 |
| `src/ui/TerminalUI.vue` template | MODIFY — badge, bar, dot, label, divider changes | 1-7 |
| `src/ui/TerminalUI.vue` CSS | MODIFY — new styles for all visual upgrades | 1-7 |
| `src/ui/TerminalUI.vue` JS | MODIFY — update `resourceIcon()` to return `abbr` | 1 |

---

## DESIGN NOTES

**Why badges and not better unicode?** We tested a "Sigil" approach using curated high-visibility unicode (▣, ▨, ▩). While the glyphs are geometrically bolder, they still rely on system font fallback. A player on Android might see boxes (□) where a desktop player sees proper symbols. Latin characters in VT323 are the only 100% predictable rendering path.

**Why not full emoji?** Some resources (rep_police, rep_exile) already use emoji (🛡️, 👁️). Emoji render well but at inconsistent vertical alignment across platforms, and they can't be color-tinted with CSS. The badge system provides unified alignment and per-resource color coding.

**Why keep ASCII bars in task cards?** Task progress bars are ephemeral — they fill once and reset. The ASCII aesthetic fits the "running an operation" feel of the scrapyard terminal. Resources, by contrast, are permanent tracked values that the player monitors constantly — they benefit from precision (smooth fill, val/max) over style.

**Why border-left accents?** Left-border color coding is a proven pattern in terminal UIs and IDE editors (VS Code, GitHub). It creates instant visual hierarchy without adding visual noise. The player learns: amber border = active operation, copper/red border = buildable upgrade, gray border = available but idle.

---

*Standalone. Zero engine changes. Pure visual layer. Every fix is CSS + template — no game.js, no runner.js, no data logic.*
