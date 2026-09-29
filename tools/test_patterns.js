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
    const SAFE_MODE = "Script safe mode is active to let you solve problems in your configuration.\nThe masterScriptToggle is always disabled in this mode, and your overrides don't get evaluated.\nFix the problems that required you to use this mode, then remove ?safemode from the URL to deactivate.";
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
      <div><span>Warning! This race have special requirements: Failed Experiment unlocked. This condition is not met.</span></div>
      <div><span>Complete an Ascension reset and be on a suitable planet for your chosen genus (not set).</span></div>
      <div><span>If logging is enabled then logs Construction actions</span></div>
      <div><span>Script Notice: Script Error</span></div>
      <div><span>Soul Well</span></div>
      <div><span>Cabin</span></div>
      <div><span>Prestige</span></div>
      <div><span>Garrison is destroyed</span></div>
      <div><span>Hired 3 mercenaries to join the garrison.</span></div>
      <div><span>10 for Custom</span></div>
      <div><span>10 for Custom and Sludge</span></div>
      <div><span>Major</span></div>
      <div><span>Genus</span></div>
      <div><span>Graveyard</span></div>
      <div><span>Shrine</span></div>
      <div><span>Supercollider</span></div>
      <div><span>Monument</span></div>
      <div><span>Railway</span></div>
      <div><span>Nexus</span></div>
      <div><span>Depot</span></div>
      <div><span>Purchase</span></div>
      <div><span>Ship</span></div>
      <div><span>Mech</span></div>
      <div><span>Plans</span></div>
      <div><span>Warning</span></div>
      <div><span>Post-Transcendence</span></div>
      <div><span>Post-Preeminence</span></div>
      <div><span>Evil</span></div>
      <div><span>Flier</span></div>
      <div><span>1st Warning</span></div>
      <div><span>2nd Warning</span></div>
      <div><span>True Path</span></div>
      <div><span>Power</span></div>
      <div><span>Lone Survivor</span></div>
      <div><span>Some Tech (True Path)</span></div>
      <div><span>Next mech (1.5)</span></div>
      <div><span>Conflicts with A, B for X, Y (Mech)</span></div>
      <div><span>Performing &quot;Sabotage&quot; covert operation against Zaron (1).</span></div>
      <div><span>Training a spy to send against Zaron (1).</span></div>
      <div><span>Launching Raid campaign against Zaron (1) with ~25.0% advantage.</span></div>
      <div><span>Launching Siege campaign against Valdi (2) with 40.0% advantage.</span></div>
      <div><span>Reset: Bioseed, Species: Human, Duration: 1234 days</span></div>
      <div><span>Ambush</span></div>
      <div><span>Raid</span></div>
      <div><span>Pillage</span></div>
      <div><span>Assault</span></div>
      <div><span>Siege</span></div>
      <div><span>Next mech (titan)</span></div>
      <div><span>Troll</span></div>
      <div><span>Human</span></div>
      <div><span>Wendigo</span></div>
      <div><span>Ultra Sludge</span></div>
      <div><span>Hellspawn</span></div>
      <div><span>Shroomi</span></div>
      <div><span>Fungi</span></div>
      <div><span>Aquatic</span></div>
      <div><span>Reset: MAD, Species: Human, Duration: 5 days</span></div>
      <div><span>${SAFE_MODE}</span></div>
    `;
    d.body.appendChild(root);

    // 游戏消息日志容器：自动化脚本 GameLog 的英文提示会进入这里
    const msgRoot = d.createElement('div');
    msgRoot.id = 'msgQueue';
    msgRoot.innerHTML = `
      <p class="has-text-success">Hired a mercenary to join the garrison.</p>
      <p class="has-text-danger">Wrong race, soft resetting and trying again.</p>
    `;
    d.body.appendChild(msgRoot);

    setTimeout(() => {
        const texts = [];
        const walk = (el) => { if (el.nodeType === 3) texts.push(el.nodeValue); el.childNodes.forEach(walk); };
        [root, msgRoot].forEach(walk);
        const t = texts.map(x => x.trim()).filter(Boolean);

        check('supported', t.includes('支持的补给：42'), true);
        check('nexttech', t.includes('下一科技等级于 ~[2:30:00]'), true);
        check('autobuild weight', t.includes('自动建造权重：1.5'), true);
        check('more options', t.includes('更多脚本选项位于设置标签页'), true);
        check('ctrl click', t.includes('Ctrl+点击选项以打开'), true);
        check('advanced config', t.includes('高级配置'), true);
        check('conflicts', t.includes('与A, B冲突，争用X, Y（cause）'), true);
        check('bypass pattern', t.some(x => x.indexOf('警告！此种族有特殊要求：xxx 此条件已绕过。种族将有 25% 惩罚。') === 0), true);
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
        check('race requirement nested', t.includes('警告！此种族有特殊要求：实验失败已解锁。 此条件未满足。'), true);
        check('ascension genus template', t.includes('完成一次飞升重置，并处于适合你所选属的行星（未设置）。'), true);
        check('logging nested', t.includes('如果启用日志，则记录建设操作'), true);
        check('script notice nested', t.includes('脚本提示：脚本错误'), true);
        check('soul well key', t.includes('灵魂井'), true);
        check('cabin key', t.includes('小木屋'), true);
        check('prestige key', t.includes('威望'), true);
        check('garrison destroyed key', t.includes('驻军已被摧毁'), true);
        check('safe mode block', t.some(x => x.indexOf('脚本安全模式已激活，以便你排查配置中的问题。') === 0), true);

        // 动态模板：雇佣兵 / Custom 费用 / 表格类型标签
        check('hired mercenaries', t.includes('已聘请 3 名雇佣兵加入驻军。'), true);
        check('custom cost', t.includes('自定义 10'), true);
        check('custom sludge cost', t.includes('自定义与软泥 10'), true);
        check('major label', t.includes('主要'), true);
        check('genus label', t.includes('属'), true);

        // msgQueue 容器（游戏消息日志）
        check('msgQueue observed', t.includes('已聘请一名雇佣兵加入驻军。'), true);
        check('msgQueue wrong race', t.includes('种族错误，软重置后重试。'), true);

        // 建筑/项目名（进 Buildings/Projects 权重表）
        check('key graveyard', t.includes('墓地'), true);
        check('key shrine', t.includes('圣地'), true);
        check('key supercollider', t.includes('超级对撞机'), true);
        check('key monument', t.includes('纪念碑'), true);
        check('key railway', t.includes('铁路'), true);
        check('key nexus', t.includes('魔法回路'), true);
        check('key depot', t.includes('贮藏所'), true);
        check('key purchase', t.includes('收购'), true);
        check('key ship', t.includes('飞船'), true);
        check('key mech', t.includes('机甲'), true);
        check('key plans', t.includes('计划'), true);
        check('key warning', t.includes('预警'), true);
        check('key post-transcendence', t.includes('超越之后'), true);
        check('key post-preeminence', t.includes('卓越之前'), true);

        // 科技区分词 Technology.techDiscriminators
        check('disc evil', t.includes('邪恶'), true);
        check('disc flier', t.includes('飞行'), true);
        check('disc 1st warning', t.includes('第一次预警'), true);
        check('disc 2nd warning', t.includes('第二次预警'), true);
        check('disc true path', t.includes('智械黎明'), true);
        check('disc true path in parens', t.includes('Some Tech（智械黎明）'), true);
        check('disc power unchanged', t.includes('电力'), true);
        check('disc lone survivor unchanged', t.includes('孤独幸存者'), true);

        // 冲突目标：name + cause
        check('next mech target', t.includes('下一台机甲（1.5）'), true);
        check('conflict cause translated', t.includes('与A, B冲突，争用X, Y（机甲）'), true);

        // 间谍 / 战役动态模板
        check('covert operation', t.includes('正在对 Zaron (1) 执行「破坏」间谍行动。'), true);
        check('train spy', t.includes('训练间谍以对抗 Zaron (1)。'), true);
        check('launch campaign approx', t.includes('对 Zaron (1) 发起战役（突袭），优势 ~25.0%。'), true);
        check('launch campaign exact', t.includes('对 Valdi (2) 发起战役（围城），优势 40.0%。'), true);

        // 威望日志模板
        check('prestige log format', t.includes('重置：播种重置，种族：人类，时长：1234 天'), true);

        // 战役类型名（civics_garrison_tactic_*）
        check('tactic ambush', t.includes('伏击'), true);
        check('tactic raid', t.includes('突袭'), true);
        check('tactic pillage', t.includes('抢劫'), true);
        check('tactic assault', t.includes('突击'), true);
        check('tactic siege', t.includes('围城'), true);

        // 机甲尺寸 id
        check('mech size titan', t.includes('下一台机甲（泰坦）'), true);

        // 种族 species（race_* 官方值）
        check('species human', t.includes('人类'), true);
        check('species troll', t.includes('巨魔'), true);
        check('species wendigo', t.includes('温迪戈'), true);
        check('species ultra sludge', t.includes('终极软泥'), true);
        check('species hellspawn', t.includes('渊嗣'), true);
        check('species shroomi', t.includes('蘑菇人'), true);
        // 种族 species（genelab_genus_* 官方值）
        check('species fungi', t.includes('真菌'), true);
        check('species aquatic', t.includes('水生生物'), true);

        // 威望日志模板：species 段已可翻译
        check('prestige log mad', t.includes('重置：MAD，种族：人类，时长：5 天'), true);

        // confirm 特殊场景
        window.confirm('MAD has already been researched. You may prestige immediately. Are you sure you want to toggle this prestige?');
        check('confirm prestige', confirmLog[0], 'MAD 已被研究。 你可以立即进行威望。确定要切换此威望吗？');
        window.confirm("Warning! Imported settings includes evaluated code, which will have full access to browser page, and can be potentially dangerous.\nOnly continue if you trust the source. Injected code:\neval(1)");
        check('confirm import', confirmLog[1], '警告！导入的设置包含求值代码，其将拥有浏览器页面的完全访问权限，可能有潜在危险。\n仅当你信任来源时才继续。注入的代码：\neval(1)');

        console.log('\nPASS:', pass, 'FAIL:', fail);
        process.exit(fail ? 1 : 0);
    }, 3000);
}, 3300);
