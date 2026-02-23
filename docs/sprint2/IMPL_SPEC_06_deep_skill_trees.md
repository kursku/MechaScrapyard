# MECHA SCRAPYARD — Implementation Spec: Deep Skill Trees
## Sprint: Reclaim-06 — 70 Skills, 7 Trees, 4 Tiers

**From:** Design (Claude)
**To:** Implementation (Antigravity)
**Priority:** 🟢 MEDIUM — Enriches progression depth, drives build diversity
**Estimated effort:** ~6-8 hours
**Prerequisites:** None (standalone), but skills gates feed all other systems

---

## WHY DEEP TREES

Currently `skills.json` has 7 top-level skills with `max: 10`. This is flat — every level is the same. The original Zero sessions designed skill trees with 4 tiers and exponential branching:

- Tier 1: 1 skill (entry point)
- Tier 2: 2 skills (first choice)
- Tier 3: 3 skills (specialization)
- Tier 4: 4 skills (mastery)

= 10 skills per tree × 7 trees = **70 individual skills**

This creates the incremental game's core reward loop. Each skill point is a micro-reward. Branching means builds diverge — your combat pilot plays differently from my netrunner.

---

## CURRENT STATE

✅ `skills.json` — 7 categories: Combat, Investigation, Hacking, Crafting, Resource Gathering, Mecha Upgrades, Social
✅ Each has `max: 10`, `primaryStats`, `secondaryStats`, `milestones`
✅ `effects` defined per skill (maneuverSlots, accuracy, etc.)
✅ AI_RULES.md §2.4 specifies 4 mastery tiers

❌ No sub-skills within each category
❌ No branching choices
❌ No prerequisites between sub-skills
❌ No skill point allocation system (skills just level from use)

---

## PART 1: SKILL TREE DATA STRUCTURE

### 1.1 Extend skills.json

Keep existing top-level skills as CATEGORIES. Add a `tree` array to each with sub-skills:

```json
{
  "id": "skill_combat",
  "name": "Combat",
  "desc": "Piloting, weapon handling, battlefield awareness.",
  "school": "combat",
  "require": "g.garagem>0",
  "max": 10,
  "primaryStats": ["muscle", "reflex"],
  "tree": [
    {
      "tier": 1,
      "skills": [
        {
          "id": "cs_basic_training",
          "name": "Basic Combat Training",
          "desc": "Fundamentals of mecha combat. Stance, aim, positioning.",
          "require": "",
          "cost": 1,
          "effect": { "combatAccuracy": 3, "description": "+3 base accuracy" },
          "flavor": "Every pilot starts here. Most stay."
        }
      ]
    },
    {
      "tier": 2,
      "skills": [
        {
          "id": "cs_precision_strike",
          "name": "Precision Strike",
          "desc": "Targeted attacks. Higher accuracy, critical chance.",
          "require": "cs_basic_training",
          "cost": 2,
          "effect": { "critChance": 5, "combatAccuracy": 2, "description": "+5% crit, +2 accuracy" },
          "flavor": "Aim for the joints. That's where armor ends."
        },
        {
          "id": "cs_defensive_maneuver",
          "name": "Defensive Maneuver",
          "desc": "Evasive patterns. Higher dodge, reduced incoming damage.",
          "require": "cs_basic_training",
          "cost": 2,
          "effect": { "dodgeChance": 5, "damageReduction": 2, "description": "+5% dodge, -2 damage taken" },
          "flavor": "The best hit is the one that misses."
        }
      ]
    },
    {
      "tier": 3,
      "skills": [
        {
          "id": "cs_area_assault",
          "name": "Area Assault",
          "desc": "Wide-arc attacks. Damage multiple parts simultaneously.",
          "require": "cs_precision_strike",
          "cost": 3,
          "effect": { "splashDamage": 0.3, "description": "30% splash to adjacent parts" },
          "flavor": "Why hit one arm when you can hit both?"
        },
        {
          "id": "cs_counter_mastery",
          "name": "Counter Mastery",
          "desc": "Counterattack on successful dodge. Turns defense into offense.",
          "require": "cs_defensive_maneuver",
          "cost": 3,
          "effect": { "counterChance": 20, "description": "20% counter on dodge" },
          "flavor": "You moved. Now they're open."
        },
        {
          "id": "cs_heat_management",
          "name": "Heat Management",
          "desc": "Optimize weapon cooling cycles. Fight longer, harder.",
          "require": "cs_basic_training",
          "cost": 3,
          "effect": { "heatDissipBonus": 5, "description": "+5 heat dissipation/turn" },
          "flavor": "Cool under pressure. Literally."
        }
      ]
    },
    {
      "tier": 4,
      "skills": [
        {
          "id": "cs_alpha_strike",
          "name": "Alpha Strike",
          "desc": "Fire all weapons simultaneously. Maximum damage, maximum heat.",
          "require": "cs_area_assault",
          "cost": 4,
          "effect": { "alphaStrike": true, "description": "New maneuver: Alpha Strike" },
          "flavor": "Everything. All at once. Pray you survive the heat."
        },
        {
          "id": "cs_iron_wall",
          "name": "Iron Wall",
          "desc": "Immovable defense. Near-immunity for one turn, massive heat.",
          "require": "cs_counter_mastery",
          "cost": 4,
          "effect": { "ironWall": true, "description": "New maneuver: Iron Wall" },
          "flavor": "You don't move. Nothing moves you."
        },
        {
          "id": "cs_thermal_override",
          "name": "Thermal Override",
          "desc": "Push past heat limits. One extra turn before shutdown.",
          "require": "cs_heat_management",
          "cost": 4,
          "effect": { "heatOverride": 20, "description": "+20 heat cap (temp)" },
          "flavor": "The warning says stop. You say no."
        },
        {
          "id": "cs_combat_mastery",
          "name": "Combat Mastery",
          "desc": "The pinnacle. All combat stats enhanced.",
          "require": "cs_precision_strike&&cs_defensive_maneuver",
          "cost": 5,
          "effect": { "combatAccuracy": 5, "critChance": 5, "dodgeChance": 5, "description": "+5 acc, +5% crit, +5% dodge" },
          "flavor": "Muscle memory. Neural sync. Perfect combat."
        }
      ]
    }
  ]
}
```

### 1.2 Repeat pattern for all 7 trees

Each tree follows: Tier 1 (1 skill) → Tier 2 (2) → Tier 3 (3) → Tier 4 (4) = 10 skills.

**Abbreviated structures for remaining 6 trees:**

**Crafting & Research:**
- T1: Basic Crafting
- T2: Efficient Refining | Blueprint Analysis
- T3: Advanced Materials | Prototype Design | Mass Production
- T4: Masterwork Quality | Experimental Tech | Industrial Scale | Universal Fabrication

**Resource Gathering:**
- T1: Scavenger Instinct
- T2: Deep Dig | Quick Sort
- T3: Toxic Zone Harvesting | Rare Material Sense | Bulk Collection
- T4: Master Salvager | Molecular Extraction | Automated Collection | Scrap Whisperer

**Hacking & Cybernetics:**
- T1: Basic Intrusion
- T2: Firewall Bypass | Data Mining
- T3: Neural Interface | System Overload | Ghost Protocol
- T4: Master Netrunner | AI Dialogue | Digital Fortress | Total Access

**Investigation:**
- T1: Scene Analysis
- T2: Pattern Recognition | Interrogation
- T3: Forensic Expertise | Surveillance Network | Informant Network
- T4: Master Detective | Cold Case Specialist | Conspiracy Mapper | Truth Serum

**Mecha Upgrades:**
- T1: Basic Maintenance
- T2: Structural Reinforcement | Systems Tuning
- T3: Custom Fabrication | Combat Modification | Efficiency Optimization
- T4: Master Mechanic | Prototype Integration | Overclocking | Frame Mastery

**Social Influence:**
- T1: Streetwise
- T2: Negotiation | Intimidation
- T3: Faction Diplomacy | Black Market Connections | Public Speaking
- T4: Master Negotiator | Kingmaker | Shadow Broker | People's Champion

Full JSON for all trees would be ~500 lines. **Deliver tree structures incrementally** — start with Combat and Crafting (most used), add others in follow-up sprints.

---

## PART 2: SKILL POINT SYSTEM

### 2.1 Skill points as resource

Currently skills level from use. Add explicit skill points for tree allocation:

**Add to `resources.json`:**
```json
{
  "id": "skill_points",
  "name": "Skill Points",
  "desc": "Earned through leveling. Spent to unlock new abilities.",
  "flavor": "Knowledge is power. Literally.",
  "group": "player",
  "icon": "✦",
  "color": "#ff0",
  "val": 0,
  "max": 999,
  "rate": 0,
  "locked": true,
  "require": "g.garagem>0",
  "sortOrder": 3
}
```

### 2.2 Earning skill points

Award 1 skill point per top-level skill level gained:

```js
// In wherever skill_combat.val (or similar) is incremented:
// (This is likely in the XP/level system or mission reward handler)

_onSkillLevelUp(skillId) {
    const sp = this.state.items.skill_points;
    if (sp) {
        sp.val += 1;
        Log.add(`✦ Skill Point earned! (${sp.val} available)`, 'info');
    }
}
```

Also award skill points from major milestones:

```js
// In milestoneCheck or mission rewards:
{ "id": "milestone_garage", "rewards": { "skill_points": 2 } }
{ "id": "milestone_phase2", "rewards": { "skill_points": 3 } }
```

### 2.3 Spending skill points

**In `game.js`:**

```js
/**
 * Learn a sub-skill from a skill tree.
 * @param {string} categoryId - Top-level skill ID (e.g. 'skill_combat')
 * @param {string} subSkillId - Sub-skill ID (e.g. 'cs_precision_strike')
 */
learnSubSkill(categoryId, subSkillId) {
    const category = this.state.items[categoryId];
    if (!category || !category.tree) return false;

    // Find the sub-skill
    let subSkill = null;
    for (const tier of category.tree) {
        subSkill = tier.skills.find(s => s.id === subSkillId);
        if (subSkill) break;
    }
    if (!subSkill) return false;

    // Already learned?
    if (subSkill.learned) {
        Log.add(`Already know: ${subSkill.name}`, 'info');
        return false;
    }

    // Check prerequisites
    if (subSkill.require) {
        const reqs = subSkill.require.split('&&');
        for (const req of reqs) {
            const prereq = this._findSubSkill(req.trim());
            if (!prereq || !prereq.learned) {
                Log.add(`✗ Prerequisite not met: ${prereq?.name || req}`, 'error');
                return false;
            }
        }
    }

    // Check skill points
    const sp = this.state.items.skill_points;
    if (!sp || sp.val < subSkill.cost) {
        Log.add(`✗ Need ${subSkill.cost} skill points (have ${sp?.val || 0}).`, 'error');
        return false;
    }

    // Learn!
    sp.val -= subSkill.cost;
    subSkill.learned = true;

    // Apply effects to game state
    this._applySubSkillEffects(subSkill.effect);

    Log.add(`★ Learned: ${subSkill.name}`, 'story');
    Log.add(`  ${subSkill.flavor}`, 'flavor');

    return true;
},

/**
 * Find a sub-skill by ID across all trees.
 */
_findSubSkill(subSkillId) {
    for (const item of Object.values(this.state.items)) {
        if (item.tree) {
            for (const tier of item.tree) {
                const found = tier.skills.find(s => s.id === subSkillId);
                if (found) return found;
            }
        }
    }
    return null;
},

/**
 * Apply sub-skill effects to game state.
 */
_applySubSkillEffects(effect) {
    if (!effect) return;

    // Numeric bonuses stored on a subsystem object
    if (!this.state.skillBonuses) this.state.skillBonuses = {};
    for (const [key, val] of Object.entries(effect)) {
        if (key === 'description') continue;
        if (typeof val === 'number') {
            this.state.skillBonuses[key] = (this.state.skillBonuses[key] || 0) + val;
        } else if (typeof val === 'boolean') {
            this.state.skillBonuses[key] = val;
        }
    }
},
```

---

## PART 3: UI — SKILL TREE VIEWER

### 3.1 Tree visualization in Skills tab

Replace the flat skill list with an interactive tree:

```vue
<div v-for="category in skillCategories" :key="category.id" class="skill-tree-panel">
  <div class="tree-header">
    {{ category.name }} ({{ countLearned(category) }}/{{ countTotal(category) }})
  </div>

  <div v-for="tier in category.tree" :key="tier.tier" class="tier-row">
    <div class="tier-label">Tier {{ tier.tier }}</div>
    <div class="tier-skills">
      <div
        v-for="skill in tier.skills"
        :key="skill.id"
        class="skill-node"
        :class="{
          'skill-learned': skill.learned,
          'skill-available': canLearn(category.id, skill),
          'skill-locked': !canLearn(category.id, skill) && !skill.learned
        }"
        @click="tryLearn(category.id, skill.id)"
      >
        <div class="skill-name">{{ skill.name }}</div>
        <div class="skill-cost" v-if="!skill.learned">{{ skill.cost }} SP</div>
        <div class="skill-effect">{{ skill.effect?.description }}</div>
      </div>
    </div>
  </div>
</div>

<!-- Available points display -->
<div class="skill-points-display">
  ✦ Skill Points: {{ skillPoints }}
</div>
```

### 3.2 CSS: Terminal-style tree nodes

```css
.skill-node {
  border: 1px solid var(--terminal-dim);
  padding: 6px 10px;
  margin: 3px;
  cursor: pointer;
  min-width: 150px;
  text-align: center;
}
.skill-learned {
  border-color: var(--terminal-green);
  color: var(--terminal-green);
  background: rgba(0, 255, 0, 0.05);
}
.skill-available {
  border-color: var(--terminal-bright);
  animation: pulse-border 2s infinite;
}
.skill-locked {
  opacity: 0.4;
  cursor: not-allowed;
}
.tier-row {
  display: flex;
  align-items: center;
  margin: 8px 0;
}
.tier-label {
  width: 50px;
  font-weight: bold;
  opacity: 0.6;
}
.tier-skills {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
```

### 3.3 Prerequisite lines (optional enhancement)

Draw SVG lines between prerequisite nodes. This is cosmetic and can be added later:

```js
// After rendering, calculate positions and draw lines
// from each skill to its prerequisites
```

---

## PART 4: SAVE/LOAD

Sub-skills' `learned` state needs to persist:

```js
// Save:
subSkills: this._getAllSubSkills().filter(s => s.learned).map(s => s.id),

// Load:
if (saveData.subSkills) {
    for (const id of saveData.subSkills) {
        const skill = this._findSubSkill(id);
        if (skill) skill.learned = true;
    }
    // Re-apply all effects
    for (const id of saveData.subSkills) {
        const skill = this._findSubSkill(id);
        if (skill) this._applySubSkillEffects(skill.effect);
    }
}
```

Helper:
```js
_getAllSubSkills() {
    const all = [];
    for (const item of Object.values(this.state.items)) {
        if (item.tree) {
            for (const tier of item.tree) {
                all.push(...tier.skills);
            }
        }
    }
    return all;
},
```

---

## PART 5: INTEGRATION WITH COMBAT

### 5.1 Skill bonuses in combat

The `skillBonuses` object feeds into combat calculations. In `combatRunner.js`:

```js
// When calculating accuracy:
const skillAccBonus = Game.state.skillBonuses?.combatAccuracy || 0;
const totalAccuracy = baseAccuracy + skillAccBonus;

// When calculating crit chance:
const skillCritBonus = Game.state.skillBonuses?.critChance || 0;
const totalCrit = baseCrit + skillCritBonus;

// When calculating heat dissipation:
const skillHeatBonus = Game.state.skillBonuses?.heatDissipBonus || 0;
const totalDissip = baseDissip + skillHeatBonus;

// Etc. for dodgeChance, damageReduction, counterChance, splashDamage
```

---

## VERIFICATION CRITERIA

- [ ] Skill trees load with sub-skills per category
- [ ] Skill points resource appears after Garage
- [ ] Skill points earned on level up and milestones
- [ ] Sub-skills can be learned with skill points
- [ ] Prerequisites enforced (can't learn Tier 2 without Tier 1)
- [ ] Effects apply (check combat accuracy changes)
- [ ] Tree UI shows learned/available/locked states
- [ ] Clicking available skill learns it (with cost)
- [ ] Learned sub-skills persist across save/load
- [ ] Combat system reads skillBonuses

## FILE REFERENCE

| File | Action |
|------|--------|
| `data/mecha/skills.json` | MODIFY — add `tree` array to each category |
| `data/mecha/resources.json` | MODIFY — add `skill_points` resource |
| `src/game.js` | MODIFY — `learnSubSkill`, `_findSubSkill`, `_applySubSkillEffects`, `_getAllSubSkills` |
| `src/gameState.js` | MODIFY — add `skillBonuses` object |
| `src/modules/combatRunner.js` | MODIFY — read skillBonuses in calculations |
| `modules/persist.js` | MODIFY — save/load learned sub-skills |
| `src/ui/TerminalUI.vue` | MODIFY — skill tree visualization |

---

## DESIGN NOTES

**70 skills is a LOT of content.** Deliver incrementally: Combat + Crafting trees first (most impact), then add trees as zones/systems need them. Each tree is ~10 JSON entries.

**Skill points are SCARCE.** With ~30 total levels and 1 SP per level + milestone bonuses, the player gets maybe 40-50 SP total. With 70 skills costing 1-5 SP each (total cost ~175 SP), the player can only learn ~30% of all skills per playthrough. This forces BUILDS — the core replayability hook.

**Sub-skill prerequisites use ID strings, not g. expressions.** This keeps them simple: `"require": "cs_basic_training"` checks if that specific sub-skill is learned, not a global counter.

---

*Standalone. Feeds into: Combat (accuracy/crit/dodge), Reclaim-03 (Focus → android), Reclaim-02 (job requirements), Reclaim-04 (zone requirements).*
