const fs = require('fs');
const lines = fs.readFileSync('/home/king/workspace/evolve_automation_zh-CN/tools/missing.txt', 'utf8').split('\n').filter(Boolean);

const EXCLUDE_PREFIX = [
    'function ', 'let ', 'const ', 'var ', 'if ', 'for ', 'while ', 'return ', 'class ', '}',
    'else ', 'typeof ', 'throw ', 'new ', 'try ', 'catch ', 'break;', 'continue;', 'switch ',
    'this.value', 'callback', 'node.append', 'smartNode', 'tableBodyNode', 'listNode', 'toggle', 'section.find',
    'settingsRaw.', 'settings.', 'game.', 'resource', 'target.', 'building.', 'state.', 'buildings.',
    'conflict.', 'response', 'this.checked', 'mainVue', 'trs', 'ui.item', 'foundItem', 'list[',
    'currentNode', 'parentNode', 'left', 'right', 'clickable', 'project', 'obj', 'res.',
    'hidden>', 'document.documentElement', 'resetButton', 'fuelAdjust', 'missingProducer', 'mechQueued',
    'nextBireme', 'nextTransport', 'maxStateOn', 'supportedAmount', 'remainingSmelters', 'remainingSegments',
    'smelterIridium', 'smelterIron', 'smelterSteel', 'steelRemoved', 'fuelRemoved', 'resourceTimeLeft',
    'targetTimeLeft', 'targetSegments', 'targetName', 'timeLeft', 'longestTimeLeft', 'queueid',
    'stateKey', 'smartKey', 'completion', 'curTech', 'nextTech', 'eta', 'expo', 'set.map', 'game.loc',
];

const EXCLUDE_RE = /([=+\-*/%<>!]|=|=>|\bnew\b|\bfunction\b|\blet\b|\bconst\b|\bvar\b|\(\)|\$\{|`|\bsource:|\.map\(|\.filter\(|\.find\(|\.forEach|\.join\(|\.trim|\.split|\.length|\.count|\.rate|\.cost|\.id\b|\.name\b|\.value\b|\btry\b|\bcatch\b|throw|prototype|\.indexOf|\.slice\(|\.append\(|\.on\(|\.val\(|\.prop\(|\.addClass|\.toggleClass|\.empty|\.off\(|\.css\(|\.before\(|\.after\(|\.remove\(|\.hide\(|\.show\(|\.autocomplete|\?\?|\?\s)/;

const candidates = [];
for (const l of lines) {
    const t = l;
    if (EXCLUDE_PREFIX.some(p => t.startsWith(p))) continue;
    if (EXCLUDE_RE.test(t)) continue;
    if (/^[a-z_$][\w$]*$/.test(t)) continue; // 单小写标识符
    if (/^\W*$/.test(t)) continue;
    // 需含字母
    if (!/[A-Za-z]/.test(t)) continue;
    candidates.push(t);
}

// 去重
const uniq = [...new Set(candidates)];
fs.writeFileSync('/home/king/workspace/evolve_automation_zh-CN/tools/candidates.txt', uniq.join('\n'));
console.log('candidates:', uniq.length);
