# Walkthrough — TerminalUI Refactor

I have successfully decomposed the monolithic [TerminalUI.vue](file:///c:/Users/nicol/dyad-apps/MechaScrapyard/src/ui/TerminalUI.vue) component into a modern, maintainable component-based architecture. This refactor follows the patterns observed in the Arcanum codebase, separating concerns and significantly improving code readability.

## Changes Overview

The [TerminalUI.vue](file:///c:/Users/nicol/dyad-apps/MechaScrapyard/src/ui/TerminalUI.vue) file has been reduced from ~2,600 lines to ~700 lines (including CSS), serving as a lean orchestration layer.

### 🧩 New Components
All panel-specific logic and templates have been moved to specialized components in `src/ui/sections/`:

- [FactionsPanel.vue](file:///c:/Users/nicol/dyad-apps/MechaScrapyard/src/ui/sections/FactionsPanel.vue) — Reputation and Vendor access.
- [CareerPanel.vue](file:///c:/Users/nicol/dyad-apps/MechaScrapyard/src/ui/sections/CareerPanel.vue) — Job management and promotion path.
- [WorkshopPanel.vue](file:///c:/Users/nicol/dyad-apps/MechaScrapyard/src/ui/sections/WorkshopPanel.vue) — Blueprint crafting and filtering.
- [ZonesPanel.vue](file:///c:/Users/nicol/dyad-apps/MechaScrapyard/src/ui/sections/ZonesPanel.vue) — City map and zone details.
- [MechaPanel.vue](file:///c:/Users/nicol/dyad-apps/MechaScrapyard/src/ui/sections/MechaPanel.vue) — Rig configuration, Hardware, and Inventory.
- [ScrapyardPanel.vue](file:///c:/Users/nicol/dyad-apps/MechaScrapyard/src/ui/sections/ScrapyardPanel.vue) — Android control and Base Infrastructure.
- [PilotPanel.vue](file:///c:/Users/nicol/dyad-apps/MechaScrapyard/src/ui/sections/PilotPanel.vue) — Stats, Skills, and Morality Compass.
- [OperationsPanel.vue](file:///c:/Users/nicol/dyad-apps/MechaScrapyard/src/ui/sections/OperationsPanel.vue) — Generic task categorization from the old monolith.
- [ResourceMonitor.vue](file:///c:/Users/nicol/dyad-apps/MechaScrapyard/src/ui/sections/ResourceMonitor.vue) — Left sidebar with Directive tracker and Resource rates.

### 🛠️ Shared Utilities
Shared logic has been moved to [uiHelpers.js](file:///c:/Users/nicol/dyad-apps/MechaScrapyard/src/ui/uiHelpers.js) to avoid duplication across panels:
- `renderBar`, `resourceIcon`, `fmtRate`, `formatName`, etc.

## Verification Results

### ✅ Automated Build
I ran `npm run build` after the final cleanup (Step Id: 485), and it passed successfully:
```text
✓ built in 5.17s
```

### ✅ Component Coordination
The [TerminalUI.vue](file:///c:/Users/nicol/dyad-apps/MechaScrapyard/src/ui/TerminalUI.vue) component now correctly coordinates the whole UI, passing necessary state as props and handling global actions (Header/Footer/Prestige).

## Before & After

````carousel
```javascript
// BEFORE (TerminalUI.vue - ~2600 lines)
// Monolithic methods for everything:
assignAndroid(id) { ... }
promoteJob() { ... }
getNetRate(res) { ... }
// Template with massive v-if/v-else-if chains
```
<!-- slide -->
```javascript
// AFTER (TerminalUI.vue - ~700 lines)
// Lean coordinator:
import MechaPanel from "./sections/MechaPanel.vue";
import ResourceMonitor from "./sections/ResourceMonitor.vue";
// Template:
<ResourceMonitor :state="state" />
<MechaPanel v-else-if="selectedCategory === 'mecha'" :state="state" />
```
````

> [!NOTE]
> The `CombatPanel.vue` remains unchanged as per the implementation plan, but it is now correctly integrated into the new `v-else-if` orchestration flow.
