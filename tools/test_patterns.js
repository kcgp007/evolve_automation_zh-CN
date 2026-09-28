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
    const d = window.document;
    const root = d.createElement('div');
    root.id = 'script_settings';
    root.innerHTML = `
      <div><span>Supported Supplies: 42</span></div>
      <div><span>Next Tech Level in ~[2:30:00]</span></div>
      <div><span>AutoBuild weighting: 1.5</span></div>
      <div><span>More script options available in Settings tab</span><br><span>Ctrl+click options to open </span><span>advanced configuration</span></div>
      <div><span>Conflicts with A, B for X, Y (cause)</span></div>
      <div><span>Warning! This race have special requirements: xxx This condition is bypassed. Race will have 25% penalty.</span></div>
      <div><span>outer_shipyard_core</span></div>
      <div><span>Mutual Assured Destruction</span></div>
      <div><span>Endless game</span></div>
      <div><span>By resource quantity</span></div>
      <div><span>Legacy (deprecated)</span></div>
      <div><span>Total Soldiers</span></div>
      <div><span>Contaminated in [0:30:00]</span></div>
      <div><span>~1.18 soldiers healed per day</span></div>
      <div><span>~16.18 seconds to increase population</span></div>
      <div><span>Up to ~30 seconds to break car (with full supression)</span></div>
      <div><span>10 seconds to repair 1% of wall</span></div>
      <div><span>5 seconds to repair car</span></div>
      <div><span>~5% chance to find Soul Gem</span></div>
      <div><span>Up to ~10-50 demons spawned per day</span></div>
      <div><span>2% of stored Food spoiled per second</span></div>
      <div><span>Next level will increase total consumption by 10 MW</span></div>
      <div><span>Next level will decrease total consumption by 3 MW</span></div>
      <div><span>Current team potential: 0.5</span></div>
      <div><span>Supplies collected: 100 /s</span></div>
      <div><span>Next level will increase Alpha Exchange storage by +5% (+1.6% per crew)</span></div>
      <div><span>Missing 5 MW to power on</span></div>
      <div><span>AutoARPA weighting: 1.5 (50%)</span></div>
      <div><span>Still have some unused storage</span></div>
      <div><span>Queued building, processing...</span></div>
      <div><span>Not needed for Bioseed prestige</span></div>
      <div><span>Provided Moon Support not currently needed</span></div>
      <div><span>Missing Red Support to operate</span></div>
      <div><span>Provided Sun Support not currently needed</span></div>
      <div><span>Provided Belt Support not currently needed</span></div>
      <div><span>Missing Elerium to operate</span></div>
      <div><span>6.0M Max Knowledge required</span></div>
    `;
    d.body.appendChild(root);

    setTimeout(() => {
        const texts = [];
        const walk = (el) => { if (el.nodeType === 3) texts.push(el.nodeValue); el.childNodes.forEach(walk); };
        walk(root);
        const t = texts.map(x => x.trim()).filter(Boolean);

        check('supported', t.includes('支持的补给：42'), true);
        check('nexttech', t.includes('下一科技等级于 ~[2:30:00]'), true);
        check('autobuild weight', t.includes('自动建造权重：1.5'), true);
        check('more options', t.includes('更多脚本选项位于设置标签页'), true);
        check('ctrl click', t.includes('Ctrl+点击选项以打开'), true);
        check('advanced config', t.includes('高级配置'), true);
        check('conflicts', t.includes('与A, B冲突，争用X, Y（cause）'), true);
        check('bypass pattern', t.some(x => x.indexOf('警告！此种族有特殊要求：xxx 此条件已绕过。种族将有惩罚。') === 0), true);
        check('game.loc untouched', t.includes('outer_shipyard_core'), true);
        check('prestige label', t.includes('核爆重置'), true);
        check('endless', t.includes('无尽游戏'), true);
        check('by resource qty', t.includes('按资源数量'), true);
        check('legacy', t.includes('旧版（已弃用）'), true);
        check('total soldiers', t.includes('总士兵'), true);
        check('contaminated2', t.includes('污染于 [0:30:00]'), true);
        check('soldiers healed', t.includes('~1.18 名士兵每天治愈'), true);
        check('population', t.includes('~16.18 秒后人口增长'), true);
        check('break car', t.includes('最多 ~30 秒拆除勘探车（完全镇压时）'), true);
        check('repair wall', t.includes('10 秒修复 1% 城墙'), true);
        check('repair car', t.includes('5 秒修复勘探车'), true);
        check('find resource', t.includes('~5% 概率找到 灵魂宝石'), true);
        check('demons', t.includes('每天最多 ~10-50 只恶魔生成'), true);
        check('spoiled', t.includes('存储的 食物 每秒腐败 2%'), true);
        check('inc consumption', t.includes('下一级总消耗增加 10 MW'), true);
        check('dec consumption', t.includes('下一级总消耗减少 3 MW'), true);
        check('team potential', t.includes('当前队伍潜力：0.5'), true);
        check('supplies', t.includes('已收集补给：100 /秒'), true);
        check('storage by crew', t.includes('下一级使 阿尔法交易站 存储上限 +5%（每名船员 +1.6%）'), true);
        check('missing MW', t.includes('缺少 5 MW 供电'), true);
        check('autoarpa', t.includes('自动研究权重：1.5（50%）'), true);
        check('unused storage', t.includes('仍有未使用的存储'), true);
        check('queued building', t.includes('建筑排队中，正在处理...'), true);
        check('bioseed prestige', t.includes('播种威望不需要'), true);
        check('provided moon', t.includes('当前不需要月球支援'), true);
        check('missing red', t.includes('缺少 红星支援 无法运作'), true);
        check('provided sun', t.includes('当前不需要太阳支援'), true);
        check('provided belt', t.includes('当前不需要小行星带支援'), true);
        check('missing elerium', t.includes('缺少 超铀 无法运作'), true);
        check('max knowledge required', t.includes('知识上限需达到 6.0M'), true);

        // confirm 特殊场景
        window.confirm('MAD has already been researched. You may prestige immediately. Are you sure you want to toggle this prestige?');
        check('confirm prestige', confirmLog[0], 'MAD 已被研究。 你可以立即进行威望。确定要切换此威望吗？');
        window.confirm("Warning! Imported settings includes evaluated code, which will have full access to browser page, and can be potentially dangerous.\nOnly continue if you trust the source. Injected code:\neval(1)");
        check('confirm import', confirmLog[1], '警告！导入的设置包含求值代码，其将拥有浏览器页面的完全访问权限，可能有潜在危险。\n仅当你信任来源时才继续。注入的代码：\neval(1)');

        console.log('\nPASS:', pass, 'FAIL:', fail);
        process.exit(fail ? 1 : 0);
    }, 3000);
}, 3300);
