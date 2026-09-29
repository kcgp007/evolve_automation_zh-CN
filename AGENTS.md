# AGENTS.md — Evolve 自动化脚本中文化

本文件是 opencode 自动加载的项目指令，为**每个新会话**提供持久上下文。开始任何工作前先阅读本文件与 `docs/DECISIONS.md`、`README.md`。

## 项目概览

将 Evolve Automation 脚本（`evolve_automation.user.js`，英文，来源 https://github.com/Vollch/Evolve-Automation）生成的界面翻译为简体中文。

- **主脚本**：`evolve_automation_zh-CN.user.js`（Tampermonkey 用户脚本，`@match https://pmotschmann.github.io/Evolve/*`）
- **英文原脚本**：`evolve_automation.user.js`（只读参考，永不修改）
- **备份**：`evolve_automation_zh-CN.user.js.bak`（每次修改验证通过后同步更新）
- **Git 仓库**：`git@github.com:kcgp007/evolve_automation_zh-CN.git`

## 翻译架构（主脚本核心机制）

主脚本是一个 IIFE，核心结构：

1. **`SECTION_NAMES`**（约 16 行）：设置面板 section 名映射。
2. **`PATTERNS` 数组**（TRANSLATIONS 之前）：正则+rep 的动态模板翻译。`re` 通常锚定 `^...$`，`rep` 返回中文，可用 `lookup(TRANSLATIONS, pN)` 对捕获组二次查字典。
3. **`NORM` + `normalizeText()`**：先 decode 实体/转义，再做归一化查找（处理不可见字符）。
4. **`TRANSLATIONS` 字典**：**单行 JSON**，位于约第 188 行（`var TRANSLATIONS = {"key":"值",...};`），当前约 1708 键。这是主要的英→中精确匹配表。
5. **`translateText(text)`**：处理顺序 = `TRANSLATIONS` 精确匹配 → `PATTERNS` 正则 → em-space 修整 → `normalizeText` → `NORM` 匹配 → `TRANSLATIONS` 兜底。
6. **`translateAttributes`**：翻译 title/placeholder 属性，有普通空格 trim 兜底。
7. **`MutationObserver`**：监听 `WATCH_CONTAINERS`（`script_settings`、`autoScriptContainer`、`scriptModal`、`popper`、`s-prestige-type`），新内容进入时触发翻译。`init` 每 1.5s 运行一次。

## 三种翻译机制（判断新文本用哪种）

| 文本类型 | 机制 | 操作 |
|---|---|---|
| **静态字符串**（如 "Still have some unused storage"） | TRANSLATIONS 精确匹配 | 往字典加键值对 |
| **动态模板**（如 `~1.18 soldiers healed per day`、`Missing Elerium to operate`） | PATTERNS 正则 + rep | 在 `PATTERNS` 数组加规则，捕获组二次查字典 |
| **Section 名** | SECTION_NAMES | 改 SECTION_NAMES 映射 |

新增动态模板正则时，放在 PATTERNS 数组末尾通用括号规则（`^(.+) \(([^)]+)\)$`）**之前**，避免被通用规则截获。

### 易漏的四个坑

1. **PATTERNS 的 rep 若拼接捕获组，必须用 `lookup(TRANSLATIONS, p1)` 二次查字典**，否则内嵌英文原样漏出。已知已修：`This race have special requirements:` 三条、`If logging is enabled then logs X actions`、`Script Notice: X`。
2. **同一个英文词有两条通道、查两张表**：`addSettings*` 的 section 名走 `SECTION_NAMES`+`translateSection()`，而 `addOptionUI(...)` 第 3 个参数（弹窗标题）走 `TRANSLATIONS`。凡是被 `addOptionUI` 当标题用的词（如 `Hell`、`Fleet`、`Prestige`）**两张表都要有**。
3. **建筑/资源显示名会原样进 Buildings/Projects 权重表**（`buildings[id].name` → `buildTableLabel`），所以 `new Action("Soul Well", …)` 这类名字需要在字典里有键，否则表里中英混排。译法优先取 `tools/official_zh.json` 官方值。
4. **不进 `WATCH_CONTAINERS` 的通道加了键也不生效**。已知的未覆盖通道：`#script-script-warning` 警告节点、高级触发器的 jQuery-UI autocomplete 菜单（挂 `document.body`）、`<textarea>` 的 value。这类情况属"必要不充分"，键先备着，机制要单独补。

   > 游戏消息队列**已覆盖**（本轮新增）：`GameLog.log*` 的消息落在 `#msgQueueLog`（`#msgQueue` 的子节点，每条消息是 `$('<p class="has-text-COLOR"></p>').text(msg)` 纯文本注入），因此把 `'msgQueue'` 整容器加进 `WATCH_CONTAINERS` 即可，只翻 DOM、不污染存档里的 `global.lastMsg`。
   > **不要改成包装 `window.evolve.messageQueue`**：游戏内部约 150 处调用走的是 ES module 作用域里的函数绑定，改 `window.evolve` 属性拦不到；且 `messageQueue` 会把 msg 写进 `global.lastMsg` 并随存档序列化，翻译第一个参数等于把中文写进存档。

## 审计脚本

`node tools/archive/audit_untranslated.js`（加 `--json` 输出机器可读）会扫描英文原脚本的界面字符串、送进 `translateText`、列出原样返回的条目（疑似界面文本 / 疑似内部误报两组）。补完翻译后跑一次看数字下降，是最快的回归体检手段。

## 标准工作流（翻译新文本）

1. 在英文原脚本 `evolve_automation.user.js` 中定位文本来源（`rg "文本" evolve_automation.user.js`），确认是静态还是动态。
2. 若动态，确认动态部分（数值/名称）在字典有对应键（名称用 `lookup(TRANSLATIONS, ...)` 二次翻译）。
3. 按上表机制修改主脚本。
4. 验证：
   ```bash
   node --check evolve_automation_zh-CN.user.js
   node tools/test_all_keys.js
   node tools/test_full_dom.js
   node tools/test_modal.js
   node tools/test_final.js
   node tools/test_patterns.js
   ```
   全部通过后：`cp evolve_automation_zh-CN.user.js evolve_automation_zh-CN.user.js.bak`，然后 git 提交。
5. 术语对齐官方翻译时，用 `tools/official_en.json` / `tools/official_zh.json`（官方在线源的本地镜像）。冲突项**必须列清单请示用户**，不得擅自决定。

## 关键决策记录（详见 docs/DECISIONS.md）

- **术语原则**：优先官方，冲突时列出请示。用户对 7 项冲突、19 项措辞差异已逐项拍板。
- **保留 `~` 符号**：动态数值模板（如 `~1.18 名士兵每天治愈`）保留原 `~`。
- **prestige 名**：MAD→核爆重置、Bioseed→播种重置、Whitehole→黑洞重置、Ascension→飞升重置 等（官方 wiki_resets_*）。
- **A.R.P.A.**→高级研究计划局（TRANSLATIONS 与 SECTION_NAMES 两处都要改）。
- **支援模板**：`Missing X to operate`→`缺少 X 无法运作`；`Provided X not currently needed`→`当前不需要X`（方案 B）。

## 安全守则（历史教训，务必遵守）

> ⚠️ **这几条是多次文件损坏换来的教训。**

- **禁止用 `JSON.stringify` 重写整个文件**。只允许：定位 `TRANSLATIONS` 所在行 → 截取该行的 `{...}` → `JSON.parse` → 改键值 → `JSON.stringify` → 只替换那一行。用 node 脚本完成，勿手工编辑 9 万字符单行字典。
- **禁止手工编辑含转义引号/反斜杠的行**（曾导致损坏）。改动后用 `node --check` + 全部测试验证。
- 字典有损坏时，从 `.bak` 恢复后**必须用幂等的 `tools/apply_official.js` 重放**官方对齐（.bak 可能落后于主脚本）。
- `MAD`/`RNA`/`DNA` 等缩写键自映射（值=键）是刻意保留，勿改。
- 测试脚本的断言更新后要同步更新，勿让过时断言误报。

## 上游文件同步

> **每个新会话开始、以及翻译工作前，先运行：`node tools/check_upstream.js`**（网络不稳，可直接用 GitHub API 校验）。

- 该脚本检查三处：
  1. `evolve_automation.user.js`：对比 GitHub master blob sha，**不一致时自动覆盖**本地原脚本（只读参考，覆盖安全）。
  2. `official_en.json`：对比在线 `strings.json`，仅报告键差异，不覆盖。
  3. `official_zh.json`：对比在线 `strings.zh-CN.json`，仅报告键差异，不覆盖（在线含乱码，本地是修复版）。
- 原脚本有新版本（`UPDATED`）时：先重跑 `node tools/align_official.js` 与 `node tools/apply_official.js` 对齐新增官方术语，再按标准工作流补齐新文本的翻译，全部测试通过后提交。
- 注意：脚本用 Node 内置 `https` 直连 GitHub API（`Accept: application/vnd.github.raw`），勿改回 curl 拉 raw.githubusercontent.com（会超时）。

## 工具目录说明

- **核心维护**（勿删）：`check_upstream.js`（上游同步检查）、`apply_official.js` + `apply_official.json`（官方对齐幂等重放）、`align_official.js`（生成 align_report.json）、`fix_arpa.js`、`test_all_keys.js`、`test_full_dom.js`、`test_modal.js`、`test_final.js`、`test_patterns.js`、`official_en.json`、`official_zh.json`、`align_report.json`
- **历史归档**（勿用于新工作，仅参考）：`tools/archive/` 下的一次性构建/调试脚本与中间报告。

## 备注

- 测试用 jsdom（`node_modules/` 已安装）。测试脚本可能因 `window.setTimeout` 导致超时，必要时加 `timeout` 前缀。
- 修改并验证通过后才提交 git；提交信息用英文，遵循仓库既有风格。