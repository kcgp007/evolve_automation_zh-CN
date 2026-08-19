const fs = require('fs');
const path = require('path');

const ROOT = '/home/king/workspace/evolve_automation_zh-CN';
const src = fs.readFileSync(path.join(ROOT, 'evolve_automation.user.js'), 'utf8');
const dict = JSON.parse(fs.readFileSync('/home/king/workspace/evolve_automation_zh-CN/tools/dict_zh.json', 'utf8'));

function jsDecode(s) {
    return s.replace(/\\(u[\da-fA-F]{4}|x[\da-fA-F]{2}|n|r|t|b|f|v|0|\\|'|"|\s|.)/g, (m, esc) => {
        if (esc[0] === 'u') return String.fromCharCode(parseInt(esc.slice(1), 16));
        if (esc[0] === 'x') return String.fromCharCode(parseInt(esc.slice(1), 16));
        switch (esc) {
            case 'n': return '\n';
            case 'r': return '\r';
            case 't': return '\t';
            case 'b': return '\b';
            case 'f': return '\f';
            case 'v': return '\v';
            case '0': return '\0';
            default: return esc;
        }
    });
}

function htmlDecode(s) {
    return s.replace(/&#x([0-9a-fA-F]+);|&#(\d+);|&emsp;|&ensp;|&nbsp;|&amp;|&lt;|&gt;|&quot;|&#39;|&apos;/g, (m, hex, dec) => {
        if (hex) return String.fromCharCode(parseInt(hex, 16));
        if (dec) return String.fromCharCode(parseInt(dec, 10));
        switch (m) {
            case '&emsp;': return '\u2003';
            case '&ensp;': return '\u2002';
            case '&nbsp;': return '\u00a0';
            case '&amp;': return '&';
            case '&lt;': return '<';
            case '&gt;': return '>';
            case '&quot;': return '"';
            case '&#39;':
            case '&apos;': return "'";
        }
    });
}

// runtime 文本 = jsDecode + htmlDecode（title 属性经过 HTML 解析）
function runtimeText(literal) {
    return htmlDecode(jsDecode(literal));
}

function parseString(s, i) {
    const q = s[i];
    let j = i + 1;
    let out = '';
    if (q === '`') {
        let depth = 0;
        while (j < s.length) {
            const c = s[j];
            if (c === '\\') { out += c + (s[j + 1] || ''); j += 2; continue; }
            if (c === '`') break;
            if (c === '$' && s[j + 1] === '{') {
                out += '${EXPR}';
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
        return { end: j, text: out };
    }
    while (j < s.length) {
        const c = s[j];
        if (c === '\\') { out += c + (s[j + 1] || ''); j += 2; continue; }
        if (c === q) break;
        out += c;
        j++;
    }
    return { end: j + 1, text: out };
}

const TARGETS = [
    ['addSettingsToggle', [2, 3]],
    ['addSettingsNumber', [2, 3]],
    ['addSettingsString', [2, 3]],
    ['addSettingsSelect', [2, 3]],
    ['addSettingsList', [2, 3]],
    ['addSettingsHeader1', [1]],
    ['addSettingsHeader2', [1]],
    ['addStandardHeading', [1]],
    ['addOptionUI', [2]],
];

const allStrings = [];
for (const [fn, argIdxArr] of TARGETS) {
    let idx = 0;
    const pat = fn + '(';
    while ((idx = src.indexOf(pat, idx)) !== -1) {
        let i = idx + fn.length + 1;
        let argNum = 0;
        let collected = [];
        while (i < src.length) {
            while (i < src.length && /\s/.test(src[i])) i++;
            const c = src[i];
            if (c === ')') break;
            if (c === "'" || c === '"' || c === '`') {
                const r = parseString(src, i);
                if (argIdxArr.includes(argNum)) collected.push(r.text);
                i = r.end;
                argNum++;
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
            if (src[i] === ',') { i++; argNum++; }
            else if (src[i] === ')') break;
        }
        for (const t of collected) allStrings.push({ fn, literal: t });
        idx += fn.length;
    }
}

// 命中检测（模拟 translateText 增强版）
function hasOwn(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
function keyOf(text) {
    if (hasOwn(dict, text)) return text;
    const norm = text.replace(/^\u2003+|\u2003+$/g, '');
    if (norm !== text && hasOwn(dict, norm)) return norm;
    // 规范化字典键后再查：对字典键做 runtimeText 规范化
    const rt = runtimeText(text);
    if (rt !== text) {
        if (hasOwn(dict, rt)) return rt;
        const n2 = rt.replace(/^\u2003+|\u2003+$/g, '');
        if (hasOwn(dict, n2)) return n2;
    }
    return null;
}

const miss = [];
const hit = [];
for (const item of allStrings) {
    const lit = item.literal;
    // 运行时文本（含 ${EXPR} 时插值处为动态）
    const rt = runtimeText(lit);
    if (rt.length === 0 || !/[A-Za-z]/.test(rt)) continue;
    if (/^\{?[A-Za-z_$][\w$]*\.?[\w$]*\}?$/.test(rt) && !/\s/.test(rt) && !/[.!?:]/.test(rt)) continue;
    // 如果含 ${EXPR}，插值前后单独检测
    const parts = rt.split('${EXPR}');
    let allHit = true;
    for (const p of parts) {
        const trimmed = p.trim();
        if (trimmed.length === 0) continue;
        if (!/[A-Za-z]/.test(trimmed)) continue;
        if (/^[\s\W_]*$/.test(trimmed)) continue;
        if (keyOf(trimmed) === null) { allHit = false; }
    }
    if (allHit) hit.push(item); else miss.push(item);
}

let out = '';
out += 'total gui strings: ' + allStrings.length + '\n';
out += 'hit: ' + hit.length + ', miss: ' + miss.length + '\n';
out += '\n=== MISS ===\n';
for (const m of miss) {
    out += m.fn + ' | ' + JSON.stringify(runtimeText(m.literal).slice(0, 120)) + '\n';
}
fs.writeFileSync('/home/king/workspace/evolve_automation_zh-CN/tools/hit_report.txt', out);
console.log('total:', allStrings.length, 'hit:', hit.length, 'miss:', miss.length);
