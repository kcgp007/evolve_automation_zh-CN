# Evolve 自动化脚本 · 界面中文化

将 Evolve Automation 脚本（`evolve_automation.user.js`）生成的界面（设置面板、tooltip 提示、按钮、下拉选项、确认框、建筑权重原因、声望顶栏等）翻译为简体中文的 Tampermonkey 用户脚本。

- 主脚本：`evolve_automation_zh-CN.user.js`
- 需在 Evolve Automation 脚本之后启用。
- 游戏本体语言请在游戏设置 - Locale 中切换为中文。

原自动化脚本（待翻译的英文脚本）：

- GitHub 仓库：https://github.com/Vollch/Evolve-Automation
- 本地副本：`evolve_automation.user.js`

## 翻译术语来源

术语对齐 Evolve 游戏官方简体中文翻译，官方对照文件：

- 英文（en）：https://pmotschmann.github.io/Evolve/strings/strings.json
- 简体中文（zh-CN）：https://pmotschmann.github.io/Evolve/strings/strings.zh-CN.json

本地镜像（供对齐工具使用）：

- `tools/official_en.json`（与在线英文版完全一致）
- `tools/official_zh.json`（键值与在线版一致，已修复在线版 17 处乱码）

## 鸣谢

感谢以下项目与工具为本次翻译工作提供的支持：

- **游戏官方**：Evolve 游戏及其官方简体中文翻译
- **脚本作者**：Vollch 制作的 Evolve-Automation 自动化脚本
- **opencode**：AI 编码代理工具，用于辅助完成本项目
- **DeepSeek**：AI 大语言模型，提供翻译与代码生成支持

## 开发与测试

```bash
# 语法检查
node --check evolve_automation_zh-CN.user.js

# 测试
node tools/test_all_keys.js    # 字典键完整性
node tools/test_full_dom.js    # 全界面渲染翻译覆盖率
node tools/test_modal.js       # 确认框/弹窗翻译
node tools/test_final.js       # 最终脚本功能
node tools/test_patterns.js    # 动态模板（PATTERNS 正则）翻译
```

修改完成后同步更新备份：`cp evolve_automation_zh-CN.user.js evolve_automation_zh-CN.user.js.bak`
