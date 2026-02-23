# Mecha Scrapyard — Parts Catalog Reference
## GDD Supplement: Complete `parts.json`

---

## 1. Catalog Overview

**Total items:** 34
- Structural parts: 29 (10 torso, 10 arm, 9 legs)
- Backpack utilities: 5
**Manufacturers:** 7 (Sora, KZ, Red Creek, Daewon, Aegis-Tac, Phantom Works, Kuroda)
**Note:** Hayabusa Engineering parts are player-crafted and not in this catalog. Crafted parts inherit `mfr: "hayabusa_eng"` and stats defined at crafting time.

---

## 2. Design Philosophy

### The Frankenstein Rule in Action

The GDD states: "A police torso with labor arms and military legs is not only possible — it's the *expected* playstyle." This catalog makes every mix-and-match combination viable while creating clear tradeoff identities per manufacturer.

### Three Dimensions of Part Choice

```
DURABILITY ←————————→ WEIGHT
(hp, integrity, armor)  (weight, frame compat)

SURVIVABILITY ←————————→ UTILITY
(raw stats)              (special properties, heatMod)

AVAILABILITY ←————————→ QUALITY
(price, reputation gates)  (tier, stats)
```

### Slot Identity

| Slot | Strategic Role | Key Tradeoff |
|---|---|---|
| **Torso** | The core. Defines durability ceiling and heat profile. Most integrity levels. | HP/armor vs heatMod vs weight |
| **Arm** | The weapon platform. Accuracy bonuses live here. Destruction = weapon loss. | Accuracy/special vs durability |
| **Legs** | The mobility platform. Initiative and evasion bonuses. Destruction = immobilization. | Speed/initiative vs armor |
| **Backpack** | The utility slot. Doesn't compete with weapons. Pure customization. | Which weakness to patch |

---

## 3. Manufacturer Identity in Parts

| Manufacturer | Parts Identity | Stat Signature |
|---|---|---|
| **Sora Motor** | Cheap, light, accessible. The baseline. | Low HP/armor, low weight, slight heatMod bonus |
| **KZ Industrial** | Tanky, heavy, industrial. The durability option. | Highest HP/armor in tier, highest weight, neutral-to-bad heatMod |
| **Red Creek** | Dirt cheap, compromised quality. The placeholder. | Below-average stats, below-average integrity, lowest prices |
| **Daewon Dynamics** | Tech-focused, thermally superior. The cooling specialist. | Best heatMod in the game, low HP/armor, unique specials |
| **Aegis-Tac** | Reliable, balanced, police-gated. No weaknesses. | Above-average across the board, accuracy specials |
| **Phantom Works** | Extreme tradeoffs, unique properties. The exotic option. | Universal compat, low base stats, unique specials |
| **Kuroda Heavy** | Military-grade endgame. The best stats, the highest cost. | Best everything, heaviest, most expensive |

---

## 4. Torso — The Core (10 parts)

The torso defines the frame's durability ceiling, houses the cockpit, and links to shoulder and backpack slots. Torso destruction = frame destroyed.

### Progression

| Tier | Budget | Standard | Premium |
|---|---|---|---|
| 1 | RC Patchwork (12¢, 2 int) | Sora C-100 (15¢, light) / KZ Mk.I (25¢, medium+) | — |
| 2 | Sora M-300 (35¢, light) | KZ Mk.II (45¢, heavy) | DW-X5 Thermal (55¢, -8 heat) |
| 3 | AT-440 Patrol (70¢) | Paradox Core (90¢, regen) | DW-X9 CryoCore (100¢, -12 heat) |
| 4 | — | — | Type 88 Fortress (160¢, 220 total HP) |

### Key Decisions

**Early game:** Sora C-100 (light, cheap) vs KZ Mk.I (medium+, durable). First real parts choice.

**Mid game:** DW-X5 Thermal (-8 heatMod) enables Taeyang heat weapons. Trade durability for thermal freedom.

**Late game:** DW-X9 CryoCore (-12 heatMod, never overheat) vs Type 88 Fortress (220 total HP, never die).

**Wildcard:** Paradox Core (regen_1) — 20 HP regen in a 20-turn combat. Weak on paper, interesting in practice.

---

## 5. Arms — The Weapon Platform (10 parts)

Arms are generic — same part fits `left_arm` or `right_arm`. Players buy arms in pairs or mix two different arms. Arm destruction disables the linked hand weapon.

### The Accuracy Economy

| Arm | Accuracy | Trade-off | Best For |
|---|---|---|---|
| Drone Manipulator | +3% | Light-only, 18 HP, tier 1 | Early Light sniper builds |
| AT-220 Patrol | +5% | Medium-only, police-gated | Shibata + Sentinel builds |
| DW-N3 Neural | +5% | Light/Medium, 1 integrity | Wraith + Valletta builds |
| Type 44 Assault | +5% | Heavy-only, tier 4, 120¢ | Fortress + Zenith Absolute builds |

**Asymmetric arms:** Drone Manipulator (left, sniper) + Sora C-100 (right, melee). Different arms, different roles.

**Glitch Arm:** The only arm with a combat token property. `emp_melee_10` + DW-E4 'Glitch' = 45% ERROR chance per hit.

---

## 6. Legs — The Mobility Platform (9 parts)

Destruction = immobilization (-50% combat speed, can't flee). Two exclusive special types: initiative and evasion.

### Initiative vs Evasion

| Legs | Property | Effect | Philosophy |
|---|---|---|---|
| RC Sprinter | initiative_1 | +1 initiative | Strike first (cheap) |
| Ghost Step | initiative_2 | +2 initiative | Strike first (premium) |
| DW-H2 Hover | evasion_5 | 5% dodge | Don't get hit (0 armor) |

**Initiative** rewards burst builds. **Evasion** rewards sustained builds. Both are glass cannon options.

---

## 7. Backpack Utilities (5 items)

| Utility | Effect | Best For |
|---|---|---|
| **Extra Coolant Tank** | heatCap +15 | Energy weapon builds |
| **Ammo Crate** | +5 Supply | Heavy frames (0.7-0.8× efficiency) |
| **Field Repair Kit** | 10 HP post-combat | Light frames (reduces maintenance) |
| **DW-S3 SenseGrid** | +5% accuracy | Accuracy stacking builds |
| **DW-C1 Neural Dampener** | stressPerTurn -0.2 | Wraith/Leviathan builds |

---

## 8. Special Properties System

| Property | Effect | Found On |
|---|---|---|
| `accuracy_3` | +3% accuracy (linked hand) | Drone Manipulator |
| `accuracy_5` | +5% accuracy (linked hand) | AT-220, DW-N3, Type 44 |
| `regen_1` | +1 HP/turn auto-repair | Paradox Core |
| `initiative_1` | +1 initiative | RC Sprinter |
| `initiative_2` | +2 initiative | Ghost Step |
| `evasion_5` | 5% dodge chance | DW-H2 Hover |
| `emp_melee_10` | +10% ERROR on melee | Glitch Arm |

---

## 9. Category Compatibility Coverage

| Category | Torso | Arm | Legs | Total | Identity |
|---|---|---|---|---|---|
| **Light** | 4 | 5 | 5 | 14 | Fewer choices, more specials |
| **Medium** | 9 | 8 | 7 | 24 | Most flexible (sweet spot) |
| **Heavy** | 5 | 5 | 3 | 13 | Focused on raw power |

---

## 10. Example Loadouts

### "The Phantom" — Light sustained farming
- Frame: Sora Courier / Torso: Sora C-100 / Arms: Drone Manipulator ×2 / Legs: Sora C-100 / Backpack: Field Repair Kit
- **heatMod: -5** | Cost: ~75¢

### "The Grinder" — Medium tank
- Frame: KZ Ironback / Torso: KZ Mk.II / Arms: KZ-7 Reinforced ×2 / Legs: KZ-7 Heavy-Duty / Backpack: Ammo Crate
- **Total HP: 420** | heatMod: +4

### "The Scalpel" — Glass cannon sniper
- Frame: Wraith / Torso: DW-X5 / Arms: DW-N3 ×2 / Legs: DW-H2 Hover / Backpack: Neural Dampener
- **heatMod: -21** | accuracy: +10% | stress: 0.2/turn effective

### "The Fortress" — Endgame heavy
- Frame: Type 90 / Torso: Type 88 / Arms: Type 44 ×2 / Legs: Type 66 / Backpack: Coolant Tank
- **Total HP: 700** | accuracy: +10% | heatMod: +7

---

## 11. Intentional Gaps

| Gap | Rationale |
|---|---|
| Hayabusa parts | Crafted via blueprint system |
| Kuroda tier 5 | Headroom for prestige items |
| Phantom heavy parts | Reserve for special events |
| Red Creek tier 2+ | Red Creek stays at tier 1 — they're the floor |
| Shield items | Separate system, future sprint |
