---
title: extension
description: 延伸卡片 - 從文章分析中識別的待建立卡片
type: category
created: 2025-10-30
---

## 日文
拡張（かくちょう）

**羅馬拼音**：kakuchou

**詞性**：名詞

**別名**：延伸（えんしん）

## 日文解釋
拡張（かくちょう）とは、既存のカードから派生して新しく作成する必要があると判断されたカードの一時的な置き場です。この category は、記事分析や既存カードのレビュー中に「このカードがあれば理解が深まる」「この概念は独立したカードにすべきだ」と判断された項目を記録します。例えば、ある文法カードを書いている時に関連する語用論的概念が必要だと気づいた場合、そのアイデアを extension カードとして記録し、後で適切な category に移動します。これは Zettelkasten システムにおける「アイデアのインキュベーター」として機能し、将来の知識ネットワーク拡張の方向性を示します。

## 英文解釋
"Extension" (kakuchou) is a temporary holding place for cards identified as needing creation based on existing cards. This category records items identified during article analysis or card reviews where "this card would deepen understanding" or "this concept should be an independent card." For example, when writing a grammar card and realizing a related pragmatic concept is needed, that idea is recorded as an extension card and later moved to the appropriate category. This functions as an "idea incubator" in the Zettelkasten system, indicating directions for future knowledge network expansion.

## 中文解釋
「延伸」（かくちょう）是從現有卡片衍生出來、被判斷需要新建立的卡片的臨時存放處。此分類記錄在文章分析或現有卡片審查過程中識別出的項目，例如「有了這張卡片就能加深理解」、「這個概念應該獨立成卡片」等情況。例如，在撰寫文法卡片時發現需要相關的語用學概念，就可以將該想法記錄為延伸卡片，之後再移動到適當的分類。這在 Zettelkasten 系統中充當「想法孵化器」的角色，指出未來知識網絡擴展的方向。

---

## Category 資訊

**Category 名稱**：`extension`
**中文名稱**：延伸（かくちょう）/ 擴張
**建立日期**：2025-10-30

## 定義

延伸卡片是在版本循環的 Extension-Review 階段識別出的待建立卡片的臨時存放處，用於追蹤知識網絡的擴展需求。

## 收錄標準

✅ 從現有卡片分析中識別出的概念
✅ 未來版本需要建立的卡片
✅ 暫時無法歸類到現有分類的概念
✅ 記錄在 `doc/worklog/extension-cards-{version}.md` 中

### Extension 卡片的生命週期

1. **識別階段** (Extension-Review Phase)
   - 在審查現有卡片時識別需求
   - 記錄在延伸需求文檔中

2. **優先級評估**
   - Critical: 立即建立（當前版本）
   - High: 下一版本建立
   - Medium: 未來版本考慮
   - Low: 可選擇性建立

3. **轉換階段**
   - 根據優先級在後續版本建立
   - 建立後移動到正確的分類
   - 更新索引和連結

4. **完成**
   - 延伸卡片從 extension 分類移除
   - 成為正式的知識卡片

## 使用場景

### 適合作為 Extension 卡片的情況

**語用學概念**
- ウチ・ソト（內外概念）
- 視點理論
- 敬意表達系統

**語言學理論**
- アスペクト（時相）
- モダリティ（情態）
- テンス（時態）

**文化概念**
- 社會階層與敬語
- 日本商務禮儀
- 季節表達

**文法系統**
- 條件形體系
- 授受動詞系統
- 複合動詞類型

### 不適合的情況

- 已有明確分類的詞彙 → 直接建立在對應分類
- 簡單的詞彙變化 → 在現有卡片中補充
- 重複的概念 → 檢查是否已存在

## 與版本循環的關係

Extension 分類與專案的版本循環緊密相關：

**Phase 2: Extension-Review**
- 識別所有需要的延伸卡片
- 記錄在 `doc/worklog/extension-cards-{version}.md`
- **不在本階段建立卡片**

**下一版本 Phase 1: Draft**
- 從延伸需求文檔中選擇高優先級項目
- 建立新卡片（stage: draft）
- 開始新的版本循環

## 標籤建議

- `extension` - 延伸卡片
- `concept` - 概念性質
- `grammar` - 文法相關
- `pragmatics` - 語用學
- `linguistic_theory` - 語言學理論
- `pending` - 待處理

## 管理建議

### 定期維護

1. **每個版本結束時**
   - 檢查 extension 分類中的卡片
   - 評估是否可以移到正確分類
   - 更新優先級

2. **規劃新版本時**
   - 從延伸需求文檔選擇要建立的卡片
   - 依照優先級排序
   - 分配到版本計畫中

3. **避免積累**
   - Extension 分類不應長期保留大量卡片
   - 定期清理和轉換
   - 低優先級項目可以考慮移除

## 統計資訊

**卡片數量**：0 張（截至 2025-10-30）
**最後更新**：2025-10-30
**使用頻率**：動態（隨版本循環變化）

### 設計理念

Extension 分類體現了 Zettelkasten 系統的核心理念：
- **漸進式成長**：知識網絡隨學習自然擴展
- **有機連結**：新卡片從現有卡片的需求中產生
- **靈活規劃**：根據實際需求決定建立順序

---

## 與其他 Category 的關係

- **concept**：Extension 卡片建立後，概念類通常會移到 concept
- **grammar**：文法延伸通常會移到 grammar
- **comparison**：對比分析類型會移到 comparison
- **context**：情境類型會移到 context
- **所有分類**：Extension 是所有分類的「孵化器」

## 注意事項

⚠️ **Extension 不是垃圾桶**
- 不要將不確定的想法隨意丟入
- 每個 extension 卡片都應該有明確的建立理由

⚠️ **記錄在 Worklog**
- Extension-Review 階段的需求必須記錄在工作日誌
- 不要只在卡片中記錄，應該有文檔追蹤

⚠️ **及時轉換**
- 建立後應盡快移到正確分類
- 避免 extension 分類膨脹

---

**最後更新**：2025-10-30
**維護者**：AI Assistant
**版本**：1.0.0
