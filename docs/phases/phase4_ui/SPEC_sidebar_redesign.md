# SPEC — Sidebar Resource Redesign

**Phase:** 4-UI — Spec 6 of 7
**Area:** ResourceMonitor / Sidebar / Header
**Priority:** 🟠 HIGH — Sidebar required excessive scrolling, wasted space
**Status:** ✅ COMPLETE

---

## PROBLEM

The sidebar (`ResourceMonitor.vue`) displayed all resources as a flat list requiring 15+ rows and significant scrolling. Repetitive reputation entries, a fixed 260px width, and the directive tracker consumed valuable sidebar space.

## SOLUTION

### 6.1 Flex-Width Sidebar

| Property | Before | After |
|----------|--------|-------|
| Grid column | `minmax(220px, 260px)` | `clamp(260px, 18vw, 360px)` |
| `.side-panel` width | `260px` | `100%` |
| `clip-path` | Present (clipping content) | Removed |

### 6.2 Collapsible Resource Sections

Resources reorganized into logical groups with toggle headers:

| Section | Layout | Default State |
|---------|--------|---------------|
| **Core** (Energy, Scrap, Creds, Chips) | Full rows with progress bars | Always visible |
| **Space** | Single row | Always visible |
| **Refined** (Mecha Parts, Nano, Armor, Fabric) | 2×2 compact tile grid | Collapsed |
| **Combat** (Glory, Supply) | Inline side-by-side row | Collapsed |
| **Reputation** (5 factions) | Colored badge pairs | Collapsed |

**Result:** ~15 rows → ~7 visible rows in collapsed state.

### 6.3 Directive Tracker → Header Bar

Moved from sidebar to header as a compact inline element:

```
▶ Build the Sorting Station. [0/1] ████░░░░░
```

Header updated to `flex-wrap: wrap` to accommodate the new directive row below the main header content.

## VERIFICATION CRITERIA

- [x] Collapsible sections toggle correctly
- [x] Core resources always visible without scrolling
- [x] Sidebar width adapts to viewport
- [x] Directive renders in header with progress bar
- [x] Refined 2×2 tile grid displays correctly
- [x] Reputation shows as compact colored badges

## FILE REFERENCE

| File | Action |
|------|--------|
| `src/ui/sections/ResourceMonitor.vue` | REWRITE — collapsible sections, compact grids, badge rows |
| `src/ui/TerminalUI.vue` | MODIFY — grid flex width, directive computed + header template + CSS |
| `css/mecha_terminal.css` | MODIFY — `.side-panel` width: 100%, remove clip-path |
