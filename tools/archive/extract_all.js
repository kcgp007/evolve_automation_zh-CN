const fs = require('fs');
const path = require('path');

const ROOT = '/home/king/workspace/evolve_automation_zh-CN';
const src = fs.readFileSync(path.join(ROOT, 'evolve_automation.user.js'), 'utf8');
const dict = JSON.parse(fs.readFileSync('/home/king/workspace/evolve_automation_zh-CN/tools/dict_zh.json', 'utf8'));

// 提取所有字符串字面量：单引号、双引号、模板字符串
const literals = [];
const re = /('((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"|`((?:[^`\\$]|\\.|\$(?!\{))*?[^`\\$]|`))/g;
let m;
while ((m = re.exec(src)) !== null) {
    let s = m[2] !== undefined ? m[2] : (m[3] !== undefined ? m[3] : m[4]);
    if (s === undefined) continue;
    // 反转义
    try { s = s.replace(/\\(.)/g, '$1'); } catch (e) {}
    literals.push(s);
}

// 过滤：可能是 UI 文本的
// 排除代码特征
const codeRe = /^[\s]*($|[#.]|['"`]+$|[a-zA-Z_$][\w$]*\s*[:=({\[]|\.\w+\s*=|=>|function|\bvar\s|\blet\s|\bconst\s|\breturn\b|class\s|\.forEach|\.map\(|new\s|\bif\s*\(|\bfor\s*\(|\bwhile\s*\(|\bswitch\s*\(|\bcase\s|\btypeof\s|\bthis\b)/;
const htmlRe = /<[a-zA-Z\/]|class=|style=|\bid=|\bwidth:|\bcolor:|\bmargin|\bpadding|\bfont-|display:|\btext-align|\bbackground/;
const cssRe = /^[\w-]+:\s*\d|px|rgba?\(|#[0-9a-f]{3,8}\b/i;

const counts = new Map();
for (const s of literals) {
    const t = s.trim();
    if (t.length < 1) continue;
    if (!/[A-Za-z]/.test(t)) continue; // 必须有字母
    if (/[<>{}]/.test(t)) continue;     // 排除 HTML/代码
    if (codeRe.test(t)) continue;
    if (htmlRe.test(t)) continue;
    if (/^[0-9.%\-+\s]+$/.test(t)) continue;
    if (/^(true|false|null|undefined|NaN|Infinity)$/.test(t)) continue;
    if (/[;=]/.test(t) && !/\.\s/.test(t)) continue;
    counts.set(t, (counts.get(t) || 0) + 1);
}

const uncovered = [];
const covered = [];
for (const [t, c] of counts) {
    const inDict = Object.prototype.hasOwnProperty.call(dict, t);
    (inDict ? covered : uncovered).push({ t, c });
}

uncovered.sort((a, b) => b.c - a.c);
covered.sort((a, b) => b.c - a.c);

let out = '';
out += '=== COVERED (' + covered.length + ') ===\n';
for (const { t, c } of covered) out += c + '\t' + JSON.stringify(t) + '\n';
out += '\n=== UNCOVERED (' + uncovered.length + ') ===\n';
for (const { t, c } of uncovered) out += c + '\t' + JSON.stringify(t) + '\n';
fs.writeFileSync('/home/king/workspace/evolve_automation_zh-CN/tools/uncovered_report.txt', out);
console.log('literals:', literals.length, 'unique:', counts.size, 'covered:', covered.length, 'uncovered:', uncovered.length);
