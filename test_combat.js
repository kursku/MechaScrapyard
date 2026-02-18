import Game from './src/game.js';

/**
 * Combat Verification Script
 * To be run in the browser console.
 */
export function testCombat() {
    const player = Game.state.player.frame;
    const enemyItem = Game.state.get('scrap_drone');

    if (!enemyItem) {
        console.error('Enemy "scrap_drone" not found in GameState.');
        return;
    }

    // Clone enemy for combat (reactive so it updates UI if integrated)
    const enemy = JSON.parse(JSON.stringify(enemyItem));
    enemy.stress = 0; // Initialize stress

    console.log('%c--- STARTING COMBAT TEST ---', 'color: cyan; font-weight: bold;');
    console.log('Player:', player);
    console.log('Enemy:', enemy);

    // Run 5 turns
    for (let i = 1; i <= 5; i++) {
        console.log(`%cTurn ${i}`, 'color: yellow; font-weight: bold;');

        // Player attacks enemy
        console.log('Player attacks...');
        Game.combat.resolveAttack(player, enemy, 'auto');

        if (enemy.parts.torso.status === 'destroyed') {
            console.log('%cEnemy Defeated!', 'color: green;');
            break;
        }

        // Enemy attacks player
        console.log('Enemy attacks...');
        Game.combat.resolveAttack(enemy, player, 'auto');

        if (player.parts.torso.status === 'destroyed') {
            console.log('%cPlayer Defeated!', 'color: red;');
            break;
        }
    }

    console.log('%c--- COMBAT TEST FINISHED ---', 'color: cyan; font-weight: bold;');
}

// Expose to window for easy access
window.testCombat = testCombat;
