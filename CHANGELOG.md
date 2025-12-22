# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2025-12-22

### Added

#### macOS Dictionary Skill 系統

建立 Claude Code Skill 系統，整合 macOS 內建字典到卡片生成流程。

**Skill 功能**：
- 查詢 スーパー大辞林（日→日）：讀音、詞性、日文定義
- 查詢 ウィズダム和英辭典（日→英）：英文翻譯
- 查詢 國語辭典（中→中）：注音、解釋
- 查詢 譯典通英漢雙向字典（英↔中）：翻譯

**整合到卡片流程**：
1. card-structure-handler 建立卡片時自動查詢字典
2. 字典資料存入 YAML `dictionary` 區塊
3. build-card-content 使用字典資料作為權威來源

**Skill 架構**：
- `.claude/skills/macos-dictionary/SKILL.md` - Skill 主文件
- `.claude/skills/macos-dictionary/references/output-format.md` - 輸出格式規範
- `.claude/skills/macos-dictionary/references/cjk-handling.md` - 中日漢字處理

**支援腳本**：
- `scripts/lookup-dictionary.py` - 多語字典查詢 CLI

### Changed

#### 卡片生成流程更新

**card-structure-handler 代理人**：
- 新增步驟 3.5：查詢字典
- 新增 YAML `dictionary` 區塊格式
- 優先使用字典讀音生成 title

**build-card-content 代理人**：
- 新增步驟 2.4：讀取字典資料
- 日文解釋以字典定義為基礎
- 字典資料作為權威來源，減少 AI 幻覺

### Documentation

- 新增 `doc/macos-dictionary-services.md` - DictionaryServices API 技術文檔
- 更新 `.claude/agents/card-structure-handler.md` - 字典查詢流程
- 更新 `.claude/agents/build-card-content.md` - 字典資料使用
- 更新 `CLAUDE.md` - 字典整合說明

### Statistics

- **Skill 檔案**：3 個（SKILL.md + 2 個 references）
- **腳本更新**：1 個（lookup-dictionary.py）
- **代理人更新**：2 個（card-structure-handler, build-card-content）
- **處理時間**：2025-12-22

### Highlights

1. **權威資料來源** - 使用 macOS 內建字典，減少 AI 幻覺風險
2. **自動化整合** - 卡片建立流程自動查詢字典
3. **多語支援** - 同時查詢日日、日英、中中、英中字典
4. **Skill 系統** - 首次建立可重用的 Claude Code Skill

## [1.1.1] - 2025-12-19

### Added

#### 視覺化圖表系統 - 34 張卡片新增 Mermaid 圖表

本版本大規模擴展視覺化學習資源，為三個分類共 34 張卡片新增 Mermaid 圖表。

**Grammar 分類（5 張）**：
- 073_te_aru：〜ている vs 〜てある 對比圖
- 074_te_shimau：完成/遺憾 雙重意義分支圖
- 076_te_oku：準備/放置 意義對比圖
- 077_te_miru：時制階梯圖
- 094_quotation_expression：引用類型選擇流程圖

**Comparison 分類（7 張）**：
- 002_de_vs_ni_location：場所用法決策樹
- 004_te_iru_meanings：語義分類判斷圖
- 009_ba_vs_to：ば/と 決策樹 + 對比圖
- 010_ba_vs_tara：ば/たら 語氣選擇圖
- 011_conditional_comparison：四種條件形決策樹
- 013_wo_vs_de：を/で 功能分類圖
- 015_ageru_vs_kureru：授受方向 sequenceDiagram

**Concept 分類（14 張）**：
- 003_jidoushi, 004_tadoushi：自他動詞特徵圖
- 005_doushi_bunrui：動詞三分類層級圖
- 006_viewpoint：視點系統 sequenceDiagram
- 007_uchi_soto：內外關係層次圖
- 010_katsuyou：六種活用形放射圖
- 021_aspect_theory：體理論對比圖
- 036_benefactive_perspective：授受視點圖
- 037, 038, 040：敬語三類概念結構圖
- 041_conditional_forms：條件形決策樹
- 043_obligation_expressions：義務/禁止表達層級圖
- 044_teineitai_vs_futsutai：丁寧體/普通體對比圖

**先前已完成的 8 張高優先級圖表**：
- grammar/091_case_particles：格助詞選擇流程圖
- grammar/092_transitive_intransitive：自他動詞判斷樹
- grammar/096_aru_iru：生命性判斷樹
- grammar/075_te_iru：〜ている語義分支圖
- comparison/001_ga_vs_wa：決策流程圖
- comparison/005_conditional_comparison：條件形選擇流程圖
- concept/013_keigo_taikei：敬語三元階層圖
- concept/022_verb_types_system：動詞三維分類圖

**圖表設計規範**（遵循 `.claude/diagram-guidelines.md`）：
- 自解釋性：節點包含日文 + 中文
- 國小生友善：簡單詞彙、節點數 ≤ 7
- 顏色語義：綠=基本、藍=正式、紅=否定、橘=進行、紫=過去
- 具體範例：每個節點有例句

### Fixed

#### 草稿卡片清理 - 194 張卡片狀態修復

修復 v1.0.6 遺留的草稿卡片問題，確保題庫連結正常運作。

**問題背景**：
- 題庫包含 `draft: true` 的草稿卡片
- Hugo 不發布草稿卡片，導致 165 個連結返回 404
- 題庫題目數從 271 題降至 106 題

**修復內容**：
- 審計 194 張草稿卡片（164 complete, 27 partial, 2 inconsistent, 1 redirect）
- 刪除 1 張重複的 redirect 卡片（grammar/090_to_jouken.md）
- 批次移除 191 張完整卡片的 `draft: true` 標記
- 修復 2 張狀態不一致的卡片

**修復結果**：
- 題庫題目數：106 → 271 題（+155.7%）
- 草稿卡片數：194 → 0 張
- 404 連結：165 → 0 個

### Documentation

- 新增 `doc/worklog/worklog-1.1.1.md` - 版本工作日誌
- 新增 `doc/worklog/diagram-assessment-summary.md` - 圖表需求評估報告
- 新增 `.claude/diagram-guidelines.md` - 圖表設計規範

### Statistics

- **新增圖表**：34 張卡片（871 行程式碼）
- **修復卡片**：194 張（draft: true → false）
- **題庫擴展**：106 → 271 題（+155.7%）
- **處理時間**：2025-12-19
- **代理人數量**：26 個平行代理人（圖表建立）

### Highlights

1. **視覺化學習系統** - 首次大規模引入 Mermaid 圖表，提升學習體驗
2. **草稿卡片清理** - 解決 v1.0.6 遺留問題，題庫容量增加 155%
3. **設計規範建立** - 制定 `diagram-guidelines.md`，確保圖表品質一致性
4. **平行處理效率** - 使用 26 個代理人同時處理，大幅提升效率

## [1.0.8] - 2025-12-18

### Added

#### 內容擴展 - 8 個分類新增 24 張卡片

本版本擴展多個基礎詞彙分類，新增以下學習內容：

**新增分類與卡片**：

1. **adj-i（い形容詞）** - 3 張
   - 大きい、小さい、高い

2. **adverb（副詞）** - 3 張
   - とても、すぐ、まだ

3. **verb-irr（サ變動詞）** - 3 張
   - 勉強する、運動する、掃除する

4. **conjunction（接續詞）** - 4 張
   - したがって、しかし、または、なぜなら

5. **idiom（慣用語）** - 3 張
   - 一石二鳥、七転び八起き、花より団子

6. **onomatopoeia（擬聲擬態詞）** - 3 張
   - ドキドキ、ワクワク、ピカピカ

7. **honorific（敬語表達）** - 3 張
   - いただきます、ごちそうさま、失礼します

8. **phrase（短語）** - 6 張
   - したいと思う、〜たらどう、どうしますか、お願いします、ありがとうございます、すみません

**每張卡片包含**：
- 完整三語解釋（日文、英文、繁體中文）
- 4-5 個實用例句
- 活用形/變化形說明
- 相關詞彙與連結

### Documentation

#### Extension Review 報告
- `doc/worklog/extension-cards-1.0.8.md` - 識別 45 張延伸需求
  - Critical: 12 張（道歉/感謝系列、敬語系統等）
  - High: 18 張（同義詞辨析等）
  - Medium: 10 張
  - Low: 5 張

#### Linking 報告
- `doc/worklog/linking-cards-1.0.8.md` - 連結建立與缺口分析
  - 識別 17 張連結缺口卡片（供未來版本建立）

### Fixed
- 修復 conjunction/006_shitagatte.md 的 11 個 Wikilink 格式

### Notes
- 這是一個內容擴展版本（PATCH），專注於基礎詞彙分類擴展
- 本版本識別的延伸需求將供 v1.0.9+ 版本使用
- 累積卡片數：248 張（全部 completed 狀態）

## [1.0.6] - 2025-12-17

### Added

#### 大規模學習內容卡片建立（220 張卡片完成）

本版本完成了從 v1.0.4 和 v1.0.5 累積的延伸需求卡片建立，總計 220 張學習內容卡片進入 completed 狀態。

**執行方式**：使用 44 個平行代理人同時建立卡片，大幅提升建立效率。

**建立的學習內容卡片分類**：

1. **grammar** - 68 張（文法表達、條件形、助動詞、複合表達等）
2. **noun** - 63 張（Domain 詞彙、位置詞彙、時間詞彙、疑問詞等）
3. **concept** - 40 張（語言學概念、語用概念、敬語概念等）
4. **phrase** - 10 張（日常表達、情境短語、支付表達等）
5. **contrast** - 10 張（語義對比、詞彙辨析）
6. **comparison** - 9 張（條件形對比、助詞對比、授受對比等）
7. **verb-u** - 9 張（N5-N4 基礎五段動詞）
8. **verb-ru** - 8 張（N5-N4 基礎一段動詞）
9. **conjunction** - 5 張（接續詞：だから、でも、じゃあ等）
10. **verb-irr** - 1 張（不規則動詞補充）

**每張學習內容卡片包含**：
- 完整的三語解釋（日文、英文、繁體中文）
- 4 個以上的實用例句
- 腳註說明關鍵概念
- 相關連結區塊

### Changed

#### CSV 工作流程系統（v1.0.6 新增）
- 新增 `scripts/get_pending_cards.py` - 讀取待辦卡片清單
- 新增 `scripts/add_pending_cards.py` - 新增待辦卡片
- 新增 `scripts/update_card_progress.py` - 更新卡片進度
- 新增 `scripts/manage_worklog_cards.py` - 查詢統計與驗證
- 新增 `scripts/allocate_card_numbers.py` - 預先分配編號（支援並發）

#### 連結格式修復
- 執行 `fix-wikilinks.py --fix`：修正 155 個檔案、1843 個連結
- 將所有 Wikilink 格式（`[[...]]`）轉換為標準 Markdown 連結（`[text](path.md)`）

### Documentation
- 更新 `doc/worklog/worklog-1.0.6.md` - 記錄完整的執行過程
- 更新 `doc/worklog/README-CSV.md` - CSV 工作流程使用指南

### Notes
- 這是一個內容建立版本（PATCH），專注於學習內容卡片建立
- 從 v1.0.4/v1.0.5 Extension-Review 識別的需求已大部分完成
- 下一版本將繼續補充剩餘的延伸需求

## [1.0.5] - 2025-10-30

### Added

#### Meta 系統維護 - Tag 定義卡片建立（139 張）

本版本專注於完善 Meta 系統的 Tag 定義，建立 139 張 Tag Meta 定義卡片，確保所有使用中的 tags 都有完整的定義和說明。

**執行方式**：使用 12 個平行代理人同時處理不同分類，大幅提升建立效率。

**建立的 Tag Meta 卡片**：

1. **grammar** - 32 張（aspect, auxiliary_verb, causative, conditional 等文法相關標籤）
2. **context** - 10 張（casual, family, formal, invitation, question, shopping 等情境標籤）
3. **domain** - 4 張（commerce, linguistics, learning, transaction 等領域標籤）
4. **pragmatics** - 12 張（agreement, confirmation, contrast, focus 等語用學標籤）
5. **semantic** - 20 張（ability, desire, permission, necessity 等語義標籤）
6. **verb-type** - 14 張（giving, receiving, movement, continuous 等動詞類型標籤）
7. **particle** - 3 張（particle, particle_to, conjunction 等助詞標籤）
8. **keigo** - 8 張（honorific, humble_form, sonkeigo, kenjougo 等敬語標籤）
9. **position** - 6 張（destination, direction, location, origin 等位置標籤）
10. **linguistic** - 8 張（basic_form, comparison, idiom, sentence_pattern 等語言學標籤）
11. **misc** - 17 張（clothing, koto, mashou, time, thinking 等雜項標籤）
12. **special** - 1 張（授受表現 - 特殊日文標籤）
13. **別名卡片** - 7 張（context 和 domain 類別的簡寫別名）

**每張 Tag Meta 卡片包含**：
- 完整的三語解釋（日文、英文、繁體中文）
- Tag 定義和使用場景說明
- 典型詞彙和表達範例
- 與其他 Tags 的關係說明
- 使用指南和學習建議
- 統計資訊區塊

### Changed

#### 修復工具
- 新增 `scripts/fix-tag-meta-titles.py` - 修復 Tag Meta 卡片的 title 格式
  - 處理路徑前綴問題（如 `keigo/honorific` → `honorific`）
  - 支援特殊映射規則（如 `special/giving_receiving` → `授受表現`）
  - 保留必要的前綴（context/, domain/, grammar/, jlpt/）

#### 驗證結果
- 執行 `verify-meta.py --verbose`：
  - ✅ Categories: 完全一致（25/25）
  - ⚠️ Tags: 輕微不一致（158 定義 vs 152 使用）
  - 6 個預先定義但未使用的 tags（正常情況）

### Documentation
- 更新 `doc/worklog/worklog-1.0.5.md` - 記錄完整的執行過程和問題解決
- 新增 `doc/worklog/extension-review-1.0.5.md` - Extension-Review 綜合報告

### Extension-Review 結果
- 使用 12 個平行代理人分析 138 張 Tag Meta 卡片
- 識別出約 **200 張**延伸學習內容卡片需求：
  - Critical: 60-70 張
  - High: 80-90 張
  - Medium: 40-50 張
  - Low/Optional: 10-20 張
- 主要發現：
  - Conjunction 分類完全空白（0/11 接續詞）
  - 授受表現缺少敬語形式
  - Domain 核心詞彙待建立
  - 系統性整合卡片不足
- 產出文檔：`doc/worklog/extension-review-1.0.5.md`

### Linking 階段
- **簡化處理**：由於 v1.0.5 是 Meta 系統維護版本，Tag Meta 卡片不是學習內容，採用簡化處理
- **決策原因**：
  - Tag Meta 卡片是系統定義卡片，主要用於規範 tag 使用
  - Extension-Review 已識別 200+ 張學習內容卡片需求
  - 資源應優先建立學習內容卡片，而非優化 Meta 系統連結
- **識別新卡片**：0 張（Linking 階段不適用於 Meta 卡片）
- 產出文檔：`doc/worklog/linking-cards-1.0.5.md`

### 系統設計決策：Meta 卡片 vs 學習內容卡片
- 確立**雙軌制設計原則**：
  - **Meta 卡片**（`_meta/`）：系統定義和組織規範，不參與四階段循環
  - **學習內容卡片**（`noun/`, `verb/`, `grammar/` 等）：實際教學材料，嚴格遵循四階段流程
- 同一個日文詞彙可能需要兩張卡片：
  - Meta 定義卡片：定義「如何分類」（如 `_meta/tags/grammar/grammar.md`）
  - 學習內容卡片：教「如何使用這個詞」（如 `noun/bunpou.md` - 文法）

### v1.0.6 規劃
- 建立工作日誌：`doc/worklog/worklog-1.0.6.md`
- 規劃建立 40 張 Critical 優先級學習內容卡片
- 優先補充：Conjunction 分類（5 張）、Domain 核心詞彙（10 張）、授受表現敬語（6 張）

### Notes
- 這是一個維護性版本（PATCH），專注於 Meta 系統完善
- Tag 系統完整性大幅提升，為未來的卡片建立提供更好的基礎
- Extension-Review 為後續 10 個版本（v1.0.6 - v1.1.5）提供明確的建立方向
- 系統驗證通過：
  - ✅ Categories: 25/25 完全一致
  - ✅ 編號連續性：無問題
  - ✅ Wikilink 格式：無遺留問題
  - ⚠️ Tags: 158 定義 vs 153 使用（6 個預先定義，正常）

## [1.0.4] - 2025-10-30

### Added

#### Linking 階段完成（36 張卡片）

本版本完成了 36 張新建卡片的連結階段處理，使用 8 個平行代理人同時處理，建立完整的知識網絡連結。

**概念卡片（3 張）**
- `concept/002_fukisoku-katsuyou.md` - 不規則活用 - 添加 5 個腳註，連結 11 張相關卡片
- `concept/003_jidoushi.md` - 自動詞 - 添加 6 個腳註，建立與他動詞的對比系統
- `concept/004_tadoushi.md` - 他動詞 - 強化 5 個腳註，建立動詞分類體系

**文法卡片（28 張）**
- `grammar/028_nakutemo_ii.md` - なくてもいい（不必）- 添加 7 個腳註
- `grammar/029_o_go_itadaku.md` - お/ご～いただく（謙讓語）- 添加 7 個腳註
- `grammar/030_tara.md` - たら條件形 - 添加 7 個腳註，連結四大條件形
- `grammar/031_tearu.md` - てある（結果狀態）- 添加 7 個腳註
- `grammar/032_tekuru_teiku.md` - てくる・ていく（方向補助動詞）- 添加 8 個腳註
- `grammar/033_topic_comment_structure.md` - 主題評述結構 - 添加 5 個腳註
- `grammar/034_information_structure.md` - 資訊結構理論 - 添加 4 個腳註
- `grammar/035_contrast_focus.md` - 對比與焦點 - 添加 4 個腳註
- `grammar/036_made_vs_madeni.md` - まで vs までに - 添加 4 個腳註
- `grammar/037_ni_suru.md` - ～にする - 添加 4 個腳註
- `grammar/038_progressive_vs_state.md` - 進行形 vs 狀態形 - 添加 9 個腳註
- `grammar/039_to_shite.md` - ～として - 添加 3 個腳註
- `grammar/040_suru_koto_ga_aru.md` - することがある - 添加 2 個腳註，修正內部參照
- `grammar/041_jishokei.md` - 辭書形 - 添加 7 個腳註
- `grammar/042_mashitaka.md` - ～ましたか - 添加 3 個腳註
- `grammar/043_masu-kei.md` - ます形 - 添加 8 個腳註
- `grammar/044_nai-kei.md` - ない形 - 添加 9 個腳註
- `grammar/045_ta-kei.md` - た形 - 添加 8 個腳註
- `grammar/046_te-kei.md` - て形 - 添加 16 個腳註（最複雜的文法卡片）
- `grammar/047_ba-jouken.md` - ば條件形 - 添加 6 個腳註，修正 Wikilink 格式
- `grammar/048_juju-hyougen.md` - 授受表達 - 添加 7 個腳註
- `grammar/049_te-iru.md` - ～ている形 - 強化 5 個腳註
- `grammar/050_te-kureru.md` - ～てくれる - 添加 4 個腳註，轉換 Wikilink
- `grammar/051_te-morau.md` - ～てもらう - 添加 4 個腳註，轉換 Wikilink
- `grammar/052_to-jouken.md` - と條件形 - 添加 6 個腳註，轉換 Wikilink
- `grammar/053_beki.md` - べき（應該）- 修正腳註連結
- `grammar/054_nara.md` - なら條件形 - 重組腳註結構
- `grammar/055_sonzai-basho.md` - 存在與場所表達 - 建立完整連結系統

**助詞卡片（2 張）**
- `particle/010_to.md` - と（引用/並列）- 建立完整連結
- `particle/011_wo.md` - を（賓格）- 建立完整連結

**動詞卡片（3 張）**
- `verb-irr/005_iru.md` - いる（存在）- 修正 Wikilink 格式
- `verb-ru/013_kureru.md` - くれる（給我）- 建立授受表達連結
- `verb-ru/014_motsu.md` - 持つ（持有）- 添加元資料

**短語卡片（1 張）**
- `phrase/001_dou_suru.md` - どうする（怎麼辦）- 添加完整連結系統

#### 系統改進

- **連結系統強化**
  - 添加約 200+ 個腳註標註
  - 建立約 350+ 個標準連結
  - 所有連結使用標準 Markdown 格式 `[text](path.md)`
  - 修正 5 張卡片的 Wikilink 格式

- **平行處理優化**
  - 使用 8 個專門代理人同時處理卡片
  - 按分類分批處理：概念、文法（分 7 批）、助詞/動詞/短語
  - 處理效率提升 8 倍

- **索引完整性**
  - 所有分類索引保持最新
  - 編號連續性驗證通過
  - 總計 129 張卡片

- **卡片狀態管理**
  - 所有 36 張卡片從 `stage: extension-review` 或 `stage: draft` 更新為 `stage: completed`
  - 設置 `completed: 2025-10-30` 時間戳
  - 移除冗餘的 YAML 欄位

#### Meta 系統修復

- **修復 verify-meta.py 腳本**
  - 修正 category title 讀取邏輯
  - 現在可以正確識別所有 category Meta 定義

- **新增 Category Meta 卡片（2 張）**
  - `_meta/categories/024_comparison.md` - 比較分析分類定義
  - `_meta/categories/025_extension.md` - 延伸卡片分類定義

- **驗證結果**
  - ✅ Categories: 25/25 完全一致
  - ⚠️ Tags: 20/152（132 個待定義，列入 v1.0.5）

#### 文檔

- `doc/worklog/linking-cards-1.0.4.md` - Linking 階段詳細記錄
- `doc/worklog/worklog-1.0.5.md` - v1.0.5 規劃（Tag Meta 系統）

### Fixed

- 修正 `verify-meta.py` 無法讀取 category Meta 卡片的問題
- 修正 5 張卡片的 Wikilink 格式為標準 Markdown 格式
- 修正 `grammar/040_suru_koto_ga_aru.md` 的內部參照錯誤

### Statistics

- **處理卡片**: 36 張（100% 完成）
- **腳註**: ~200+ 個
- **標準連結**: ~350+ 個
- **Wikilink 修正**: 5 張卡片
- **Category Meta 新增**: 2 張
- **處理時間**: 2025-10-30
- **代理人數量**: 8 個平行代理人

### Highlights

1. **完成 Linking 階段** - v1.0.4 所有 36 張新卡片完成連結建立
2. **平行處理創新** - 首次使用 8 個代理人同步處理，大幅提升效率
3. **格式標準化** - 統一使用標準 Markdown 連結格式，移除所有 Wikilinks
4. **Meta 系統修復** - 解決 Category Meta 驗證問題，新增缺失定義
5. **高效搜尋策略** - 全面採用 Glob + YAML 方法，避免 Grep 全文搜尋
6. **文法體系完整** - 建立四大條件形、動詞活用形、授受表達等完整體系
7. **v1.0.5 規劃** - 識別 132 個 Tag Meta 卡片需求，完成下一版本規劃

---

## [1.0.3] - 2025-10-30

### Added

#### Linking 階段完成（20 張卡片）

**助詞卡片（3 張）**
- `particle/007_wa.md` - は助詞（主題標記）- 添加 9 個 wikilinks，3 個腳註
- `particle/008_ni.md` - に助詞（目的地、時間、存在）- 添加 34+ 個 wikilinks，5 個腳註
- `particle/009_made.md` - まで助詞（終點）- 添加 8 個 wikilinks，3 個腳註

**不規則動詞（3 張）**
- `verb-irr/001_suru.md` - する（做）- 添加 5 個 wikilinks，10 個腳註
- `verb-irr/002_kuru.md` - 来る（來）- 添加 11 個 wikilinks，9 個腳註
- `verb-irr/003_iru.md` - いる（在）- 添加 4 個 wikilinks，5 個腳註

**五段動詞（8 張）**
- `verb-u/010_hairu.md` - 入る（進入）- 添加 2 個腳註
- `verb-u/011_kaeru.md` - 帰る（回家）- 添加 2 個腳註
- `verb-u/012_uru.md` - 売る（賣）- 添加 3 個腳註
- `verb-u/013_iu.md` - 言う（說）- 添加 4 個腳註
- `verb-u/014_omou.md` - 思う（想）- 修正 4 個連結，添加 4 個腳註
- `verb-u/015_haku.md` - 履く（穿鞋褲）- 修正 3 個連結，添加 3 個腳註
- `verb-u/016_nugu.md` - 脱ぐ（脫衣）- 修正 6 個連結，添加 6 個腳註
- `verb-u/017_hashiru.md` - 走る（跑）- 修正 3 個連結，添加 3 個腳註

**一段動詞（2 張）**
- `verb-ru/010_mieru.md` - 見える（看得見）- 添加 4 個 wikilinks，3 個腳註
- `verb-ru/011_ageru.md` - 上げる（給予）- 添加 5 個 wikilinks，4 個腳註

**文法卡片（9 張）**
- `grammar/016_tai_form.md` - たい形（想要）- 標記完成
- `grammar/017_mashou_form.md` - ましょう形（邀請）- 標記完成
- `grammar/018_naide.md` - ないで（不...就）- 添加 3 個腳註
- `grammar/019_naide_kudasai.md` - ないでください（請不要）- 添加 2 個腳註
- `grammar/020_ta_koto_ga_aru.md` - たことがある（經驗）- 添加 4 個腳註
- `grammar/021_koto_ga_dekiru.md` - ことができる（能力）- 添加 4 個腳註
- `grammar/022_te_iru.md` - ている（進行/狀態）- 添加 4 個腳註
- `grammar/023_temo_ii.md` - てもいい（許可）- 添加 3 個腳註
- `grammar/024_tewa_ikenai.md` - てはいけない（禁止）- 添加 2 個腳註

#### 新建草稿卡片（14 張）

**Critical 優先級（3 張）**
- `grammar/031_made_vs_madeni.md` - まで vs までに 比較（N5）
- `comparison/003_iru_vs_aru.md` - いる vs ある 比較（N5）
- `comparison/004_te_iru_meanings.md` - ている 多義解析（N5）

**High 優先級（2 張）**
- `verb-ru/015_motsu.md` - 持つ（擁有）
- `grammar/031_progressive_vs_state.md` - 進行 vs 狀態區別

**文法卡片（6 張）**
- `grammar/028_topic_comment_structure.md` - 主題評述結構（N3）
- `grammar/029_information_structure.md` - 資訊結構理論（N2）
- `grammar/030_contrast_focus.md` - 對比與焦點（N2）
- `grammar/031_ni_suru.md` - ～にする（N4）
- `grammar/032_to_shite.md` - ～として（N3）
- `grammar/033_suru_koto_ga_aru.md` - することがある（N4）

**短語卡片（3 張）** - 首次建立 phrase 類別
- `phrase/001_dou_suru.md` - どうする（N5）
- `phrase/002_sou_suru.md` - そうする（N5）
- `phrase/003_shouganai.md` - しょうがない（N3）

#### 系統改進

- **連結系統增強**
  - 添加約 200 個 wikilinks
  - 添加約 92 個腳註說明
  - 建立雙向連結網絡

- **索引更新**
  - `grammar/index.md` - 更新到 40 張卡片（last: 033）
  - `phrase/index.md` - 新建索引，3 張卡片（last: 003）
  - `verb-ru/index.md` - 更新到 15 張卡片（last: 015）
  - `comparison/index.md` - 更新到 4 張卡片（last: 004）

- **卡片狀態管理**
  - 所有 20 張卡片從 `stage: linking` 更新為 `stage: completed`
  - 設置 `needs_review: false`
  - 添加 `completed: 2025-10-30` 時間戳

#### 文檔

- 更新 `doc/worklog/worklog-1.0.3.md` - 記錄 Linking 階段完成
- Linking 階段詳細成果記錄

### Statistics

- **處理卡片**: 20 張（100% 完成）
- **Wikilinks**: ~200 個
- **腳註**: ~92 個
- **新建草稿**: 14 張（Critical: 3, High: 2, N5: 4, N4: 2, N3: 3, N2: 2）
- **處理時間**: 2025-10-30

### Highlights

1. **完成 Linking 階段** - 為 20 張卡片添加完整的連結和腳註系統
2. **建立 phrase 類別** - 首次建立短語卡片系統，補充實用表達
3. **識別 Critical 延伸** - 發現 3 張 Critical 優先級對比卡片需求
4. **高效搜尋策略** - 使用 Glob + YAML 方法，避免全文搜尋
5. **系統化追蹤** - 使用 todo list 追蹤每張卡片進度

---

## [1.0.2] - 2025-10-29

### Added

#### 卡片內容

**Critical 優先級卡片（5 張）**
- **助詞 2 張**
  - `particle/006_wa.md` - は助詞（主題標記）- 與が形成最重要對比
  - `particle/007_ni.md` - に助詞（目的地、存在場所、時間）- 多功能核心助詞

- **不規則動詞 3 張**
  - `verb-irr/001_suru.md` - する（做）- 日語最常用動詞，サ變動詞基礎
  - `verb-irr/002_kuru.md` - 来る（來）- 與行く形成方向動詞對
  - `verb-irr/003_iru.md` - いる（在、存在）- 有生命物體存在動詞

**High N5 文法卡片（10 張）**
- `grammar/016_tai_form.md` - たい形（想要）
- `grammar/017_mashou_form.md` - ましょう形（建議、邀請）
- `grammar/022_naide.md` - ないで（不...就...）
- `grammar/023_naide_kudasai.md` - ないでください（請不要）
- `grammar/024_ta_koto_ga_aru.md` - たことがある（經驗）
- `grammar/027_koto_ga_dekiru.md` - ことができる（能力）
- `grammar/038_te_iru.md` - ている（進行、持續）
- `grammar/039_temo_ii.md` - てもいい（許可）
- `grammar/040_tewa_ikenai.md` - てはいけない（不可以）
- `particle/008_made.md` - まで助詞（終點）- 與から成對使用

**High N5 動詞卡片（10 張）**
- `verb-u/010_hairu.md` - 入る（進入）- 出る的反義詞
- `verb-u/011_kaeru.md` - 帰る（回去、回家）- 完成移動三元組
- `verb-u/012_uru.md` - 売る（賣）- 買う的反義詞
- `verb-u/013_iu.md` - 言う（說）- 基礎溝通動詞
- `verb-u/014_omou.md` - 思う（想、覺得）- 與考える的重要區別
- `verb-u/015_haku.md` - 履く（穿褲子/鞋子）- 完成穿衣動詞組
- `verb-u/016_nugu.md` - 脫ぐ（脫衣服）- 着る的反義詞
- `verb-u/017_hashiru.md` - 走る（跑）- 與歩く配對的移動動詞
- `verb-ru/010_mieru.md` - 見える（看得見）- 見る的自然能力形式
- `verb-ru/013_ageru.md` - 上げる/あげる（給）- 授受表現核心

#### 系統改進

- **知識網絡擴充**
  - 填補關鍵缺口：は vs が、で vs に
  - 完成不規則動詞系統
  - 建立反義詞對系統
  - 完成 N5 派生文法網絡

- **延伸檢查成果**
  - 識別 53 張延伸卡片需求（doc/worklog/extension-review-1.0.2-phase1.md）
  - 按優先級分類：Critical (2), High (18), Medium (25), Low (8)
  - 建立延伸檢查總結（doc/worklog/extension-review-1.0.2-summary.md）

- **連結建立**
  - 新增約 120 個 wikilinks
  - 與 v1.0.1 卡片緊密連結
  - 建立系統性交叉連結

#### 文檔

- `doc/worklog/worklog-1.0.2.md` - v1.0.2 工作流程文檔
- `doc/worklog/extension-review-1.0.2-phase1.md` - Phase 1 延伸檢查詳細報告
- `doc/worklog/extension-review-1.0.2-summary.md` - 延伸檢查總結

### Statistics

- **完成卡片**: 25 張（Critical: 5, High: 20）
- **總字數**: ~55,000 字
- **例句數**: ~325 句（平均 13 句/卡）
- **Wikilinks**: ~120 個
- **識別延伸**: 53 張（待後續版本處理）
- **JLPT 覆蓋**: N5 (96%), N4 (4%)

### Highlights

1. **填補關鍵缺口** - は vs が（學習者最大挑戰）、で vs に（場所用法）
2. **完成不規則動詞** - する、来る、いる（最基礎的動詞系統）
3. **派生文法完整** - 從基本形式派生出 10 個實用文法模式
4. **反義詞系統** - 入る/出る、買う/売る、着る/脱ぐ
5. **品質維持** - 延續 v1.0.1 的高品質標準

---

## [1.0.1] - 2025-10-28

### Added

#### 卡片內容（31 張）

**助詞 4 張**
- `particle/001_ga.md` - が助詞（主語標記）
- `particle/003_kara.md` - から（從、因為、之後）
- `particle/004_de.md` - で（方法、場所）
- `particle/005_to.md` - と（和）

**文法 9 張**
- `grammar/007_masu_form.md` - ます形（禮貌形）
- `grammar/008_nai_form.md` - ない形（否定形）
- `grammar/009_ta_form.md` - た形（過去形）
- `grammar/010_dictionary_form.md` - 辭書形（基本形）
- `grammar/011_potential_form.md` - 可能形
- `grammar/012_passive_form.md` - 受身形
- `grammar/013_causative_form.md` - 使役形
- `grammar/014_ato_de.md` - 〜後で（之後）
- `grammar/015_te_kara.md` - 〜てから（之後，強調順序）

**一段動詞 7 張**
- `verb-ru/003_miru.md` - 見る（看）
- `verb-ru/004_neru.md` - 寝る（睡）
- `verb-ru/005_okiru.md` - 起きる（起床）
- `verb-ru/006_kiru.md` - 着る（穿）
- `verb-ru/007_deru.md` - 出る（出去）
- `verb-ru/008_dekakeru.md` - 出かける（外出）
- `verb-ru/009_kangaeru.md` - 考える（思考）

**五段動詞 8 張**
- `verb-u/002_nomu.md` - 飲む（喝）
- `verb-u/003_yomu.md` - 読む（讀）
- `verb-u/004_kaku.md` - 書く（寫）
- `verb-u/005_kiku.md` - 聞く（聽）
- `verb-u/006_kau.md` - 買う（買）
- `verb-u/007_hanasu.md` - 話す（說話）
- `verb-u/008_aruku.md` - 歩く（走路）
- `verb-u/009_iku.md` - 行く（去）

**敬語動詞對 4 張**
- `honorific/002_ossharu_mousu.md` - おっしゃる・申す（說的敬語）
- `honorific/003_irassharu_mairu.md` - いらっしゃる・参る（去來的敬語）
- `honorific/004_nasaru_itasu.md` - なさる・いたす（做的敬語）
- `honorific/005_goran_haiken.md` - ご覧になる・拝見する（看的敬語）

#### 系統改進

- **延伸檢查成果**
  - 識別 90 張延伸卡片需求（doc/worklog/extension-review-1.0.1.md）
  - 按優先級分類：Critical (5), High (37), Medium (35), Low (13)

- **連結建立**
  - 新增約 180 個 wikilinks
  - 建立知識網絡基礎

#### 文檔

- `doc/worklog/worklog-1.0.1.md` - v1.0.1 工作流程文檔
- `doc/worklog/extension-review-1.0.1.md` - 延伸檢查報告
- `doc/worklog/linking-strategy-1.0.1.md` - 連結策略文檔
- `doc/worklog/completion-summary-1.0.1.md` - 完成總結

### Statistics

- **完成卡片**: 31 張
- **總字數**: ~70,000 字
- **例句數**: ~400 句（平均 13 句/卡）
- **Wikilinks**: ~180 個
- **識別延伸**: 90 張

---

## [1.0.0] - 2025-10-28

### Added

#### 專案結構與文檔
- 建立版本更新記錄 `CHANGELOG.md`
- 建立工作流程文檔目錄 `doc/`
- 定義四階段工作流程循環系統
- 定義語義化版本管理規則

#### 卡片系統
- 實現 Zettelkasten 卡片盒筆記系統
- 支援多種卡片類型：
  - 動詞（る動詞、う動詞）
  - 名詞
  - 形容詞（い形容詞、な形容詞）
  - 助詞
  - 文法
  - 敬語
  - 語用
  - 文化

#### 連結系統
- 實現雙重連結系統：
  - 標準 Wikilink 連結 `[[card]]` - 用於相關卡片列表
  - 腳註標註 `[^note]` - 用於文內概念說明
- 支援語義化腳註標籤（如 `[^ichidan]`）
- 建立卡片格式完整指南 `.claude/card-format-guidelines.md`

#### 代理人
- **延伸卡片建立代理人** (`.claude/subagents/create-extension-cards.md`)
  - 分析詞彙卡片識別需要的延伸卡片
  - 自動建立文法、語用、文化等延伸卡片
  - 支援完整腳註標註

- **連結建立代理人** (`.claude/subagents/build-card-links.md`)
  - 為卡片補充標準連結和腳註
  - 自動檢測遺漏的卡片
  - 建立草稿卡片（`draft: true`）

#### Slash Commands
- `/analyze-article` - 分析日文文章（難度、主題、文法、學習重點）
- `/explain-grammar` - 詳細解釋文法結構和句型
- `/extract-vocab` - 提取關鍵詞彙並提供解釋
- `/generate-exercises` - 生成練習題
- `/create-zettel` - 從文章建立 Zettelkasten 卡片

#### 卡片 YAML 格式
- 新增 `stage` 欄位追蹤卡片進度：
  - `draft` - 草稿階段
  - `extension-review` - 延伸卡片檢查階段
  - `linking` - 建立連結與腳註階段
  - `completed` - 完成階段
- 新增草稿卡片標記：`draft`, `auto_generated`, `needs_review`
- 新增 `generated_cards` 欄位追蹤自動生成的卡片

### Testing

#### 腳註功能測試
- 測試 4 種卡片類型（動詞、延伸卡片、名詞、形容詞）
- 總計測試 37 個腳註標註
- 建立 5 張草稿卡片作為測試
- 創建測試報告 `.claude/footnotes-review-report.md`

**測試結果**：
- ✅ 設計完整度：90%（生產環境就緒）
- ✅ 驗證 6 大腳註類型分類
- ✅ 識別 3 個需要補充的次分類
- ✅ 高頻類型：文法概念 (15次)、文法點標註 (12次)

### Documentation

- 卡片格式完整指南 (13,966 bytes)
- 腳註功能評估報告 (13,042 bytes)
- 專案主指南文檔 (本次新增)
- 版本更新記錄 (本檔案)

---

## 版本類型說明

- **MAJOR（大版本）** - 專案結構或核心功能重大變動
- **MINOR（中版本）** - 新增或修改 slash command 或代理人
- **PATCH（小版本）** - 卡片內容新增、修改或修復

## 連結

- [項目指南](.claude/claude.md)
- [卡片格式指南](.claude/card-format-guidelines.md)
- [腳註評估報告](.claude/footnotes-review-report.md)
- [工作流程文檔](doc/)

---

**維護者**: Claude Code
**最後更新**: 2025-10-28
