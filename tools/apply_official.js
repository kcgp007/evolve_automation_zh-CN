const fs = require('fs');
const path = require('path');

const TOOLS = __dirname;
const ROOT = path.join(TOOLS, '..');
const USERJS = path.join(ROOT, 'evolve_automation_zh-CN.user.js');

let src = fs.readFileSync(USERJS, 'utf8');

// ---------- 1) TRANSLATIONS dictionary key-value overrides ----------
const DICT_OVERRIDES = {
  // jobs (official job_*)
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
  // resources (official resource_*_name)
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
  // buildings / ships / techs / regions
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
  "Gate Turret": "远古之门炮塔",
  "Gather Food": "收集食物",
  "Gather Lumber": "收集木材",
  "Gather Stone": "收集石料",
  "Foreign Powers": "周边国家",
  // prestige resets (official wiki_resets_*)
  "Mutual Assured Destruction": "核爆重置",
  "Bioseed": "播种重置",
  "Whitehole": "黑洞重置",
  "Ascension": "飞升重置",
  "Matrix": "矩阵重置",
  "Cataclysm": "大灾变重置",
  "Retirement": "隐退重置",
  "Eden": "伊甸园重置",
  "Apotheosis": "神灵重置",
  "AI Apocalypse": "人工智能觉醒",
  "Warlord": "黑暗战神",
  "Unification": "世界统一"
};

// ---------- 2) SECTION_NAMES overrides (official tab_* / civics_*) ----------
const SECTION_OVERRIDES = [
  { from: "'Ejector': '弹射器'", to: "'Ejector': '质量喷射器'" },
  { from: "'Ejector, Supply & Nanite': '弹射器、补给与纳米'", to: "'Ejector, Supply & Nanite': '质量喷射器、补给与纳米'" },
  { from: "'Foreign Powers': '外部势力'", to: "'Foreign Powers': '周边国家'" }
];

// ---------- apply dictionary overrides by rewriting the TRANSLATIONS line ----------
function rewriteTranslations() {
  const lines = src.split('\n');
  const idx = lines.findIndex(x => x.includes('var TRANSLATIONS = {'));
  if (idx < 0) throw new Error('TRANSLATIONS line not found');
  const line = lines[idx];
  const start = line.indexOf('{');
  const end = line.lastIndexOf('}') + 1;
  const dict = JSON.parse(line.slice(start, end));
  let changed = 0, missing = [];
  for (const k of Object.keys(DICT_OVERRIDES)) {
    if (!(k in dict)) { missing.push(k); continue; }
    if (dict[k] !== DICT_OVERRIDES[k]) { dict[k] = DICT_OVERRIDES[k]; changed++; }
  }
  const indent = line.slice(0, start);
  const tail = line.slice(end);
  lines[idx] = indent + JSON.stringify(dict) + tail;
  src = lines.join('\n');
  console.log('dict changes applied:', changed, '| keys missing from dict:', missing.length);
  if (missing.length) console.log('  missing keys:', missing.join(', '));
}

function applySectionOverrides() {
  let changed = 0;
  for (const o of SECTION_OVERRIDES) {
    if (src.includes(o.from)) { src = src.replace(o.from, o.to); changed++; }
    else console.log('  WARN not found:', o.from);
  }
  console.log('section changes applied:', changed);
}

rewriteTranslations();
applySectionOverrides();

fs.writeFileSync(USERJS, src);
console.log('written', USERJS);