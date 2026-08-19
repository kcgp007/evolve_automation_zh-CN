const fs = require('fs');
const path = require('path');

const ROOT = '/home/king/workspace/evolve_automation_zh-CN';
const src = fs.readFileSync(path.join(ROOT, 'evolve_automation.user.js'), 'utf8');
const dict = JSON.parse(fs.readFileSync('/home/king/workspace/evolve_automation_zh-CN/tools/dict_zh.json', 'utf8'));

function hasOwn(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }

// 提取所有 { ... label: "...", hint: "..." (short_label) ...} 对象数组元素
const objRe = /\{\s*(?:\w+\s*:\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)\s*,?\s*)+?\}/g;
const entries = [];
let m;
while ((m = objRe.exec(src)) !== null) {
    const o = m[0];
    if (!/label\s*:|hint\s*:/.test(o)) continue;
    const fm = /(short_label|label|hint)\s*:\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g;
    let mm;
    let e = {};
    while ((mm = fm.exec(o)) !== null) {
        let s = mm[2];
        const q = s[0];
        s = s.slice(1, -1);
        if (q === '`') s = s.replace(/\$\{[^}]*\}/g, '${EXPR}');
        s = s.replace(/\\(.)/g, '$1');
        if (!e[mm[1]]) e[mm[1]] = s;
    }
    if (e.label || e.hint) entries.push(e);
}

// 对照字典，输出缺失
const miss = [];
const seen = new Set();
for (const e of entries) {
    for (const f of ['short_label', 'label', 'hint']) {
        const v = e[f];
        if (!v) continue;
        const key = f + '|' + v;
        if (seen.has(key)) continue;
        seen.add(key);
        const norm = v.replace(/^\u2003+|\u2003+$/g, '');
        if (!hasOwn(dict, v) && !hasOwn(dict, norm)) {
            miss.push({ f, v });
        }
    }
}

let out = '=== OPTION ENTRIES (' + entries.length + ') ===\n';
out += 'missing: ' + miss.length + '\n\n';
for (const x of miss) out += '[' + x.f + '] ' + JSON.stringify(x.v) + '\n';
fs.writeFileSync('/home/king/workspace/evolve_automation_zh-CN/tools/opts_report.txt', out);
console.log('entries:', entries.length, 'missing:', miss.length);
