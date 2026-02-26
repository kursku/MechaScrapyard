# SPEC: Save Basics — Phase 1 / Rank 3, 13, 14

**Type:** `feat(save/p1)`
**Effort:** Low — ~1–2 hours, changes to `persist.js` and `game.js`
**Depends on:** Nothing
**Blocks:** Nothing (but foundational for all future sessions)

---

## Why This Matters

The save system works but is invisible and fragile:
- No `beforeunload` handler means tab-closes lose up to 30 seconds of progress
- No timestamp in save means debugging is impossible and migrations are unsafe
- `QuotaExceededError` silently fails — player loses all progress with no warning
- No visual feedback means players don't know if their game is saving

---

## Files Changed

- `src/modules/persist.js`
- `src/game.js`
- `src/ui/HudOverlay.vue` (or wherever the HUD save flash is placed)

---

## Change 1 — beforeunload Force-Save

**File:** `src/game.js`
**Location:** Inside the game `init()` or `load()` method, after `loaded = true`

```js
// Add once during game initialization
window.addEventListener('beforeunload', () => {
    Persist.save(this);
});
```

This ensures the game saves when the player closes the tab or navigates away.

---

## Change 2 — Add Meta to Save Payload

**File:** `src/modules/persist.js`
**Location:** `save()` method

```js
save(game) {
    try {
        const data = game.serialize();
        // ADD: metadata header
        data._meta = {
            version: '1.0',
            savedAt: Date.now(),
            playTime: game.timer?.total || 0,
        };
        localStorage.setItem(SAVE_KEY, JSON.stringify(data));
        // ADD: emit save event for HUD flash
        this._lastSavedAt = Date.now();
        return true;
    } catch (e) {
        // Change 3 handles this
        this._handleSaveError(e);
        return false;
    }
},
```

---

## Change 3 — Quota Error Detection

**File:** `src/modules/persist.js`
**Location:** New helper method on the Persist object

```js
_handleSaveError(e) {
    if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        // Import Log or use a fallback
        console.error('[PERSIST] Storage quota exceeded. Save failed.');
        // Signal the game to show a warning — use a flag the HUD can read
        this._quotaError = true;
    } else {
        console.error('[PERSIST] Save failed:', e);
    }
},
```

In `game.js` or HudOverlay, poll `Persist._quotaError` and show:
```
⚠ SAVE FAILED: Storage full. Export your save to continue safely.
```

---

## Change 4 — SAVED Flash in HUD

**File:** `src/ui/HudOverlay.vue` (or a new `SaveIndicator` in TerminalUI header)

Add a reactive ref that shows for 2 seconds after each successful autosave:

```vue
<!-- In HudOverlay template, above corner brackets -->
<transition name="fade">
    <div v-if="showSaved" class="save-flash">
        SAVED ✓
    </div>
</transition>
```

```js
// In game.js autosave callback, after Persist.save() returns true:
// Emit a brief event or set a flag the HUD reads
// The HUD shows "SAVED" for 2000ms then hides it
```

The `SAVED` flash should be styled in dim green, small, positioned top-right or bottom of header — non-intrusive.

---

## Test Checklist

- [ ] Open game → make progress → close tab → reopen → progress is not lost
- [ ] Save payload in localStorage has `_meta.savedAt` timestamp (check via DevTools)
- [ ] Artificially trigger QuotaExceededError (fill localStorage manually) → in-game warning appears
- [ ] `SAVED ✓` flash appears briefly after 30 seconds of play
- [ ] `npm run build` passes

---

## Commit Message

```
feat(save/p1): add beforeunload save, meta timestamp, quota error warning, saved flash
```
