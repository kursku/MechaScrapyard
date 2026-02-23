# Mecha Scrapyard — Manufacturer System Reference
## GDD Supplement: `manufacturers.json`

---

## 1. Architecture Decision

**`origin`** (existing) = mechanical tag. Drives compatibility, reverse engineering, loot tables, vendor filtering.
**`mfr`** (new field) = narrative identity. Drives UI flavor, tooltips, collection tracking, lore entries.

Both fields coexist. Multiple manufacturers can share an `origin`. The `mfr` field is optional — items without it default to "Unknown" in UI.

---

## 2. Data Contract: `manufacturers.json`

**Location:** `data/mecha/manufacturers.json`
**Registered in modules.json:** No (lookup table only, not TechTree-managed)
**Loaded by:** Helper utility `src/util/manufacturers.js`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | yes | Unique ID, used as `mfr` value in parts/weapons/frames |
| `name` | string | yes | Display name (English) |
| `nameLoc` | string|null | no | Localized name (kanji/hangul/etc.) |
| `nameRomanized` | string|null | no | Romanized pronunciation |
| `nation` | string | yes | `japanese`, `chinese`, `korean`, `european`, `international`, `stateless` |
| `type` | string | yes | `structural` (frames & parts) or `weapons` |
| `specialty` | string | yes | Human-readable description of what they make |
| `origins` | string[] | yes | Which `origin` values this mfr maps to (empty for weapon-only mfrs) |
| `categories` | string[] | yes | Frame categories they produce for (empty for weapon-only mfrs) |
| `tierRange` | [min, max] | yes | Tier range of their products |
| `color` | string | yes | Primary brand color (hex) for UI elements |
| `colorAlt` | string | yes | Secondary/dark brand color (hex) |
| `icon` | string | yes | Single character icon for compact UI |
| `slogan` | string|null | no | Corporate slogan (null for Phantom Works and Red Creek) |
| `desc` | string | yes | Full description for lore panel |
| `flavor` | string | yes | Short atmospheric text |
| `availability` | string | yes | `common`, `uncommon`, `rare`, `crafted`, `progressive` |
| `vendorLocation` | string | yes | Where to find their products |
| `statBias` | object | yes | Design guide for stat tendencies (NOT runtime multipliers) |
| `loreUnlock` | string | yes | Condition that reveals lore entry for this manufacturer |
| `notes` | string | yes | Designer notes (not shown to player) |

---

## 3. Integration: New `mfr` Field

### In Parts (`data/mecha/parts.json`)
```json
{
  "id": "torso_kz_industrial_mk1",
  "name": "KZ Industrial Torso Mk.I",
  "type": "frame_part",
  "slot": "torso",
  "origin": "labor",
  "mfr": "kz_industrial",
  ...
}
```

### In Weapons (`data/mecha/weapons.json`)
```json
{
  "id": "machine_gun_d6",
  "name": "MG-206 'Rattler'",
  "type": "weapon",
  "category": "short",
  "mfr": "shibata_arms",
  ...
}
```

### In Frames
```json
{
  "id": "frame_hayabusa_mk1",
  "name": "Hayabusa Mk.I",
  "category": "light",
  "mfr": "hayabusa_eng",
  ...
}
```

---

## 4. Helper Utility

**File:** `src/util/manufacturers.js`

```js
import mfrData from '@/data/mecha/manufacturers.json';

const MFR_MAP = Object.fromEntries(mfrData.map(m => [m.id, m]));

export function getMfr(id) {
  return MFR_MAP[id] || {
    id: 'unknown',
    name: 'Unknown',
    color: '#888',
    colorAlt: '#555',
    icon: '?',
    flavor: 'Origin unknown. No manufacturer markings found.'
  };
}

export function getMfrsByOrigin(origin) {
  return mfrData.filter(m => m.origins.includes(origin));
}

export function getMfrsByType(type) {
  return mfrData.filter(m => m.type === type);
}

export const ALL_MANUFACTURERS = mfrData;
```

---

## 5. Retroactive Mapping — Existing Items

### Weapons (from `weapons.json`)

| Existing ID | Existing Name | Assigned `mfr` | Rationale |
|-------------|--------------|----------------|-----------|
| `mech_fist` | Mech Fist | `null` | Generic/unbranded — it's just a hydraulic fist, no manufacturer |
| `machine_gun_d6` | MG-206 'Rattler' | `shibata_arms` | Standard-issue firearm, short category, Shibata's bread and butter |
| `heat_blade_d6` | ThermoEdge Mk.I | `taeyang_forge` | Heat blade = Taeyang specialty, Korean melee energy weapon |
| `shotgun_d6` | Scatterblast SG-4 | `shibata_arms` | Close-range firearm, short category, fits Shibata's catalog |
| `missile_pod_d8` | Valkyr Mk.I Salvo | `valletta_precision` | Shoulder-mount guided missiles, long category, precision ordnance |
| `piercing_lance_d8` | AP Lance 'Puncture' | `taeyang_forge` | Melee armor-piercing weapon, fight category, Korean forge work |

### Parts (from GDD examples)

| Existing ID | Existing Name | Assigned `mfr` | Rationale |
|-------------|--------------|----------------|-----------|
| `torso_kz_industrial_mk1` | KZ Industrial Torso Mk.I | `kz_industrial` | Already named after manufacturer |
| `arm_drone_manipulator` | Drone Manipulator Arm | `sora_motor` | Civilian drone part, mass-produced |
| `arm_police_servo_mk2` | Police Servo Arm Mk.II | `aegis_tac` | Police-grade standardized part |
| `legs_labor_hydraulic` | Labor Hydraulic Legs | `kz_industrial` | Industrial labor legs |

### Frames

| Existing ID | Existing Name | Assigned `mfr` | Rationale |
|-------------|--------------|----------------|-----------|
| `frame_hayabusa_mk1` | Hayabusa Mk.I | `hayabusa_eng` | Family legacy frame |

---

## 6. Origin × Manufacturer Matrix

```
                  KZ    Sora   Aegis  Kuroda  Phantom  Hayabusa  Daewon
                  Ind.  Motor  Tac    Heavy   Works    Eng.      Dyn.
  ─────────────────────────────────────────────────────────────────────
  labor           ███                                   
  civilian              ███                                       ███
  police                       ███                       
  military                            ███               
  exile                                       ███       
  custom                                               ███
```

Weapon manufacturers (Shibata, Taeyang, Valletta, Red Creek) operate independently of the origin system — weapons don't use `origin`, they use `category` (fight/short/long).

**Crossover exceptions:**
- KZ Industrial: produces fight weapons (d4-d6) — repurposed industrial tools
- Aegis-Tac: produces short weapons (tier 2-3) — standardized police sidearms
- Kuroda Heavy: produces long weapons (tier 4-5) — military-grade artillery

---

## 7. Availability Progression Map

```
GAME START ──────────────────────────────────────────────────── ENDGAME

Phase 1-2 (Scrapyard)     Phase 3 (Hub)          Phase 4-5 (Expansion)
┌──────────────────┐      ┌──────────────────┐   ┌──────────────────┐
│ KZ Industrial    │      │ Aegis-Tac        │   │ Kuroda Heavy     │
│ Sora Motor       │──────│ Daewon Dynamics  │───│ Phantom Works    │
│ Red Creek Arsenal│      │ Shibata (tier 2+)│   │ Valletta (tier4+)│
│ Shibata (tier 1) │      │ Taeyang (tier 2+)│   │ Kuroda weapons   │
│ Taeyang (tier 1) │      │ Valletta(tier 2-3)│  │                  │
└──────────────────┘      └──────────────────┘   └──────────────────┘

ALWAYS AVAILABLE: Hayabusa Engineering (crafted — scales with player)
```

---

## 8. Future Mechanic Hooks (Not for Sprint 1-2)

These features are enabled by the `mfr` field but should NOT be implemented now:

| Feature | Description | Trigger |
|---------|-------------|---------|
| **UI Tooltip** | Show mfr icon, color, name on item hover | `getMfr(item.mfr)` in tooltip component |
| **Lore Codex** | Unlock manufacturer lore entry on first acquisition | Check `loreUnlock` condition |
| **Set Bonus** | Full loadout of same mfr = small passive bonus | Count equipped items per mfr |
| **Vendor Affinity** | Buy frequently from one mfr → discount or tier unlock | Track purchases per mfr |
| **Mfr Knowledge** | Reverse engineering tracks per mfr (not just origin) | Extend knowledge system |
| **Brand Rivalry** | Narrative events: Kuroda vs Phantom, Shibata vs Taeyang | Event system triggers |

---

## 9. Naming Conventions

When creating new items for each manufacturer, follow these naming patterns:

| Manufacturer | Part Naming | Weapon Naming | Examples |
|---|---|---|---|
| KZ Industrial | `KZ [Function] [Mark]` | `KZ-[Number] [Nickname]` | KZ Dockyard Torso Mk.II, KZ-40 'Breaker' |
| Sora Motor | `Sora [Series]-[Number]` | N/A | Sora C-200 Commuter Legs |
| Aegis-Tac | `AT-[Number] [Codename]` | `AT-[Number] [Codename]` | AT-550 Watchdog Torso, AT-15 'Standard' |
| Kuroda Heavy | `Type [Number] [Codename]` | `Type [Number] [Codename]` | Type 88 Fortress Torso, Type 12 'Judgment' |
| Phantom Works | `[Abstract noun/concept]` | `[Abstract noun/concept]` | Paradox Core, Whisper Blade, Null Lance |
| Hayabusa Eng. | `Hayabusa [Part] [Mark]` | `Hayabusa [Nickname]` | Hayabusa Torso Mk.III, Hayabusa 'Tailwind' |
| Daewon Dynamics | `DW-[Series] [Name]` | N/A | DW-X9 Thermal Core, DW-S3 SenseGrid |
| Shibata Arms | N/A | `[Model]-[Number] '[Nickname]'` | MG-206 'Rattler', SG-4 'Scatterblast' |
| Taeyang Forge | N/A | `[Name] [Mark]` | ThermoEdge Mk.I, SolarFang Mk.II |
| Valletta Precision | N/A | `[Name] [Mark/Series]` | Valkyr Mk.I Salvo, Zenith SR-7 |
| Red Creek Arsenal | N/A | `RC-[Number] [Nickname or none]` | RC-44, RC-80 'Lucky Shot' |
