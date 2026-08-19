const fs = require('fs');
const path = require('path');

const ROOT = '/home/king/workspace/evolve_automation_zh-CN';
const src = fs.readFileSync(path.join(ROOT, 'evolve_automation.user.js'), 'utf8');
const dict = JSON.parse(fs.readFileSync('/home/king/workspace/evolve_automation_zh-CN/tools/dict_zh.json', 'utf8'));

function hasOwn(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
function normOf(s) { return s.replace(/^\u2003+|\u2003+$/g, ''); }
function inDict(s) {
    if (hasOwn(dict, s)) return true;
    const n = normOf(s);
    return n !== s && hasOwn(dict, n);
}

// 提取所有 GUI 相关模板/字符串的完整文本（保留结构，去标签后的连续文本）
// 1) append(...) / prepend(...) / $('...') 模板
const guiStrings = [];
const seen = new Set();
function add(s) {
    const n = normOf(s.trim());
    if (n.length < 2) return;
    if (!/[A-Za-z]/.test(n)) return;
    if (seen.has(n)) return;
    seen.add(n);
    guiStrings.push(n);
}

// 提取模板/普通字符串字面量中，去 HTML 标签后含字母的文本块
const litRe = /(`(?:[^`\\]|\\.)*`|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g;
let m;
let guard = 0;
while ((m = litRe.exec(src)) !== null && guard < 200000) {
    guard++;
    let t = m[1];
    const q = t[0];
    t = t.slice(1, -1);
    if (q === '`') t = t.replace(/\$\{([^}]*)\}/g, '${EXPR}');
    t = t.replace(/\\(.)/g, '$1');
    // 必须像是 UI 文本（含 HTML 标签或表头样式或常见 UI 词），且非代码
    if (!/<[a-zA-Z]/.test(t)) continue;
    if (/<(script|style)\b/i.test(t)) continue;
    // 去标签、去插值、解码实体
    const text = t.replace(/<[^>]*>/g, ' ').replace(/\$\{EXPR\}/g, '').replace(/&emsp;/g, '\u2003').replace(/&#x27;/g, "'").replace(/&#xA;/g, '\n').replace(/&amp;/g, '&');
    // 分割成文本段（按标签边界）
    // 这里简单：整段去多余空白后，切分长空格
    const parts = text.split(/\s{2,}|\n+/).map(s => s.trim()).filter(s => s.length >= 2 && /[A-Za-z]/.test(s));
    for (const p of parts) add(p);
}

// 选项 label/hint（含 const 数组）
const objRe = /\{\s*(?:\w+\s*:\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)\s*,?\s*)+?\}/g;
while ((m = objRe.exec(src)) !== null) {
    if (!/label\s*:|hint\s*:/.test(m[0])) continue;
    const fm = /(short_label|label|hint)\s*:\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g;
    let mm;
    while ((mm = fm.exec(m[0])) !== null) {
        let s = mm[2];
        const q = s[0];
        s = s.slice(1, -1);
        if (q === '`') s = s.replace(/\$\{[^}]*\}/g, '${EXPR}');
        s = s.replace(/\\(.)/g, '$1');
        add(s);
    }
}

// addSettingsSelect/addSettingsNumber 等（含 addSettingsList 的 list）
const TF = [
    ['addSettingsSelect', [2, 3]],
    ['addSettingsNumber', [2, 3]],
    ['addSettingsString', [2, 3]],
    ['addSettingsList', [2, 3]],
    ['addSettingsToggle', [2, 3]],
    ['addSettingsHeader1', [1]],
    ['addSettingsHeader2', [1]],
    ['addStandardHeading', [1]],
];
function parseString(s, i) {
    const q = s[i]; let j = i + 1, out = '';
    if (q === '`') {
        let depth = 0;
        while (j < s.length) {
            const c = s[j];
            if (c === '\\') { out += c + (s[j + 1] || ''); j += 2; continue; }
            if (c === '`') break;
            if (c === '$' && s[j + 1] === '{') { out += '${EXPR}'; depth = 1; j += 2; while (j < s.length && depth > 0) { if (s[j] === '{') depth++; else if (s[j] === '}') depth--; if (depth === 0) break; j++; } j++; continue; }
            out += c; j++;
        }
        return { end: j, text: out };
    }
    while (j < s.length) { const c = s[j]; if (c === '\\') { out += c + (s[j + 1] || ''); j += 2; continue; } if (c === q) break; out += c; j++; }
    return { end: j + 1, text: out };
}
for (const [fn, argIdxArr] of TF) {
    let idx = 0;
    const pat = fn + '(';
    while ((idx = src.indexOf(pat, idx)) !== -1) {
        let i = idx + fn.length + 1, argNum = 0, col = [];
        while (i < src.length) {
            while (i < src.length && /\s/.test(src[i])) i++;
            const c = src[i];
            if (c === ')') break;
            if (c === "'" || c === '"' || c === '`') {
                const r = parseString(src, i);
                if (argIdxArr.includes(argNum)) col.push(r.text);
                i = r.end; argNum++;
                while (i < src.length && /\s/.test(src[i])) i++;
                if (src[i] === ',') i++;
                continue;
            }
            let depth = 0;
            while (i < src.length) {
                const c2 = src[i];
                if (c2 === '(' || c2 === '[' || c2 === '{') depth++;
                if (c2 === ')' || c2 === ']' || c2 === '}') depth--;
                if ((c2 === ',' || c2 === ')') && depth === 0) break;
                i++;
            }
            if (src[i] === ',') { i++; argNum++; } else if (src[i] === ')') break;
        }
        for (const t of col) add(t);
        idx += fn.length;
    }
}

// 对照字典，输出缺失
const miss = [];
for (const s of guiStrings) {
    if (s.indexOf('${EXPR}') > -1) continue; // 动态模板单独处理
    if (inDict(s)) continue;
    miss.push(s);
}

// 排序（按字母）
miss.sort((a, b) => a.localeCompare(b));
fs.writeFileSync('/home/king/workspace/evolve_automation_zh-CN/tools/missing.txt', miss.join('\n'));
console.log('total unique gui strings:', guiStrings.length, 'missing:', miss.length);
