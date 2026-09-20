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

    // --- 模拟 #autoScriptContainer（Automation 折叠面板） ---
    const ac = d.createElement('div');
    ac.id = 'autoScriptContainer';
    ac.innerHTML = `
      <h3 id="toggleSettingsCollapsed" class="script-collapsible">Automation</h3>
      <div id="scriptToggles">
        <label>More script options available in Settings tab<br>${String.fromCharCode(0x2b)}+click options to open <span class="inactive-row">advanced configuration</span></label><br>
        <label class="switch" title="Allows script to finish current run after reaching configured goal. Prestige Type is recommended to be set even with manual resetting, as script uses that to make various decisions such as picking theology techs, or skipping buildings leading in wrong direction.">
          <span class="check"></span><span>autoPrestige</span>
        </label>
        <label class="switch" title="Stop taking any actions on behalf of the player.">
          <span class="check"></span><span>masterScriptToggle</span>
        </label>
        <a class="button" id="bulk-sell"><span>Bulk Sell</span></a>
      </div>`;
    d.body.appendChild(ac);

    // --- 模拟 #scriptModal（弹出面板） ---
    const modal = d.createElement('div');
    modal.id = 'scriptModal';
    modal.innerHTML = `
      <div id="scriptModalHeader"><p>Government</p></div>
      <div id="scriptModalBody">
        <table style="width:100%">
          <tr><th>Variable 1</th><th>Check</th><th>Variable 2</th><th>Result</th></tr>
          <tr><th>Type</th><th>Value</th><th>Type</th><th>Value</th></tr>
        </table>
        <p>First value passed check will be used. Default value:</p>
        <p>The current value:</p>
        <select><option title="Return true when building is unlocked">Building Unlocked</option></select>
        <select><option>AND</option></select>
        <p>Toggle (autoPrestige)</p>
        <p>Script Notice: something went wrong</p>
      </div>`;
    d.body.appendChild(modal);

    // 记录初始挂载时间戳，等待 init 首次轮询
    const t0 = Date.now();
    const watcher = setInterval(() => {
        const h = d.getElementById('scriptModalHeader').textContent.trim();
        if (h !== 'Government' || Date.now() - t0 > 12000) {
            clearInterval(watcher);
            runChecks();
        }
    }, 200);
}, 100);

function runChecks() {
    const d = window.document;
    const $ = (sel) => d.querySelector(sel);

    // #autoScriptContainer
    check('collapsible title', $('#toggleSettingsCollapsed').textContent.trim(), '自动化');
    check('more options', $('#scriptToggles > label').textContent.includes('更多脚本选项'), true);
    check('advanced config', $('#scriptToggles .inactive-row').textContent.trim(), '高级配置');
    const switches = [...d.querySelectorAll('#scriptToggles label.switch')];
    const autoPrestige = switches[0];
    const master = switches[1];
    check('toggle key autoPrestige', autoPrestige.querySelector('span:last-of-type').textContent, '自动威望');
    check('toggle key master', master.querySelector('span:last-of-type').textContent, '总开关');
    check('toggle title autoPrestige', autoPrestige.getAttribute('title').includes('达到配置的目标'), true);
    check('toggle title master', master.getAttribute('title'), '停止代表玩家执行任何操作。');
    check('bulk sell', $('#bulk-sell span').textContent, '批量出售');

    // #scriptModal
    const ths = [...d.querySelectorAll('#scriptModalBody th')].map(x => x.textContent.trim());
    check('modal var1', ths.includes('变量 1'), true);
    check('modal check', ths.includes('检查'), true);
    check('modal result', ths.includes('结果'), true);
    check('modal type', ths.includes('类型'), true);
    check('modal value', ths.includes('值'), true);
    const bodyText = $('#scriptModalBody').textContent;
    check('modal default note', bodyText.includes('将通过检查的第一个值作为结果。默认值：'), true);
    check('modal current value', bodyText.includes('当前值：'), true);
    const opt1 = $('#scriptModalBody select:first-of-type option');
    check('cond type option', opt1.textContent.trim(), '建筑已解锁');
    check('cond type title', opt1.getAttribute('title'), '建筑解锁时返回 true');
    const opt2 = $('#scriptModalBody select:nth-of-type(2) option');
    check('comparator option', opt2.textContent.trim(), '与');
    check('dynamic toggle label', bodyText.includes('切换（自动威望）'), true);
    check('script notice', bodyText.includes('脚本提示：'), true);

    // 动态加入新内容（模拟弹窗重新填充），观察 observer 翻译
    const nb = d.createElement('div');
    nb.innerHTML = '<p>Other uncategorized variables</p><p>Eval of this condition:</p>';
    $('#scriptModalBody').appendChild(nb);

    setTimeout(() => {
        const t2 = $('#scriptModalBody').textContent;
        check('dyn append 1', t2.includes('其他未分类变量'), true);
        check('dyn append 2', t2.includes('此条件的求值：'), true);

        // 游戏 tab 内的主题开关（QUIET_TARGETS）
        const eject = d.createElement('div');
        eject.id = 'eject';
        eject.innerHTML = '<span id="script_eject_top_row" class="has-text-danger">Auto Eject</span>';
        d.body.appendChild(eject);
        setTimeout(() => {
            check('auto eject label', d.getElementById('script_eject_top_row').textContent.trim(), '自动喷射');
            console.log('\nPASS:', pass, 'FAIL:', fail);
            process.exit(fail ? 1 : 0);
        }, 5500);
    }, 2500);
}
