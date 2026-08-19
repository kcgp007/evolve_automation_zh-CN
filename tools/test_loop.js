const fs = require('fs');
const userjs = fs.readFileSync('/home/king/workspace/evolve_automation_zh-CN/evolve_automation_zh-CN.user.js', 'utf8');
const { JSDOM } = require('/home/king/workspace/evolve_automation_zh-CN/node_modules/jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { runScripts: 'outside-only' });
const { window } = dom;
window.confirm = () => true;
window.eval(userjs);

let pass = 0, fail = 0;
function check(label, found, expected) {
    if (found === expected) pass++;
    else { fail++; console.log('FAIL', label, 'got', JSON.stringify(found), 'want', JSON.stringify(expected)); }
}

setTimeout(() => {
    const d = window.document;
    const root = d.createElement('div');
    root.id = 'script_settings';
    root.innerHTML = `<div class="row"><label title="Script runs once per this amount of game ticks. Game tick every 250ms, thus with rate 4 script will run once per second. You can set it lower to make script act faster, or increase it if you have performance issues. Tick rate should be a positive integer."><span>Script tick rate</span><span id="val">123</span></label></div>`;
    d.body.appendChild(root);

    setTimeout(() => {
        const label = root.querySelector('label');
        const val = d.getElementById('val');
        const firstTitle = label.getAttribute('title');
        const firstText = label.querySelector('span:first-of-type').textContent;
        check('title translated', firstTitle.indexOf('脚本每此数量') === 0, true);
        check('label translated', firstText, '脚本 tick 频率');

        // 模拟脚本频繁更新数值（数字文本，无字母）
        let mutations = 0;
        const mo = new window.MutationObserver(() => mutations++);
        mo.observe(label, { childList: true, subtree: true, characterData: true, attributes: true });
        for (let i = 0; i < 50; i++) {
            val.textContent = String(1000 + i);
        }
        // 触发 title 变化（脚本可能更新 tooltip）
        label.setAttribute('title', 'When enabled script will schedule its ticks to run after game ticks, instead of executing both at once. Splitting of long task allows browser to update UI in between of game and script ticks, making game run smoother, but less throttling-proof - that can make tick rate float inconsistently.');
        setTimeout(() => {
            // 数字更新不应触发翻译循环；title 新值应被翻译一次
            const newTitle = label.getAttribute('title');
            check('new title translated', newTitle.indexOf('启用后') === 0, true);
            check('val numeric kept', val.textContent, '1049');
            console.log('mutations observed:', mutations, '(fires are expected for DOM updates, but must not loop forever)');
            // 模拟脚本重建面板（empty + 重新插入）
            const d2 = d.createElement('div');
            d2.id = 'script_settings';
            d2.innerHTML = `<div><span>Assign governor task</span></div>`;
            root.replaceWith(d2);
            setTimeout(() => {
                check('rebuild translated', d2.textContent.trim(), '分配总督任务');
                // 再触发一次 characterData，确认不循环重翻
                const s = d2.querySelector('span');
                s.textContent = 'Assign governor task';
                setTimeout(() => {
                    check('re-mutated still translated', s.textContent, '分配总督任务');
                    console.log('\nPASS:', pass, 'FAIL:', fail);
                    process.exit(fail ? 1 : 0);
                }, 2500);
            }, 3000);
        }, 2500);
    }, 3000);
}, 3300);
