const fs = require('fs');
const dict = JSON.parse(fs.readFileSync('/home/king/workspace/evolve_automation_zh-CN/tools/dict_zh.json', 'utf8'));
const src = fs.readFileSync('/home/king/workspace/evolve_automation_zh-CN/evolve_automation.user.js', 'utf8');
const litRe = /(`(?:[^`\\]|\\.)*`|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g;
let m;
let found = [];
while ((m = litRe.exec(src)) !== null) {
    let t = m[1];
    const q = t[0];
    t = t.slice(1, -1);
    if (q === '`') t = t.replace(/\$\{[^}]*\}/g, '${EXPR}');
    t = t.replace(/\\(.)/g, '$1');
    if (t.indexOf('Import Script Settings') > -1) {
        found.push({ t: t, inDict: Object.prototype.hasOwnProperty.call(dict, t.trim()) });
    }
}
console.log('matches:', found.length);
found.forEach(f => console.log(JSON.stringify(f.t.slice(0, 100)), 'trimInDict:', f.inDict));
