const fs = require('fs');
const lines = fs.readFileSync('/home/king/workspace/evolve_automation_zh-CN/evolve_automation_zh-CN.user.js', 'utf8').split('\n');
const line = lines.find(l => l.startsWith('    var TRANSLATIONS = {'));
const objStr = line.slice(line.indexOf('{'), line.lastIndexOf('};') + 1);
const dict = JSON.parse(objStr);

function decodeJsEscapes(s) {
    return s.replace(/\\(u[\da-fA-F]{4}|x[\da-fA-F]{2}|[nrtbfv0\\'"\s.])/g, function (m, esc) {
        if (esc[0] === 'u') return String.fromCharCode(parseInt(esc.slice(1), 16));
        if (esc[0] === 'x') return String.fromCharCode(parseInt(esc.slice(1), 16));
        switch (esc) { case 'n': return '\n'; case 'r': return '\r'; case 't': return '\t'; case 'b': return '\b'; case 'f': return '\f'; case 'v': return '\v'; case '0': return '\0'; default: return esc; }
    });
}
function decodeHtmlEntities(s) {
    return s.replace(/&#x([0-9a-fA-F]+);|&#(\d+);|&emsp;|&ensp;|&nbsp;|&amp;|&lt;|&gt;|&quot;|&#39;|&apos;/g, function (m, hex, dec) {
        if (hex) return String.fromCharCode(parseInt(hex, 16));
        if (dec) return String.fromCharCode(parseInt(dec, 10));
        switch (m) { case '&emsp;': return '\u2003'; case '&ensp;': return '\u2002'; case '&nbsp;': return '\u00a0'; case '&amp;': return '&'; case '&lt;': return '<'; case '&gt;': return '>'; case '&quot;': return '"'; case '&#39;': case '&apos;': return "'"; }
    });
}
function normalizeText(s) { return decodeHtmlEntities(decodeJsEscapes(s)); }

// 构建 NORM
const NORM = {};
for (const k in dict) {
    if (Object.prototype.hasOwnProperty.call(dict, k)) {
        const nk = normalizeText(k);
        if (!Object.prototype.hasOwnProperty.call(NORM, nk)) NORM[nk] = dict[k];
        const nk2 = nk.replace(/^\u2003+|\u2003+$/g, '');
        if (!Object.prototype.hasOwnProperty.call(NORM, nk2)) NORM[nk2] = dict[k];
    }
}

const bsKey = Object.keys(dict).find(k => k.indexOf('strorage') > -1);
const occKey = Object.keys(dict).find(k => k.indexOf('annex') > -1);
console.log('bsKey backslashes:', (bsKey.match(/\\/g) || []).length);
console.log('occKey backslashes:', (occKey.match(/\\/g) || []).length);
console.log('normalized bs has backslash:', (normalizeText(bsKey).match(/\\/g) || []).length);
console.log('normalized occ has backslash:', (normalizeText(occKey).match(/\\/g) || []).length);

const runtimeBs = "Assigns 3% extra strorage above required amounts, ensuring that required quantity will be actually reached, even if other part of script trying to sell\\eject\\switch production, etc. When manual trades enabled applies additional adjust derieved from selling threshold.";
const runtimeOcc = "Occupy last foreign power once other two are controlled, and unification is researched to speed up unification. Disable if you want annex\\purchase achievements.";
console.log('runtimeBs backslashes:', (runtimeBs.match(/\\/g) || []).length);
console.log('NORM has runtimeBs:', Object.prototype.hasOwnProperty.call(NORM, runtimeBs));
console.log('NORM has runtimeOcc:', Object.prototype.hasOwnProperty.call(NORM, runtimeOcc));
console.log('norm(runtimeBs) == norm(bsKey):', normalizeText(runtimeBs) === normalizeText(bsKey));
console.log('norm(runtimeOcc) == norm(occKey):', normalizeText(runtimeOcc) === normalizeText(occKey));
