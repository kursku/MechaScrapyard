# Walkthrough: Frame Swapping & Parts Inventory

## Changes Made

### 1. [game.js](file:///c:/Users/nicol/dyad-apps/MechaScrapyard/src/game.js) — Core Logic
- **[equipFrame(frameId)](file:///c:/Users/nicol/dyad-apps/MechaScrapyard/src/ui/TerminalUI.vue#213-217)**: Swaps the active chassis. Auto-unequips structural parts whose `category_compat` doesn't include the new frame's category, and weapons from slots the new chassis doesn't have. Returns both to inventory.
- **[equipPart(slot, partItem)](file:///c:/Users/nicol/dyad-apps/MechaScrapyard/src/game.js#2447-2509)**: Installs an inventory part into a frame slot. Validates slot type, `category_compat`, and `weight` limits. Pushes the old part back to inventory.

### 2. [TerminalUI.vue](file:///c:/Users/nicol/dyad-apps/MechaScrapyard/src/ui/TerminalUI.vue) — Garage UI
Enhanced the existing tabbed Garage (FRAMES | PARTS | WEAPONS):

- **Frames Tab**: Added manufacturer icon, color, base stats (ATK/DEF/ENR), ◆ EQUIPPED badge
- **Parts Tab**: Fixed [equipPart](file:///c:/Users/nicol/dyad-apps/MechaScrapyard/src/game.js#2447-2509) call to pass full part object (was passing just ID). Added manufacturer branding with colored left border.
- **Weapons Tab**: Added manufacturer icon/color and category label
- **Manufacturer helpers**: [getMfrColor](file:///c:/Users/nicol/dyad-apps/MechaScrapyard/src/ui/TerminalUI.vue#230-234), [getMfrIcon](file:///c:/Users/nicol/dyad-apps/MechaScrapyard/src/ui/TerminalUI.vue#234-238), [getMfrName](file:///c:/Users/nicol/dyad-apps/MechaScrapyard/src/ui/TerminalUI.vue#238-242), `getPartMfrColor/Icon/Name/Style`

### 3. CSS
Added `.salvage-card` border-left accent, `.inventory-grid` layout, `.mfr-icon`, `.mfr-tag`, `.empty-state`

### 4. [itemPopup.vue](file:///c:/Users/nicol/dyad-apps/MechaScrapyard/src/ui/popups/itemPopup.vue)
Manufacturer tooltip banner was already implemented (`.popup-mfr-banner`).

---

## Verification

### Dev Server
Vite compiled clean, no errors.

### Browser Test Results

````carousel
![Frames Tab — shows all frames with manufacturer icons and EQUIP CHASSIS buttons](C:/Users/nicol/.gemini/antigravity/brain/2cacf590-a82a-4b22-88a2-e1fea9467b03/frames_tab.png)
<!-- slide -->
![Parts Tab — shows salvaged parts with manufacturer branding and EQUIP/DISMANTLE](C:/Users/nicol/.gemini/antigravity/brain/2cacf590-a82a-4b22-88a2-e1fea9467b03/parts_tab.png)
````

### Confirmed Working
- ✅ Frames display with manufacturer icons (隼 Hayabusa, ◇ Sora, ⚙ KZ, etc.)
- ✅ Stats comparison mini-row (ATK/DEF/ENR) on frame cards
- ✅ Currently equipped frame shows **◆ EQUIPPED** (disabled button)
- ✅ Parts display with manufacturer name + colored left border
- ✅ EQUIP + DISMANTLE buttons functional on part cards
- ✅ Weapons display with category label + manufacturer tag
- ✅ No console errors after full interaction test

![Browser recording of the Garage UI test](C:/Users/nicol/.gemini/antigravity/brain/2cacf590-a82a-4b22-88a2-e1fea9467b03/garage_ui_verification_1772011505823.webp)
