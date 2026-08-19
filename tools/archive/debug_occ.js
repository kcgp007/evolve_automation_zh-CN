const fs = require('fs');
const userjs = fs.readFileSync('/home/king/workspace/evolve_automation_zh-CN/evolve_automation_zh-CN.user.js', 'utf8');
const { JSDOM } = require('/home/king/workspace/evolve_automation_zh-CN/node_modules/jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { runScripts: 'outside-only' });
const { window } = dom;
window.confirm = () => true;
window.eval(userjs);

setTimeout(() => {
    const d = window.document;
    const root = d.createElement('div');
    root.id = 'script_settings';
    root.innerHTML = `<div><span>Occupy last foreign power once other two are controlled, and unification is researched to speed up unification. Disable if you want annex\\purchase achievements.</span></div>`;
    d.body.appendChild(root);
    setTimeout(() => {
        const span = root.querySelector('span');
        const bs = (span.textContent.match(/\\/g) || []).length;
        console.log('span backslashes:', bs);
        console.log('span text:', JSON.stringify(span.textContent.slice(0, 140)));
        console.log('mark:', span.getAttribute('data-evolve-zh'));
        // 直接测试 translateText 对该字符串
        const script = userjs.replace(/^[\s\S]*?function translateText\(/, 'var getTT = function() { return function(text) { return text; }; };');
        process.exit(0);
    }, 3000);
}, 3500);
