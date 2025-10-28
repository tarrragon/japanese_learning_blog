# Tags 索引

記錄系統中所有使用的標籤（tags）及其定義。

## Tag 系統說明

Tags 用於標記卡片的屬性，幫助分類和檢索。每個卡片可以有多個 tags。

### Tag 類型

1. **context/** - 使用情境標籤
2. **domain/** - 領域標籤
3. **jlpt/** - JLPT 等級標籤

## Context Tags（使用情境）

**路徑**：`_meta/tags/context/`
**最後編號**：006
**總 tags 數**：6

### 已定義的 Context Tags

- [001 - business](context/001_business.md) - 商務場合
- [002 - casual](context/002_casual.md) - 日常、朋友間
- [003 - family](context/003_family.md) - 家庭
- [004 - formal](context/004_formal.md) - 正式場合
- [005 - academic](context/005_academic.md) - 學術環境
- [006 - social](context/006_social.md) - 社交場合

## Domain Tags（領域）

**路徑**：`_meta/tags/domain/`
**最後編號**：003
**總 tags 數**：3

### 已定義的 Domain Tags

- [001 - economics](domain/001_economics.md) - 經濟學
- [002 - daily_life](domain/002_daily_life.md) - 日常生活
- [003 - finance](domain/003_finance.md) - 財經金融

### 其他可用的 Domain Tags

根據 `.claude.md` 定義，以下 domain tags 可使用但尚未建立卡片：
- technology - 科技
- philosophy - 哲學
- history - 歷史
- culture - 文化
- medical - 醫療
- legal - 法律
- art - 藝術
- science - 科學
- politics - 政治
- education - 教育

## JLPT Tags（等級）

**路徑**：`_meta/tags/jlpt/`
**最後編號**：006
**總 tags 數**：6

### 已定義的 JLPT Tags

- [001 - n5](jlpt/001_n5.md) - JLPT N5（最基礎）
- [002 - n4](jlpt/002_n4.md) - JLPT N4
- [003 - n3](jlpt/003_n3.md) - JLPT N3
- [004 - n2](jlpt/004_n2.md) - JLPT N2
- [005 - n1](jlpt/005_n1.md) - JLPT N1（最高級）
- [006 - none](jlpt/006_none.md) - 不在 JLPT 範圍（專業術語等）

## Tag 使用統計

### Context Tags 使用次數
- business: 1 次
- casual: 9 次
- family: 4 次
- formal: 8 次
- academic: 1 次
- social: 1 次

### Domain Tags 使用次數
- economics: 2 次
- daily_life: 6 次

### JLPT Tags 使用次數
- n5: 3 次
- n4: 3 次
- n3: 6 次
- n2: 0 次
- n1: 1 次
- none: 0 次

## 新增 Tag 流程

1. 確認是否真的需要新 tag（避免過度細分）
2. 決定 tag 的類型（context/domain/jlpt）
3. 在對應資料夾建立新的 meta 卡片
4. 更新此索引檔案
5. 在實際卡片中開始使用

---

**建立日期**：2025-10-28
**最後更新**：2025-10-28
