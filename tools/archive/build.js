const fs = require('fs');
const path = require('path');

const ROOT = '/home/king/workspace/evolve_automation_zh-CN';
const OUT = path.join(ROOT, 'evolve_automation_zh-CN.user.js');

// 合并字典：base + part6 + part7 + part8 补充（保留 base 原翻译）
const base = JSON.parse(fs.readFileSync('/home/king/workspace/evolve_automation_zh-CN/tools/dict_zh.json', 'utf8'));
const part6 = JSON.parse(fs.readFileSync('/home/king/workspace/evolve_automation_zh-CN/tools/part6.json', 'utf8'));
const part7 = JSON.parse(fs.readFileSync('/home/king/workspace/evolve_automation_zh-CN/tools/part7.json', 'utf8'));
const part8 = JSON.parse(fs.readFileSync('/home/king/workspace/evolve_automation_zh-CN/tools/part8.json', 'utf8'));
const dict = {};
for (const [k, v] of Object.entries(base)) dict[k] = v;
for (const src of [part6, part7, part8]) {
    for (const [k, v] of Object.entries(src)) {
        if (!Object.prototype.hasOwnProperty.call(dict, k)) dict[k] = v;
    }
}

const header = `// ==UserScript==
// @name         Evolve 自动化脚本 · 界面中文化
// @namespace    http://tampermonkey.net/
// @version      1.1.0
// @description  将 Evolve Automation 脚本生成的界面（设置面板、tooltip 提示、按钮、下拉选项、确认框等）翻译为简体中文。需在 Evolve Automation 脚本之后启用。游戏本体语言请在游戏设置 - Locale 中切换为中文。
// @match        https://pmotschmann.github.io/Evolve/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    var MARK = 'data-evolve-zh';

    var SECTION_NAMES = {
        'General': '常规',
        'Government': '政府',
        'Prestige': '声望',
        'Evolution': '进化',
        'Planet': '行星',
        'Traits': '特质',
        'Trigger': '触发器',
        'Research': '研究',
        'War': '战争',
        'Hell': '地狱',
        'Mech': '机甲',
        'Fleet': '舰队',
        'Ejector': '弹射器',
        'Market': '市场',
        'Storage': '存储',
        'Magic': '魔法',
        'Production': '生产',
        'Jobs': '工作',
        'Buildings': '建筑',
        'Weightings': '权重',
        'Projects': '项目',
        'Logging': '日志',
        'Foreign Powers': '外部势力',
        'Mission': '任务'
    };

    function translateSection(name) {
        var n = name.trim();
        if (Object.prototype.hasOwnProperty.call(SECTION_NAMES, n)) return SECTION_NAMES[n];
        return n;
    }
`;

const logic = `
    var PATTERNS = [
        {
            re: /^This race have special requirements: (.+) This condition is met\\.$/,
            rep: function (m, p1) { return "此种族有特殊要求：" + p1 + " 此条件已满足。"; }
        },
        {
            re: /^Warning! This race have special requirements: (.+) This condition is not met\\.$/,
            rep: function (m, p1) { return "警告！此种族有特殊要求：" + p1 + " 此条件未满足。"; }
        },
        {
            re: /^Warning! This race have special requirements: (.+) This condition is bypassed\\. Race will have [\\d.]+% penalty\\.$/,
            rep: function (m, p1) { return "警告！此种族有特殊要求：" + p1 + " 此条件已绕过。种族将有惩罚。"; }
        },
        {
            re: /^If logging is enabled then logs (.+) actions$/,
            rep: function (m, p1) { return "如果启用日志，则记录" + p1 + "操作"; }
        },
        {
            re: /^Make sure all (.+) producers are above consumers in buildings list!/,
            rep: function (m, p1) { return "确保所有" + p1 + "的生产者排在建筑列表中的消费者之上！"; }
        },
        {
            re: /^Supported Supplies: /,
            rep: function () { return "支持的补给："; }
        },
        {
            re: /^Contaminated in \\[/,
            rep: function () { return "污染于 ["; }
        },
        {
            re: /^Next Tech Level in ~\\[/,
            rep: function () { return "下一科技等级于 ~["; }
        },
        {
            re: /^AutoBuild weighting: /,
            rep: function () { return "自动建造权重："; }
        },
        {
            re: /click options to open /,
            rep: function () { return "点击选项以打开 "; }
        },
        {
            re: /^Conflicts with (.+) for (.+) \\(([^)]*)\\)$/,
            rep: function (m, p1, p2, p3) { return "与" + p1 + "冲突，争用" + p2 + "（" + p3 + "）"; }
        },
        {
            re: /^Are you sure you wish to reset (.+) Settings\\?$/,
            rep: function (m, p1) { return "确定要重置" + translateSection(p1) + "设置吗？"; }
        },
        {
            re: /^Reset (.+) Settings$/,
            rep: function (m, p1) { return "重置" + translateSection(p1) + "设置"; }
        },
        {
            re: /^(.+) Settings$/,
            rep: function (m, p1) { return translateSection(p1) + "设置"; }
        },
        {
            re: /^Script Notice: (.+)$/,
            rep: function (m, p1) { return "脚本提示：" + p1; }
        },
        {
            re: /^Eval of this condition: (.+)$/,
            rep: function (m, p1) { return "此条件的求值：" + p1; }
        },
        {
            re: /^(.+) \\(([^)]+)\\)$/,
            rep: function (m, p1, p2) {
                var t1 = lookup(TRANSLATIONS, p1);
                var t2 = lookup(TRANSLATIONS, p2);
                if (t1 === null && t2 === null) return m;
                return (t1 !== null ? t1 : p1) + "（" + (t2 !== null ? t2 : p2) + "）";
            }
        }
    ];

    function decodeJsEscapes(s) {
        return s.replace(/\\\\(u[\\da-fA-F]{4}|x[\\da-fA-F]{2}|[nrtbfv0\\\\'"\\s.])/g, function (m, esc) {
            if (esc[0] === 'u') return String.fromCharCode(parseInt(esc.slice(1), 16));
            if (esc[0] === 'x') return String.fromCharCode(parseInt(esc.slice(1), 16));
            switch (esc) {
                case 'n': return '\\n';
                case 'r': return '\\r';
                case 't': return '\\t';
                case 'b': return '\\b';
                case 'f': return '\\f';
                case 'v': return '\\v';
                case '0': return '\\0';
                default: return esc;
            }
        });
    }

    function decodeHtmlEntities(s) {
        return s.replace(/&#x([0-9a-fA-F]+);|&#(\\d+);|&emsp;|&ensp;|&nbsp;|&amp;|&lt;|&gt;|&quot;|&#39;|&apos;/g, function (m, hex, dec) {
            if (hex) return String.fromCharCode(parseInt(hex, 16));
            if (dec) return String.fromCharCode(parseInt(dec, 10));
            switch (m) {
                case '&emsp;': return '\\u2003';
                case '&ensp;': return '\\u2002';
                case '&nbsp;': return '\\u00a0';
                case '&amp;': return '&';
                case '&lt;': return '<';
                case '&gt;': return '>';
                case '&quot;': return '"';
                case '&#39;':
                case '&apos;': return "'";
            }
        });
    }

    function normalizeText(s) {
        return decodeHtmlEntities(decodeJsEscapes(s));
    }

    var TRANSLATIONS = ${JSON.stringify(dict)};

    var NORM = {};
    (function () {
        for (var k in TRANSLATIONS) {
            if (Object.prototype.hasOwnProperty.call(TRANSLATIONS, k)) {
                var nk = normalizeText(k);
                if (!Object.prototype.hasOwnProperty.call(NORM, nk)) NORM[nk] = TRANSLATIONS[k];
                var nk2 = nk.replace(/^\\u2003+|\\u2003+$/g, '');
                if (!Object.prototype.hasOwnProperty.call(NORM, nk2)) NORM[nk2] = TRANSLATIONS[k];
            }
        }
    })();

    function lookup(dictObj, text) {
        if (Object.prototype.hasOwnProperty.call(dictObj, text)) return dictObj[text];
        return null;
    }

    function translateText(text) {
        if (typeof text !== 'string') return text;
        if (!/[A-Za-z]/.test(text)) return text;
        var direct = lookup(TRANSLATIONS, text);
        if (direct !== null) return direct;

        for (var i = 0; i < PATTERNS.length; i++) {
            if (PATTERNS[i].re.test(text)) {
                var rep = text.replace(PATTERNS[i].re, function () {
                    return PATTERNS[i].rep.apply(null, arguments);
                });
                if (rep !== text) return rep;
            }
        }

        var norm = text.replace(/^\\u2003+|\\u2003+$/g, '');
        if (norm !== text) {
            direct = lookup(TRANSLATIONS, norm);
            if (direct !== null) return direct;
        }

        var dec = normalizeText(text);
        var d2 = lookup(NORM, dec);
        if (d2 !== null) return d2;
        var n2 = dec.replace(/^\u2003+|\u2003+$/g, '');
        if (n2 !== dec) {
            d2 = lookup(NORM, n2);
            if (d2 !== null) return d2;
        }
        d2 = lookup(TRANSLATIONS, n2);
        if (d2 !== null) return d2;
        return text;
    }

    function translateAttributes(el) {
        var changed = false;
        if (el && el.hasAttribute && el.hasAttribute('title')) {
            var t = translateText(el.getAttribute('title'));
            if (t !== el.getAttribute('title')) {
                el.setAttribute('title', t);
                changed = true;
            }
        }
        if (el && el.hasAttribute && el.hasAttribute('placeholder')) {
            var p = translateText(el.getAttribute('placeholder'));
            if (p !== el.getAttribute('placeholder')) {
                el.setAttribute('placeholder', p);
                changed = true;
            }
        }
        return changed;
    }

    function translateElement(el) {
        var changed = false;
        if (translateAttributes(el)) changed = true;
        var nodes = el.childNodes;
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].nodeType === 3) {
                var t = translateText(nodes[i].nodeValue);
                if (t !== nodes[i].nodeValue) {
                    nodes[i].nodeValue = t;
                    changed = true;
                }
            }
        }
        if (changed) {
            el.setAttribute(MARK, '1');
        }
    }

    function translateNode(root) {
        if (!root || root.nodeType !== 1 || root.hasAttribute(MARK)) return;
        translateElement(root);
        var walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
            acceptNode: function (node) {
                if (node.hasAttribute(MARK)) return NodeFilter.FILTER_REJECT;
                return NodeFilter.FILTER_ACCEPT;
            }
        });
        var el;
        while ((el = walker.nextNode())) {
            translateElement(el);
        }
    }

    function onMutations(mutations) {
        for (var i = 0; i < mutations.length; i++) {
            var mut = mutations[i];
            if (mut.type === 'attributes') {
                if (mut.target && mut.target.nodeType === 1) {
                    translateElement(mut.target);
                }
            } else if (mut.type === 'characterData') {
                var parent = mut.target.parentNode;
                if (parent && parent.nodeType === 1) {
                    translateElement(parent);
                }
            } else if (mut.type === 'childList') {
                var added = mut.addedNodes;
                for (var j = 0; j < added.length; j++) {
                    var n = added[j];
                    if (n.nodeType === 1) {
                        translateNode(n);
                    } else if (n.nodeType === 3) {
                        var p = n.parentNode;
                        if (p && p.nodeType === 1) translateElement(p);
                    }
                }
            }
        }
    }

    var observer = null;
    var observedRoots = {};
    var quietTick = 0;

    // 需要长期观察（DOM 动态变化）的容器
    var WATCH_CONTAINERS = ['script_settings', 'autoScriptContainer', 'scriptModal'];
    // 只做低频强制翻译、不长期观察的容器（游戏各 tab 内的主题开关/标签）
    var QUIET_TARGETS = ['script_importExportButtons', 'eject', 'spireSupply', 'mTabCivil', 'resStorage', 'market', 'resEjector', 'resCargo', 'arpaPhysics', 'mechList'];

    function translateNodeForce(root) {
        if (!root || root.nodeType !== 1) return;
        translateElement(root);
        var walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, null);
        var el;
        while ((el = walker.nextNode())) translateElement(el);
    }

    function init() {
        var needs = [];
        for (var i = 0; i < WATCH_CONTAINERS.length; i++) {
            var el = document.getElementById(WATCH_CONTAINERS[i]);
            if (el && el.nodeType === 1) needs.push({ id: WATCH_CONTAINERS[i], el: el });
        }
        var changed = false;
        for (var k = 0; k < needs.length; k++) {
            if (observedRoots[needs[k].id] !== needs[k].el) { changed = true; break; }
        }
        for (var id in observedRoots) {
            if (Object.prototype.hasOwnProperty.call(observedRoots, id)) {
                var cur = document.getElementById(id);
                if (cur !== observedRoots[id]) { changed = true; break; }
            }
        }
        if (changed || (!observer && needs.length)) {
            if (observer) observer.disconnect();
            observer = new MutationObserver(onMutations);
            observedRoots = {};
            for (var j = 0; j < needs.length; j++) {
                observer.observe(needs[j].el, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['title', 'placeholder'] });
                observedRoots[needs[j].id] = needs[j].el;
                translateNode(needs[j].el);
            }
        }

        quietTick = (quietTick + 1) % 3;
        if (quietTick === 0) {
            for (var q = 0; q < QUIET_TARGETS.length; q++) {
                var t = document.getElementById(QUIET_TARGETS[q]);
                if (t && t.nodeType === 1) translateNodeForce(t);
            }
        }
        setTimeout(init, 1500);
    }

    var prestigeSuffix = " You may prestige immediately. Are you sure you want to toggle this prestige?";
    var importPrefix = "Warning! Imported settings includes evaluated code, which will have full access to browser page, and can be potentially dangerous.\\nOnly continue if you trust the source. Injected code:";

    function translateConfirm(msg) {
        if (typeof msg !== 'string') return msg;
        var t = translateText(msg);
        if (t !== msg) return t;
        if (msg.lastIndexOf(prestigeSuffix) === msg.length - prestigeSuffix.length) {
            var head = msg.slice(0, msg.length - prestigeSuffix.length);
            var th = translateText(head);
            return th + " 你可以立即进行声望。确定要切换此声望吗？";
        }
        if (msg.indexOf(importPrefix) === 0) {
            var code = msg.slice(importPrefix.length);
            var t2 = translateText(importPrefix);
            if (t2 !== importPrefix) return t2 + code;
        }
        return msg;
    }

    try {
        var origConfirm = window.confirm.bind(window);
        window.confirm = function (msg) {
            return origConfirm(translateConfirm(msg));
        };
    } catch (e) { }

    setTimeout(init, 1500);
})();
`;

const output = header + logic;
fs.writeFileSync(OUT, output);
console.log('written, size:', output.length, 'dict keys:', Object.keys(dict).length);
