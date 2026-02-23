# MECHA SCRAPYARD — Implementation Changelog
## Session: Feb 20, 2026 — "The Plumbing Sprint"

---

## CRITICAL BUGS FIXED

### 🔴 BUG 1: Mission chains were completely broken
**Problem:** `g.msn_rogue_drone_patrol>0` in `require` strings NEVER evaluated to `true` because missions use `completed` not `val` or `owned`, and only `val`/`owned` were exposed to the `g.` namespace.

**Impact:** NO mission after the first one could ever unlock. The entire story chain was dead.

**Fix:** `gameState.js → register()` now exposes `completed` count for missions:
```
g.msn_xxx → returns item.completed || 0  (missions)
g.skill_xxx → returns item.val || 0      (skills - also broken before)
g.xxx → returns item.owned || 0          (upgrades)
```

**Files:** `src/gameState.js`

---

### 🔴 BUG 2: Skill requirements never passed
**Problem:** `g.skill_combat>=2` in require strings was comparing the entire item OBJECT (not its value) against a number. `[object Object] >= 2` → always `false`.

**Impact:** Missions gated by skill checks (msn_corporate_warning, msn_bounty_on_player, msn_phantom_signal, etc.) were unreachable.

**Fix:** Same as Bug 1. `g.skill_xxx` now returns `item.val || 0`.

**Files:** `src/gameState.js`

---

### 🔴 BUG 3: Mission completion didn't persist across saves
**Problem:** `toJSON()` only saved `val`, `owned`, `locked` — not `completed`. Loading a save reset all mission progress to 0.

**Impact:** Every game reload lost all mission progress and re-locked the chain.

**Fix:** `toJSON()` now saves `completed` and `_lastKnownTier`. `fromJSON()` restores them. Also restores dynamically created flags (like `grandpa_dead`).

**Files:** `src/gameState.js`

---

### 🔴 BUG 4: Faction tier blueprint unlocks didn't work
**Problem:** `_checkRepTierTransitions()` looked for `tierData.unlocksBlueprints` but faction data uses `unlocks` array containing mixed strings (descriptions + blueprint IDs).

**Impact:** Reaching a new faction tier never unlocked any blueprints.

**Fix:** Now extracts blueprint IDs (strings starting with `bp_`) from the `unlocks` array. Also handles multi-tier jumps (if rep jumps from 0 to 30, unlocks tiers 10 AND 25).

**Files:** `src/game.js`

---

## NEW FEATURES IMPLEMENTED

### ✅ Narrative-Only Missions
Missions with `encounter.mode: "none"` (like `msn_dads_secret`) now have a proper flow:
- Plays briefing dialogue
- Plays debriefing dialogue
- Awards rewards and sets completion flag
- NO combat launched

**Files:** `src/game.js` → `_handleNarrativeMission()`, `_completeNarrativeMission()`

---

### ✅ Grandpa Death Flag System
After `msn_scrapyard_siege` completes:
- `grandpa_dead` flag is permanently set
- Milestone dialogues that use Grandpa as speaker check this flag
- Post-siege milestones use System narrator instead
- Flag persists across saves

New milestones added:
- `post_siege_silence` — System scan shows "1 life sign detected. Just you."
- `dads_lab_hint` — System detects subsurface power signature, hints at Dad's Secret

**Files:** `src/game.js` → `_onGrandpaDeath()`, updated `milestoneCheck()`

---

### ✅ Expanded Milestone System
Added 5 new narrative milestones:
1. `corporate_warning` — Grandpa warns about Aegis after that mission
2. `bounty_reveal` — Grandpa reveals the truth about Dad's corruption charges
3. `phantom_contact` — Grandpa reacts to the Phantom Collective connection
4. `post_siege_silence` — System scan after the siege
5. `dads_lab_hint` — System detects the hidden lab

All new milestones respect the `grandpa_dead` flag.

**Files:** `src/game.js`

---

### ✅ Enhanced Mission UI
- Narrative-only missions show `NARRATIVE` tag (blue) and no energy cost
- Missions display faction rep rewards (`+5 UNDERGROUND`, `+3 MILITARY`)
- Story missions have gold left border
- Narrative missions have blue left border
- Zero-difficulty missions show ◆ instead of empty stars

**Files:** `src/ui/components/CombatPanel.vue`

---

### ✅ Enhanced Faction Panel
- Shows unlocked perks for current tier
- Shows `relationToFather` (FORMER_EMPLOYER, THE_ENEMY, etc.) as narrative depth indicator
- Tier info and rep bar remain functional

**Files:** `src/ui/TerminalUI.vue`

---

### ✅ Combat End Safety for Narrative Missions
`_onCombatEnd` now checks `reason === 'narrative'` and skips combat-specific processing (debriefing replay, frame recovery, salvage). Narrative missions handle their own completion flow.

**Files:** `src/game.js`

---

## DATA VALIDATION RESULTS

```
22/22 JSON files valid ✅
Mission require chains: 0 broken refs ✅
Mission reward resources: 0 broken refs ✅  
Blueprint material IDs: 0 broken refs ✅
Faction rep resource IDs: 0 broken refs ✅
Upgrade require chains: 0 broken refs ✅
```

---

## WHAT'S NOW WORKING END-TO-END

With these fixes, the full game flow should work:

```
New Game → Scavenge → Build Sorting Station → Classified Scrap
    → Build Workshop → Build Refinery → Build Garage
    → Grandpa's dialogue → Dad's Frame discovered
    → First Mission (Rogue Drone Patrol) unlocks
    → Win → Grandpa's pride → Next missions chain
    → Faction rep earned → Tier transitions → Blueprint unlocks
    → Story missions progress → Bounty → Dad's Route → Phantom Signal
    → Scrapyard Siege (Grandpa dies) → Dad's Secret (narrative mission)
    → Secret Lab discovered → Hayabusa Mk.II quest begins
```

---

## WHAT'S STILL NEEDED (for Antigravity to address)

1. **Skills training speed** — Training tasks need to actually increase skill values for skill gates to be reachable
2. **Boss encounter resolution** — Boss enemies referenced in missions need archetype IDs that match enemies.json
3. **Job System** — Not yet designed (next content sprint)
4. **Events expansion** — Only 7 events, need 30-40+
5. **Equip slot migration** — Old saves may have legacy slot IDs
