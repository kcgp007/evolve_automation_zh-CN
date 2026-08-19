const fs = require('fs');
const path = require('path');
const { JSDOM } = require('/home/king/workspace/evolve_automation_zh-CN/node_modules/jsdom');

const ROOT = '/home/king/workspace/evolve_automation_zh-CN';
const src = fs.readFileSync(path.join(ROOT, 'evolve_automation.user.js'), 'utf8');
const userjs = fs.readFileSync(path.join(ROOT, 'evolve_automation_zh-CN.user.js'), 'utf8');

function jsDecode(s) {
    return s.replace(/\\(u[\da-fA-F]{4}|x[\da-fA-F]{2}|n|r|t|b|f|v|0|\\|'|"|\s|.)/g, (m, esc) => {
        if (esc[0] === 'u') return String.fromCharCode(parseInt(esc.slice(1), 16));
        if (esc[0] === 'x') return String.fromCharCode(parseInt(esc.slice(1), 16));
        switch (esc) { case 'n': return '\n'; case 'r': return '\r'; case 't': return '\t'; case 'b': return '\b'; case 'f': return '\f'; case 'v': return '\v'; case '0': return '\0'; default: return esc; }
    });
}
function htmlDecode(s) {
    return s.replace(/&#x([0-9a-fA-F]+);|&#(\d+);|&emsp;|&ensp;|&nbsp;|&amp;|&lt;|&gt;|&quot;|&#39;|&apos;/g, (m, hex, dec) => {
        if (hex) return String.fromCharCode(parseInt(hex, 16));
        if (dec) return String.fromCharCode(parseInt(dec, 10));
        switch (m) { case '&emsp;': return '\u2003'; case '&ensp;': return '\u2002'; case '&nbsp;': return '\u00a0'; case '&amp;': return '&'; case '&lt;': return '<'; case '&gt;': return '>'; case '&quot;': return '"'; case '&#39;': case '&apos;': return "'"; }
    });
}
function runtimeText(l) { return htmlDecode(jsDecode(l)); }

function parseString(s, i) {
    const q = s[i];
    let j = i + 1, out = '';
    if (q === '`') {
        let depth = 0;
        while (j < s.length) {
            const c = s[j];
            if (c === '\\') { out += c + (s[j + 1] || ''); j += 2; continue; }
            if (c === '`') break;
            if (c === '$' && s[j + 1] === '{') {
                out += '${EXPR}';
                depth = 1; j += 2;
                while (j < s.length && depth > 0) {
                    if (s[j] === '{') depth++;
                    else if (s[j] === '}') depth--;
                    if (depth === 0) break;
                    j++;
                }
                j++; continue;
            }
            out += c; j++;
        }
        return { end: j, text: out };
    }
    while (j < s.length) {
        const c = s[j];
        if (c === '\\') { out += c + (s[j + 1] || ''); j += 2; continue; }
        if (c === q) break;
        out += c; j++;
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

const items = []; // {fn, kind, text}
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
                if (argIdxArr.includes(argNum)) collected.push({ kind: argIdxArr.indexOf(argNum) === 0 ? 'label' : 'hint', text: r.text });
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
            if (src[i] === ',') { i++; argNum++; }
            else if (src[i] === ')') break;
        }
        for (const c of collected) {
            const rt = runtimeText(c.text);
            if (rt.length === 0 || !/[A-Za-z]/.test(rt)) continue;
            if (/^\{?[A-Za-z_$][\w$]*\.?[\w$]*\}?$/.test(rt) && !/\s/.test(rt) && !/[.!?:]/.test(rt)) continue;
            // 跳过明显解析错误的（跨行抓到别的代码）
            if (/game\.loc|set\.map|buildPrestigeSettings\);/i.test(rt)) continue;
            if (rt.indexOf('${EXPR}') > -1) continue; // 模板动态，单独处理
            items.push({ fn, kind: c.kind, text: rt });
        }
        idx += fn.length;
    }
}

// 构造 DOM
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { runScripts: 'outside-only', pretendToBeVisual: true });
const { window } = dom;
const doc = window.document;

const settings = doc.createElement('div');
settings.id = 'script_settings';
doc.body.appendChild(settings);

let i = 0;
for (const it of items) {
    const div = doc.createElement('div');
    div.className = 'item' + (i++);
    const label = doc.createElement('label');
    label.title = it.text; // hint 或 label 都用 title 存原文，span 存文本
    const span = doc.createElement('span');
    span.textContent = it.text;
    label.appendChild(span);
    div.appendChild(label);
    settings.appendChild(div);
}

// 记录原文
const checkList = [];
const labels = settings.querySelectorAll('label');
labels.forEach((l, idx) => {
    checkList.push({ idx, kind: items[idx].kind, orig: items[idx].text });
});

window.eval(userjs);

// 等待 init 轮询两次（3s），确保翻译完成
setTimeout(() => {
    setTimeout(() => {
        const missList = [];
        const labels = settings.querySelectorAll('label');
        labels.forEach((l, idx) => {
            const expect = checkList[idx];
            if (!expect) return;
            const curTitle = l.getAttribute('title');
            const curText = l.querySelector('span').textContent;
            // 该元素是否被翻译：title 或 text 中任一不再是英文原文
            const titleTr = curTitle !== expect.orig;
            const textTr = curText !== expect.orig;
            if (!titleTr && !textTr) {
                missList.push({ kind: expect.kind, orig: expect.orig });
            }
        });
        console.log('total items:', items.length);
        console.log('translated:', items.length - missList.length, 'not translated:', missList.length);
        console.log('\n=== NOT TRANSLATED ===');
        for (const m of missList) console.log('[' + m.kind + ']', JSON.stringify(m.orig.slice(0, 100)));
        process.exit(0);
    }, 2000);
}, 3200);
