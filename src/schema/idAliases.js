// Canonical English IDs -> current data IDs.
// This enables an English-first schema while keeping backward compatibility.
export const CANONICAL_ID_MAP = {
    sorting_station: 'triagem',
    workshop_lv2: 'oficina_nivel2',
    refinery: 'refinaria',
    garage: 'garagem',
    research_bench: 'mesa_pesquisa',
    morality: 'moralidade',
};

const LEGACY_TO_CANONICAL = Object.fromEntries(
    Object.entries(CANONICAL_ID_MAP).map(([canonical, legacy]) => [legacy, canonical])
);

export function resolveItemId(id) {
    return CANONICAL_ID_MAP[id] || id;
}

export function toCanonicalId(id) {
    return LEGACY_TO_CANONICAL[id] || id;
}

export function getCanonicalAliases(actualId) {
    return Object.entries(CANONICAL_ID_MAP)
        .filter(([, legacy]) => legacy === actualId)
        .map(([canonical]) => canonical);
}
