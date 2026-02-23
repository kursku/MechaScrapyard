# AI_RULES.md — Mecha Scrapyard

> Mandatory reference document for any AI/LLM working on this project.
> Read this ENTIRELY before generating code, suggesting changes, or making architectural decisions.
> Always check `docs/logs/implementation_plan.md` before structural changes.

---

## 1. DESIGN PHILOSOPHY

### Identity

- **Theme:** Cyberpunk / Industrial Mecha / Legacy
- **Aesthetic:** Terminal/ASCII UI. Monochrome neon green, scanlines, CRT-style distortion.
- **Tone:** Oppressive but opportunistic. Focus on survival, family legacy, and corporate vs. street pragmatism.
- **Narrative core:** Personal — about family, identity, and legacy. The grandfather is the emotional anchor. The father is a complex mystery, NOT a villain.

### No Magic Rule ⚠️

**Remove or remap ALL fantasy/magic metaphors from the original Arcanum engine.**
No trace of fantasy language may exist in code, data, or UI.

| Arcanum (FORBIDDEN) | Mecha Scrapyard (USE)         |
| ------------------- | ----------------------------- |
| Mana                | Energy                        |
| Spells              | Programs / Hacks              |
| Scrolls             | Data Chips / Schematics       |
| Arcana              | Tech Points / Research        |
| Potions             | Stimpacks / Boosters          |
| Enchanting          | Modding / Overclocking        |
| Dungeon             | District / Zone / Facility    |
| Monster             | Hostile / Rival Mecha / Drone |
| Wizard              | Pilot / Netrunner             |
| Magic School        | Skill Tree / Specialization   |
| Spell School        | Hack Suite / Combat Module    |
| Familiar / Minion   | Drone / Sub-system            |
| Gold                | Creds                         |
| Gems                | Components                    |
| Herbs               | Salvage / Bio-material        |
| Wand / Staff        | Interface / Neural Link       |

### Decision Making

When in doubt about a design decision:

- Favor **Pragmatism** for system efficiency (clean code, performance, reuse)
- Favor **Idealism** for narrative depth (lore, characters, meaningful choices)
- This mirrors the game's own morality system.

---

## 2. CORE MECHANICS STANDARDS

### 2.1 d100 System

All active checks (combat, hacking, investigation) use the d100 system:

- **Implementation:** `src/util/d100.js`
- **Rule:** Roll ≤ target percentage = success
- **Criticals:** 1–5 = critical success, 96–100 = critical failure
- **Fail Forward:** ALWAYS grant minimum rewards on failure (data fragments, scrap, minimal XP)
- **Idle adaptation:** Batch rolling — execute N rolls per tick for background tasks

### 2.2 Bipolar Morality

Idealist (+) ↔ Pragmatic (-) axis. This is NOT good vs. evil.

- **Implementation:** `src/values/BipolarStat.js` (extends Arcanum `Stat`)
- **Range:** [-100, +100]
- **Idealist (≥+30):** Constructive, altruistic → "greater good" missions, diplomacy, honest allies
- **Pragmatic (≤-30):** Opportunistic, survivalist → black market, dangerous allies, hacking
- **Neutral:** Flexibility without extreme benefits
- **In require:** `"g.morality>=30"` (idealist) / `"g.morality<=-30"` (pragmatic)

### 2.3 Primary Attributes (6)

ALWAYS respect the 6 primary attributes:

| ID         | Name     | Governs                                 |
| ---------- | -------- | --------------------------------------- |
| `neuro`    | Neuro    | Hacking, logic, tech                    |
| `muscle`   | Muscle   | Raw power, mecha combat, heavy handling |
| `reflex`   | Reflex   | Agility, evasion, reaction              |
| `grit`     | Grit     | Survival, resilience, HP                |
| `charisma` | Charisma | Influence, diplomacy, bargaining        |
| `focus`    | Focus    | Crafting, research, idle efficiency     |

`Focus` is especially important: it governs idle loop efficiency (mods on production rates).

### 2.4 Skill Trees (7)

4 mastery tiers each: Basic → Advanced → Expert → Master

| Tree                  | Related To                           |
| --------------------- | ------------------------------------ |
| Resource Gathering    | Collecting, scavenging, salvage      |
| Mecha Upgrades        | Assembly, maintenance, customization |
| Combat                | Mecha combat, weapons, defense       |
| Hacking & Cybernetics | Netrunning, programs, cyberware      |
| Investigation         | Clues, analysis, deduction           |
| Crafting & Research   | Fabrication, blueprints, tech        |
| Social Influence      | Diplomacy, intimidation, trade       |

### 2.5 Career Paths (4)

Each career branches by morality:

1. **Police Force** — investigation, access to internal records
2. **Merchant (Scrapyard)** — trade, base expansion
3. **Netrunner** — hacking, digital underworld
4. **Arena Fighter** — mecha gladiator, combat

---

## 3. ARCHITECTURE — DATA-DRIVEN (GOLDEN RULE)

### All game content is defined in DATA, not in code

Code in `src/` is the generic engine. JSONs in `data/mecha/` are the game.

```json
CORRECT:  { "id": "new_task", "require": "g.refinery>0", ... }    ← data
WRONG:    if (upgrades.refinery.owned > 0) { showNewTask(); }      ← hardcoded logic
```

### 3.1 Arcanum Core — What to Use

- **Inherit from `GData`** for any new game item
- **Use the `Stat` class** from Arcanum for all numeric properties (supports mods and scaling natively)
- **TechTree** (`techTree.js`) — copy as-is, cascading unlock system
- **Runner** (`modules/runner.js`) — active task management
- **DataLoader** (`dataLoader.js`) — JSON data loading
- **Game Loop** (`game.js`) — update tick system
- **GameState** (`gameState.js`) — central state + save/load

### 3.2 Clean Engine ⚠️

**DO NOT import or use files from the original Arcanum "magic" modules.**

Forbidden to use directly:

- `data/spells.json`, `data/enchants.json`, `data/potions.json`
- `data/reagents.json`, `data/stressors.json`
- `data/modules/pyromancer/`, `data/modules/duelist/`
- Any file with references to magic, sorcery, or arcana

If equivalent functionality is needed, **create a cyberpunk version from scratch** in `data/mecha/`.

### 3.3 Project Structure (Target)

MechaScrapyard/
├── src/ # ENGINE: Vue/JS logic
├── data/ # HEART: Game content (JSON)
├── css/ # SKIN: Terminal aesthetic
├── docs/ # BRAIN: Documentation
│ ├── gdd/ # Game Design Documents
│ ├── specs/ # Implementation Specifications
│ └── logs/ # Progress logs & current plan
├── AI_RULES.md # This file (The LAW)
├── README.md # Project overview
└── index.html # Entry point

```text
MechaScrapyard/
├── src/                  # ENGINE: Vue/JS logic
├── data/                 # HEART: Game content (JSON)
├── css/                  # SKIN: Terminal aesthetic
├── docs/                 # BRAIN: Documentation
│   ├── gdd/              # Game Design Documents
│   ├── specs/            # Implementation Specifications
│   └── logs/             # Progress logs & current plan
├── AI_RULES.md           # This file (The LAW)
├── README.md             # Project overview
└── index.html            # Entry point
```

- **Engine:** Vue 3 + Vite (same as Arcanum)
- **Prototyping:** React JSX (temporary, for rapid iteration in artifacts)
- **Data format:** JSON
- **Style:** `css/mecha_terminal.css` (terminal aesthetic)
- **Tick rate:** 200ms (`TICK_MS`) — ~5 FPS

---

## 4. DATA PATTERNS

### 4.1 Item Anatomy

All items inherit from `GData` and follow this base structure:

```javascript
{
  id: "unique_snake_case",     // Unique identifier
  name: "Display Name",        // Player-facing name
  desc: "Functional desc.",    // What it does (gameplay)
  flavor: "Lore text.",        // Narrative flavor (tooltip, italic)
  tips: "How to use this.",    // Gameplay hint (tooltip)
  locked: true,                // Initial visibility
  require: "g.X>0&&g.Y>=5",   // Unlock condition (TechTree)
  tags: "t_tagname",           // Tags for grouping/filtering
  group: "category",           // UI grouping
  icon: "⚙",                  // Visual icon (1–2 chars)
  color: "#hex",               // Thematic color
  mod: { "stat.prop": value }, // Modifiers applied while active/owned
  // ... type-specific fields
}
```

### 4.2 Resources

```javascript
{
  id: "scrap", name: "Scrap Metal",
  val: 0, max: 100, rate: 0,          // Stat properties (val, max, rate)
  group: "base", locked: false,
  icon: "⚙", color: "#0fa",
  desc: "Raw salvageable metal.",
  flavor: "One man's trash is another man's mecha.",
}
```

Groups: `player`, `base`, `currency`, `refined`

Rule: ALL val modifications MUST use `clamp(val, 0, max)`.

### 4.3 Tasks

```javascript
// Perpetual (idle)
{ perpetual: true, run: { energy: 0.15 }, effect: { scrap: 0.6 } }

// Timed
{ perpetual: false, cost: { energy: 5 }, result: { creds: 8 }, length: 10 }
```

| Field       | Type   | Description                                     |
| ----------- | ------ | ----------------------------------------------- |
| `cost`      | object | One-time cost paid on start                     |
| `run`       | object | Ongoing cost per second                         |
| `effect`    | object | Ongoing production per second                   |
| `result`    | object | One-time reward on completion                   |
| `length`    | number | Duration in seconds (timed tasks)               |
| `loot`      | object | `{ blueprint_id: chance }` — drop on completion |
| `perpetual` | bool   | Whether it runs indefinitely                    |

### 4.4 Upgrades

```javascript
{
  cost: { scrap: 60, creds: 40 },
  max: 1,                              // single purchase (or N for repeatable)
  owned: 0,
  mod: { "energy.max": 20 },          // permanent bonus
  costScale: 1.5,                      // cost × (scale ^ owned) per level
  unlockText: "Unlocks: ...",          // informational for tooltip
  log: "Narrative message.",           // appears in log on purchase
}
```

### 4.5 Mods (Modifiers)

Format: `"resource.property": additive_value`

```javascript
mod: {
  "scrap.max": 50,     // +50 to scrap max
  "scrap.rate": 0.1,   // +0.1/s to scrap production
  "energy.max": 20,    // +20 to energy max
}
```

Mods are ALWAYS additive. `"scrap.max": 50` ADDS 50, does NOT set to 50.
Properties: `val`, `max`, `rate` (and future combat stats).
Mods are removed when the item is lost/unequipped.

### 4.6 Blueprints (Earn → Learn → Produce)

```javascript
// Purchasable at the Market
{ id: "bp_ceramite", cost: { creds: 75 }, unlocks: "ceramite",
  require: "g.refinery>0" }

// Exploration loot
{ id: "bp_nanofiber", cost: null, unlocks: "nanofiber",
  foundVia: "search_neon_bazaar" }
```

Flow: Acquire blueprint → TechTree unlocks resource + recipe automatically.

### 4.7 Recipes

```javascript
{
  cost: { scrap: 25, nano_infra: 3 },
  result: { ceramite: 1 },
  length: 12,
  require: "g.bp_ceramite>0",
}
```

The Refinery operates independently from the active task (runs in parallel).

### 4.8 Require System

In the final engine, `require` is a string evaluated as an expression:

```text
"g.scrap>=50"                         // resource >= value
"g.refinery>0"                        // upgrade purchased
"g.refinery>0&&g.scrap>=100"          // AND
"g.job_police>0||g.charisma>=8"       // OR
"g.morality>=30"                      // idealist morality
"g.player.level>=5"                   // player level
```

NEVER create unlock logic outside the `require` field.

---

## 5. WORLD & NARRATIVE

### 5.1 New Tokyo — 7 Districts

1. **Downtown District** — corporate power + street life
2. **Slums & Black Market** — survival of the fittest, Neon Bazaar
3. **Industrial Wasteland** — toxic ruins, abandoned factories
4. **High-Tech Corporate Zone** — pristine skyscrapers, total surveillance
5. **Cybernetic Research Facility** — cybernization experiments
6. **Underworld Arena** — mecha gladiator colosseum
7. **The City's Nexus** — data center, the truth about the father

### 5.2 Factions (4)

- **Corporations** — dominant elite with private armies
- **Police Force** — fragmented by corruption (father was a member)
- **The Underground** — hackers, rebels, smugglers
- **Survivors & Exiles** — Slums and Wasteland inhabitants

### 5.3 Scrapyard Phases (5)

1. **Abandoned Beginnings** — dust, rust, broken tools
2. **Functional Outpost** — lights work, sorting operational
3. **Restored Hub** — active forges, research, partial hangar
4. **Advanced Production** — operational hangar, refinery, cyber workbench
5. **Legendary Legacy** — AI workshop, father's secret laboratory

### 5.4 Narrative Rules

- The grandfather is a mentor and anchor. Treat with respect and humanity.
- The father is complexity, NOT villainy. The investigation reveals layers.
- The scrapyard is HOME, not just a base of operations.
- Flavor text has personality: dry humor, cyberpunk slang, character.
- Dialogue choices must have REAL consequences (morality, factions, unlocks).

---

## 6. UI/UX — TERMINAL AESTHETIC

### 6.1 Rules

- **Font:** ALWAYS monospace (`'Courier New', 'Lucida Console', monospace`)
- **CSS:** Defined in `css/mecha_terminal.css`
- **Backgrounds:** Dark greenish tones (`#0a0e0d`, `#060b09`, `#080d0b`)
- **Borders:** `1px solid #1a3a2a` — no border-radius, EVER
- **Scanlines:** `repeating-linear-gradient` overlay for CRT effect
- **ASCII art** for visual feedback where possible
- **FORBIDDEN:** border-radius, soft shadows, colorful gradients, sans-serif fonts, colored emojis

### 6.2 Color System

```text
Primary / Success:    #0fa  (neon green)
Errors:               #f44  (red)
Narrative / Story:    #8cf  (light blue)
Loot / Rare:          #f0a  (magenta)
Upgrades:             #ff0  (yellow)
Player actions:       #4a8  (dark green)
System / Meta:        #444  (gray)
Tips:                 #6a8a6a (grayish green)
Disabled:             #333
```

Resource colors by group:

- `player` → `#0af` (blue)
- `base` → `#0fa` (green)
- `currency` → `#ff0` (yellow)
- `refined` → `#a6f` / `#f80` / `#f0a` (per material)

### 6.3 Tooltips

Every interactive element MUST have a tooltip with:

1. **Name** — thematic color, bold
2. **Description** — functional gameplay text
3. **Flavor** — italic, color `#5a7a6a`, in quotes
4. **Stats** — costs (green = affordable, red = can't), effects, duration
5. **Contextual hint** — sustainable time, capacity warnings, etc.

### 6.4 Layout

```text
┌──────────────────────────────────────────┐
│ HEADER: Title + location + version       │
├──────────────────────────────────────────┤
│ RESOURCE BAR: Visible resources (hover)  │
├──────────────────────────┬───────────────┤
│ LEFT: Tabs + Content     │ RIGHT: Log    │
│ [Dynamic tabs]           │ [System log]  │
│ [DETAILS] toggle         │ [Clock/tick]  │
│ [Scrollable content]     │               │
└──────────────────────────┴───────────────┘
```

Dynamic tabs: SCRAPYARD and UPGRADES always visible.
REFINERY, MARKET, COMBAT, MAP appear based on progression (`sections.json`).

### 6.5 Bars

- **Resources:** ASCII `"█".repeat(filled) + "░".repeat(empty)`
- **Task progress:** CSS gradient `linear-gradient(90deg, #0a4, #0fa)`

---

## 7. CODE CONVENTIONS

### 7.1 Naming

| Context              | Format                 | Example            |
| -------------------- | ---------------------- | ------------------ |
| Data IDs             | `snake_case` (English) | `scrap_compressor` |
| Display names        | Title Case (English)   | `"Scrap Metal"`    |
| JS variables         | `camelCase`            | `activeTask`       |
| Vue/React components | `PascalCase`           | `ResourceTooltip`  |
| Global constants     | `UPPER_SNAKE`          | `TICK_MS`          |
| Data files           | `snake_case.json`      | `resources.json`   |

### 7.2 Data Stores

Objects indexed by ID (O(1) access), NOT arrays:

```javascript
// CORRECT — access: tasks["scavenge_scrap"]
const TASKS = {
  scavenge_scrap: { id: "scavenge_scrap", ... },
};

// WRONG — access: tasks.find(t => t.id === "scavenge_scrap")
const TASKS = [
  { id: "scavenge_scrap", ... },
];
```

### 7.3 Immutable State (React prototype)

```javascript
// CORRECT
setResources((prev) => ({ ...prev, [k]: { ...prev[k], val: newVal } }));

// WRONG — direct mutation
resources[k].val = newVal;
```

In the final Vue engine, use `reactive()` with equivalent care.

### 7.4 Number Formatting

Use `fmt()`:

- `≥10000` → `"10.0k"`
- `≥100` → `"100"`
- `≥10` → `"10.5"`
- `<10` → `"0.30"`

### 7.5 Texts & Localization

- **Gameplay text** (names, desc, tips): English ONLY
- **Flavor text**: English with cyberpunk slang/jargon
- **IDs**: English snake_case
- **Code comments**: Portuguese or English
- **Docs** (GDD, AI_RULES): English or bilingual
- Prepare for i18n by separating strings

---

## 8. CONTENT CREATION CHECKLISTS

### ✏️ New Resource

- [ ] Entry in `data/mecha/resources.json` with ALL fields
- [ ] If refined: `locked: true` + `unlockHint`
- [ ] Corresponding blueprint in `blueprints.json`
- [ ] Corresponding recipe in `recipes.json`
- [ ] Color does not conflict with existing resources
- [ ] Follow the No Magic table (§1)

### ✏️ New Task

- [ ] Entry in `data/mecha/tasks.json`
- [ ] `group` defined (scrapyard, income, exploration, combat, hacking)
- [ ] `require` + `requireText` if locked
- [ ] `tips` explaining the mechanic
- [ ] `flavor` with narrative tone
- [ ] Balance: energy sustainable for ≥30s under normal conditions

### ✏️ New Upgrade

- [ ] Entry in `data/mecha/upgrades.json`
- [ ] `mod` with modifiers
- [ ] `unlockText` explaining what it unlocks
- [ ] `log` with narrative message
- [ ] `require` chain makes sense in progression
- [ ] If `max > 1`: define `costScale` (default 1.5)

### ✏️ New Enemy

- [ ] Entry in `data/mecha/enemies.json`
- [ ] Stats using Arcanum's `Stat` class
- [ ] HP per mecha part (Core, Head, Torso, L.Arm, R.Arm, L.Leg, R.Leg)
- [ ] Loot table defined
- [ ] Flavor text with personality
- [ ] NO fantasy terminology (see table §1)

### ✏️ Documentation

- [ ] New system? Create design docs in `docs/gdd/`
- [ ] Implementing? Follow/Create spec in `docs/specs/`
- [ ] Update progress? Add entry to `docs/logs/`
- [ ] Root is for code/config only (declutter active)

---

## 9. ARCANUM REFERENCE

### 9.1 Reusable Systems

| System     | File                     | Status                        |
| ---------- | ------------------------ | ----------------------------- |
| Game Loop  | `game.js`                | ✅ Reuse                      |
| Runner     | `modules/runner.js`      | ✅ Reuse                      |
| TechTree   | `techTree.js`            | ✅ Reuse                      |
| Resources  | `game.js:doResources`    | ✅ Reuse                      |
| DataLoader | `dataLoader.js`          | ✅ Reuse                      |
| Mod System | `game.js:updateTechTree` | ✅ Reuse                      |
| Save/Load  | `gameState.js`           | ✅ Reuse                      |
| Inventory  | `inventories/`           | ✅ Reuse                      |
| GData base | `items/base.js`          | ✅ Reuse                      |
| Stat class | `values/rvals/stat.js`   | ✅ Reuse                      |
| Combat     | `composites/combat.js`   | 🔧 Adapt (d100 + mecha parts) |
| Explore    | `composites/explore.js`  | 🔧 Adapt (districts)          |
| Skills     | `items/skill.js`         | 🔧 Adapt (7 trees)            |
| Homes      | `data/homes.json`        | 🔧 Adapt (scrapyard phases)   |
| Classes    | `data/classes.json`      | 🔧 Adapt (4 careers)          |

### 9.2 New Systems (not in Arcanum)

| System         | Target File                 | Notes                                  |
| -------------- | --------------------------- | -------------------------------------- |
| d100 Rolls     | `src/util/d100.js`          | Roll ≤ target, criticals, fail-forward |
| Morality       | `src/values/BipolarStat.js` | Extends Stat, range [-100, +100]       |
| Prestige       | `src/modules/prestige.js`   | Voluntary reset + permanent bonuses    |
| Careers        | `data/mecha/careers.json`   | 4 paths × moral branching              |
| Dialogues      | `data/mecha/dialogues.json` | Choices → morality + factions          |
| Factions       | `data/mecha/factions.json`  | Reputation tracking, 4 factions        |
| Mecha Parts HP | `src/chars/mechaChar.js`    | Core, Head, Torso, Arms, Legs + Heat   |

---

## 10. SPRINT ROADMAP

### Sprint 1 ✅ — Core Idle Loop

- [x] Game loop 200ms tick
- [x] Resources (scrap, creds, energy)
- [x] Tasks (perpetual + timed)
- [x] Upgrades with mods
- [x] Terminal UI + system log

### Sprint 1.5 ✅ — Resources + Blueprints + UX

- [x] Blueprint system (Earn → Learn → Produce)
- [x] Refinery + recipes
- [x] Refined materials (nano_infra, ceramite, nanofiber)
- [x] Tooltips on everything
- [x] Flavor text + lore
- [x] Expandable resource panel

### Sprint 2 — Player Base (NEXT)

- [ ] Scrapyard 5 phases
- [ ] Structures as furniture (Workshop, Garage, Hangar)
- [ ] Story event: discover father's mecha
- [ ] Phase-gated unlocks

### Sprint 3 — Character

- [ ] 6 primary attributes
- [ ] 7 skill trees, 4 mastery levels
- [ ] Skill points from leveling/missions
- [ ] Morality system (BipolarStat)

### Sprint 4 — Combat

- [ ] d100 roll system
- [ ] Idle combat with mecha part HP
- [ ] Heat system
- [ ] Fail-forward rewards
- [ ] First enemies

### Sprint 5 — World

- [ ] Explorable districts
- [ ] Dialogue system with moral choices
- [ ] Faction reputation
- [ ] NPCs

### Sprint 6 — Meta-Progression

- [ ] 4 careers with moral branching
- [ ] Prestige ("Respect") system
- [ ] Final arc (Nexus + father's truth)
- [ ] Balancing + polish

---

## 11. COMMON MISTAKES

### ❌ NEVER

- Create unlock logic outside the `require` field
- Mutate state directly (always create new objects)
- Import Arcanum magic/fantasy modules
- Use fantasy terminology (see No Magic table §1)
- Use border-radius, sans-serif fonts, or soft shadows
- Hardcode values in the engine (put them in data JSONs)
- Use `setInterval` in child components (only the main game loop has a timer)
- Write generic flavor text without personality
- Use `localStorage` (doesn't work in Claude artifacts)
- Make structural changes without checking `docs/logs/implementation_plan.md`
- Put new documentation files in the root folder (use `docs/` subfolders)

### ✅ ALWAYS

- Read this entire document before starting
- Use the `require` field for ALL progression logic
- Include `desc`, `flavor`, `tips` in new items
- Verify tooltips render correctly
- Follow the color palette (§6.2)
- Use `clamp()` on ALL resource modifications
- Check that unlock chains make narrative sense
- Inherit from `GData` for new item types
- Use the `Stat` class for numeric properties
- Keep `data/mecha/` clean and organized

---

## 12. GLOSSARY

| Term             | Definition                                                               |
| ---------------- | ------------------------------------------------------------------------ |
| **Scrapyard**    | Player base. Evolves through 5 phases.                                   |
| **Scrap**        | Base resource. Collected by scavenging.                                  |
| **Creds**        | New Tokyo digital currency.                                              |
| **Blueprint**    | Schematic that unlocks a refinement recipe.                              |
| **Mod**          | Additive numeric modifier on a resource/stat property.                   |
| **Require**      | Condition string that must be met to unlock an item.                     |
| **TechTree**     | System that monitors changes and cascades unlocks.                       |
| **Runner**       | System that manages active tasks (Arcanum `runner.js`).                  |
| **GData**        | Base class for all game items (Arcanum `items/base.js`).                 |
| **Stat**         | Numeric property class supporting mods (Arcanum `values/rvals/stat.js`). |
| **Perpetual**    | A task that runs indefinitely until stopped.                             |
| **Rate**         | Per-second production/consumption of a resource.                         |
| **Tick**         | One game loop cycle (200ms).                                             |
| **Prestige**     | Voluntary reset granting permanent bonuses.                              |
| **d100**         | Percentile roll system (roll ≤ target = success).                        |
| **Fail-forward** | Design where even failures grant minimum rewards.                        |
| **BipolarStat**  | Morality axis class, range [-100, +100].                                 |

---

_Last updated: Sprint 1.5 — v0.1.5_
_Maintained by: Charles (SB Studio)_
_Merged from: Original AI_RULES (Antigravity) + Expanded AI_RULES (Claude)_
