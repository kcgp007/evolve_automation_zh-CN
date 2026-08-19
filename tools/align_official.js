const fs = require('fs');
const path = require('path');

const TOOLS = __dirname;
const ROOT = path.join(TOOLS, '..');
const USERJS = path.join(ROOT, 'evolve_automation_zh-CN.user.js');

const en = JSON.parse(fs.readFileSync(path.join(TOOLS, 'official_en.json'), 'utf8'));
const zh = JSON.parse(fs.readFileSync(path.join(TOOLS, 'official_zh.json'), 'utf8'));

const src = fs.readFileSync(USERJS, 'utf8');
const line = src.split('\n').find(x => x.includes('var TRANSLATIONS = {'));
const dictText = line.slice(line.indexOf('{'), line.lastIndexOf('}') + 1);
const dict = JSON.parse(dictText);

const SECTION_NAMES_RAW = src.match(/var SECTION_NAMES = (\{[\s\S]*?\n    \});/);
const sections = eval('(' + SECTION_NAMES_RAW[1] + ')');

function isEntityValue(v) {
    if (typeof v !== 'string' || !v) return false;
    if (!/[A-Za-z]/.test(v)) return false;
    if (v.indexOf('%') >= 0 || v.indexOf('{') >= 0 || v.indexOf('}') >= 0) return false;
    if (v.indexOf('\n') >= 0 || v.indexOf('\r') >= 0) return false;
    if (v.indexOf('<br') >= 0) return false;
    if (v.length < 2 || v.length > 60) return false;
    return true;
}

function isEntityKey(k) {
    if (k.endsWith('_name') || k.endsWith('_title') || k.endsWith('_plural')) return true;
    if (/^(job|city|structure|galaxy|outer|interstellar|eden|tau|portal|space|hell|race|trait|tech|civics|governor|morale|wish|feat|arpa)_/.test(k)) return true;
    return false;
}

const hit = {};
for (const k of Object.keys(en)) {
    if (!isEntityKey(k)) continue;
    const ev = en[k];
    if (!isEntityValue(ev)) continue;
    const zv = zh[k];
    if (!zv || !/[\u4e00-\u9fff]/.test(zv)) continue;
    if (!hit[ev]) hit[ev] = {};
    if (!hit[ev][zv]) hit[ev][zv] = [];
    hit[ev][zv].push(k);
}

const changes = [];
const conflicts = [];

for (const k of Object.keys(dict)) {
    if (!/^[A-Za-z]/.test(k) || k.length < 2) continue;
    const cands = hit[k] ? Object.keys(hit[k]) : [];
    if (!cands.length) continue;
    const unique = [...new Set(cands)];
    if (unique.length === 1) {
        const o = unique[0];
        if (dict[k] !== o) changes.push({ key: k, mine: dict[k], official: o, src: hit[k][o] });
    } else {
        conflicts.push({ key: k, mine: dict[k], official: unique, src: hit[k] });
    }
}

function fmt(x) { return x.key.padEnd(28) + ' mine=' + (x.mine || '').padEnd(12) + ' official=' + x.official; }

console.log('---- CHANGES (%d) ----', changes.length);
for (const c of changes) console.log(fmt(c) + '  [' + c.src.join(',') + ']');

console.log('\n---- CONFLICTS (%d) ----', conflicts.length);
for (const c of conflicts) console.log(c.key.padEnd(28) + ' mine=' + (c.mine || '').padEnd(12) + ' official=' + JSON.stringify(c.official));

console.log('\n---- SECTIONS ----');
for (const k of Object.keys(sections)) {
    const cands = hit[k] ? Object.keys(hit[k]) : [];
    if (cands.length === 1 && sections[k] !== cands[0]) {
        console.log('  ' + k + '  mine=' + sections[k] + '  official=' + cands[0]);
    }
}

const out = { changes, conflicts };
out.changes.forEach(c => delete c.src);
out.conflicts.forEach(c => delete c.src);
fs.writeFileSync(path.join(TOOLS, 'align_report.json'), JSON.stringify(out, null, 2));
console.log('\nreport -> tools/align_report.json');