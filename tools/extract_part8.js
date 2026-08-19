const fs = require('fs');
const src = fs.readFileSync('/home/king/workspace/evolve_automation_zh-CN/evolve_automation.user.js', 'utf8');

const base = JSON.parse(fs.readFileSync('/home/king/workspace/evolve_automation_zh-CN/tools/dict_zh.json', 'utf8'));
let p6 = {}, p7 = {};
try { p6 = JSON.parse(fs.readFileSync('/home/king/workspace/evolve_automation_zh-CN/tools/part6.json', 'utf8')); } catch (e) {}
try { p7 = JSON.parse(fs.readFileSync('/home/king/workspace/evolve_automation_zh-CN/tools/part7.json', 'utf8')); } catch (e) {}
const all = { ...base, ...p6, ...p7 };

const out = {};

// 解码 JS 字符串字面量转义（含 \n \\ \' \" 等）
function decodeJsLiteral(s) {
    return s.replace(/\\(u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|[nrtbfv0'\"\\])/g, (m, esc) => {
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
            default: return esc; // \' -> ', \" -> ", \\ -> \
        }
    });
}

function add(k) {
    if (k === undefined || k === null) return;
    k = String(k);
    if (k === '') return;
    if (/^[\W_]+$/.test(k) || !/[A-Za-z]/.test(k)) return;
    if (Object.prototype.hasOwnProperty.call(all, k)) return;
    if (Object.prototype.hasOwnProperty.call(out, k)) return;
    out[k] = '';
}

// 1) master toggles: createSettingToggle(togglesNode, 'key', 'title')
const toggleRe = /createSettingToggle\(\s*togglesNode\s*,\s*'([^']+)'\s*,\s*'((?:[^'\\]|\\.)*)'/g;
let m;
while ((m = toggleRe.exec(src))) {
    add(m[1]);
    add(decodeJsLiteral(m[2]));
}
add('Bulk Sell');
const safeM = src.match(/Safe mode active, [^<`]+/);
if (safeM) add(safeM[0]);

// 2) checkTypes: id -> display name + desc
const ctStart = src.indexOf('const checkTypes = {');
const rbIdx = src.indexOf('const retBools', ctStart);
let ctBlock = rbIdx > -1 ? src.slice(ctStart, rbIdx) : src.slice(ctStart, ctStart + 30000);
let tm;
const idRe = /^\s*([A-Za-z0-9]+):\s*\{/gm;
while ((tm = idRe.exec(ctBlock))) {
    add(tm[1].replace(/([A-Z])/g, ' $1').trim());
}
const descRe = /desc:\s*"((?:[^"\\]|\\.)*)"/g;
while ((tm = descRe.exec(ctBlock))) {
    add(decodeJsLiteral(tm[1]));
}

// 3) checkCompare comparator option names
const ccStart = src.indexOf('const checkCompare = {');
const ccEnd = src.indexOf('const checkCustom', ccStart);
const ccBlock = src.slice(ccStart, ccEnd);
const cmpRe = /^\s*"([A-Za-z0-9!?]+)":/gm;
while ((tm = cmpRe.exec(ccBlock))) add(tm[1]);

// 4) checkCustom desc
const customStart = src.indexOf('const checkCustom = {');
const customEnd = src.indexOf('const argType', customStart);
const customBlock = src.slice(customStart, customEnd);
const customRe = /"((?:[^"\\]|\\.)*)"/g;
while ((tm = customRe.exec(customBlock))) add(tm[1]);

// 5) argType hints + plain labels
const atStart = src.indexOf('const argType = {');
const atEnd = src.indexOf('const argMap', atStart);
const atBlock = src.slice(atStart, atEnd);
const hintRe = /hint:\s*"((?:[^"\\]|\\.)*)"/g;
while ((tm = hintRe.exec(atBlock))) {
    if (!tm[1].startsWith('game.loc')) add(decodeJsLiteral(tm[1]));
}
const labelRe = /label:\s*"((?:[^"\\]|\\.)*)"/g;
while ((tm = labelRe.exec(atBlock))) {
    const v = tm[1];
    if (!v.startsWith('game.loc') && !/\$\{/.test(v)) add(v);
}

// 6) resource toggle titles (eject/supply/market/storage...)
const titleRe = /title="((?:[^"\\]|\\.)*)"/g;
while ((tm = titleRe.exec(src))) {
    const v = decodeJsLiteral(tm[1]);
    if (/^Enable/.test(v) && /resource|eject|supply|buy|sell|trade|store/i.test(v)) add(v);
}

// 7) prompt
add('Eval of this condition:');

fs.writeFileSync('/home/king/workspace/evolve_automation_zh-CN/tools/part8.json', JSON.stringify(out, null, 2));
console.log('extracted keys:', Object.keys(out).length);
const suspicious = Object.keys(out).filter(k => /\\\\/.test(k));
if (suspicious.length) console.log('suspicious (unterminated backslash):', suspicious.length);
