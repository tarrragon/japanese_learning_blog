# Meta 資訊索引

此資料夾包含系統的元資訊（metadata），用於記錄和追蹤系統中使用的 tags 和 categories。

## 目的

1. **明確定義**：為每個 tag 和 category 提供清晰的定義
2. **使用追蹤**：記錄何時新增、如何使用
3. **一致性維護**：確保 tags 和 categories 使用的一致性
4. **索引功能**：方便查詢和管理

## 結構

### Tags（標籤）
- **路徑**：`_meta/tags/`
- **內容**：記錄所有使用的 tag 及其定義
- **子分類**：
  - `context/` - 使用情境標籤
  - `domain/` - 領域標籤
  - `jlpt/` - JLPT 等級標籤

### Categories（分類）
- **路徑**：`_meta/categories/`
- **內容**：記錄所有卡片類型（資料夾）及其定義
- **說明**：解釋每個 category 的用途、收錄標準、命名規範

## 使用方式

### 新增 Tag
1. 在對應的子資料夾中建立新的卡片
2. 更新該資料夾的 index.md
3. 在卡片中說明 tag 的定義、使用場景、範例

### 新增 Category
1. 在 `_meta/categories/` 中建立新的卡片
2. 更新 `_meta/categories/index.md`
3. 在主目錄建立對應的資料夾
4. 更新 `.claude.md` 文件

## 維護原則

- 每次新增 tag 或 category 都必須建立對應的 meta 卡片
- 定期檢查 meta 資訊的準確性
- 保持 meta 卡片的更新，反映實際使用情況

---

**建立日期**：2025-10-28
**最後更新**：2025-10-28
