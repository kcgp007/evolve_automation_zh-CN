const fs = require('fs');
const path = require('path');

const ROOT = '/home/king/workspace/evolve_automation_zh-CN';
const src = fs.readFileSync(path.join(ROOT, 'evolve_automation.user.js'), 'utf8');
const dict = JSON.parse(fs.readFileSync('/home/king/workspace/evolve_automation_zh-CN/tools/dict_zh.json', 'utf8'));

function hasOwn(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }

// 1) addSettingsSelect 的 optionsList（第5参，数组字面量 [ {val,label,hint} ]）
function extractOptionsList() {
    const results = [];
    let idx = 0;
    const pat = 'addSettingsSelect(';
    while ((idx = src.indexOf(pat, idx)) !== -1) {
        let i = idx + pat.length;
        let argNum = 0;
        let listStart = -1;
        while (i < src.length) {
            while (i < src.length && /\s/.test(src[i])) i++;
            const c = src[i];
            if (c === ')') break;
            if (c === "'" || c === '"' || c === '`') {
                // 跳过字符串
                const q = c; i++;
                while (i < src.length) { if (src[i] === '\\') { i += 2; continue; } if (src[i] === q) { i++; break; } i++; }
                argNum++;
                while (i < src.length && /\s/.test(src[i])) i++;
                if (src[i] === ',') i++;
                continue;
            }
            if (c === '[') {
                if (argNum === 4) { listStart = i; break; }
                let depth = 0;
                while (i < src.length) {
                    if (src[i] === '[') depth++;
                    if (src[i] === ']') { depth--; if (depth === 0) { i++; break; } }
                    i++;
                }
                argNum++;
                while (i < src.length && /\s/.test(src[i])) i++;
                if (src[i] === ',') i++;
                continue;
            }
            if (c === '[' && argNum === 4) { listStart = i; break; }
            // 其他 token
            let depth = 0;
            while (i < src.length) {
                const c2 = src[i];
                if (c2 === '(' || c2 === '{') depth++;
                if (c2 === ')' || c2 === '}') depth--;
                if ((c2 === ',' || c2 === ')') && depth === 0) break;
                i++;
            }
            if (src[i] === ',') { i++; argNum++; }
            else if (src[i] === ')') break;
        }
        if (listStart >= 0) {
            // 提取数组内的对象 {val: "...", hint: "...", label: "..."}
            const endBracket = src.indexOf(']', listStart);
            const arrStr = src.slice(listStart, endBracket + 1);
            const objRe = /\{\s*(val|hint|label)\s*:\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)\s*,?/g;
            let objBlock = null;
            // 更简单：按 { } 分割
            let depth = 0, cur = '', objs = [];
            for (let k = listStart; k <= endBracket; k++) {
                const ch = src[k];
                if (ch === '{') { if (depth === 0) cur = '{'; depth++; }
                else if (ch === '}') { depth--; if (depth === 0) { cur += '}'; objs.push(cur); cur = ''; } else cur += ch; }
                else if (depth > 0) cur += ch;
            }
            for (const o of objs) {
                const entry = {};
                const fm = /(\w+)\s*:\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g;
                let mm;
                while ((mm = fm.exec(o)) !== null) {
                    let s = mm[2];
                    const q = s[0];
                    s = s.slice(1, -1);
                    if (q === '`') s = s.replace(/\$\{[^}]*\}/g, '${EXPR}');
                    s = s.replace(/\\(.)/g, '$1');
                    entry[mm[1]] = s;
                }
                if (entry.label || entry.hint) results.push(entry);
            }
        }
        idx += pat.length;
    }
    return results;
}

// 2) append( / $(`) 模板里的静态英文文本（去 HTML 标签/插值）
function extractAppendTexts() {
    const results = [];
    const re = /(?:append|html|prepend)\((`(?:[^`\\]|\\.)*`|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')\)/g;
    let m;
    while ((m = re.exec(src)) !== null) {
        let t = m[2] !== undefined ? m[2] : (m[3] !== undefined ? m[3] : m[1]);
        if (m[1].startsWith('`')) {
            t = m[1].slice(1, -1).replace(/\$\{([^}]*)\}/g, '${EXPR}');
        } else {
            t = t.slice(1, -1).replace(/\\(.)/g, '$1');
        }
        // 去掉标签，保留文本
        const tagRe = /<[^>]*>/g;
        t = t.replace(tagRe, ' ');
        // 去掉插值
        t = t.replace(/\$\{EXPR\}/g, '');
        t = t.replace(/&emsp;/g, '\u2003');
        // 提取含字母的连续文本段
        const segRe = /[A-Za-z][A-Za-z0-9 '.,\-!?%():"'/<>+×°™]*[A-Za-z0-9)''"!?%.,>/]/g;
        const segs = t.match(segRe) || [];
        for (const s of segs) {
            const trimmed = s.trim();
            if (trimmed.length < 2) continue;
            if (!/[A-Za-z]/.test(trimmed)) continue;
            if (/^(true|false|null|undefined|NaN)$/i.test(trimmed)) continue;
            if (/^[#./]/.test(trimmed) && /\s/.test(trimmed) === false) continue;
            results.push(trimmed);
        }
    }
    return results;
}

const opts = extractOptionsList();
const appends = extractAppendTexts();

let out = '';
out += '=== SELECT OPTIONS (' + opts.length + ') ===\n';
const seen = new Set();
for (const o of opts) {
    for (const f of ['label', 'hint']) {
        if (o[f]) {
            const k = f + '|' + o[f];
            if (!seen.has(k)) { seen.add(k); out += '[' + f + '] ' + JSON.stringify(o[f]) + '\n'; }
        }
    }
}
out += '\n=== APPEND TEXT SEGMENTS (' + appends.length + ') ===\n';
const seenA = new Set();
for (const s of appends) {
    if (!seenA.has(s)) { seenA.add(s); out += JSON.stringify(s) + '\n'; }
}
fs.writeFileSync('/home/king/workspace/evolve_automation_zh-CN/tools/more_report.txt', out);
console.log('options:', opts.length, 'append segs:', appends.length);
