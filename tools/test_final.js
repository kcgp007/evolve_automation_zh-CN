const fs = require('fs');
const userjs = fs.readFileSync('/home/king/workspace/evolve_automation_zh-CN/evolve_automation_zh-CN.user.js', 'utf8');
const { JSDOM } = require('/home/king/workspace/evolve_automation_zh-CN/node_modules/jsdom');

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { runScripts: 'outside-only' });
const { window } = dom;
const confirmLog = [];
window.confirm = (m) => { confirmLog.push(m); return true; };
window.eval(userjs);

let pass = 0, fail = 0;
function check(label, found, expected) {
    if (found === expected) pass++;
    else { fail++; console.log('FAIL', label, 'got', JSON.stringify(found), 'want', JSON.stringify(expected)); }
}

setTimeout(() => {
    // 构造 #script_settings，触发 init 翻译
    const d = window.document;
    const root = d.createElement('div');
    root.id = 'script_settings';
    root.innerHTML = `
      <h3>General Settings</h3>
      <div class="script-content">
        <button id="script_resetgeneral" class="button">Reset General Settings</button>
        <div>
          <label title="Script runs once per this amount of game ticks. Game tick every 250ms, thus with rate 4 script will run once per second. You can set it lower to make script act faster, or increase it if you have performance issues. Tick rate should be a positive integer.">
            <span>Script tick rate</span>
            <input type="text" placeholder="Research...">
          </label>
        </div>
        <div>
          <label title="When enabled script will be allowed to assign some crates and containers even if resulting storage space won't be enough to build new building. It allows to pre-build stock of resources for further use, but can be potentially dungerous.\nIf script not allowed to reassign non-empty storage it can lock storage in position when stored resources can't be used.\nIf script is allowed to reassign non-empty storage it might waste time producing materials which might need to be disposed.">
            <span>Assign partial storage</span>
          </label>
        </div>
        <div>
          <label title="Assigns 3% extra strorage above required amounts, ensuring that required quantity will be actually reached, even if other part of script trying to sell\\eject\\switch production, etc. When manual trades enabled applies additional adjust derieved from selling threshold.">
            <span>Assign buffer storage</span>
          </label>
        </div>
        <div>
          <span>Occupy last foreign power once other two are controlled, and unification is researched to speed up unification. Disable if you want annex\\purchase achievements.</span>
        </div>
        <div>
          <span>Lower Rating for each active Predator Drone by</span>
        </div>
        <div>
          <span>Eject mode</span>
        </div>
        <div>
          <span>Assign governor task</span>
        </div>
        <div>
          <span>Prioritize keeping materials stockpiled</span>
        </div>
        <div>
          <span>Weighting mode</span>
        </div>
        <div>
          <span>By atomic mass</span>
        </div>
        <div>
          <span>This race have special requirements: blah This condition is met.</span>
        </div>
        <div>
          <span>If logging is enabled then logs someAction actions</span>
        </div>
        <div>
          <span>Contaminated in [2:00:00]</span>
        </div>
        <div>
          <span>Make sure all Steel producers are above consumers in buildings list!</span>
        </div>
        <div>
          <span>Total Soldiers Max</span>
        </div>
      </div>`;
    d.body.appendChild(root);

    setTimeout(() => {
        const texts = [];
        const walk = (el) => { if (el.nodeType === 3) texts.push(el.nodeValue.trim()); el.childNodes.forEach(walk); };
        walk(root);

        check('h3', texts.includes('常规设置'), true);
        check('reset', texts.includes('重置常规设置'), true);
        check('tick label', texts.includes('脚本 tick 频率'), true);
        check('tick title', root.querySelectorAll('label')[0].getAttribute('title').indexOf('脚本每此数量的游戏 tick 运行一次') === 0, true);
        check('partial storage label', texts.includes('分配部分仓库'), true);
        check('partial storage title newline', root.querySelectorAll('label')[1].getAttribute('title').indexOf('启用后，即使最终仓库空间不足以建造新建筑') === 0, true);
        check('buffer label', texts.includes('分配缓冲仓库'), true);
        check('buffer title backslash', root.querySelectorAll('label')[2].getAttribute('title').indexOf('即使脚本其他部分试图出售\\排出\\切换生产') > -1, true);
        check('occupy backslash', texts.some(t => t.indexOf('如果你想要吞并\\购买成就') > -1), true);
        check('predator drone emspace-free', texts.includes('每个活跃的掠食者无人机降低评级'), true);
        check('eject mode', texts.includes('弹出模式'), true);
        check('governor', texts.includes('分配总督任务'), true);
        check('stockpiled', texts.includes('优先保持材料库存'), true);
        check('weighting mode', texts.includes('权重模式'), true);
        check('atomic mass', texts.includes('按原子质量'), true);
        check('race pattern', texts.some(t => t === '此种族有特殊要求：blah 此条件已满足。'), true);
        check('logging pattern', texts.includes('如果启用日志，则记录someAction操作'), true);
        check('contaminated pattern', texts.includes('污染于 [2:00:00]'), true);
        check('make sure pattern', texts.includes('确保所有Steel的生产者排在建筑列表中的消费者之上！'), true);
        check('total soldiers max', texts.includes('总士兵上限'), true);

        // confirm hook（直接调用翻译包装后的 window.confirm）
        window.confirm('Are you sure you wish to reset Hell Settings?');
        check('confirm', confirmLog[0], '确定要重置地狱设置吗？');
        console.log('\nPASS:', pass, 'FAIL:', fail);
        process.exit(fail ? 1 : 0);
    }, 3000);
}, 3500);
