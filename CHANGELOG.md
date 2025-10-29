# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
