#!/usr/bin/env node
'use strict';
/**
 * tools/archive/audit_untranslated.js
 *
 * 只读审计脚本：扫描英文原脚本 `evolve_automation.user.js` 中面向用户的英文字符串，
 * 逐条送入主脚本 `evolve_automation_zh-CN.user.js` 的 `translateText()`，
 * 统计哪些字符串被「原样返回」（即当前没有中文翻译）。
 *
 * 硬性约束：
 *   - 不修改任何仓库文件（主脚本尾部注入仅发生在内存中，磁盘文件不动）。
 *   - 不联网、不安装依赖，仅使用仓库内已有的 jsdom。
 *   - 唯一新建文件就是本文件。
 *
 * 用法：
 *   node tools/archive/audit_untranslated.js         # 人读报告（stdout，不写任何文件）
 *   node tools/archive/audit_untranslated.js --json  # 机器可读
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const FILE_EN = path.join(ROOT, 'evolve_automation.user.js');   // 英文原脚本（只读）
const FILE_ZH = path.join(ROOT, 'evolve_automation_zh-CN.user.js'); // 主脚本

// ---------------------------------------------------------------- 参数

const argv = process.argv.slice(2);
const AS_JSON = argv.includes('--json');

// ---------------------------------------------------------------- 一、极简词法扫描
// 目的：拿到源码里所有「字符串字面量」，并记录 行号 / 所在调用 / 参数序号。
// 这样才能按位置区分 settings 键名、game.loc key、label/hint 描述、日志等。

const KEYWORDS_BEFORE_REGEX = new Set([
    'return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void',
    'case', 'do', 'else', 'yield', 'await', 'throw'
]);

const IDENT_START = /[A-Za-z_$]/;
const IDENT_CHAR = /[A-Za-z0-9_$]/;

function unescapeChar(ch) {
    switch (ch) {
        case 'n': return '\n';
        case 't': return '\t';
        case 'r': return '\r';
        case 'b': return '\b';
        case 'f': return '\f';
        case 'v': return '\v';
        case '0': return '\0';
        case '\n': return '';
        case 'x': return null;   // 由调用方处理
        case 'u': return null;
        default: return ch;
    }
}

function scanLiterals(src) {
    const lits = [];
    const n = src.length;
    let i = 0, line = 1;

    const frames = [];              // {kind:'paren'|'brace'|'bracket'|'tmplExpr', call, arg, exprDepth}
    const tstack = [];              // 模板字符串上下文 {parts, buf, line, phase}
    let objKey = null;              // 待取值的对象属性名（label/hint/...）
    let afterReturn = false;        // 紧跟在 return 之后
    let returnDepth = -1;           // 见到 return 时的括号深度（用于排除 return foo("x")）
    let lastIdent = '';             // 上一个标识符（用于判断 `/` 是正则还是除号）

    function ctx() { return tstack[tstack.length - 1]; }
    function inTemplateString() { const c = ctx(); return !!(c && c.phase === 'str'); }
    function nearestParen() {
        for (let k = frames.length - 1; k >= 0; k--) if (frames[k].kind === 'paren') return frames[k];
        return null;
    }

    function callNameLookback(from) {
        let k = from - 1;
        while (k >= 0 && /\s/.test(src[k])) k--;
        if (k < 0) return '<top>';
        const ch = src[k];
        if (ch === ')' || ch === '"' || ch === "'" || ch === '`') return '<expr>';
        if (/[A-Za-z0-9_$.]/.test(ch)) {
            let s = k;
            while (s >= 0 && /[A-Za-z0-9_$.]/.test(src[s])) s--;
            return src.slice(s + 1, k + 1).replace(/\.+$/, '') || '<anon>';
        }
        return '<anon>';
    }

    function pushRecord(rec) {
        const f = nearestParen();
        rec.call = f ? f.call : (lastIdent || '<top>');
        rec.arg = f ? f.arg : -1;
        rec.depth = frames.length;
        rec.start = i;
        rec.prop = objKey;          // label / hint / val ... （只对紧跟其后的字面量有效）
        rec.afterReturn = afterReturn && frames.length === returnDepth;
        lits.push(rec);
        // objKey 只对紧随其后的第一个字面量有效
        objKey = null;
        afterReturn = false;
    }

    function parseQuoted(quote) {
        let j = i + 1;
        let out = '';
        while (j < n) {
            const c = src[j];
            if (c === '\\') {
                const nx = src[j + 1];
                if (nx === 'x') { out += String.fromCharCode(parseInt(src.substr(j + 2, 2), 16) || 0); j += 4; continue; }
                if (nx === 'u') {
                    if (src[j + 2] === '{') {
                        const end = src.indexOf('}', j + 3);
                        out += String.fromCodePoint(parseInt(src.slice(j + 3, end), 16) || 0);
                        j = end + 1; continue;
                    }
                    out += String.fromCharCode(parseInt(src.substr(j + 2, 4), 16) || 0);
                    j += 6; continue;
                }
                if (nx === '\n') { line++; j += 2; continue; }
                const u = unescapeChar(nx);
                out += u === null ? nx : u;
                j += 2; continue;
            }
            if (c === quote) { j++; break; }
            if (c === '\n') line++;
            out += c; j++;
        }
        return { value: out, end: j };
    }

    function skipLineComment() {
        while (i < n && src[i] !== '\n') i++;
    }
    function skipBlockComment() {
        i += 2;
        while (i < n && !(src[i] === '*' && src[i + 1] === '/')) { if (src[i] === '\n') line++; i++; }
        i += 2;
    }
    function skipRegex() {
        // JS 正则字面量不能跨行：若在闭合 '/' 之前遇到换行，说明这是除号而非正则。
        const start = i;
        i++; // '/'
        let inClass = false;
        let closed = false;
        while (i < n) {
            const c = src[i];
            if (c === '\\') { i += 2; continue; }
            if (c === '\n') break;
            if (c === '[') inClass = true;
            else if (c === ']') inClass = false;
            else if (c === '/' && !inClass) { i++; closed = true; break; }
            i++;
        }
        if (!closed) { i = start; return false; }
        while (i < n && /[a-z]/.test(src[i])) i++;
        return true;
    }
    function regexAllowed() {
        if (KEYWORDS_BEFORE_REGEX.has(lastIdent)) return true;
        let k = i - 1;
        while (k >= 0 && /\s/.test(src[k])) k--;
        if (k < 0) return true;
        const c = src[k];
        if (IDENT_CHAR.test(c) || /[0-9)\]"']/.test(c) || c === '}') return false;
        return true;
    }

    while (i < n) {
        const c = src[i];

        // ---- 模板字符串的静态文本段 ----
        if (inTemplateString()) {
            const t = ctx();
            if (c === '\\') { t.buf += src.substr(i, 2); i += 2; continue; }
            if (c === '`') {
                t.parts.push(t.buf); t.buf = '';
                pushRecord({ value: t.parts.join('\u0001'), dynamic: t.parts.length > 1, line: t.line, quote: '`' });
                tstack.pop();
                i++;
                continue;
            }
            if (c === '$' && src[i + 1] === '{') {
                t.parts.push(t.buf); t.buf = '';
                t.phase = 'expr'; t.exprDepth = 0;
                frames.push({ kind: 'tmplExpr', call: '<tmpl>', arg: -1, exprDepth: 0 });
                i += 2;
                continue;
            }
            if (c === '\n') line++;
            t.buf += c; i++;
            continue;
        }

        // ---- 行注释 ----
        if (c === '/' && src[i + 1] === '/') { skipLineComment(); continue; }
        // ---- 块注释 ----
        if (c === '/' && src[i + 1] === '*') { skipBlockComment(); continue; }
        // ---- 正则字面量 ----
        if (c === '/' && regexAllowed()) {
            if (skipRegex()) { lastIdent = ''; i++; continue; }
            // 不是正则（其实是除号），按普通字符处理
            i++;
            continue;
        }
        // ---- 引号字符串 ----
        if (c === '"' || c === "'") {
            const startLine = line;
            const r = parseQuoted(c);
            // 字符串拼接（"a" + x + "b"）中的片段不是完整界面文本，单独标注：
            //   向前看 —— 前一个非空白字符是 '+'（说明是拼接的后半段）
            //   向后看 —— 下一个非空白字符是 '+'（说明是拼接的前半段）
            let k = r.end;
            while (k < n && /\s/.test(src[k])) k++;
            let b = i - 1;
            while (b >= 0 && /\s/.test(src[b])) b--;
            pushRecord({
                value: r.value, dynamic: false, line: startLine, quote: c,
                concat: src[k] === '+' || (b >= 0 && src[b] === '+')
            });
            i = r.end;
            continue;
        }
        // ---- 模板字符串开始 ----
        if (c === '`') {
            tstack.push({ parts: [], buf: '', line, phase: 'str', exprDepth: 0 });
            i++;
            continue;
        }
        // ---- 括号 / 花括号 / 方括号 ----
        if (c === '(') { frames.push({ kind: 'paren', call: callNameLookback(i), arg: 0, exprDepth: 0 }); i++; continue; }
        if (c === '[') { frames.push({ kind: 'bracket', call: '<bracket>', arg: -1, exprDepth: 0 }); i++; continue; }
        if (c === '{') {
            const top = frames[frames.length - 1];
            if (top && top.kind === 'tmplExpr') top.exprDepth++;
            frames.push({ kind: 'brace', call: '<brace>', arg: -1, exprDepth: 0 });
            i++; continue;
        }
        if (c === ')') { frames.pop(); i++; continue; }
        if (c === ']') { frames.pop(); i++; continue; }
        if (c === '}') {
            const top = frames[frames.length - 1];
            if (top && top.kind === 'tmplExpr') {
                frames.pop();
                const t = ctx();
                t.parts.push(t.buf); t.buf = '';
                t.phase = 'str';
                i++; continue;
            }
            frames.pop();
            afterReturn = false;
            i++; continue;
        }
        if (c === ',') {
            const top = frames[frames.length - 1];
            if (top && top.kind === 'paren') top.arg++;
            i++; continue;
        }
        if (c === ';') { afterReturn = false; i++; continue; }
        // ---- 标识符 ----
        if (IDENT_START.test(c)) {
            let j = i;
            while (j < n && IDENT_CHAR.test(src[j])) j++;
            const name = src.slice(i, j);
            // 对象属性名 `label: "x"` —— 前一个非空白字符是 { 或 ,
            let k = i - 1;
            while (k >= 0 && /\s/.test(src[k])) k--;
            const prev = k >= 0 ? src[k] : '';
            if (src[j] === ':' && src[j + 1] !== ':' && (prev === '{' || prev === ',' || prev === '[')) {
                objKey = name;
            } else if (name !== 'return') {
                if (src[j] !== ':') objKey = null;
            }
            if (name === 'return') { afterReturn = true; returnDepth = frames.length; }
            lastIdent = name;
            i = j;
            continue;
        }
        if (c === '\n') { line++; i++; continue; }
        if (/\s/.test(c)) { i++; continue; }
        // ---- 其它字符（数字、运算符等）----
        if (c !== ':') objKey = null;
        i++;
    }

    // objKey / afterReturn / start 已在记录时一并写入
    return lits;
}

// ---------------------------------------------------------------- 二、候选分类

// 位置敏感的用户界面 API（参数序号从 0 开始）
const UI_FN_ARGS = {
    addSettingsToggle: { 2: 'label', 3: 'hint' },
    addSettingsNumber: { 2: 'label', 3: 'hint' },
    addSettingsString: { 2: 'label', 3: 'hint' },
    addSettingsSelect: { 2: 'label', 3: 'hint' },
    addSettingsList: { 2: 'label', 3: 'hint' },
    addSettingsHeader1: { 1: 'header' },
    addSettingsHeader2: { 1: 'header' },
    addStandardHeading: { 1: 'heading' },
    buildSettingsSection: { 1: 'section' },
    buildSettingsSection2: { 3: 'section' },
    addOptionUI: { 2: 'modal-title' },
};
const UI_FN_SETTING_KEY_ARG = new Set([
    'addSettingsToggle', 'addSettingsNumber', 'addSettingsString', 'addSettingsSelect', 'addSettingsList'
]);

// 出现在界面上的对象属性（下拉选项 label/hint、tooltip title 等）
const UI_OBJ_PROPS = new Set(['label', 'short_label', 'hint', 'title', 'text', 'description', 'note']);
// 明显是内部字段的属性
const INTERNAL_OBJ_PROPS = new Set(['val', 'value', 'key', 'id', 'name', 'type', 'class', 'style', 'method', 'event', 'prop', 'attr', 'selector', 'query', 'url', 'path', 'file', 'tag', 'color', 'icon', 'source', 'target', 'mode', 'unit', 'field', 'fieldName', 'dataName', 'labelKey', 'locKey']);

// 对话框类
const DIALOG_FNS = new Set(['alert', 'confirm', 'prompt', 'window.alert', 'window.confirm', 'window.prompt', 'win.alert', 'win.confirm', 'win.prompt', 'game.alert', 'game.confirm', 'game.prompt', 'GM_info', 'toast', 'game.toast', 'showMessage', 'game.showMessage']);

const RE_LOGLIKE = /(^|\.)(console|log|logMessage|addLog|debug|debugLog|print|printMessage|showLog|trace|warn|error)(Log|Message)?$/i;
const RE_LOCLIKE = /(^|\.)(loc|locate|tr|translate|i18n|t)$/i;

function looksInternalId(s) {
    const t = s.trim();
    if (/^[a-z0-9_]+$/.test(t)) return true;                    // 全小写 / 下划线 / 数字
    if (/^[a-z][a-zA-Z0-9]*$/.test(t) && t.length <= 3) return true;  // 过短的小写 token
    if (/^[A-Za-z_$][\w$]*$/.test(t) && !/^[A-Z]/.test(t) && /[A-Z]/.test(t)) return true; // camelCase 标识符
    if (/^[A-Za-z0-9]+(_[A-Za-z0-9]+)+$/.test(t)) return true;   // 带下划线的 loc 名（Helium_3 / Moon_Support）
    if (/^[a-z]+(-[a-z0-9]+)+$/.test(t)) return true;             // kebab-case（has-text-info / is-hidden）
    return false;
}
function looksHtmlOrCss(s) {
    if (/[<>]/.test(s)) return true;
    if (/\b(class|style|href|src|margin|padding|width|height|px|em|rem|color|background|border)\s*[=:]/i.test(s)) return true;
    if (/^\s*[.#][A-Za-z0-9_\-[\]=]/.test(s)) return true;
    if (/^\s*[a-z-]+\s*:\s*[a-z0-9#%()., ]+;/.test(s)) return true;
    return false;
}
function wordCount(s) {
    return s.trim().split(/\s+/).filter(Boolean).length;
}

/** 把一个字符串字面量判成 {skip: reason} 或 {reason, group} */
function classify(lit) {
    const raw = lit.value;
    const call = lit.call;
    const fn = (call || '').split('.').pop();
    const val = raw.replace(/\u0001/g, ' ').trim(); // 模板静态片段

    if (lit.dynamic) {
        // 动态模板：无法直接送进 translateText 对比，单独标注
        return { skip: 'template-dynamic' };
    }

    // ---- 明确排除类 ----
    if (RE_LOCLIKE.test(call) && fn && /^(loc|locate|tr|translate|i18n|t)$/i.test(fn)) return { skip: 'loc-key' };
    if (UI_FN_SETTING_KEY_ARG.has(fn) && lit.arg === 1) return { skip: 'settings-key' };
    if (RE_LOGLIKE.test(call)) return { skip: /^(error|warn)$/i.test(fn) ? 'error-msg' : 'log' };
    if (objKeyIsInternal(lit)) return { skip: 'internal-field' };

    if (!/[A-Za-z]/.test(val)) return { skip: 'no-latin' };
    if (val.length < 2) return { skip: 'too-short' };
    if (val.length > 800) return { skip: 'too-long' };
    if (/^[\s\d.,:;%+\-*/^()[\]{}|=<>!?&#$@~]+$/.test(val)) return { skip: 'not-text' };
    if (looksHtmlOrCss(val)) return { skip: 'html/css' };
    if (/^https?:\/\//i.test(val) || /\.(js|css|png|svg|json|html)(\?|$)/i.test(val)) return { skip: 'url/path' };
    if (/^['"]?use (strict|asm)['"]?$/i.test(val)) return { skip: 'directive' };
    // `xxx_yyy: "..."` 这类 snake_case 键的对象，多半是内部映射表
    if (lit.prop && /^[a-z][a-z0-9]*(_[a-z0-9]+)+$/.test(lit.prop)) return { skip: 'internal-map' };

    // ---- 来源判定 ----
    let reason = null;
    if (UI_FN_ARGS[fn] && UI_FN_ARGS[fn][lit.arg] !== undefined) {
        reason = UI_FN_ARGS[fn][lit.arg] + '@' + fn;      // addSettings* 的 label / hint
    } else if (UI_OBJ_PROPS.has(lit.prop || '')) {
        reason = 'objprop:' + lit.prop;                  // 下拉选项 label/hint、tooltip title
    } else if (DIALOG_FNS.has(call) || DIALOG_FNS.has(fn)) {
        reason = 'dialog';                                // alert / confirm / prompt
    } else if (lit.afterReturn) {
        reason = 'return';                                // 条件描述等 return "..."
    }

    const wc = wordCount(val);
    if (looksInternalId(val)) {
        // 明显是内部标识符 / settings 键 / 变量名，而不是界面文本
        return reason
            ? { reason: reason + ':idlike', group: 'other' }
            : { skip: wc === 1 ? 'id-or-key' : 'looks-like-id' };
    }
    if (!reason) {
        if (wc >= 2) {
            reason = 'generic-sentence';
        } else if (/^[A-Z]/.test(val)) {
            // 单个 TitleCase 单词（资源/建筑内部名、游戏 loc 名）多半不是脚本自绘文本，
            // 归入「疑似内部/误报」由人工确认，而不是直接当成漏译。
            return { reason: 'generic-titlecase', group: 'other' };
        } else {
            return { skip: 'id-or-key' };
        }
    }
    if (reason.indexOf('generic-') === 0 && looksLikeCodeFragment(val)) {
        return { reason: reason + ':fragment', group: 'other' };
    }
    // 字符串拼接片段（"Are you sure..." + x + " Settings?"）需要人工合并后再判断
    if (lit.concat) return { reason: reason + ':concat', group: 'other' };
    return { reason, group: 'ui' };
}

/** 字符串拼接 / 代码片段痕迹（多半是半句话，需要人工确认） */
function looksLikeCodeFragment(v) {
    return /[{}<>\\|]|\$\{|\bvar\b|\bfunction\b/.test(v);
}

/** 自检：确认词法扫描给出的行号与源码真实行号一致（模板字面量取模板起始行，跳过） */
function verifyLines(src, lits) {
    const nl = [];
    for (let i = 0; i < src.length; i++) if (src[i] === '\n') nl.push(i);
    const trueLine = (off) => {
        let lo = 0, hi = nl.length;
        while (lo < hi) { const m = (lo + hi) >> 1; if (nl[m] < off) lo = m + 1; else hi = m; }
        return lo + 1;
    };
    let bad = 0;
    for (const l of lits) {
        if (l.quote === '`') continue;   // 模板取起始行，属预期
        if (trueLine(l.start) !== l.line) bad++;
    }
    return bad;
}

function objKeyIsInternal(lit) {
    if (!lit.prop) return false;
    if (UI_OBJ_PROPS.has(lit.prop)) return false;
    return INTERNAL_OBJ_PROPS.has(lit.prop);
}

// ---------------------------------------------------------------- 三、运行

function main() {
    if (!fs.existsSync(FILE_EN)) throw new Error('缺少英文原脚本: ' + FILE_EN);
    if (!fs.existsSync(FILE_ZH)) throw new Error('缺少主脚本: ' + FILE_ZH);

    const src = fs.readFileSync(FILE_EN, 'utf8');
    const lits = scanLiterals(src);

    // 自检：非模板字面量的行号必须与源码真实行号一致（模板取起始行，属预期差异）
    const lineCheck = verifyLines(src, lits);

    // 分类 + 统计
    const skipStats = {};   // 抽取阶段被排除的（附原因）
    const hitStats = {};    // 进入 translateText 的（附来源）
    const bump = (obj, k) => { obj[k] = (obj[k] || 0) + 1; };

    const candidates = [];   // 进入 translateText 的候选
    for (const lit of lits) {
        const c = classify(lit);
        if (c.skip) { bump(skipStats, c.skip); continue; }
        bump(hitStats, c.reason);
        candidates.push({ text: lit.value.trim(), line: lit.line, reason: c.reason, group: c.group, call: lit.call });
    }

    // 载入主脚本，拿到 translateText（仅内存注入，不落盘）
    const { translateText, nonStringBehaviour } = loadTranslator();

    const byText = new Map();
    for (const cand of candidates) {
        if (!/[A-Za-z]/.test(cand.text)) { bump(skipStats, 'no-latin'); continue; }
        const out = translateText(cand.text);
        // translateText 对非字符串直接原样返回，必须按 JS 行为排除
        if (typeof out !== 'string') { bump(skipStats, 'non-string-result'); continue; }
        const rec = byText.get(cand.text) || { text: cand.text, lines: [], reasons: new Set(), calls: new Set(), ui: false, translated: out !== cand.text };
        rec.lines.push(cand.line);
        rec.reasons.add(cand.reason);
        rec.calls.add(cand.call);
        if (cand.group === 'ui') rec.ui = true;   // 任一来源判定为界面文本即算界面文本
        byText.set(cand.text, rec);
    }

    const all = [...byText.values()];
    const translated = all.filter(r => r.translated);
    const untranslated = all.filter(r => !r.translated);
    const untrUi = untranslated.filter(r => r.ui);
    const untrOther = untranslated.filter(r => !r.ui);

    // ---- 报告 ----
    if (AS_JSON) {
        console.log(JSON.stringify({
            totals: { literals: lits.length, candidates: candidates.length, unique: all.length, translated: translated.length, untranslated: untranslated.length, untranslatedUi: untrUi.length, untranslatedOther: untrOther.length, lineMismatches: lineCheck },
            reasons: { skipped: skipStats, hit: hitStats },
            nonStringBehaviour,
            untranslated: untranslated.map(r => ({ text: r.text, lines: r.lines, reasons: [...r.reasons], ui: r.ui }))
        }, null, 2));
        return;
    }

    const bar = '='.repeat(72);
    console.log(bar);
    console.log('未翻译文本审计  (audit_untranslated.js)');
    console.log(bar);
    console.log('英文原脚本     : ' + path.relative(ROOT, FILE_EN));
    console.log('主脚本         : ' + path.relative(ROOT, FILE_ZH));
    console.log('');
    console.log('字符串字面量总数           : ' + lits.length);
    console.log('进入 translateText 的候选  : ' + candidates.length);
    console.log('去重后候选                 : ' + all.length);
    console.log('已翻译                     : ' + translated.length);
    console.log('未翻译（合计）             : ' + untranslated.length);
    console.log('  ├─ 疑似界面文本（需处理）: ' + untrUi.length);
    console.log('  └─ 疑似内部/误报          : ' + untrOther.length);
    console.log('');
    console.log('translateText 非字符串行为 : ' + nonStringBehaviour);
    console.log('行号自检（应全为 0）      : ' + lineCheck);
    console.log('');
    console.log('--- 抽取阶段排除统计 ---');
    const skipKeys = Object.keys(skipStats).sort((a, b) => skipStats[b] - skipStats[a]);
    for (const k of skipKeys) console.log('  ' + k.padEnd(24) + skipStats[k]);
    console.log('');
    console.log('--- 命中来源统计（进入 translateText）---');
    const inKeys = Object.keys(hitStats).sort((a, b) => hitStats[b] - hitStats[a]);
    for (const k of inKeys) console.log('  ' + k.padEnd(34) + hitStats[k]);

    console.log('');
    console.log(bar);
    console.log('未翻译 · 疑似界面文本 (' + untrUi.length + ')');
    console.log(bar);
    untrUi.sort((a, b) => a.lines[0] - b.lines[0]);
    for (const r of untrUi) {
        console.log('L' + r.lines.join(',L') + '\t[' + [...r.reasons].join(',') + ']\t' + oneLine(r.text));
    }

    console.log('');
    console.log(bar);
    console.log('未翻译 · 疑似内部/误报 (' + untrOther.length + ')');
    console.log(bar);
    untrOther.sort((a, b) => a.lines[0] - b.lines[0]);
    for (const r of untrOther) {
        console.log('L' + r.lines.join(',L') + '\t[' + [...r.reasons].join(',') + ']\t' + oneLine(r.text));
    }
    console.log('');
    console.log('(以上为完整清单，共 ' + untranslated.length + ' 条未翻译)');
}

function oneLine(s) {
    const t = s.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
    return t.length > 300 ? t.slice(0, 300) + ' …' : t;
}

/** 载入主脚本，暴露 translateText（内存中注入，磁盘文件不动） */
function loadTranslator() {
    const jsdomPath = path.join(ROOT, 'node_modules', 'jsdom');
    const { JSDOM } = require(jsdomPath);
    const userjs = fs.readFileSync(FILE_ZH, 'utf8');
    const idx = userjs.lastIndexOf('})();');
    if (idx === -1) throw new Error('未找到主脚本 IIFE 结尾 "})();"');
    const patched = userjs.slice(0, idx) + 'window.__auditTranslateText = translateText;\n' + userjs.slice(idx);

    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { runScripts: 'outside-only' });
    const { window } = dom;
    window.confirm = () => true;
    window.alert = () => undefined;
    window.eval(patched);
    const translateText = window.__auditTranslateText;
    if (typeof translateText !== 'function') throw new Error('translateText 未成功暴露');

    // translateText 对非字符串直接原样返回 —— 探针验证，避免审计时把非字符串当「未翻译」
    const probes = [42, null, undefined, true, {}, [], ['a']];
    const behaviour = probes.map(p => (translateText(p) === p ? 'passthrough' : 'CHANGED'));
    const allPass = behaviour.every(b => b === 'passthrough');
    return {
        translateText,
        nonStringBehaviour: allPass ? '非字符串原样返回（已排除）' : '异常：' + behaviour.join(',')
    };
}

main();
process.exit(0);
