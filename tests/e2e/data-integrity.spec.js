import { test, expect } from '@playwright/test';

async function bootGame(page) {
  await page.goto('/');
  await page.waitForFunction(() => window.Game && window.Game.loaded === true);
}

/**
 * Data integrity tests for fix(data/p1):
 * - Zone mission ID fix (msn_rogue_drone_patrol → mission_scrap_drone)
 * - Portuguese ID standardization (garagem → garage, mesa_pesquisa → research_desk)
 * - evt_intro require fix (was always-truthy "energy" → "")
 */

test('mission ID: mission_scrap_drone exists in game state', async ({ page }) => {
  await bootGame(page);

  const result = await page.evaluate(() => {
    const g = window.Game;
    return {
      missionExists: !!g.state.items['mission_scrap_drone'],
      oldIdExists: !!g.state.items['msn_rogue_drone_patrol'],
      missionName: g.state.items['mission_scrap_drone']?.name || null,
    };
  });

  expect(result.missionExists, 'mission_scrap_drone should exist in state').toBe(true);
  expect(result.oldIdExists, 'msn_rogue_drone_patrol should NOT exist (wrong ID)').toBe(false);
  expect(result.missionName).toBe('Rogue Drone Patrol');
});

test('zone availableMissions references valid mission IDs', async ({ page }) => {
  await bootGame(page);

  const result = await page.evaluate(() => {
    const g = window.Game;
    // Find zone_scrapyard and check its missions resolve
    const zone = g.state.items['zone_scrapyard'];
    if (!zone) return { error: 'zone_scrapyard not found' };

    const missions = zone.availableMissions || [];
    return {
      missionIds: missions,
      allResolve: missions.every(id => !!g.state.items[id]),
    };
  });

  expect(result.error).toBeUndefined();
  expect(result.allResolve, `All zone missions should resolve: ${JSON.stringify(result.missionIds)}`).toBe(true);
});

test('Portuguese ID fix: garage upgrade exists, old garagem ID does not', async ({ page }) => {
  await bootGame(page);

  const result = await page.evaluate(() => {
    const g = window.Game;
    return {
      garageExists: !!g.state.items['garage'],
      garageIsUpgrade: g.state.items['garage']?.type === 'upgrade' || g.state.items['garage']?.max === 1,
      garagemExists: !!g.state.items['garagem'],
    };
  });

  expect(result.garageExists, 'garage upgrade should exist in state').toBe(true);
  expect(result.garagemExists, 'garagem should NOT exist (old Portuguese ID)').toBe(false);
});

test('Portuguese ID fix: research_desk upgrade exists, old mesa_pesquisa ID does not', async ({ page }) => {
  await bootGame(page);

  const result = await page.evaluate(() => {
    const g = window.Game;
    return {
      researchDeskExists: !!g.state.items['research_desk'],
      oldIdExists: !!g.state.items['mesa_pesquisa'],
    };
  });

  expect(result.researchDeskExists, 'research_desk upgrade should exist in state').toBe(true);
  expect(result.oldIdExists, 'mesa_pesquisa should NOT exist (old Portuguese ID)').toBe(false);
});

test('gate expressions evaluate without error after ID rename', async ({ page }) => {
  await bootGame(page);

  const result = await page.evaluate(() => {
    const g = window.Game;
    try {
      // These gate expressions now use the canonical IDs
      const garageGate = new Function('g', 'return !!(g.garage>0)')(g.state.g);
      const researchGate = new Function('g', 'return !!(g.research_desk>0)')(g.state.g);
      const missionGate = new Function('g', 'return !!(g.mission_scrap_drone>0)')(g.state.g);

      return {
        garageGateRan: true,
        garageGate,   // false until player builds it — that's correct
        researchGate,
        missionGate,
        errors: null,
      };
    } catch (e) {
      return { errors: e.message };
    }
  });

  expect(result.errors).toBeNull();
  expect(result.garageGateRan).toBe(true);
  // Newly started game: all gates should be false (nothing built yet)
  expect(result.garageGate).toBe(false);
  expect(result.researchGate).toBe(false);
  expect(result.missionGate).toBe(false);
});

test('evt_intro require is empty string, not truthy resource reference', async ({ page }) => {
  await bootGame(page);

  const result = await page.evaluate(() => {
    const g = window.Game;
    const evt = g.state.items['evt_intro'];
    return {
      eventExists: !!evt,
      require: evt?.require ?? 'NOT_FOUND',
    };
  });

  expect(result.eventExists, 'evt_intro should exist').toBe(true);
  expect(result.require, 'evt_intro require should be empty string, not "energy"').toBe('');
});
