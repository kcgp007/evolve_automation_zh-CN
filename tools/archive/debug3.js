const fs = require('fs');
const src = fs.readFileSync('/home/king/workspace/evolve_automation_zh-CN/evolve_automation.user.js', 'utf8');
const litRe = /(`(?:[^`\\]|\\.)*`|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g;
let m;
let count = 0;
let imp = 0;
let guard = 0;
while ((m = litRe.exec(src)) !== null) {
    guard++;
    if (guard > 300000) { console.log('guard hit, abort'); break; }
    count++;
    let t = m[1];
    const q = t[0];
    t = t.slice(1, -1);
    if (q === '`') t = t.replace(/\$\{[^}]*\}/g, '${EXPR}');
    t = t.replace(/\\(.)/g, '$1');
    if (t.indexOf('Import') > -1) { imp++; if (imp <= 5) console.log('IMP:', JSON.stringify(t.slice(0, 90))); }
}
console.log('total literals:', count, 'with Import:', imp);
