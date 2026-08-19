# 翻译决策台账（DECISIONS）

本文件记录翻译过程中的术语与措辞决策，供后续会话直接沿用。原则：**优先官方，冲突时列清单请示用户**。

## 已拍板决策

### 1. 官方对齐保留项（脚本语境与官方不同，刻意保留）

| 键 | 脚本译法 | 官方译法 | 原因 |
|---|---|---|---|
| Mutual Assured Destruction | 核爆重置 | 共同毁灭原则 | prestige 名，用官方 wiki_resets_* |
| Ascension | 飞升重置 | 飞升 | prestige 名，加"重置"表操作 |
| Matrix | 矩阵重置 | 矩阵 | prestige 名 |
| Scout | 侦察机 | 侦察 | 船坞预设语境 |
| Retirement | 隐退重置 | 隐退 | prestige 名 |
| Eden | 伊甸园重置 | 伊甸 | prestige 名 |
| Research | 研究 | 研发 | 脚本通用词 |
| Servants | 仆从 | 鼬仆 | 脚本语义 |
| Type / Count / Reset / Smart / Compact / Gain / Dark / Power / Storage | 见 align_report | — | 通用词，官方词根语境不符 |

### 2. 已确认冲突项（官方多义，按脚本语境选定）

| 键 | 选定 | 官方候选 |
|---|---|---|
| Dreadnought | 无畏舰 | 外域无畏舰 / 无畏舰 |
| Steel | 钢 | 钢 / 钢铁 |
| Unemployed | 失业人口 | 失业 / 失业人口 |
| Forager | 寻觅者 | 寻觅者 / [寻觅者]特质 |
| Scavenger | 拾荒者 | 拾荒者 / 清道夫 |
| Miner | 矿工 | 矿工 / 中子矿船 |
| Gate Turret | 远古之门炮塔 | 大门炮塔 / 远古之门炮塔 |

### 3. 措辞差异改为官方（19 项，用户拍板"改为官方措辞"）

| 键 | 原译法 | 官方译法 |
|---|---|---|
| Psychic Powers | 心灵力量 | 灵能 |
| Patrol Size | 巡逻规模 | 巡逻队规模 |
| Outer Solar | 外太阳系 | 太阳系外围 |
| Retire and enjoy the easy life. | 退休并享受安逸生活。 | 隐退并享受美好生活。 |
| Evolution | 进化 | 史前进化 |
| War | 战争 | 战斗 |
| Never | 从不 | 永不 |
| No Manual Crafting | 无手动制作 | 关闭手动锻造 |
| Default | 默认 | 默认特质 |
| Resource | 资源 | 资源类型 |
| Cost | 费用 | 成本 |
| Job | 职业 | 工作 |
| Active | 进行中 | 已激活 |
| New | 新建 | 新 |
| Manual | 手动 | 手动调整 |
| Industry | 工业 | 行业 |
| Corrupt Gem | 腐化宝石 | 腐化的灵魂宝石 |
| Orbital Decay | 轨道衰减 | 轨道衰变 |
| The True Path | 真理之路 | 智械黎明 |

### 4. 动态数值模板翻译（PATTERNS，保留 `~`）

| 英文模板 | 中文 |
|---|---|
| `~{n} soldiers healed per day` | `~{n} 名士兵每天治愈` |
| `~{n} seconds to increase population` | `~{n} 秒后人口增长` |
| `Up to ~{n} seconds to break car (with full supression)` | `最多 ~{n} 秒拆除勘探车（完全镇压时）` |
| `{n} seconds to repair 1% of wall` | `{n} 秒修复 1% 城墙` |
| `{n} seconds to repair car` | `{n} 秒修复勘探车` |
| `~{n}% chance to find {资源}` | `~{n}% 概率找到 {资源}` |
| `Up to ~{n}-{n} demons spawned per day` | `每天最多 ~{n}-{n} 只恶魔生成` |
| `{n}% of stored {资源} spoiled per second` | `存储的 {资源} 每秒腐败 {n}%` |
| `Next level will (in|de)crease total consumption by {n} MW` | `下一级总消耗（增/减）少 {n} MW` |
| `Current team potential: {n}` | `当前队伍潜力：{n}` |
| `Supplies collected: {n} /s` | `已收集补给：{n} /秒` |
| `Next level will increase {建筑} storage by +{n}% (+{n}% per crew)` | `下一级使 {建筑} 存储上限 +{n}%（每名船员 +{n}%）` |
| `Missing {n} MW to power on` | `缺少 {n} MW 供电` |
| `AutoARPA weighting: {n} ({n}%)` | `自动研究权重：{n}（{n}%）` |

### 5. 支援模板（方案 B，用户拍板）

| 英文 | 中文 |
|---|---|
| `Missing {X} to operate` | `缺少 {X} 无法运作` |
| `Provided {X} not currently needed` | `当前不需要{X}` |

其中 `{X}` 为支援名（19 个，如 月球支援/红星支援/太阳支援/小行星带支援）或资源名，均已在字典中，用 `lookup(TRANSLATIONS, ...)` 二次翻译。注意支援名本身已含"支援"二字，`Provided X not currently needed` 的 rep **不要**再追加"支援"（避免"月球支援支援"）。

### 6. 其他约定

- **保留 `~` 符号**：动态数值模板保留原 `~`。
- **资源名二次翻译带空格**：如 `~5% 概率找到 灵魂宝石`（资源名两侧留空格）。
- **A.R.P.A.**→高级研究计划局（TRANSLATIONS 键 + SECTION_NAMES 两处）。
- **缩写键自映射**（MAD/RNA/DNA，值=键）刻意保留，勿改。
- **官方源**：https://pmotschmann.github.io/Evolve/strings/strings.json（en）与 strings.zh-CN.json（zh-CN），本地镜像 `tools/official_*.json`（在线中文有 17 处乱码，本地已修复）。