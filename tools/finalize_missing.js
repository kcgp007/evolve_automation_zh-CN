const fs = require('fs');
const dict = JSON.parse(fs.readFileSync('/home/king/workspace/evolve_automation_zh-CN/tools/dict_zh.json', 'utf8'));
const cand = fs.readFileSync('/home/king/workspace/evolve_automation_zh-CN/tools/candidates.txt', 'utf8').split('\n').filter(Boolean);

const NOISE = [
    'Boolean(', 'currentStateOn));', 'game.loc(', 'this.checked);', '.appendTo(node);',
    '] : Number.MAX_SAFE_INTEGER;', '{val: "apocalypse', '{val: "ascension', '{val: "bioseed',
    '{val: "cataclysm', '{val: "mad', '{val: "none', '{val: "vacuum', '{val: "whitehole',
    'addSettingsHeader1(currentNode, "Game Messages");', 'addSettingsNumber(currentNode, "arpaStep"',
    'addSettingsString(currentNode, "log_prestige_format"', 'addSettingsToggle(currentNode, "arpaScaleWeighting"',
    'addSettingsToggle(currentNode, "hellTurnOffLogMessages"', 'addToggleCallbacks(smartNode, smartKey);',
    'buildSettingsSectionImpl($("#script_settings")', 'delay: 0,', 'here .', 'minLength: 2,', 'null;',
    'return;', 's no broken getter, etc.', 's open', 't demand it here, though, due to order of operations',
    't match the search query', 't selected from list', 'updateSettingsContentFunction(secondaryPrefix);',
    'with current progress, making script more eager to spend resources on finishing nearly constructed projects.");',
    ', Gain', ', game.loc(', ', Boolean(', ', currentStateOn', ', this.checked',
    ', Gain', 'is demanded',
];

const keep = [];
for (const t of cand) {
    if (NOISE.some(n => t === n || t.startsWith(n))) continue;
    if (/^, /.test(t)) continue;
    keep.push(t);
}

const missing = [];
const present = [];
for (const t of keep) {
    const norm = t.replace(/^\u2003+|\u2003+$/g, '');
    const has = Object.prototype.hasOwnProperty.call(dict, t) || Object.prototype.hasOwnProperty.call(dict, norm);
    (has ? present : missing).push(t);
}

fs.writeFileSync('/home/king/workspace/evolve_automation_zh-CN/tools/final_missing.txt', missing.join('\n'));
console.log('kept:', keep.length, 'present:', present.length, 'missing:', missing.length);
console.log('\n--- MISSING ---');
missing.forEach(m => console.log(JSON.stringify(m)));
