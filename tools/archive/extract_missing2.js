const fs = require('fs');
const path = require('path');
const ROOT = '/home/king/workspace/evolve_automation_zh-CN';
const src = fs.readFileSync(path.join(ROOT, 'evolve_automation.user.js'), 'utf8');
const userjs = fs.readFileSync(path.join(ROOT, 'evolve_automation_zh-CN.user.js'), 'utf8');

const dLine = userjs.split('\n').find(l => l.indexOf('var TRANSLATIONS = {') !== -1);
const dict = JSON.parse(dLine.slice(dLine.indexOf('{'), dLine.lastIndexOf('};') + 1));

// 用户汇报的 section 行区间
const RANGES = [
    ['Planet', 16519, 16600],
    ['War', 16941, 17231],
    ['Mech', 17231, 17353],
    ['Ejector', 17353, 18373],
    ['Job', 18373, 18497],
    ['Weighting', 18497, 18568],
    ['Building', 18568, 18730],
];
const lines = src.split('\n');
const missing = {};
const found = {};

function consider(text, kind) {
    const t = String(text);
    if (!t || !/[A-Za-z]{2}/.test(t)) return;
    if (/^\s*$/.test(t)) return;
    if (/\$\{/.test(t) || /\$\[/.test(t)) return;
    if (t.startsWith('game.loc') || t.startsWith('game.') || t.startsWith('#script') || t.startsWith('script_')) return;
    const norm = t.trim().replace(/^\u2003+|\u2003+$/g, '');
    if (Object.prototype.hasOwnProperty.call(dict, norm)) {
        (found[kind] = found[kind] || []).push(norm);
        return;
    }
    if (Object.prototype.hasOwnProperty.call(dict, t)) { (found[kind] = found[kind] || []).push(t); return; }
    (missing[kind] = missing[kind] || []).push(t);
}

for (const [name, a, b] of RANGES) {
    const seg = lines.slice(a - 1, b).join('\n');
    // HTML 纯文本 >...< 与 title/placeholder
    const htmlRe = /(?:>|<[a-z][^>]*?title=")[^<>\n]*?\s([A-Za-z][^<>\n]*?)(?=<|\n|$)/g;
    for (const m of seg.matchAll(/([^<>]*?)<[^>]*>/g)) {
        const txt = m[1].trim();
        if (txt && /[A-Za-z]{2}/.test(txt) && !/^[\W]+$/.test(txt)) consider(txt, name + '-html');
    }
    // title="..."
    for (const m of seg.matchAll(/title="([^"]*)"/g)) {
        if (m[1] && /[A-Za-z]{2}/.test(m[1])) consider(m[1], name + '-title');
    }
    // options label/hint/short_label (不含 game.loc)
    for (const m of seg.matchAll(/(label|hint|short_label):\s*"((?:[^"\\]|\\.)*)"/g)) {
        if (m[2] && !m[2].startsWith('game.loc')) consider(m[2], name + '-opt');
    }
    // addStandardHeading / addSettingsHeader1 参数
    for (const m of seg.matchAll(/(?:addStandardHeading|addSettingsHeader1|addSettingsHeader2|addSettingsToggle|addSettingsNumber|addSettingsString|addSettingsSelect|addSettingsList)\(\s*[^,]+,\s*[^,]+,\s*"((?:[^"\\]|\\.)*)"/g)) {
        if (m[1]) consider(m[1], name + '-label');
    }
}

const missAll = {};
for (const k of Object.keys(missing)) for (const t of missing[k]) { if (!missAll[t]) missAll[t] = []; missAll[t].push(k); }
for (const t of Object.keys(missAll)) {
    const k = missAll[t];
    if (t.includes('\n')) continue;
    console.log('MISS ' + JSON.stringify(t) + '  [' + k.join(',') + ']');
}
console.log('\nmissing unique:', Object.keys(missAll).length);
