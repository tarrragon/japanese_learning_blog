# 工作日誌 - Version 1.0.6

**版本號**：1.0.6 (PATCH)
**開始日期**：待定
**目標**：建立 v1.0.5 Extension-Review 識別的 Critical 優先級卡片

---

## 📌 版本目標聲明

**核心目標**：建立 v1.0.5 Extension-Review 階段識別的 **Critical 優先級學習內容卡片**，補充系統中最緊迫的缺口。

**版本類型**：PATCH 版本（新增學習內容卡片）

**特別說明**：
- 本版本是 v1.0.5 的延續，處理 Tag Meta Extension-Review 識別的高優先級需求
- 專注於 **Critical 優先級**卡片，確保系統基礎完整
- 預計建立 **35-45 張**學習內容卡片

---

## 🎯 卡片來源

本版本的卡片來源於：

### 主要來源
- **v1.0.5 Extension-Review**：`doc/worklog/extension-review-1.0.5.md`
  - 總需求：約 200 張學習內容卡片
  - 本版本選擇：Critical 優先級（35-45 張）

### 次要來源
- **v1.0.4 Extension-Review**：`doc/worklog/extension-cards-1.0.4.md`（如有重疊，優先使用 v1.0.5 的定義）

---

## 📋 Phase 1 卡片清單（Draft 階段）

本版本計劃建立 **40 張** Critical 優先級卡片，按分類組織如下：

### 1. Conjunction（接續詞）- **Critical Priority** - 5 張

> ⚠️ **緊急**：Conjunction 分類目前**完全空白**（0/11），急需建立基礎接續詞卡片

| # | 卡片路徑 | 日文 | 中文 | JLPT | 優先級 | 備註 |
|---|---------|------|------|------|--------|------|
| 1 | `conjunction/001_dakara.md` | だから | 所以 | N5 | Critical | 因果接續詞 |
| 2 | `conjunction/002_demo.md` | でも | 但是 | N5 | Critical | 逆接接續詞 |
| 3 | `conjunction/003_sorede.md` | それで | 因此 | N4 | Critical | 順接接續詞 |
| 4 | `conjunction/004_jaa.md` | じゃあ | 那麼 | N5 | Critical | 轉折接續詞 |
| 5 | `conjunction/005_soshite.md` | そして | 然後 | N5 | Critical | 並列接續詞 |

**完成標準**：
- 每張卡片包含完整的三語解釋
- 至少 2-3 個實際例句
- 說明接續詞的使用情境和語氣差異

---

### 2. Domain - Learning & Linguistics（學習與語言學領域）- 10 張

> 💡 **核心詞彙**：這些是語言學習領域的基礎詞彙，對學習者極為重要

| # | 卡片路徑 | 日文 | 中文 | JLPT | 優先級 | 備註 |
|---|---------|------|------|------|--------|------|
| 6 | `noun/gakushuu.md` | 学習（がくしゅう） | 學習 | N4 | Critical | 核心概念 |
| 7 | `noun/bunpou.md` | 文法（ぶんぽう） | 文法 | N4 | Critical | 語言學術語 |
| 8 | `noun/goi.md` | 語彙（ごい） | 詞彙 | N3 | Critical | 語言學術語 |
| 9 | `noun/hatsuon.md` | 発音（はつおん） | 發音 | N4 | Critical | 語言學習基礎 |
| 10 | `verb-ru/oboeru.md` | 覚える（おぼえる） | 記住 | N5 | Critical | 學習基本動詞 |
| 11 | `verb-u/manabu.md` | 学ぶ（まなぶ） | 學習 | N5 | Critical | 學習基本動詞 |

**對比卡片**：
| # | 卡片路徑 | 主題 | JLPT | 優先級 | 備註 |
|---|---------|------|------|--------|------|
| 12 | `contrast/gakushuu_vs_benkyou.md` | 学習 vs 勉強 | N4 | Critical | 區分兩種「學習」 |
| 13 | `contrast/goi_vs_tango.md` | 語彙 vs 単語 | N3 | Critical | 詞彙術語辨析 |
| 14 | `contrast/oboeru_vs_manabu.md` | 覚える vs 学ぶ | N5 | Critical | 學習動詞對比 |

**概念卡片**：
| # | 卡片路徑 | 主題 | JLPT | 優先級 | 備註 |
|---|---------|------|------|--------|------|
| 15 | `concept/language_acquisition.md` | 語言習得 | N2 | Important | 學習理論概念 |

---

### 3. Domain - Commerce（商業領域）- 4 張

| # | 卡片路徑 | 日文 | 中文 | JLPT | 優先級 | 備註 |
|---|---------|------|------|------|--------|------|
| 16 | `noun/shougyou.md` | 商業（しょうぎょう） | 商業 | N3 | Critical | 商業基礎詞彙 |
| 17 | `noun/torihiki.md` | 取引（とりひき） | 交易 | N3 | Critical | 商業核心詞彙 |
| 18 | `noun/keiyaku.md` | 契約（けいやく） | 契約 | N3 | Critical | 商業法律詞彙 |
| 19 | `noun/kokyaku.md` | 顧客（こきゃく） | 顧客 | N3 | Critical | 商業人員詞彙 |

---

### 4. Verb-Type - 授受表現敬語形式（Critical）- 3 張

> ❌ **系統缺口**：授受表現基本形都已存在，但缺少敬語形式

| # | 卡片路徑 | 日文 | 中文 | JLPT | 優先級 | 備註 |
|---|---------|------|------|------|--------|------|
| 20 | `verb-ru/sashiageru.md` | 差し上げる（さしあげる） | 給予（謙讓語） | N3 | Critical | あげる謙讓語 |
| 21 | `verb-ru/kudasaru.md` | 下さる（くださる） | 給予（尊敬語） | N3 | Critical | くれる尊敬語 |
| 22 | `verb-ru/itadaku.md` | 頂く（いただく） | 收到（謙讓語） | N3 | Critical | もらう謙讓語 |

**相關文法卡片**：
| # | 卡片路徑 | 主題 | JLPT | 優先級 | 備註 |
|---|---------|------|------|--------|------|
| 23 | `grammar/te-ageru.md` | 〜てあげる | N4 | Critical | 複合授受表達 |
| 24 | `grammar/te-itadaku.md` | 〜ていただく | N3 | Critical | 謙讓複合表達 |
| 25 | `grammar/te-kudasaru.md` | 〜てくださる | N3 | Critical | 尊敬複合表達 |

---

### 5. Verb-Type - 其他 Critical 動詞 - 6 張

| # | 卡片路徑 | 日文 | 中文 | JLPT | 優先級 | 備註 |
|---|---------|------|------|------|--------|------|
| 26 | `verb-ru/ireru.md` | 入れる（いれる） | 放入 | N5 | Critical | 基本動作動詞 |
| 27 | `verb-ru/tsuzukeru.md` | 続ける（つづける） | 繼續 | N4 | Critical | 持續動作 |
| 28 | `verb-u/matsu.md` | 待つ（まつ） | 等待 | N5 | Critical | 基本動作動詞 |
| 29 | `verb-u/toru.md` | 取る（とる） | 拿取 | N5 | Critical | 基本動作動詞 |
| 30 | `verb-u/kesu.md` | 消す（けす） | 消除 | N5 | Critical | 基本動作動詞 |
| 31 | `verb-u/modoru.md` | 戻る（もどる） | 返回 | N4 | Critical | 移動動詞 |

---

### 6. Position Tags（位置語義）- 5 張

> ⚠️ **系統缺口**：Position tags 定義完整但缺乏實體卡片支撐

| # | 卡片路徑 | 日文 | 中文 | JLPT | 優先級 | 備註 |
|---|---------|------|------|------|--------|------|
| 32 | `noun/houkou.md` | 方向（ほうこう） | 方向 | N4 | Critical | 位置核心概念 |
| 33 | `noun/basho.md` | 場所（ばしょ） | 場所 | N5 | Critical | 位置核心概念 |
| 34 | `noun/shuuten.md` | 終点（しゅうてん） | 終點 | N3 | Critical | 終點概念 |
| 35 | `verb-u/tsuku.md` | 着く（つく） | 到達 | N5 | Critical | 到達動詞 |

**文法對比卡片**：
| # | 卡片路徑 | 主題 | JLPT | 優先級 | 備註 |
|---|---------|------|------|--------|------|
| 36 | `grammar/e_vs_ni_vs_made.md` | へ vs に vs まで | N5-N4 | Critical | 目的地助詞對比 |

---

### 7. Context Tags - 實用表達（Critical）- 4 張

> 💬 **高頻實用**：日常生活必備的實用表達

| # | 卡片路徑 | 主題 | JLPT | 優先級 | 備註 |
|---|---------|------|------|------|--------|
| 37 | `phrase/greetings_daily.md` | 日常打招呼表達 | N5 | Critical | 日常必備 |
| 38 | `phrase/dining_expressions.md` | 用餐相關表達 | N5 | Critical | 日常必備 |
| 39 | `phrase/shopping_basics.md` | 購物基本表達 | N5 | Critical | 日常必備 |
| 40 | `phrase/invitation_expressions.md` | 邀約表達 | N4 | Critical | 社交必備 |

---

## 📊 統計摘要

### 按分類統計

| 分類 | 卡片數 | 百分比 |
|------|--------|--------|
| conjunction | 5 | 12.5% |
| noun | 14 | 35.0% |
| verb-ru | 5 | 12.5% |
| verb-u | 6 | 15.0% |
| grammar | 4 | 10.0% |
| contrast | 3 | 7.5% |
| phrase | 4 | 10.0% |
| concept | 1 | 2.5% |
| **總計** | **40** | **100%** |

### 按 JLPT 等級統計

| JLPT | 卡片數 | 百分比 |
|------|--------|--------|
| N5 | 15 | 37.5% |
| N4 | 11 | 27.5% |
| N3 | 12 | 30.0% |
| N2 | 1 | 2.5% |
| 複合等級 | 1 | 2.5% |
| **總計** | **40** | **100%** |

### 按領域統計

| 領域 | 卡片數 | 百分比 |
|------|--------|--------|
| 學習與語言學 | 10 | 25.0% |
| 商業 | 4 | 10.0% |
| 授受表現 | 6 | 15.0% |
| 位置語義 | 5 | 12.5% |
| 實用表達 | 4 | 10.0% |
| 接續詞 | 5 | 12.5% |
| 基本動詞 | 6 | 15.0% |
| **總計** | **40** | **100%** |

---

## 🎯 版本目標與完成標準

### 必須達成

1. ✅ 建立所有 40 張 Critical 卡片的草稿（stage: draft）
2. ✅ 每張卡片包含完整的 YAML frontmatter
3. ✅ 每張卡片包含三語解釋（日文、英文、中文）
4. ✅ 每張卡片至少包含 2-3 個例句
5. ✅ 所有卡片完成 Draft → Extension-Review → Linking → Completed 四階段
6. ✅ 補充 Conjunction 分類（從 0 張 → 5 張）

### 建議達成

1. 為授受表現卡片統一加入 `special/giving_receiving` tag
2. 為位置相關卡片加入適當的 position tags
3. 建立卡片間的連結關係
4. 更新相關索引檔案

---

## 🔄 工作流程規劃

### Phase 1: Draft（草稿階段）

**目標**：建立所有 40 張卡片的完整內容

**執行策略**：
- 按分類批次處理（每批 5-8 張）
- 優先處理 Conjunction（系統完全空白）
- 使用 `/create-zettel` 代理人協助建立

**預計時間**：3-5 天

### Phase 2: Extension-Review（延伸檢查階段）

**目標**：檢查 40 張卡片是否需要延伸

**執行策略**：
- 逐張檢查，記錄延伸需求
- 產出 `extension-cards-1.0.6.md`
- 延伸需求將成為 v1.0.7+ 的卡片來源

**預計時間**：1-2 天

### Phase 3: Linking（連結階段）

**目標**：為所有卡片建立連結和腳註

**執行策略**：
- 使用 `build-card-links` 子代理人
- 補充標準連結和腳註
- 識別 Critical 遺漏卡片並立即建立草稿

**預計時間**：2-3 天

### Phase 4: Completed（完成階段）

**目標**：確認所有卡片完成，更新 CHANGELOG

**執行策略**：
- 執行版本完成檢查腳本
- 更新 CHANGELOG.md
- 合併到 main 分支

**預計時間**：0.5-1 天

---

## 📝 特別注意事項

### 1. Conjunction 分類的建立

- ⚠️ 這是第一次建立 conjunction 分類的卡片
- 需要建立 `zettelkasten/conjunction/index.md`
- 需要更新 `_meta/categories/010_conjunction.md`

### 2. 授受表現系統的完整性

- 建立敬語形式後，授受表現系統將更加完整
- 需要為所有授受相關卡片加入 `special/giving_receiving` tag
- 建議建立授受表現系統的總覽連結

### 3. 與 v1.0.4 Extension-Review 的重疊

如果發現卡片需求重疊：
- 優先使用 v1.0.5 Extension-Review 的定義（更新、更完整）
- 在 worklog 中註明來源
- 避免重複建立

### 4. 卡片編號管理

- 使用 `uv run scripts/get-next-number.py <category>` 取得編號
- Conjunction 從 001 開始
- 其他分類延續現有編號

---

## 🔗 相關文檔

### 來源文檔
- `doc/worklog/extension-review-1.0.5.md` - v1.0.5 Extension-Review 報告
- `doc/worklog/extension-cards-1.0.4.md` - v1.0.4 延伸卡片記錄（次要來源）

### 規範文檔
- `.claude/card-format-guidelines.md` - 卡片格式規範
- `.claude/version-cycle-checklist.md` - 版本循環檢查清單
- `CLAUDE.md` - 專案說明文件

### 工具腳本
- `scripts/get-next-number.py` - 取得下一個編號
- `scripts/update-index.py` - 更新索引
- `scripts/list-categories.py` - 列出分類
- `scripts/verify-meta.py` - 驗證 Meta 系統

---

## 📅 版本時間表

| 階段 | 預計開始 | 預計完成 | 狀態 |
|------|---------|---------|------|
| 規劃階段 | 2025-10-31 | 2025-10-31 | ✅ 已完成 |
| Phase 1: Draft | 待定 | 待定 | ⏳ 待開始 |
| Phase 2: Extension-Review | 待定 | 待定 | ⏳ 待開始 |
| Phase 3: Linking | 待定 | 待定 | ⏳ 待開始 |
| Phase 4: Completed | 待定 | 待定 | ⏳ 待開始 |

---

## 📈 預期成果

完成本版本後：

1. **系統完整性提升**：
   - Conjunction 分類從空白到有 5 張基礎卡片
   - 授受表現系統包含敬語形式
   - Domain 核心詞彙齊全

2. **學習內容豐富**：
   - 新增 40 張 Critical 優先級學習內容卡片
   - 涵蓋 N5-N3 等級的核心詞彙和文法
   - 提供實用的日常表達

3. **知識網絡擴展**：
   - 卡片間連結更加緊密
   - 對比卡片幫助理解細微差異
   - 概念卡片提供理論框架

4. **為後續版本奠定基礎**：
   - v1.0.7+ 可以建立 High 優先級卡片
   - Extension-Review 將識別新的延伸需求

---

**文檔建立日期**：2025-10-31
**最後更新**：2025-10-31
**維護者**：AI Assistant
**版本狀態**：📋 規劃完成，待開始執行
