import Game from './src/game.js';

/**
 * Combat Verification Script
 * To be run in the browser console.
 */
export function testCombat() {
    const runner = Game.combatRunner;
    const player = Game.state.player.frame;
    player.name = Game.state.player.name; // Assign name for logs

    // Reset tokens
    runner.clearTokens(player);

    const enemyItem = Game.state.items['scrap_drone'];

    if (!enemyItem) {
        console.error('Enemy "scrap_drone" not found in GameState.');
        return;
    }

    // Clone enemy for combat
    const enemy = runner._cloneEnemy(enemyItem);
    enemy.stress = 0; // Initialize stress

    console.log('%c--- STARTING COMBAT TEST ---', 'color: cyan; font-weight: bold;');

    // Manually setup combat runner state for test
    runner.enemies = [enemy];
    runner.active = true;
    runner.combatLog = [];

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
            console.log('Applying test tokens...');
            runner.applyToken(enemy, 'BURN', 1);
            runner.applyToken(enemy, 'BREACH', 1);
        }

        // Player attacks enemy
        console.log('Player attacks...');
        // _executeAttack(attacker, defender, policy, isPlayer)
        runner._executeAttack(player, enemy, 'auto', true);

        if (enemy.parts.torso.status === 'destroyed') {
            console.log('%cEnemy Defeated!', 'color: green;');
            runner.endCombat('victory');
            break;
        }

        // Enemy attacks player
        console.log('Enemy attacks...');
        runner._executeAttack(enemy, player, 'auto', false);

        if (player.parts.torso.status === 'destroyed') {
            console.log('%cPlayer Defeated!', 'color: red;');
            runner.endCombat('defeat');
            break;
        }

        // Maintenance Phase
        console.log('Maintenance Phase...');
        runner.maintenancePhase(player, true);
        runner.maintenancePhase(enemy, false);

        // Helper to format tokens
        const fmtTokens = (f) => (f.tokens || []).map(t => `${t.type}:${t.stacks}`).join(', ');

        const pTokens = fmtTokens(player);
        const eTokens = fmtTokens(enemy);

        console.log(`%cStatus: Player Heat ${player.heat} | Stress ${Math.floor(player.stress)} [${pTokens}] || Enemy Heat ${enemy.heat} [${eTokens}]`, 'color: gray;');

        // Print log
        console.log('Logs:', runner.combatLog.slice(-3));
    }

    console.log('%c--- COMBAT TEST FINISHED ---', 'color: cyan; font-weight: bold;');
}

export function testAdvancedTokens() {
    const runner = Game.combatRunner;
    const player = Game.state.player.frame;
    const enemyItem = Game.state.items['junkyard_furnace'] || Game.state.items['scrap_drone'];
    if (!enemyItem) return console.error('Enemy not found');
    const enemy = runner._cloneEnemy(enemyItem);
    runner.enemies = [enemy];
    runner.active = true;
    runner.combatLog = [];

    console.log('%c--- ADVANCED TOKEN TEST ---', 'color: magenta; font-weight: bold;');

    // 1. ERROR
    console.log('Testing ERROR token on Enemy...');
    runner.applyToken(enemy, 'ERROR', 3);
    for (let i = 0; i < 10; i++) {
        const canAct = runner.canAct(enemy, 'Enemy');
        console.log(`Turn ${i + 1}: Enemy can act? ${canAct} (ERROR stacks: ${runner.getTokenStacks(enemy, 'ERROR')})`);
        if (runner.getTokenStacks(enemy, 'ERROR') === 0) break;
    }

    // 2. TARGET_LOCK
    console.log('Testing TARGET_LOCK on Enemy...');
    const pLogStart = runner.combatLog.length;
    runner.applyToken(enemy, 'TARGET_LOCK', 1);
    runner._executeAttack(player, enemy, 'auto', true);
    const newLogs = runner.combatLog.slice(pLogStart);
    console.log('Log check (Target Lock):', newLogs.filter(l => l.includes('Target Locked')));

    // 3. SUPPRESS
    console.log('Testing SUPPRESS on Player...');
    runner.applyToken(player, 'SUPPRESS', 5);
    // Simulate attack
    runner._executeAttack(player, enemy, 'auto', true);
    // Verify log doesn't crash
    console.log('Suppressed attack executed.');

    console.log('%c--- END TOKEN TEST ---', 'color: magenta;');
}

// Expose to window for easy access
window.testCombat = testCombat;
window.testAdvancedTokens = testAdvancedTokens;
