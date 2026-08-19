const fs = require('fs');
const path = require('path');

const TOOLS = __dirname;
const ROOT = path.join(TOOLS, '..');
const USERJS = path.join(ROOT, 'evolve_automation_zh-CN.user.js');

const en = JSON.parse(fs.readFileSync(path.join(TOOLS, 'official_en.json'), 'utf8'));
const zh = JSON.parse(fs.readFileSync(path.join(TOOLS, 'official_zh.json'), 'utf8'));

const src = fs.readFileSync(USERJS, 'utf8');
const line = src.split('\n').find(x => x.includes('var TRANSLATIONS = {'));
const dictText = line.slice(line.indexOf('{'), line.lastIndexOf('}') + 1);
const dict = JSON.parse(dictText);

// Official translations that MUST be applied (game entity names)
// Mapped manually after investigating script UI context + official sources.
const APPLY = {
  // ---- jobs (job_* official keys) ----
  "Colonist": "行星居民",
  "Teamster": "驾驶员",
  "Farmer": "农民",
  "Lumberjack": "伐木工人",
  "Quarry Worker": "石工",
  "Coal Miner": "煤矿工人",
  "Cement Worker": "水泥工人",
  "Tormentor": "施虐者",
  "Ghost Trapper": "幽灵捕捉者",
  "Elysium Miner": "净土石矿工",
  "Unemployed": "失业人口",
  "Forager": "寻觅者",
  "Ship Crew": "船员",
  // ---- resources (resource_*_name official keys) ----
  "Nanite": "纳米体",
  "Money": "资金",
  "Suspicion": "嫌疑",
  "Omniscience": "全知之识",
  "Neutronium": "中子",
  "Infernite": "地狱石",
  "Elerium": "超铀",
  "Bolognium": "钋",
  "Vitreloy": "金属玻璃",
  "Orichalcum": "奥利哈刚",
  "Asphodel Powder": "水仙花粉",
  "Elysanite": "净土石",
  "Unobtainium": "难得素",
  "Materials": "原材料",
  "Soul Gem": "灵魂宝石",
  "Brick": "砌砖",
  "Nanoweave": "纳米织物",
  "Scarletite": "绯绯色金",
  "Quantium": "量子",
  "Blessed Essence": "天使精华",
  "Blood Stone": "鲜血之石",
  "Artifact": "上古遗物",
  "Anti-Plasmid": "反质粒",
  "AI Core": "AI核心",
  "Supplies": "物资补给",
  "Dark": "暗影",      // keep - it's a prestige resource; official "黑暗" is theme/status mismatch
  "Power": "电力",      // keep - resource Power unlimited, official "强化" is wish_power mismatch
  "Steel": "钢",        // keep - resource Steel official=钢 (mine already matches)
  // ---- buildings / ships / techs / regions ----
  "Alchemy": "炼金术",
  "Pylon": "水晶塔",
  "Terraform": "重塑星球",
  "Frigate": "大型护卫舰",
  "Freighter": "星际货轮",
  "Mass Ejector": "质量喷射器",
  "Asphodel Harvester": "水仙收割机",
  "Asphodel Stabilizer": "水仙稳定器",
  "Lake Transport": "血湖运输船",
  "Mana Syphon": "法力虹吸",
  "Neutron Miner": "中子矿船",
  "Sacrificial Altar": "祭坛",
  "Sirius B Analysis": "分析天狼星B",
  "Tau Pylon": "天仓五水晶塔",
  "Tau Colony": "天仓五生活区",
  "Asteroid Redirect": "小行星变轨",
  "Gather Food": "收集食物",
  "Gather Lumber": "收集木材",
  "Gather Stone": "收集石料",
  "Bioseed": "播种重置",
  "Whitehole": "黑洞重置",
  "Apotheosis": "神灵重置",
  "Ascension": "飞升重置",
  "Matrix": "矩阵重置",
  "Cataclysm": "大灾变重置",
  "Warlord": "黑暗战神",
  "Unification": "世界统一"
};

let changedKeys = [];
let skipReasons = {};

for (const k of Object.keys(APPLY)) {
  if (!(k in dict)) { skipReasons[k] = 'key-not-in-dict'; continue; }
  if (dict[k] === APPLY[k]) { skipReasons[k] = 'already-equal'; continue; }
  changedKeys.push({ key: k, from: dict[k], to: APPLY[k] });
}

console.log('=== WILL APPLY (%d) ===', changedKeys.length);
for (const c of changedKeys) console.log(`  ${c.key}  ${c.from} -> ${c.to}`);

console.log('\n=== SKIPPED ===');
for (const k in skipReasons) console.log(`  ${k} : ${skipReasons[k]}`);

// Also check conflicts / undecided from align report
const report = JSON.parse(fs.readFileSync(path.join(TOOLS, 'align_report.json'), 'utf8'));
console.log('\n=== CONFLICTS FROM ALIGN (need decision) ===');
for (const c of report.conflicts) {
  console.log(`  ${c.key}  mine=${c.mine}  official=${JSON.stringify(c.official)}`);
}

// Save a machine-readable list of changes to apply
fs.writeFileSync(path.join(TOOLS, 'apply_official.json'), JSON.stringify(changedKeys, null, 2));