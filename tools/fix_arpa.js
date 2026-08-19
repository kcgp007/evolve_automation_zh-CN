const fs = require('fs');
const USERJS = __dirname + '/../evolve_automation_zh-CN.user.js';
let src = fs.readFileSync(USERJS, 'utf8');
const lines = src.split('\n');
let changed = false;

lines.forEach((line, i) => {
    const m = line.match(/var TRANSLATIONS = (\{.*\});/);
    if (m) {
        const dict = JSON.parse(m[1]);
        if (dict['A.R.P.A.'] === 'A.R.P.A.') {
            dict['A.R.P.A.'] = '高级研究计划局';
            lines[i] = line.slice(0, line.indexOf('{')) + JSON.stringify(dict) + ';';
            changed = true;
            console.log('TRANSLATIONS A.R.P.A. ->', dict['A.R.P.A.']);
        } else {
            console.log('TRANSLATIONS A.R.P.A. already:', dict['A.R.P.A.']);
        }
    }
});

let out = lines.join('\n');
const s = out.match(/var SECTION_NAMES = (\{[\s\S]*?\n    \}\);)/);
if (s) {
    const sec = eval('(' + s[1] + ')');
    if (sec['A.R.P.A.'] === 'A.R.P.A.') {
        sec['A.R.P.A.'] = '高级研究计划局';
        out = out.slice(0, s.index) + 'var SECTION_NAMES = ' + JSON.stringify(sec) + ';' + out.slice(s.index + s[0].length);
        changed = true;
        console.log('SECTION_NAMES A.R.P.A. ->', sec['A.R.P.A.']);
    } else {
        console.log('SECTION_NAMES A.R.P.A. already:', sec['A.R.P.A.']);
    }
}

fs.writeFileSync(USERJS, out);
console.log(changed ? 'written' : 'no change needed');