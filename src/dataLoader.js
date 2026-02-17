/**
 * DataLoader — loads all JSON data files for the game.
 * Follows Arcanum's pattern: reads modules.json, then loads all listed files.
 */

const DATA_DIR = './data/mecha/';

async function loadJSON(path) {
    const resp = await fetch(path);
    if (!resp.ok) throw new Error(`Failed to load: ${path}`);
    return resp.json();
}

export default {

    /** Loaded raw data indexed by filename */
    rawData: {},

    /**
     * Load all game data files.
     * @returns {Promise<Object>} all loaded data
     */
    async requestData() {
        console.log('DataLoader: Fetching modules.json...');
        // Load module list
        const modules = await loadJSON(DATA_DIR + 'modules.json');
        console.log('DataLoader: modules.json loaded.', modules);

        // Load all core files
        console.log(`DataLoader: Loading ${modules.core.length} core files...`);
        const promises = modules.core.map(async (name) => {
            try {
                console.log(`DataLoader: Loading ${name}.json...`);
                const data = await loadJSON(DATA_DIR + name + '.json');
                this.rawData[name] = data;
                console.log(`DataLoader: ${name}.json loaded.`);
            } catch (e) {
                console.warn(`DataLoader ERROR: Could not load ${name}.json:`, e.message);
                this.rawData[name] = [];
            }
        });

        await Promise.all(promises);
        console.log('DataLoader: Core files loaded.');

        // Load modules (district packs, etc)
        if (modules.modules && modules.modules.length > 0) {
            console.log(`DataLoader: Loading ${modules.modules.length} district modules...`);
            for (const mod of modules.modules) {
                try {
                    console.log(`DataLoader: Loading module ${mod}...`);
                    const data = await loadJSON(DATA_DIR + 'modules/' + mod + '.json');
                    // Merge module data into rawData
                    if (Array.isArray(data)) {
                        console.log(`DataLoader: Loaded module: ${mod}`);
                    } else {
                        for (const [cat, items] of Object.entries(data)) {
                            if (!this.rawData[cat]) this.rawData[cat] = [];
                            this.rawData[cat].push(...items);
                        }
                    }
                } catch (e) {
                    console.warn(`DataLoader ERROR: Could not load module ${mod}:`, e.message);
                }
            }
        }

        console.log('DataLoader: All data loaded successfully.', Object.keys(this.rawData));
        return this.rawData;
    },

    /**
     * Get loaded data for a category.
     * @param {string} name - Category name (e.g., 'resources', 'tasks')
     * @returns {Array}
     */
    get(name) {
        return this.rawData[name] || [];
    }
};
