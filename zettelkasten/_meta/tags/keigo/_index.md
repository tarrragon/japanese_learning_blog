---
title: Keigo Tags Index
description: 敬語相關標籤索引
created: 2025-10-30
updated: 2025-10-30
---

# Keigo Tags（敬語標籤）

敬語系統相關的標籤，用於標記不同類型的敬語表達和禮貌形式。

## Tag 列表

### 核心敬語類型

1. **[keigo](003_keigo/)** - 敬語系統，日語中表達尊敬和禮貌的語言體系
2. **[sonkeigo](008_sonkeigo/)** - 尊敬語，透過提升對方或對方的行為來表達尊敬
3. **[kenjougo](004_kenjougo/)** - 謙讓語，透過降低自己或己方來表示對對方的尊敬
4. **[polite_form](006_polite_form/)** - 丁寧語，使用です・ます形的禮貌語法形式

### 表達形式

5. **[honorific](001_honorific/)** - 敬語表達，用於表示對對方的尊敬
6. **[humble_form](002_humble_form/)** - 謙遜形式，說話者降低自己的地位以表示尊敬
7. **[respect](007_respect/)** - 尊敬表達，用於表示對他人的尊重和敬意
8. **[polite](005_polite/)** - 禮貌表達，使用禮貌的語言形式和措辭

## Tag 關係圖

```
keigo (敬語系統)
├── sonkeigo (尊敬語) ──→ respect (尊敬表達)
├── kenjougo (謙讓語) ──→ humble_form (謙遜形式)
├── polite_form (丁寧語) ──→ polite (禮貌表達)
└── honorific (廣義敬語表達)
```

## 使用指南

### 選擇正確的 Tag

- **keigo/keigo** - 討論敬語系統整體或跨類型概念
- **keigo/sonkeigo** - 提升對方的尊敬語動詞和表達
- **keigo/kenjougo** - 降低自己的謙讓語動詞和表達
- **keigo/polite_form** - です・ます形的文法形式
- **keigo/honorific** - 廣義的敬語表達（不限特定類型）
- **keigo/humble_form** - 謙遜表達形式
- **keigo/respect** - 表達尊敬和敬意的語言
- **keigo/polite** - 禮貌詞彙和表達方式

### Tag 組合使用

常見組合：
- `keigo/sonkeigo` + `keigo/polite_form` - 尊敬語的丁寧形
- `keigo/kenjougo` + `keigo/polite_form` - 謙讓語的丁寧形
- `keigo/honorific` + `context/business` - 商務敬語
- `keigo/respect` + `context/formal` - 正式場合的尊敬表達

## 統計資訊

- **總 Tag 數**：8
- **建立日期**：2025-10-30
- **最後更新**：2025-10-30

---

**維護記錄**
- 2025-10-30：建立 keigo 標籤類別和 8 個 tag 定義卡片
