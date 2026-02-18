import Game from './src/game.js';

/**
 * Combat Verification Script
 * To be run in the browser console.
 */
export function testCombat() {
    const player = Game.state.player.frame;
    player.name = Game.state.player.name; // Assign name for logs

    const enemyItem = Game.state.get('scrap_drone');

    if (!enemyItem) {
        console.error('Enemy "scrap_drone" not found in GameState.');
        return;
    }

    // Clone enemy for combat (reactive so it updates UI if integrated)
    const enemy = JSON.parse(JSON.stringify(enemyItem));
    enemy.stress = 0; // Initialize stress

    console.log('%c--- STARTING COMBAT TEST ---', 'color: cyan; font-weight: bold;');

    // Register active units for maneuvers like counter-attacks
    Game.combat.setCombatants([player, enemy]);

    // Assign maneuvers for testing (§9.3)
    player.maneuvers = [
        { id: 'mech_brawl', name: 'Mech Brawl', type: 'Reaction', trigger: 'on_hit', cooldown: 0 }
    ];
    enemy.maneuvers = [
        { id: 'berserker_protocol', name: 'Berserker Protocol', type: 'Instinct', trigger: null, cooldown: 0 }
    ];
    enemy.stress = 65; // Force Berserker Protocol trigger

    console.log('Player:', player);
    console.log('Enemy:', enemy);

    // Run 5 turns
    for (let i = 1; i <= 5; i++) {
        console.log(`%cTurn ${i}`, 'color: yellow; font-weight: bold;');

        if (i === 1) {
            // Test Token Application (§8.1)
            Game.combat.applyToken(enemy, 'burn', 1);
            Game.combat.applyToken(enemy, 'error', 1);
            Game.combat.applyToken(enemy, 'breach', 1);
        }

        // Player attacks enemy
        console.log('Player attacks...');
        Game.combat.resolveAttack(player, enemy, 'auto');

        if (enemy.parts.torso.status === 'destroyed') {
            console.log('%cEnemy Defeated!', 'color: green;');
            Game.combat.resolveEndCombat(player, enemy);
            break;
        }

        // Enemy attacks player
        console.log('Enemy attacks...');
        Game.combat.resolveAttack(enemy, player, 'auto');

        if (player.parts.torso.status === 'destroyed') {
            console.log('%cPlayer Defeated!', 'color: red;');
            break;
        }

        // Maintenance Phase
        Game.combat.maintenancePhase(player);
        Game.combat.maintenancePhase(enemy);

        const pTokens = Object.entries(player.tokens || {}).filter(([k, v]) => v > 0).map(([k, v]) => `${k}:${v}`).join(', ');
        const eTokens = Object.entries(enemy.tokens || {}).filter(([k, v]) => v > 0).map(([k, v]) => `${k}:${v}`).join(', ');

        console.log(`%cStatus: Player Heat ${player.heat} | Stress ${Math.floor(player.stress)} [${pTokens}] || Enemy Heat ${enemy.heat} [${eTokens}]`, 'color: gray;');
    }

    console.log('%c--- COMBAT TEST FINISHED ---', 'color: cyan; font-weight: bold;');
}

// Expose to window for easy access
window.testCombat = testCombat;
