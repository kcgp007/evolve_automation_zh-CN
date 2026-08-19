const fs = require('fs');
const dict = JSON.parse(fs.readFileSync('/home/king/workspace/evolve_automation_zh-CN/tools/dict_zh.json', 'utf8'));
const report = fs.readFileSync('/home/king/workspace/evolve_automation_zh-CN/tools/more_report.txt', 'utf8');

// 提取 append 段部分
const segStart = report.indexOf('=== APPEND TEXT SEGMENTS');
const segs = report.slice(segStart).split('\n').slice(1).filter(Boolean)
    .map(l => { try { return JSON.parse(l); } catch (e) { return null; } }).filter(Boolean);

const hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const missing = [];
const present = [];
for (const s of segs) {
    const norm = s.replace(/^\u2003+|\u2003+$/g, '');
    if (hasOwn(dict, s) || hasOwn(dict, norm)) present.push(s);
    else missing.push(s);
}
console.log('appends total:', segs.length, 'present:', present.length, 'missing:', missing.length);
console.log('\n--- MISSING APPEND SEGMENTS ---');
missing.forEach(m => console.log(JSON.stringify(m)));