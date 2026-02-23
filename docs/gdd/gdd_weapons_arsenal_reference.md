# Mecha Scrapyard — Weapons Arsenal Reference
## GDD Supplement: Complete `weapons.json`

---

## 1. Arsenal Overview

**Total weapons:** 28 (6 existing + 22 new)
**Categories:** Fight (8), Short (12), Long (8)
**Dice tiers:** d4 (5), d6 (7), d8 (8), d10 (5), d12 (3)
**Slots:** Hand (21), Shoulder (7)
**Manufacturers:** 9 represented

---

## 2. Design Philosophy

### Every Weapon Tells a Story

No filler. Each weapon exists for one of three reasons:
1. **Fills a mechanical niche** — a tradeoff that no other weapon offers
2. **Represents its manufacturer** — stats reflect the brand identity
3. **Creates a decision** — player must choose between competing advantages

### The Three Axes of Choice

Every loadout decision balances three tensions:

```
DAMAGE ←————————→ SUSTAINABILITY
(baseDamage, dice)   (supplyCost, heatGen)

ACCURACY ←————————→ POWER
(accuracyMod)        (baseDamage, tokenOnHit)

IMMEDIATE ←————————→ COMPOUND
(raw damage)          (token stacking over turns)
```

### Manufacturer Identity in Stats

Each manufacturer's statBias is reflected consistently across all their weapons:

| Manufacturer | Signature | Weapons Reflect |
|---|---|---|
| **Shibata Arms** | Reliable, accurate | Above-avg accuracy, baseline everything else |
| **Taeyang Forge** | Hot, powerful, risky | High damage + high heat + BURN tokens |
| **Valletta Precision** | Surgical, expensive | Best accuracy, low heat, high supply cost |
| **Red Creek Arsenal** | Cheap, inconsistent | Below-avg accuracy, low price, occasional unique property |
| **Aegis-Tac** | Standard-issue, dependable | Good accuracy, no tokens, no surprises |
| **Daewon Dynamics** | Electronic warfare | Low physical damage, utility tokens (ERROR, TARGET_LOCK) |
| **KZ Industrial** | Improvised, brutish | Low accuracy, high avaria, cheap |
| **Kuroda Heavy** | Military overkill | High damage, high everything, gated behind reputation |

---

## 3. Category Breakdown

### FIGHT — Melee Weapons (8 weapons)

**Primary manufacturer:** Taeyang Forge (5 weapons)
**Secondary:** KZ Industrial (1), Red Creek (1), Generic (1)
**Key attribute:** MUS + ATK
**avaria rule:** 0.5 baseline (melee is less destructive to parts), except high-impact weapons (KZ Breaker, Pile Bunker) at 1.0+

| ID | Name | Dice | Mfr | DMG | ACC | Heat | Supply | Tokens | Tier | Value |
|---|---|---|---|---|---|---|---|---|---|---|
| `mech_fist` | Mech Fist | d4 | — | 2 | +10 | 2 | 0 | — | 1 | 5 |
| `kz_40_breaker` | KZ-40 'Breaker' | d4 | KZ Ind. | 3 | -5 | 3 | 0 | BREACH 15% | 1 | 10 |
| `rc_12_heat_knife` | RC-12 'Hot Stick' | d6 | Red Creek | 3 | -10 | 14 | 1 | BURN 20% | 1 | 15 |
| `heat_blade_d6` | ThermoEdge Mk.I | d6 | Taeyang | 3 | -5 | 12 | 1 | BURN 30% | 2 | 30 |
| `piercing_lance_d8` | AP Lance 'Puncture' | d8 | Taeyang | 5 | -15 | 6 | 1 | BREACH 40% | 2 | 40 |
| `chain_sword_d8` | SolarFang Mk.II | d8 | Taeyang | 6 | -10 | 10 | 1 | BURN 25% + BREACH 15% | 3 | 75 |
| `plasma_edge_d10` | Corona Edge | d10 | Taeyang | 8 | -10 | 18 | 2 | BURN 45% + BREACH 25% | 3 | 120 |
| `pile_bunker_d12` | Taeyang 'Sunbreak' | d12 | Taeyang | 12 | -20 | 8 | 3 | BREACH 60% ×2 | 4 | 250 |

**Progression arc:** Mech Fist (free, always available) → ThermoEdge (first real melee upgrade) → AP Lance or SolarFang (specialization: BREACH burst vs BURN+BREACH sustain) → Corona Edge (premium) → Sunbreak (endgame boss-killer).

**Notable tradeoffs:**
- RC-12 vs ThermoEdge: Red Creek copy is cheaper and available earlier, but 20% vs 30% BURN chance and worse accuracy
- AP Lance vs SolarFang: Pure BREACH stacking vs hybrid BURN+BREACH. Lance is better against single tough targets; SolarFang is better for sustained damage over many turns
- Pile Bunker: Highest single-hit damage in the game, but -20 accuracy and 1.5 avaria means it damages your own frame's integrity on use. True glass cannon weapon

---

### SHORT — Firearms (12 weapons)

**Primary manufacturer:** Shibata Arms (7 weapons)
**Secondary:** Aegis-Tac (2), Red Creek (2), Daewon (1)
**Key attribute:** REF + ATK
**avaria rule:** 1.0 standard

| ID | Name | Dice | Mfr | DMG | ACC | Heat | Supply | Tokens | Tier | Value |
|---|---|---|---|---|---|---|---|---|---|---|
| `shibata_p7_d4` | Shibata P-7 'Plinker' | d4 | Shibata | 2 | +10 | 2 | 0 | — | 1 | 8 |
| `rc_44_pistol` | RC-44 | d4 | Red Creek | 2 | +0 | 2 | 0 | — | 1 | 4 |
| `machine_gun_d6` | MG-206 'Rattler' | d6 | Shibata | 4 | +5 | 5 | 1 | — | 1 | 15 |
| `at_15_standard` | AT-15 'Standard' | d6 | Aegis-Tac | 3 | +10 | 3 | 1 | — | 2 | 20 |
| `shotgun_d6` | Scatterblast SG-4 | d6 | Shibata | 5 | -10 | 4 | 1 | BREACH 20% | 2 | 25 |
| `emp_repeater_d6` | DW-E4 'Glitch' | d6 | Daewon | 2 | +5 | 8 | 1 | ERROR 35% | 2 | 35 |
| `smg_d8` | Shibata SR-8 'Hornet' | d8 | Shibata | 5 | +0 | 7 | 1 | SUPPRESS 20% | 2 | 40 |
| `rc_80_lucky_shot` | RC-80 'Lucky Shot' | d8 | Red Creek | 6 | -15 | 6 | 1 | BREACH 25% | 2 | 20 |
| `at_300_enforcer` | AT-300 'Enforcer' | d8 | Aegis-Tac | 5 | +10 | 5 | 1 | — | 3 | 60 |
| `flamethrower_d8` | Shibata FT-9 'Hellmouth' | d8 | Shibata | 4 | +15 | 16 | 2 | BURN 50% | 3 | 65 |
| `autocannon_d10` | Shibata AC-10 'Jackhammer' | d10 | Shibata | 7 | +0 | 9 | 2 | BREACH 20% | 3 | 100 |
| `gatling_d10` | Shibata GX-6 'Buzzsaw' | d10 | Shibata | 6 | -5 | 12 | 2 | SUPPRESS 35% | 4 | 130 |

**Progression arc:** Plinker/RC-44 (free starter) → Rattler (first real gun, workhorse) → Hornet or SG-4 (suppression vs burst) → Enforcer or Hellmouth (reliable vs devastating) → Jackhammer or Buzzsaw (raw damage vs area suppression).

**Notable tradeoffs:**
- Plinker vs RC-44: Shibata's accuracy (+10) vs Red Creek's low price. Mechanically, Plinker is strictly better — but RC-44 is half the price, which matters at game start
- DW-E4 'Glitch': The utility outlier. Terrible damage (2), but 35% ERROR on hit makes it a control weapon. Pair with a high-damage weapon in the other hand for "disable then destroy" tactics
- Flamethrower: Highest accuracy in the category (+15) because it sprays, but massive heat generation (16) means you'll overheat in 3-4 shots on a Medium frame. Synergizes with Light+Cautious ("Phantom" build)
- RC-80 'Lucky Shot': Red Creek original — not a copy. Highest d8 baseDamage (6) but -15 accuracy. The "gambler's gun" — unreliable but devastating when it connects
- Buzzsaw: Shoulder-mount means it doesn't compete with hand weapons. The suppression build (Buzzsaw + hand weapon) is a strong mid-game combo for Heavy frames

---

### LONG — Artillery (8 weapons)

**Primary manufacturer:** Valletta Precision (4 weapons)
**Secondary:** Kuroda Heavy (2), Red Creek (1), Daewon (1)
**Key attribute:** FOC + ATK
**avaria rule:** 1.0 standard (except Kuroda Type 12 at 1.5 — siege weapon)

| ID | Name | Dice | Mfr | DMG | ACC | Heat | Supply | Tokens | Tier | Value |
|---|---|---|---|---|---|---|---|---|---|---|
| `dw_s5_tagger` | DW-S5 'Tagger' | d4 | Daewon | 1 | +20 | 3 | 0 | TARGET_LOCK 60% | 1 | 18 |
| `rc_mortar_d6` | RC-61 'Lobber' | d6 | Red Creek | 4 | -15 | 4 | 1 | — | 1 | 12 |
| `sniper_d8` | Zenith SR-7 | d8 | Valletta | 6 | +20 | 4 | 1 | TARGET_LOCK 30% | 2 | 55 |
| `missile_pod_d8` | Valkyr Mk.I Salvo | d8 | Valletta | 6 | +0 | 15 | 2 | — | 2 | 50 |
| `railgun_d10` | Valkyr Mk.III 'Longinus' | d10 | Valletta | 9 | +10 | 10 | 2 | BREACH 35% + SLOW 20% | 3 | 140 |
| `kuroda_launcher_d10` | Type 77 'Retribution' | d10 | Kuroda | 8 | +5 | 14 | 2 | SUPPRESS 30% | 4 | 180 |
| `zenith_d12` | Zenith Mk.V 'Absolute' | d12 | Valletta | 11 | +15 | 8 | 3 | BREACH 50% + TARGET_LOCK 40% | 5 | 300 |
| `type_12_judgment` | Type 12 'Judgment' | d12 | Kuroda | 13 | -10 | 20 | 3 | BREACH 40%×2 + SLOW 30% | 5 | 350 |

**Progression arc:** Tagger (support tool, no damage) or Lobber (cheap mortar) → Zenith SR-7 or Valkyr Mk.I (sniper precision vs missile burst) → Longinus (best overall d10) → Absolute or Judgment (endgame choice: surgical vs devastating).

**Notable tradeoffs:**
- DW-S5 'Tagger': Almost no damage, but 60% TARGET_LOCK makes it the ultimate support weapon. Equip Tagger in one hand + strong weapon in the other = mark and destroy. Pairs beautifully with the Zenith sniper
- Zenith SR-7 vs Valkyr Mk.I: Same dice, same base damage, completely different identity. Sniper has +20 acc and TARGET_LOCK but is hand-slot (competes with melee). Valkyr is shoulder-mount (doesn't compete) but high heat and no tokens
- Longinus vs Retribution: Valletta precision vs Kuroda firepower. Longinus has better accuracy and BREACH+SLOW combo. Retribution has SUPPRESS for area denial. Longinus is better 1v1; Retribution is better vs groups
- **The Endgame Choice — Absolute vs Judgment:** Valletta's masterwork is surgical (high acc, low heat, BREACH+TARGET_LOCK for compounding precision). Kuroda's siege weapon is destructive (highest baseDamage in the game at 13, but -10 acc and 20 heat). Absolute rewards skill; Judgment rewards having the resources to absorb the costs

---

## 4. Token Distribution Analysis

| Token | Weapons | Primary Source | Design Role |
|---|---|---|---|
| **BREACH** | 11 weapons | Fight melee + high-caliber firearms + artillery | Universal "armor shred" — stacks across multiple weapon types, rewards sustained aggression |
| **BURN** | 5 weapons | Taeyang melee + Shibata flamethrower | Damage-over-time pressure, synergizes with BREACH for compound damage |
| **ERROR** | 1 weapon | Daewon EMP repeater | Electronic warfare niche — action denial, stress buildup |
| **SUPPRESS** | 3 weapons | Shibata SMG/gatling + Kuroda launcher | Damage reduction on target — defensive/control option |
| **TARGET_LOCK** | 3 weapons | Daewon tagger + Valletta snipers | Accuracy amplification — support/precision synergy |
| **SLOW** | 2 weapons | Valletta railgun + Kuroda siege cannon | Mobility denial — heavy ordnance only, late-game |

**Token Synergy Combos the player can build:**

| Combo | Weapons | Effect | Build Identity |
|---|---|---|---|
| BREACH + BURN | Taeyang melee + flamethrower | Amplified DoT — burn damage increased by breach stacks | "Meltdown" |
| TARGET_LOCK + high-damage | Daewon Tagger + any heavy hitter | Mark then destroy — +bonus dice on locked target | "Spotter" |
| BREACH + SUPPRESS | Shotgun + SMG/Gatling | Shred armor while reducing enemy output | "Grinder" |
| ERROR + anything | EMP repeater + any weapon | Disable then damage — enemy loses actions | "Hacker" |
| BREACH + SLOW | Railgun/siege | Immobilize and penetrate — heavy artillery control | "Siege" |

---

## 5. Balance Notes

### Supply Economy by Tier

| Tier | Avg Supply/Attack | Avg Damage/Supply | Design Intent |
|---|---|---|---|
| 1 | 0.0-0.5 | Infinite-8.0 | Nearly free to use — learn the system |
| 2 | 0.8-1.0 | 3.0-5.0 | Supply matters — first resource pressure |
| 3 | 1.0-2.0 | 2.5-4.5 | Real cost — must manage supply between missions |
| 4 | 2.0-2.5 | 2.5-3.0 | Expensive — every shot counts |
| 5 | 3.0 | 3.7-4.3 | Premium — endgame resource sink |

### Heat Profiles by Manufacturer

| Manufacturer | Avg HeatGen | Implication |
|---|---|---|
| Taeyang Forge | 10.8 | Demands Light frame (dissipation) or Cautious stance |
| Shibata Arms | 6.9 | Manageable on any frame |
| Valletta Precision | 9.3 | Burst-friendly — fires fewer shots but each one counts |
| Red Creek Arsenal | 6.5 | Surprisingly manageable — heat is not Red Creek's problem |
| Aegis-Tac | 4.0 | Lowest heat — designed for sustained patrol engagement |
| Daewon Dynamics | 5.5 | Low heat, utility focus |

### Frame × Weapon Category Synergies

| Frame | Best Category | Why |
|---|---|---|
| **Light** | Fight (Taeyang) | Light's +40% heat dissipation offsets Taeyang's high heatGen. Light's high supply efficiency (1.2×) reduces melee supply costs. MUS builds hit hardest in melee. |
| **Medium** | Short (Shibata) | Medium's shoulder mounts accept tier ≤3 short weapons. Balanced stats support REF builds. Medium + Balanced stance + Shibata accuracy = consistent damage. |
| **Heavy** | Long (Valletta/Kuroda) | Heavy's shoulder mounts accept ALL tiers. High base_atk amplifies artillery. Heavy's raw HP pool absorbs the supply cost of d10-d12 weapons. FOC builds maximize artillery accuracy. |

These are tendencies, not rules. A Light frame with a Valletta sniper (hand slot, low heat) is perfectly viable. A Heavy frame with Taeyang melee weapons is "The Berserker" build — devastating but will overheat fast.

---

## 6. Weapons Not Yet Designed (Future Expansion)

These slots are intentionally left open for future content:

| Gap | Rationale for Leaving Open |
|---|---|
| Short d12 | No manufacturer currently makes a d12 firearm. Could be a Shibata experimental or Kuroda military prototype. Leave for late-game content expansion. |
| Fight weapons from Aegis-Tac | Police don't use melee often. If added, would be a riot baton/stun weapon with ERROR token. |
| Hayabusa weapons | Player-crafted weapons via blueprint system. Stats defined at crafting time, not predefined. |
| Phantom Works weapons | Exile experimental weapons with extreme variance. Better as hand-designed unique rewards than catalog items. |
| Shield/defensive equipment | Mentioned in combat_design_document §6.3 but excluded from this sprint. Separate system. |

---

## 7. Integration Checklist

### Retroactive changes to existing weapons.json

For the 6 existing weapons, only one field is added (`mfr`). No stat changes:

```
mech_fist        → add "mfr": null
machine_gun_d6   → add "mfr": "shibata_arms"
heat_blade_d6    → add "mfr": "taeyang_forge"
shotgun_d6       → add "mfr": "shibata_arms"
missile_pod_d8   → add "mfr": "valletta_precision"
piercing_lance_d8 → add "mfr": "taeyang_forge"
```

### New `require` fields reference

Some weapons gate behind faction reputation (not yet implemented as resources):

| Require | Weapons | Notes |
|---|---|---|
| `g.rep_police>=1` | AT-15 'Standard' | Police Rep tier 1 |
| `g.rep_police>=2` | AT-300 'Enforcer' | Police Rep tier 2 |
| `g.rep_military>=2` | Type 77 'Retribution' | Military Rep tier 2 |
| `g.rep_military>=3` | Type 12 'Judgment' | Military Rep tier 3 |
| `g.skill_combat>=N` | Various | Combat skill thresholds (already in system) |

When faction reputation resources are implemented, these `require` strings will resolve via TechTree automatically.

### Token forward-compatibility

Weapons reference 4 token types not yet implemented in the CombatRunner: ERROR, SLOW, TARGET_LOCK, SUPPRESS. The `tokenOnHit` data is present in the JSON and will be silently ignored until those token systems are built. No code changes needed — the existing `for...of weapon.tokenOnHit` loop will simply not find matching TOKEN_DEFS entries and skip them safely.

**Recommendation:** Add placeholder TOKEN_DEFS entries that do nothing, so the combat log can at least show the icon when a weapon triggers them:

```js
// Placeholder — remove when fully implementing each token
ERROR:       { id: 'ERROR',       name: 'Error',       icon: '⚡', color: '#ff0', maxStacks: 4 },
SLOW:        { id: 'SLOW',        name: 'Slow',        icon: '🐢', color: '#88f', maxStacks: 3 },
TARGET_LOCK: { id: 'TARGET_LOCK', name: 'Target Lock', icon: '🎯', color: '#f0f', maxStacks: 3 },
SUPPRESS:    { id: 'SUPPRESS',    name: 'Suppress',    icon: '🛡️', color: '#aaf', maxStacks: 4 },
```
