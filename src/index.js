import { createApp, h } from 'vue';
import Game from '@/game';
import DataLoader from '@/dataLoader';
import Persist from 'modules/persist';

import Main from 'ui/main.vue';
import globalMixin from '@/globalMixin';

if (__DIST) {
    console.log = function () { };
} else {
    // Combat Design §15 — Load test script in dev
    import('../test_combat.js').then(m => {
        window.testCombat = m.testCombat;
    }).catch(err => console.error('DEV> Could not load test_combat.js', err));

    // Global access for console debugging
    window.Game = Game;
}

const vm = createApp({
    components: { Main },

    data() {
        return {
            loading: true,
            error: null,
        };
    },

    async created() {
        console.log('BOOT: Starting boot sequence...');
        try {
            // Load all game data
            console.log('BOOT: Requesting data from DataLoader...');
            const rawData = await DataLoader.requestData();
            console.log('BOOT: Data loaded successfully.');

            // Check for saved game
            console.log('BOOT: Checking for saved game...');
            const saveData = Persist.load();

            // Initialize game
            console.log('BOOT: Initializing Game state...');
            Game.init(rawData, saveData);
            console.log('BOOT: Game initialized.');

            // Start game loop
            console.log('BOOT: Starting game loop...');
            Game.start();

            this.loading = false;
            console.log('BOOT: Mecha Scrapyard v' + __VERSION + ' initialized.');
        } catch (e) {
            console.error('BOOT ERROR:', e);
            this.error = e.message;
        }
    },

    render() {
        if (this.error) {
            return h('div', {
                style: {
                    color: '#f44',
                    fontFamily: 'monospace',
                    padding: '20px',
                    background: '#0a0e0d',
                    height: '100vh',
                }
            }, `BOOT ERROR: ${this.error}`);
        }

        if (this.loading) {
            return h('div', {
                style: {
                    color: '#0fa',
                    fontFamily: 'monospace',
                    padding: '20px',
                    background: '#0a0e0d',
                    height: '100vh',
                }
            }, 'SYS> Loading data...');
        }

        return h(Main);
    }
});

vm.mixin(globalMixin);
vm.mount('#app');
