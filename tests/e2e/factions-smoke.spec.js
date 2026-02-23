import { test, expect } from '@playwright/test';

async function bootGame(page) {
  await page.goto('/');
  await page.waitForFunction(() => window.Game && window.Game.loaded === true);
}

test('factions tab smoke: alliance labels and vendor list render after dev unlock', async ({ page }) => {
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await bootGame(page);
  await page.evaluate(() => {
    window.Game.devUnlockAll();
  });

  await page.getByRole('button', { name: /factions/i }).click();
  await expect(page.getByRole('heading', { name: /> reputation & factions/i })).toBeVisible();
  await expect(page.locator('.alliance-chip').first()).toBeVisible();
  await expect(page.locator('.faction-vendor').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'BUY' }).first()).toBeVisible();

  expect(
    consoleErrors.filter((line) => !line.includes('favicon')).length,
    `Unexpected browser console errors:\n${consoleErrors.join('\n')}`
  ).toBe(0);
});

test('awardFactionRep applies morality modifier and rivalry spillover', async ({ page }) => {
  await bootGame(page);

  const hiMoral = await page.evaluate(() => {
    const g = window.Game;
    const reps = ['rep_police', 'rep_military', 'rep_underground', 'rep_corporate', 'rep_exile'];
    for (const id of reps) {
      const r = g.state.items[id];
      r.locked = false;
      r.max = 100;
      r.val = 50;
    }
    g.state.morality.value = 50;
    g.awardFactionRep('faction_ntpd', 10, 'e2e-high-morality');
    return {
      rep_police: g.state.items.rep_police.val,
      rep_underground: g.state.items.rep_underground.val,
      rep_exile: g.state.items.rep_exile.val,
    };
  });

  expect(hiMoral.rep_police).toBe(62); // +10 * 1.2
  expect(hiMoral.rep_underground).toBe(48); // -round(12*0.2)=2
  expect(hiMoral.rep_exile).toBe(46); // -round(12*0.3)=4

  const lowMoral = await page.evaluate(() => {
    const g = window.Game;
    const reps = ['rep_police', 'rep_military', 'rep_underground', 'rep_corporate', 'rep_exile'];
    for (const id of reps) {
      const r = g.state.items[id];
      r.locked = false;
      r.max = 100;
      r.val = 50;
    }
    g.state.morality.value = -50;
    g.awardFactionRep('faction_ntpd', 10, 'e2e-low-morality');
    return {
      rep_police: g.state.items.rep_police.val,
      rep_underground: g.state.items.rep_underground.val,
      rep_exile: g.state.items.rep_exile.val,
    };
  });

  expect(lowMoral.rep_police).toBe(58); // +10 * 0.8
  expect(lowMoral.rep_underground).toBe(48); // -round(8*0.2)=2
  expect(lowMoral.rep_exile).toBe(48); // -round(8*0.3)=2
});

test('tier transition unlocks blueprint at threshold', async ({ page }) => {
  await bootGame(page);

  const result = await page.evaluate(() => {
    const g = window.Game;
    const rep = g.state.items.rep_police;
    rep.locked = false;
    rep.max = 100;
    rep.val = 24;

    const fac = g.state.items.faction_ntpd;
    fac._lastKnownTier = 0;

    const bp = g.state.items.bp_at_shield_coating;
    bp.locked = true;

    g.state.morality.value = 0;
    g.awardFactionRep('faction_ntpd', 1, 'e2e-threshold');

    return {
      rep: g.state.items.rep_police.val,
      lastTier: fac._lastKnownTier,
      blueprintUnlocked: !bp.locked,
    };
  });

  expect(result.rep).toBe(25);
  expect(result.lastTier).toBeGreaterThanOrEqual(25);
  expect(result.blueprintUnlocked).toBe(true);
});

test('vendor gating and buy flow: deduct creds, grant item, prevent blueprint rebuy', async ({ page }) => {
  await bootGame(page);

  const data = await page.evaluate(() => {
    const g = window.Game;

    const reps = ['rep_police', 'rep_military', 'rep_underground', 'rep_corporate', 'rep_exile'];
    for (const id of reps) {
      const r = g.state.items[id];
      r.locked = false;
      r.max = 100;
      r.val = 0;
    }
    g.state.items.creds.max = 100000;
    g.state.items.creds.val = 5000;
    g.state.items.rep_police.val = 50;

    const v10 = g.getFactionVendor('faction_ntpd');
    g.state.items.rep_police.val = 0;
    const v0 = g.getFactionVendor('faction_ntpd');
    g.state.items.rep_police.val = 50;

    const itemId = v10.weapons[0] || v10.backpacks[0] || v10.parts[0];
    const item = g.state.items[itemId];
    const cost = g.getVendorItemCost(itemId);

    const credsBefore = g.state.items.creds.val;
    const ownedBefore = item?.owned || 0;
    const invBefore = g.state.player.partsInventory.length;

    const buyOk = g.buyFromVendor(itemId, 'faction_ntpd');
    const credsAfter = g.state.items.creds.val;
    const ownedAfter = item?.owned || 0;
    const invAfter = g.state.player.partsInventory.length;

    const bpId = v10.blueprints[0];
    const bp = g.state.items[bpId];
    bp.locked = true;
    const bpFirst = g.buyFromVendor(bpId, 'faction_ntpd');
    const bpSecond = g.buyFromVendor(bpId, 'faction_ntpd');

    return {
      gatingWorks: v0.parts.length === 0 && v0.weapons.length === 0 && v0.backpacks.length === 0 && v0.blueprints.length === 0,
      selectedType: item?.type || null,
      cost,
      buyOk,
      credsBefore,
      credsAfter,
      ownedBefore,
      ownedAfter,
      invBefore,
      invAfter,
      blueprintFirst: bpFirst,
      blueprintSecond: bpSecond,
      blueprintUnlockedAfterFirst: !bp.locked,
    };
  });

  expect(data.gatingWorks).toBe(true);
  expect(data.buyOk).toBe(true);
  expect(data.credsAfter).toBe(data.credsBefore - data.cost);

  if (data.selectedType === 'frame_part') {
    expect(data.invAfter).toBeGreaterThan(data.invBefore);
  } else {
    expect(data.ownedAfter).toBe(data.ownedBefore + 1);
  }

  expect(data.blueprintFirst).toBe(true);
  expect(data.blueprintUnlockedAfterFirst).toBe(true);
  expect(data.blueprintSecond).toBe(false);
});

test('alliance labels hit threshold boundaries in UI', async ({ page }) => {
  await bootGame(page);

  await page.evaluate(() => {
    const g = window.Game;
    const allReps = ['rep_police', 'rep_military', 'rep_underground', 'rep_corporate', 'rep_exile'];
    for (const id of allReps) {
      const rep = g.state.items[id];
      rep.locked = true;
      rep.val = 0;
    }
    g.state.items.rep_police.locked = false;
    g.state.items.rep_police.max = 100;
    g.state.items.rep_police.val = 0;
  });

  await page.getByRole('button', { name: /factions/i }).click();
  const chip = page.locator('.alliance-chip').first();

  const checkpoints = [
    { rep: 0, label: 'HOSTILE' },
    { rep: 10, label: 'TENSE' },
    { rep: 25, label: 'NEUTRAL' },
    { rep: 50, label: 'FRIENDLY' },
    { rep: 75, label: 'ALLIED' },
  ];

  for (const c of checkpoints) {
    await page.evaluate((repVal) => {
      window.Game.state.items.rep_police.val = repVal;
    }, c.rep);
    await expect(chip).toHaveText(c.label);
  }
});
