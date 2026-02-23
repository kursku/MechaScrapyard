const fs = require('fs');
const path = require('path');

const files = [
    'css/mecha_terminal.css',
    'src/ui/TerminalUI.vue',
    'src/ui/popups/itemPopup.vue'
];

const sizeMap = {
    '11px': 'var(--font-size-xs)',
    '12px': 'var(--font-size-xs)',
    '13px': 'var(--font-size-xs)',
    '14px': 'var(--font-size-sm)',
    '15px': 'var(--font-size-sm)',
    '16px': 'var(--font-size-base)',
    '17px': 'var(--font-size-base)',
    '18px': 'var(--font-size-lg)',
    '19px': 'var(--font-size-lg)',
    '20px': 'var(--font-size-xl)',
    '24px': 'var(--font-size-xxl)'
};

files.forEach(file => {
    let target = path.join('c:/Users/nicol/dyad-apps/MechaScrapyard', file);
    if (!fs.existsSync(target)) return;

    let content = fs.readFileSync(target, 'utf8');

    // Replace font-size: XXpx; with corresponding var
    content = content.replace(/font-size:\s*(\d+px);/g, (match, p1) => {
        if (sizeMap[p1]) {
            return `font-size: ${sizeMap[p1]};`;
        }
        return match;
    });

    // Also replace inline styles like style="font-size: 16px" if they exist, but mostly CSS

    fs.writeFileSync(target, content, 'utf8');
    console.log(`Updated fonts in ${file}`);
});
