const fs = require('fs');
const path = require('path');

const ROOT = '/home/king/workspace/evolve_automation_zh-CN';
const src = fs.readFileSync(path.join(ROOT, 'evolve_automation.user.js'), 'utf8');
const dict = JSON.parse(fs.readFileSync('/home/king/workspace/evolve_automation_zh-CN/tools/dict_zh.json', 'utf8'));

// 解析一个 JS 字符串字面量（从索引 i 处，s[i] 是 ' 或 " 或 `）
function parseString(s, i) {
    const q = s[i];
    let j = i + 1;
    let out = '';
    if (q === '`') {
        // 模板字符串：处理 ${...} 插值和转义，插值记为 {EXPR}
        let depth = 0;
        while (j < s.length) {
            const c = s[j];
            if (c === '\\') { out += c + (s[j + 1] || ''); j += 2; continue; }
            if (c === '`') break;
            if (c === '$' && s[j + 1] === '{') {
                out += '{EXPR}';
                depth = 1;
                j += 2;
                while (j < s.length && depth > 0) {
                    if (s[j] === '{') depth++;
                    else if (s[j] === '}') depth--;
                    if (depth === 0) break;
                    j++;
                }
                j++;
                continue;
            }
            out += c;
            j++;
        }
        return { end: j, text: out, template: true };
    }
    while (j < s.length) {
        const c = s[j];
        if (c === '\\') { out += c + (s[j + 1] || ''); j += 2; continue; }
        if (c === q) break;
        out += c;
        j++;
    }
    return { end: j + 1, text: out, template: false };
}

// 找到下一个参数的字符串字面量，从 idx 开始（跳过逗号、空白、非字符串表达式）
function nextStringParam(s, idx) {
    let i = idx;
    while (i < s.length) {
        while (i < s.length && (s[i] === ',' || /\s/.test(s[i]))) i++;
        if (i >= s.length) return null;
        const c = s[i];
        if (c === "'" || c === '"' || c === '`') {
            return { start: i, ...parseString(s, i) };
        }
        // 非字符串表达式：跳过整个 token（到逗号或语句结束）
        let depth = 0;
        while (i < s.length) {
            const c2 = s[i];
            if (c2 === '(' || c2 === '[' || c2 === '{') depth++;
            if (c2 === ')' || c2 === ']' || c2 === '}') depth--;
            if (c2 === ',' && depth === 0) break;
            if ((c2 === ';' || c2 === '\n') && depth === 0) return null;
            i++;
        }
        if (i < s.length && s[i] === ',') continue;
        return null;
    }
    return null;
}

// 目标函数及其需提取的参数索引
const TARGETS = [
    ['addSettingsToggle', [2, 3]],
    ['addSettingsNumber', [2, 3]],
    ['addSettingsString', [2, 3]],
    ['addSettingsSelect', [2, 3]],
    ['addSettingsList', [2, 3]],
    ['addSettingsHeader1', [1]],
    ['addSettingsHeader2', [1]],
    ['addStandardHeading', [1]],
    ['buildSettingsSection', [1]],
    ['buildSettingsSection2', [3]],
    ['addSettingsText', [1]],
    ['addSettingsNotice', [1]],
    ['addOptionUI', [2]],
];

const found = [];
const skipped = [];
for (const [fn, argIdxArr] of TARGETS) {
    let idx = 0;
    const pat = fn + '(';
    while ((idx = src.indexOf(pat, idx)) !== -1) {
        const openParen = idx + fn.length;
        let i = openParen + 1;
        // 逐个参数提取字符串，按 argIdxArr 收集
        let argNum = 0;
        let collected = [];
        let done = false;
        while (i < src.length && !done) {
            while (i < src.length && /\s/.test(src[i])) i++;
            const c = src[i];
            if (c === ')') { done = true; break; }
            if (c === "'" || c === '"' || c === '`') {
                const r = parseString(src, i);
                if (argIdxArr.includes(argNum)) collected.push(r.text);
                i = r.end;
                argNum++;
                // 跳过后面的空白和逗号
                while (i < src.length && /\s/.test(src[i])) i++;
                if (src[i] === ',') i++;
                continue;
            }
            // 非字符串参数：跳过一个 token
            let depth = 0;
            while (i < src.length) {
                const c2 = src[i];
                if (c2 === '(' || c2 === '[' || c2 === '{') depth++;
                if (c2 === ')' || c2 === ']' || c2 === '}') depth--;
                if ((c2 === ',' || c2 === ')') && depth === 0) break;
                i++;
            }
            if (src[i] === ',') { i++; argNum++; }
            else if (src[i] === ')') { done = true; }
        }
        if (collected.length > 0) {
            found.push({ fn, args: collected, line: src.slice(0, idx).split('\n').length });
        }
        idx += fn.length;
    }
}

const uncovered = [];
const covered = [];
for (const item of found) {
    for (const arg of item.args) {
        const t = arg.trim();
        if (t.length === 0 || !/[A-Za-z]/.test(t)) continue;
        if (/^\{?[A-Za-z_$][\w$]*\.?[\w$]*\}?$/.test(t) && !/\s/.test(t) && !/[.!?:]/.test(t)) continue; // 单标识符
        const inDict = Object.prototype.hasOwnProperty.call(dict, t);
        (inDict ? covered : uncovered).push({ fn: item.fn, line: item.line, t });
    }
}

let out = '';
out += 'total calls with string args: ' + found.length + '\n';
out += 'covered strings: ' + covered.length + '\n';
out += 'uncovered strings: ' + uncovered.length + '\n';
out += '\n=== UNCOVERED (by fn) ===\n';
const byFn = new Map();
for (const u of uncovered) {
    if (!byFn.has(u.fn)) byFn.set(u.fn, []);
    byFn.get(u.fn).push(u);
}
for (const [fn, items] of byFn) {
    out += '\n--- ' + fn + ' (' + items.length + ') ---\n';
    for (const it of items) out += 'L' + it.line + '\t' + JSON.stringify(it.t) + '\n';
}
out += '\n=== COVERED by fn ===\n';
const byFnC = new Map();
for (const c of covered) {
    if (!byFnC.has(c.fn)) byFnC.set(c.fn, []);
    byFnC.get(c.fn).push(c);
}
for (const [fn, items] of byFnC) {
    out += fn + ': ' + items.length + '\n';
}

fs.writeFileSync('/home/king/workspace/evolve_automation_zh-CN/tools/gui_report.txt', out);
console.log('done, uncovered:', uncovered.length, 'covered:', covered.length);
