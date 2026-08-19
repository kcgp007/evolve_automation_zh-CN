const fs = require('fs');
const userjs = fs.readFileSync('/home/king/workspace/evolve_automation_zh-CN/evolve_automation_zh-CN.user.js', 'utf8');
const { JSDOM } = require('/home/king/workspace/evolve_automation_zh-CN/node_modules/jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { runScripts: 'outside-only' });
const { window } = dom;
window.confirm = () => true;
window.eval(userjs);

const lines = userjs.split('\n');
const line = lines.find(l => l.startsWith('    var TRANSLATIONS = {'));
const dict = JSON.parse(line.slice(line.indexOf('{'), line.lastIndexOf('};') + 1));
const keys = Object.keys(dict);

// 分批构造 DOM（每批 200 个）
const BATCH = 200;
let pass = 0, fail = 0;
const fails = [];
let batchIdx = 0;

function runBatch() {
    if (batchIdx * BATCH >= keys.length) {
        console.log('keys total:', keys.length, 'PASS:', pass, 'FAIL:', fail);
        if (fails.length) console.log('fails:', fails.slice(0, 30));
        process.exit(fail ? 1 : 0);
        return;
    }
    const slice = keys.slice(batchIdx * BATCH, batchIdx * BATCH + BATCH);
    const root = window.document.createElement('div');
    root.id = 'script_settings';
    window.document.body.appendChild(root);
    let i = 0;
    for (const k of slice) {
        const div = window.document.createElement('div');
        div.className = 'k' + (batchIdx * BATCH + i++);
        const span = window.document.createElement('span');
        span.textContent = k;
        div.appendChild(span);
        root.appendChild(div);
    }
    batchIdx++;
    setTimeout(() => {
        const spans = root.querySelectorAll('span');
        spans.forEach((sp, idx) => {
            const k = slice[idx];
            const expected = dict[k];
            const got = sp.textContent;
            if (got === expected) pass++;
            else { fail++; fails.push({ k: k.slice(0, 60), expected: String(expected).slice(0, 30), got: String(got).slice(0, 30) }); }
        });
        root.remove();
        runBatch();
    }, 2000);
}

setTimeout(runBatch, 3200);
