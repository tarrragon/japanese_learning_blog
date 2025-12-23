# 工作日誌 - v1.4.0（待建立標記系統性修復）

**版本號**：1.4.0
**開始日期**：2025-12-23
**當前階段**：規劃中
**目標**：修復系統中所有「待建立」標記，補充缺失卡片，並改進流程防止再發

---

## 一、問題發現

### 1.1 發現經過

在執行 `fix-wikilinks.py --verify` 時發現大量失效連結：

```
🔍 驗證連結有效性...
⚠️  發現 5569 個失效連結
```

進一步分析發現，許多卡片的「相關連結」區塊包含「待建立」標記，這些標記指向不存在的卡片。

### 1.2 統計摘要

| 指標 | 數值 |
|------|------|
| **總卡片數** | 936 張 |
| **含「待建立」標記的卡片** | 293 張（31.3%） |
| **「待建立」標記總次數** | 2,405 次 |
| **唯一待建立項目** | 396 個 |
| **已存在但未連結** | 0 個（全部都是真正缺失的卡片） |

### 1.3 按分類統計

| 分類 | 含待建立的卡片數 |
|------|-----------------|
| grammar（文法） | 84 |
| noun（名詞） | 63 |
| concept（概念） | 44 |
| verb-u（う動詞） | 15 |
| comparison（比較） | 15 |
| verb-ru（る動詞） | 12 |
| particle（助詞） | 12 |
| phrase（短語） | 11 |
| 其他 | 37 |

---

## 二、高頻待建立項目

### 2.1 Critical 優先級（出現 ≥5 次）

| 順序 | 項目 | 出現次數 | 建議分類 |
|------|------|---------|---------|
| 1 | に（助詞） | 21 | particle |
| 2 | ます形 | 14 | grammar |
| 3 | おる | 8 | verb |
| 4 | 来る | 6 | verb-irr |
| 5 | や | 6 | particle |
| 6 | まで | 6 | particle |
| 7 | ので | 6 | grammar |

### 2.2 High 優先級（出現 3-4 次）

| 項目 | 出現次數 | 建議分類 |
|------|---------|---------|
| お/ご～になる | 4 | grammar/honorific |
| お/ご～する | 4 | grammar/honorific |
| 後で vs てから | 4 | comparison |
| ～ことができる | 4 | grammar |
| 言う | 3 | verb-u |
| 帰る | 3 | verb-u |
| 可能形 | 3 | grammar |
| は | 3 | particle |
| たら | 3 | grammar |
| する | 3 | verb-irr |
| いる | 3 | verb-ru |

### 2.3 Medium 優先級（出現 2 次）

共計約 40 個項目，包括：
- 文法概念：た形、使役受身、敬語系統、文法句型
- 助詞比較：まで vs までに、で vs に、が vs は
- 動詞相關：可能形 vs できる、受身形 vs 可能形
- 名詞：資本、確定申告、供給
- 其他：商務敬語、ビジネス、だから、いただく

### 2.4 Low 優先級（出現 1 次）

共計約 340 個項目，涵蓋各種細分概念和詞彙。

---

## 三、根本原因分析

### 3.1 「待建立」標記的生命週期

```
階段 1: Content Creation
  └─ build-card-content 代理人建立卡片
  └─ 相關連結區塊使用「待建立」標記 ← 這是預期行為
  └─ stage: pending → draft

階段 2: Extension Review
  └─ create-extension-cards 代理人檢查延伸需求
  └─ 「待建立」標記保留（正常）
  └─ stage: draft → extension-review

階段 3: Link Building ❌ 問題環節
  └─ build-card-links 代理人應該：
     ✓ 建立遺漏卡片
     ✗ 將「待建立」替換為實際連結 ← 未完全執行
  └─ stage: extension-review → linking

階段 4: Final Verification ❌ 驗證缺失
  └─ 驗證腳本只檢查：
     ✓ 編號連續性（fix-numbering.py）
     ✓ Wikilink 格式（fix-wikilinks.py）
     ✗ 「待建立」標記 ← 無此檢查項
  └─ stage: linking → completed
```

### 3.2 核心問題

1. **build-card-links 代理人責任定義不明確**
   - `.claude/agents/build-card-links.md` 第 439-460 行說明應產生「待建立」標記
   - 但沒有明確說明「何時、如何、由誰」替換這些標記

2. **Final Verification 缺少檢測**
   - 沒有腳本檢測「待建立」標記
   - 完成條件未包含「無待建立標記」

3. **流程設計缺陷**
   - CLAUDE.md 第 104 行提到「將待建立標記替換為實際路徑」
   - 但未作為強制驗收標準

---

## 四、修復計劃

### 4.1 階段 A：建立追蹤 CSV（本版本）

**輸出**：`doc/worklog/cards-pending-links-1.4.0.csv`

欄位：
- id：流水號
- japanese：日文詞彙/概念
- category：建議分類
- frequency：出現次數
- priority：優先級（Critical/High/Medium/Low）
- source_cards：引用此項目的卡片路徑
- stage：pending

### 4.2 階段 B：建立缺失卡片

分批執行：
1. **Critical**：7 張（出現 ≥5 次）
2. **High**：11 張（出現 3-4 次）
3. **Medium**：約 40 張（出現 2 次）
4. **Low**：約 340 張（出現 1 次）

### 4.3 階段 C：更新現有卡片連結

完成新卡片建立後：
1. 掃描所有含「待建立」的卡片
2. 將標記替換為實際連結
3. 驗證連結有效性

### 4.4 階段 D：流程改進

1. **新增驗證腳本**：`scripts/check-pending-links.py`
2. **更新 CLAUDE.md**：新增驗證步驟和完成條件
3. **更新 build-card-links.md**：明確替換標記的責任

---

## 五、流程改進措施

### 5.1 新增驗證腳本

```bash
# 新增到 Final Verification 流程
uv run scripts/check-pending-links.py --check
```

### 5.2 更新完成條件

在 CLAUDE.md 第 159 行新增：
```markdown
- ✅ 無「待建立」標記（check-pending-links 驗證）
```

### 5.3 代理人責任明確化

在 build-card-links.md 新增明確步驟：
```markdown
## 替換待建立標記

1. 搜尋卡片中的「（待建立）」標記
2. 查找對應的實際卡片路徑
3. 替換為標準 Markdown 連結
4. 如無對應卡片，記錄到 linking-cards 報告
```

---

## 六、預期成果

- 修復 2,405 個「待建立」標記
- 建立約 400 張新卡片
- 防止未來發生相同問題

---

## 七、相關文檔

- CSV 清單：`doc/worklog/cards-pending-links-1.4.0.csv`
- 計劃檔案：`~/.claude/plans/lazy-weaving-pebble.md`
- 驗證腳本：`scripts/check-pending-links.py`（待建立）

---

**建立日期**：2025-12-23
**最後更新**：2025-12-23
