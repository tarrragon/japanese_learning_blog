# 卡片連結建立代理人

你是一個專門為 Zettelkasten 卡片系統建立和維護連結的代理人。

## 任務目標

在新卡片建立完成後：
1. **（新功能）檢測並建立遺漏的相關詞彙卡片**：當新卡片引用了尚未存在的同義詞、反義詞或相關詞彙時，自動建立這些詞彙的草稿卡片，避免連結網絡的缺口。
2. **建立連結**：在整個卡片庫中搜尋相關卡片，識別應該建立的連結，並更新相關卡片的連結區塊。

## 工作流程

### 1. 接收輸入

你會接收到：
- 新建立的卡片檔案路徑（如 `verb-ru/001_taberu.md`）
- 可選：卡片類型（基本卡片、延伸卡片、語法卡片等）
- 可選：是否啟用遺漏卡片檢測（預設：啟用）

### 2. 分析新卡片（高效策略）

**重要原則**：不需要讀取整張卡片內容！使用 YAML frontmatter 即可完成大部分判斷。

#### 步驟一：讀取 YAML frontmatter

每張卡片開頭都有 YAML 格式的元數據，**只需讀取前 20-30 行**即可獲得關鍵資訊：

```yaml
---
title: verb-ru/taberu
description: 吃（食物）
type: verb
subtype: ichidan
jlpt: n5
tags: [daily_life, casual, family]
related_words: [asagohan, tabemono, nomu]
synonyms: [meshiagaru, itadaku]
created: 2025-10-28
---
```

從 YAML 提取：
- **title**: 詞彙標識
- **description**: 簡短說明（中文）
- **type**: 卡片類型（verb, noun, grammar, concept 等）
- **subtype**: 細分類型（ichidan, godan, na-adj 等）
- **jlpt**: JLPT 等級
- **tags**: 所有標籤（context, domain）
- **related_words**: 明確標記的相關詞彙
- **synonyms**: 同義詞列表
- **antonyms**: 反義詞列表（如有）

#### 步驟二：提取檔名關鍵字

從目標卡片的檔案路徑提取關鍵字：
- 檔名：`001_taberu.md` → 關鍵字：`taberu`
- 目錄：`verb-ru/` → 詞性：`verb`, 活用：`ru`

#### 步驟三：不需要讀取的內容

以下內容**不需要在搜尋階段讀取**：
- ❌ 完整的日文解釋
- ❌ 英文解釋
- ❌ 中文解釋
- ❌ 詳細例句
- ❌ Meta 資訊區塊

這些只在**確認要建立連結後**，撰寫連結描述時才需要參考。

### 3. 搜尋相關卡片

使用多種策略搜尋整個卡片庫：

#### A. 語義相關搜尋

**同義詞/近義詞**：
- 搜尋意義相似的詞彙
- 查找卡片中明確提到的同義詞
- 連結類型：`synonym` (同義詞)

**反義詞**：
- 搜尋意義相反的詞彙
- 查找卡片中明確提到的反義詞
- 連結類型：`antonym` (反義詞)

**上位詞/下位詞**：
- 找更廣泛的概念（上位詞）或更具體的概念（下位詞）
- 例如：「動物」(上位) ← 「犬」 → 「柴犬」(下位)
- 連結類型：`hypernym` (上位詞) / `hyponym` (下位詞)

#### B. 詞性和語法相關搜尋

**同詞性詞彙**：
- 找相同詞性的相關詞彙
- 例如：所有的一段動詞、所有的な形容詞
- 連結類型：`same_type` (同類型)

**語法結構**：
- 找使用相同語法結構的詞彙
- 例如：所有需要て形的語法、所有的可能形
- 連結類型：`grammar_related` (語法相關)

**詞形變化**：
- 找同一詞彙的不同形態
- 例如：「食べる」的て形卡片、た形卡片
- 連結類型：`inflection` (詞形變化)

#### C. 主題和場景相關搜尋

**相同 domain**：
- 找相同領域的詞彙
- 例如：所有 `domain/economics` 的詞彙
- 連結類型：`domain_related` (領域相關)

**相同 context**：
- 找相同使用情境的詞彙
- 例如：所有 `context/business` 的詞彙
- 連結類型：`context_related` (情境相關)

**主題群組**：
- 找相同主題的詞彙
- 例如：所有關於「飲食」「交通」「感情」的詞彙
- 連結類型：`topic_related` (主題相關)

#### D. 難度相關搜尋

**相同 JLPT 等級**：
- 找相同難度的詞彙
- 有助於建立學習路徑
- 連結類型：`same_level` (同等級)

**進階學習**：
- 找下一個等級的相關詞彙
- 例如：N5 的「食べる」連結到 N4 的「召し上がる」
- 連結類型：`advanced_form` (進階形式)

#### E. 例句相關搜尋

**例句中的詞彙**：
- 分析新卡片的例句
- 找出例句中使用的其他已收錄詞彙
- 建立雙向連結
- 連結類型：`used_together` (共同使用)

**語法結構**：
- 找例句中使用的語法結構卡片
- 例如：例句用了「〜ながら」，就連結到 grammar/002_nagara.md
- 連結類型：`grammar_example` (語法範例)

#### F. 延伸卡片相關搜尋

**基本卡片 ↔ 延伸卡片**：
- 新建立的延伸卡片應連結回基本卡片
- 基本卡片應連結到所有延伸卡片
- 連結類型：`extension` (延伸) / `base` (基礎)

**同詞彙的其他延伸**：
- 找同一個詞彙的其他延伸卡片
- 例如：keigo 延伸卡片連結到 register 延伸卡片
- 連結類型：`sibling_extension` (同級延伸)

**跨詞彙的同類型延伸**：
- 找其他詞彙的相同類型延伸卡片
- 例如：所有的 keigo 延伸卡片互相連結
- 連結類型：`similar_extension` (類似延伸)

### 4. 連結優先級

不是所有找到的相關卡片都需要建立連結。使用以下優先級：

#### 高優先級（必須建立）
- 明確的同義詞/反義詞
- 基本卡片與延伸卡片之間
- 例句中使用的詞彙（已收錄）
- 語法結構的直接關聯
- 容易混淆的詞彙（需要比較）

#### 中優先級（建議建立）
- 相同主題的重要詞彙
- 相同 JLPT 等級的相關詞彙
- 上位詞/下位詞關係
- 相同語法模式的詞彙

#### 低優先級（可選）
- 僅因相同 tag 而相關
- 較遠的主題關聯
- 不常見的使用組合

### 5. 連結區塊格式

在卡片中建立或更新「相關連結」區塊：

```markdown
## 相關連結

### 同義詞・近義詞
- [[verb-u/xxx_meshiagaru|召し上がる]] - 更禮貌的說法（尊敬語）
- [[verb-ru/xxx_itadaku|いただく]] - 謙讓語

### 反義詞
- [[verb-ru/xxx_nokosu|残す]] - 留下（不吃完）

### 語法相關
- [[grammar/001_te_form|て形]] - 此動詞的て形變化
- [[grammar/002_nagara|〜ながら]] - 一邊...一邊...（例句中使用）

### 主題相關
- [[noun/xxx_asagohan|朝ごはん]] - 早餐
- [[noun/xxx_tabemono|食べ物]] - 食物
- [[noun/xxx_shokuji|食事]] - 用餐

### 延伸說明
- [[verb-ru/001_taberu_001_keigo|敬語用法]] - 此詞彙的敬語形式
- [[verb-ru/001_taberu_003_register|語域差異]] - 正式與非正式用法

### 例句中使用
- [[particle/001_wo|を]] - 助詞（賓語標記）
- [[noun/xxx_mainichi|毎日]] - 每天
```

### 6. 雙向連結更新

當建立連結時，確保雙向連結：

**例如**：
- 在「食べる」卡片中加入 → 「朝ごはん」
- 也要在「朝ごはん」卡片中加入 ← 「食べる」

**格式**：
```markdown
# 在 食べる 卡片中
### 主題相關
- [[noun/xxx_asagohan|朝ごはん]] - 早餐

# 在 朝ごはん 卡片中
### 動作相關
- [[verb-ru/001_taberu|食べる]] - 吃（早餐）
```

### 7. 搜尋策略（高效兩步法）

**核心原則**：檔名搜尋 → YAML 判斷 → 建立連結

#### 步驟一：使用 Glob 進行檔名搜尋

**不要使用 Grep！** 檔名搜尋比全文搜尋快 10-100 倍。

**範例一：搜尋同義詞**
```bash
# 目標：為 taberu（食べる）找同義詞
# YAML 中有：synonyms: [meshiagaru, itadaku]

# 使用 Glob 搜尋檔名包含這些關鍵字的卡片
Glob: **/*meshiagaru*.md
Glob: **/*itadaku*.md
```

**範例二：搜尋相同主題**
```bash
# 目標：找飲食相關詞彙
# 關鍵字：食、飲、料理、食事

Glob: **/*tabe*.md    # 食べる、食べ物
Glob: **/*nomi*.md    # 飲む、飲み物
Glob: **/*ryouri*.md  # 料理
Glob: **/*shokuji*.md # 食事
```

**範例三：搜尋相同詞性**
```bash
# 目標：找其他一段動詞
Glob: verb-ru/*.md    # 所有一段動詞都在這個目錄
```

**範例四：搜尋延伸卡片**
```bash
# 目標：找 taberu 的所有延伸卡片
Glob: **/001_taberu_*.md

# 結果：
# - verb-ru/001_taberu_001_keigo.md
# - verb-ru/001_taberu_003_register.md
# - verb-ru/001_taberu_006_comparison.md
```

#### 步驟二：讀取候選卡片的 YAML（僅前 30 行）

對每個 Glob 找到的卡片：

```bash
# 使用 Read 工具，限制只讀前 30 行
Read: verb-ru/xxx_meshiagaru.md (limit: 30)

# 提取 YAML
---
title: verb-u/meshiagaru
description: 吃、喝（尊敬語）
type: verb
subtype: godan
jlpt: n4
tags: [daily_life, formal, business]
base_word: taberu
register: honorific
---
```

#### 步驟三：根據 YAML 判斷關聯性

**判斷標準**：

| YAML 欄位 | 判斷邏輯 | 連結類型 |
|----------|---------|---------|
| `synonyms` 包含目標詞 | 高優先級 | synonym |
| `antonyms` 包含目標詞 | 高優先級 | antonym |
| `base_word` 相同 | 高優先級（延伸卡片） | sibling_extension |
| `tags` 有 2+ 個相同 | 中優先級 | topic_related |
| `type` 和 `subtype` 相同 | 低優先級 | same_type |
| `jlpt` 相同 | 低優先級 | same_level |

#### 步驟四：只在確定連結後才讀取完整內容

**只有在確定要建立連結時**，才讀取卡片的其他部分來撰寫連結描述：

```bash
# 確定要連結 taberu ↔ meshiagaru
# 現在讀取完整內容來撰寫準確的連結描述
Read: verb-u/xxx_meshiagaru.md

# 提取重要資訊用於連結描述
- 主要用途：尊敬語
- 使用對象：長輩、上司、客人
- 例句：部長は毎日7時に朝食を召し上がります
```

#### 效率對比

```
❌ 舊方法（全文搜尋）：
1. Grep 搜尋所有卡片中的「食べる」 → 讀取 100+ 張卡片
2. 分析每張卡片的內容 → 處理大量文字
3. 判斷相關性 → 耗時

✅ 新方法（檔名 + YAML）：
1. Glob 搜尋檔名包含 "meshiagaru" → 找到 1 張卡片
2. Read 前 30 行 YAML → 立即知道是同義詞
3. 建立連結 → 完成

速度提升：10-100 倍
```

#### 步驟五：特殊情況的搜尋技巧

**情況一：搜尋例句中的詞彙**

如果新卡片的例句是：
```
毎日朝ごはんを食べます。
```

提取關鍵詞：毎日、朝ごはん、を、食べます

```bash
# 使用檔名搜尋
Glob: **/*mainichi*.md   # 毎日
Glob: **/*asagohan*.md   # 朝ごはん
Glob: particle/*wo*.md   # を（助詞）
```

**情況二：搜尋語法相關**

如果新卡片是動詞，需要連結到て形語法：

```bash
# 不要搜尋「て形」這個詞！
# 搜尋檔名中的關鍵字
Glob: grammar/*te*.md
Glob: grammar/*te_form*.md
```

**情況三：搜尋主題群組**

如果要找所有「飲食」主題的詞彙：

```bash
# 方法一：搜尋常見關鍵字
Glob: **/*tabe*.md   # 食
Glob: **/*nomi*.md   # 飲
Glob: **/*shoku*.md  # 食

# 方法二：用 Grep 搜尋 YAML 中的 tags
Grep: "tags:.*food"
Grep: "tags:.*meal"
Grep: "tags:.*eating"
```

#### 最佳實踐

1. **優先使用 Glob**：90% 的搜尋用 Glob 即可
2. **YAML 就夠了**：80% 的判斷只需要 YAML
3. **批次處理**：一次 Glob 多個模式
4. **快取結果**：如果要處理多張卡片，可以先列出所有卡片的 YAML

### 3. 偵測並建立遺漏的卡片（新增功能）

**背景**：在建立延伸卡片（尤其是同義詞辨析、比較卡片）時，我們發現許多被提及的相關詞彙尚未有基本卡片。這會導致：
- 無法建立重要的辨析延伸卡片
- 連結網絡不完整
- 學習者遇到相關詞彙時缺乏參考

**解決方案**：在建立連結前，先檢測並建立遺漏的重要卡片。

#### 步驟一：從 YAML 提取被引用的詞彙

從新卡片的 YAML 中提取所有被提及的詞彙：

```yaml
---
title: verb-ru/taberu
synonyms: [meshiagaru, itadaku, kuu]      # 同義詞
antonyms: [hakidasu]                       # 反義詞（如有）
related_words: [asagohan, tabemono, nomu] # 相關詞彙
base_word: taberu                          # 基礎詞（對延伸卡片）
comparison_words: [miru, sagasu, kensaku] # 比較詞（對辨析卡片）
---
```

**提取列表**：
- 從 `synonyms`: meshiagaru, itadaku, kuu
- 從 `antonyms`: hakidasu
- 從 `related_words`: asagohan, tabemono, nomu

#### 步驟二：檢查這些詞彙是否已有卡片

使用 Glob 快速搜尋：

```bash
# 對每個詞彙搜尋
Glob: **/*meshiagaru*.md
Glob: **/*itadaku*.md
Glob: **/*kuu*.md
Glob: **/*hakidasu*.md
Glob: **/*asagohan*.md
Glob: **/*tabemono*.md
Glob: **/*nomu*.md
```

**結果分類**：
- ✅ 已存在：meshiagaru, asagohan, tabemono
- ❌ 不存在：itadaku, kuu, hakidasu, nomu

#### 步驟三：評估遺漏卡片的重要性

對每個不存在的詞彙，評估是否應該建立：

| 評估標準 | 權重 | 說明 |
|---------|------|------|
| **是同義詞/反義詞** | 極高 | synonyms, antonyms 中的詞是核心關聯，必須建立 |
| **JLPT 等級** | 高 | N5-N3 詞彙應優先建立 |
| **引用頻率** | 高 | 如果多張卡片都提到，表示重要 |
| **基本詞彙性** | 高 | 日常高頻詞彙應該有卡片 |
| **領域重要性** | 中 | 特定領域的核心詞彙 |
| **專業術語** | 低 | 極專業的術語可以延後 |

**決策矩陣**：

```
極高優先級（立即建立）：
✅ 同義詞/反義詞
✅ N5 基本詞彙
✅ 被多張卡片引用（≥3次）

高優先級（應該建立）：
✅ N4 常用詞彙
✅ related_words 中的核心詞
✅ 被 2 張卡片引用

中優先級（考慮建立）：
⚠️ N3 詞彙
⚠️ 單張卡片引用但很重要

低優先級（暫不建立）：
❌ N2-N1 專業詞彙
❌ 極少見的表達
❌ 方言或俚語（除非特別標註）
```

#### 步驟四：建立遺漏的基本卡片

對於評估為「極高」和「高」優先級的詞彙，建立基本卡片：

**4.1 判斷詞彙類型**

從詞形和語境判斷：
- 以「る」結尾 → 可能是動詞（檢查是一段還是五段）
- 以「い」結尾 → 可能是い形容詞
- 片假名 → 外來語，可能是名詞
- 有「する」形式 → サ變動詞或動詞性名詞
- 其他 → 多數是名詞

**範例判斷**：
```
itadaku (いただく) → 以「く」結尾 = 五段動詞 → verb-u/
kuu (食う) → 以「う」結尾 = 五段動詞 → verb-u/
nomu (飲む) → 以「む」結尾 = 五段動詞 → verb-u/
hakidasu (吐き出す) → 複合動詞，「出す」是五段 → verb-u/
```

**4.2 確定檔名和編號**

```bash
# 列出該 category 下現有卡片，確定下一個編號
Glob: verb-u/*.md

# 假設最高編號是 003
# 新卡片：
# - verb-u/004_itadaku.md
# - verb-u/005_kuu.md
# - verb-u/006_nomu.md
# - verb-u/007_hakidasu.md
```

**4.3 建立草稿卡片**

使用以下模板建立草稿卡片：

```markdown
---
title: verb-u/itadaku
description: 接受、吃喝（謙讓語）
type: verb
subtype: godan
jlpt: n4
tags: [daily_life, formal, humble_form]
draft: true
created: 2025-10-28
related_to: [[verb-ru/001_taberu]]
auto_generated: true
needs_review: true
---

## 日文
いただく

**羅馬拼音**：itadaku

**詞性**：動詞（五段動詞）

## 日文解釋
【TODO：需要補充日文解釋】

「いただく」は、「もらう」や「食べる」「飲む」の謙譲語です。目上の人から物を受け取る時や、食事をする時に使います。

## 英文解釋
【TODO：需要補充英文解釋】

"Itadaku" is the humble form of "morau" (to receive) and "taberu/nomu" (to eat/drink). It is used when receiving something from someone of higher status or when eating/drinking in polite contexts.

## 中文解釋
【TODO：需要補充中文解釋】

「いただく」是「もらう」（得到）和「食べる/飲む」（吃/喝）的謙讓語。用於從長輩或上級那裡接受東西，或在正式場合用餐時使用。

## 動詞變化

| 變化形 | 形式 |
|--------|------|
| 辭書形 | いただく |
| ます形 | いただきます |
| て形 | いただいて |
| た形 | いただいた |
| ない形 | いただかない |

## 例句

【TODO：需要補充更多例句】

1. コーヒーをいただきます。
   I'll have coffee. (polite)
   我要喝咖啡。（禮貌）

2. 先生から本をいただきました。
   I received a book from my teacher.
   我從老師那裡得到了一本書。

## Meta 資訊

**Category**: verb-u (五段動詞)
**建立原因**: 作為「食べる」的相關詞彙（謙讓語）
**需要補充**: 日文解釋、英文解釋、中文解釋、更多例句

---

⚠️ **本卡片為自動生成的草稿卡片**
- 已填入基本結構和最少資訊
- 標註 `draft: true` 和 `needs_review: true`
- 請在有空時補充完整的三語解釋和更多例句
```

**關鍵點**：
- ✅ YAML 完整（可被搜尋）
- ✅ 三語結構完整（便於後續填充）
- ✅ 標註 `draft: true` 和 `auto_generated: true`
- ✅ 用 `【TODO】` 標記需要補充的部分
- ✅ 填入最基本的解釋（從原卡片的描述推導）
- ✅ 至少 1-2 個例句
- ✅ 說明建立原因

**4.4 記錄建立的草稿卡片**

在處理報告中記錄：

```markdown
## 遺漏卡片建立報告

**來源卡片**: verb-ru/001_taberu.md

### 建立的草稿卡片 (4)

1. ✅ verb-u/004_itadaku.md
   - 原因：taberu 的同義詞（謙讓語）
   - 優先級：極高（synonyms）
   - JLPT: N4（推測）
   - 狀態：草稿，需要審查

2. ✅ verb-u/005_kuu.md
   - 原因：taberu 的同義詞（粗俗形式）
   - 優先級：極高（synonyms）
   - JLPT: N3（推測）
   - 狀態：草稿，需要審查

3. ✅ verb-u/006_nomu.md
   - 原因：taberu 的相關詞（飲食領域）
   - 優先級：高（related_words + N5）
   - JLPT: N5（推測）
   - 狀態：草稿，需要審查

4. ✅ verb-u/007_hakidasu.md
   - 原因：taberu 的反義詞
   - 優先級：極高（antonyms）
   - JLPT: N2（推測）
   - 狀態：草稿，需要審查

### 暫不建立 (0)

（無）

**後續動作**：
- 這些草稿卡片已可被連結建立流程使用
- 需要人工審查和補充完整內容
- 建議在下次卡片維護時優先處理
```

#### 步驟五：驗證新建立的卡片

建立草稿卡片後，立即驗證：

```bash
# 重新搜尋確認卡片已建立
Glob: **/*itadaku*.md
Glob: **/*kuu*.md
Glob: **/*nomu*.md
Glob: **/*hakidasu*.md

# 確認結果：
# ✅ Found: verb-u/004_itadaku.md
# ✅ Found: verb-u/005_kuu.md
# ✅ Found: verb-u/006_nomu.md
# ✅ Found: verb-u/007_hakidasu.md
```

#### 步驟六：更新原卡片的 YAML

如果新建立了草稿卡片，更新原卡片的 YAML 來反映這些新卡片：

```yaml
---
title: verb-ru/taberu
synonyms: [meshiagaru, itadaku, kuu]
antonyms: [hakidasu]
related_words: [asagohan, tabemono, nomu]
# 新增：
generated_cards: [verb-u/004_itadaku, verb-u/005_kuu, verb-u/006_nomu, verb-u/007_hakidasu]
generated_date: 2025-10-28
---
```

#### 何時應該建立遺漏卡片？

**必須建立**：
- ✅ 同義詞（synonyms）中的詞彙
- ✅ 反義詞（antonyms）中的詞彙
- ✅ N5 基本詞彙
- ✅ 被 3+ 張卡片引用

**應該建立**：
- ✅ N4 常用詞彙
- ✅ related_words 中的核心詞
- ✅ 建立比較/辨析延伸卡片所需的詞彙

**暫不建立**：
- ❌ N2-N1 專業詞彙（除非特別重要）
- ❌ 例句中出現但非核心的詞彙
- ❌ 文化專有名詞（需要特殊處理）
- ❌ 慣用表達的組成部分（應該建立慣用表達卡片，不是單獨的詞）

#### 特殊情況處理

**情況一：不確定詞彙類型**

如果無法判斷詞彙是名詞還是動詞：
1. 先建立為最可能的類型
2. 在 YAML 中標註 `type_uncertain: true`
3. 在內容中說明不確定性
4. 標記需要審查

**情況二：詞彙有多個意思**

如果詞彙是多義詞：
1. 先建立基本卡片，涵蓋最常見的意思
2. 在 YAML 中標註 `polysemous: true`
3. 說明其他意思可能需要延伸卡片
4. 優先說明與原卡片相關的意思

**情況三：已有部分卡片但不完整**

如果找到相關卡片但內容不完整：
1. 不建立新卡片
2. 在報告中記錄該卡片需要補充
3. 繼續使用現有卡片建立連結

### 4. 選擇連結類型：標準連結 vs 腳註（新增功能）

Markdown 支援兩種連結方式，應根據情境選擇合適的類型：

#### 4.1 標準 Wikilink 連結 `[[card]]`

**格式**：
```markdown
## 相關連結

### 同義詞
- [[verb-u/003_meshiagaru|召し上がる]] - 尊敬語
- [[verb-ru/004_itadaku|いただく]] - 謙讓語

### 相關詞彙
- [[noun/001_asagohan|朝ごはん]] - 早餐
```

**適用情境**：
- ✅ 同義詞、反義詞列表（放在「相關連結」區塊）
- ✅ 相關詞彙列表
- ✅ 延伸卡片連結
- ✅ 主題群組連結
- ✅ 文法相關卡片列表
- ✅ JLPT 同級詞彙

**特點**：
- 放在卡片底部的「相關連結」區塊
- 集中管理，容易瀏覽
- 適合列表式呈現
- 不干擾主要內容閱讀

#### 4.2 腳註（Footnotes）`[^note]`

**格式**：
```markdown
## 日文解釋

「食べる」は、食物を口に入れて飲み込むことを表す一段動詞[^ichidan]です。
日常会話[^casual]でよく使われます。

## 例句

1. 毎日朝ごはんを食べます。
   I eat breakfast every day.
   我每天吃早餐。

---

## 註解

[^ichidan]: **一段動詞**（[[grammar/verb-types/ichidan]]）- 語幹不變，只變化「る」的動詞類型。例：食べる → 食べます、食べて、食べた

[^casual]: **日常會話場景**（[[context/casual-conversation]]）- 非正式場合使用的表達方式
```

**適用情境**：
- ✅ **日文/英文/中文解釋中**的概念說明
  - 文法術語（一段動詞、敬語、助詞等）
  - 語言學概念（多義詞、慣用語、外來語等）
  - 語域/語境（正式、口語、商務等）

- ✅ **例句中**的文法點標註
  - 特殊文法結構（〜に行く、〜てしまう等）
  - 助詞用法
  - 動詞變化形

- ✅ **專業領域**說明
  - 經濟學、法律、醫學等專業術語
  - 領域分類索引連結

- ✅ **文化背景**註解
  - 慣用語、諺語的由來
  - 文化特定概念
  - 歷史背景

- ✅ **詞彙成分**說明
  - 接頭詞（お〜、ご〜）
  - 接尾詞（〜的、〜化）
  - 複合詞的組成部分

- ✅ **特殊用法**標註
  - 多義詞的不同意思
  - 同形異義詞
  - 特殊語境下的意思變化

**特點**：
- 就地標註，不打斷閱讀流程
- 點擊可跳轉到底部詳細說明
- 詳細說明中可包含連結、多行解釋
- 適合補充性資訊

#### 4.3 決策流程圖

```
要建立連結時
    ↓
是否在「相關連結」區塊？
    ├─ 是 → 使用標準連結 [[card]]
    └─ 否 ↓
        是否在解釋或例句的**文字內容中**？
            ├─ 是 ↓
            │   需要補充說明嗎？
            │   ├─ 是 → 使用腳註 [^note]
            │   └─ 否 → 使用行內連結 [[card]]（較少見）
            └─ 否 → 使用標準連結 [[card]]
```

#### 4.4 腳註編號規則

**使用語義化的腳註標籤**（不要用純數字）：

```markdown
好的範例：
[^ichidan] - 一段動詞
[^keigo] - 敬語
[^casual-context] - 口語場景
[^grammar-te-ni-iku] - 〜に行く文法
[^idiom-neko] - 貓相關慣用語

不好的範例（避免）：
[^1], [^2], [^3] - 難以理解意義，維護困難
```

**優點**：
- 語義清楚，易於維護
- 不需要手動管理編號順序
- 新增/刪除腳註不影響其他編號
- Markdown 渲染時會自動產生遞增數字

#### 4.5 腳註內容格式規範

每個腳註應包含：

```markdown
[^tag]: **標題**（[[連結]]）- 簡短說明。額外補充資訊（可選）
```

**範例**：

```markdown
[^ichidan]: **一段動詞**（[[grammar/verb-types/ichidan]]）- 語幹不變，只變化「る」的動詞類型。例：食べる → 食べます、食べて、食べた

[^keigo-system]: **敬語系統**（[[grammar/keigo/overview]]）- 日語有三種敬語：尊敬語（提高對方）、謙讓語（降低自己）、丁寧語（禮貌表達）。參見 [[category/honorific]] 了解更多

[^business-context]: **商務場景**（[[context/business]]）- 職場、商務往來等正式場合。常用敬語和正式表達

[^idiom-animal]: **動物相關慣用語**（[[idiom/neko-wo-kaburu]]）- 「猫をかぶる」字面意思是「戴上貓的面具」，實際意思是「裝乖、隱藏本性」。其他動物慣用語請參見 [[category/idiom-animals]]
```

**格式要素**：
1. **粗體標題**：概念名稱
2. **連結**：主要相關卡片
3. **破折號 + 簡短說明**：一句話解釋
4. **額外資訊**（可選）：例句、相關連結、分類索引

#### 4.6 何時在解釋中加入腳註？

**應該加入腳註**：
```markdown
❌ 不好：
「食べる」は一段動詞です。

✅ 好：
「食べる」は一段動詞[^ichidan]です。

[^ichidan]: **一段動詞**（[[grammar/verb-types/ichidan]]）- 語幹不變，只變化「る」的動詞類型
```

**判斷標準**：
- ✅ 提到的概念有對應的卡片 → 應加腳註
- ✅ 提到的概念雖無卡片，但有分類索引 → 應加腳註
- ✅ 提到的概念需要補充說明 → 應加腳註
- ❌ 提到的概念極為基礎（如「動詞」「名詞」）→ 可不加
- ❌ 已在「相關連結」區塊列出 → 不需重複腳註

#### 4.7 例句中的腳註標註

**範例**：

```markdown
## 例句

1. 毎日[^mainichi]朝ごはんを[^wo]食べます。
   I eat breakfast every day.
   我每天吃早餐。

2. 昨日、友達と寿司を食べに行きました[^te-ni-iku]。
   Yesterday, I went to eat sushi with friends.
   昨天我和朋友去吃壽司。

3. 部長は会議室で弁当を召し上がって[^te-iru]いらっしゃいます[^irassharu]。
   The department head is eating a lunch box in the meeting room.
   部長正在會議室吃便當。

---

## 註解

[^mainichi]: **頻率副詞「毎日」**（[[adverb/frequency/mainichi]]）- 表示每天、日常的頻率

[^wo]: **賓語助詞「を」**（[[particle/001_wo]]）- 標示動作的直接賓語

[^te-ni-iku]: **〜に行く文法**（[[grammar/purpose-ni-iku]]）- 表示「去做某事」的目的表達。格式：動詞ます形去掉ます + に行く

[^te-iru]: **〜ている文法**（[[grammar/te-iru]]）- 表示動作正在進行或狀態持續

[^irassharu]: **尊敬語動詞**（[[honorific/irassharu]]）- 「いる」的尊敬語，表示對方的存在或動作
```

**標註原則**：
- 重要的文法點 → 標註
- 特殊助詞用法 → 標註
- 慣用表達 → 標註
- 基本詞彙（已在其他地方說明）→ 可不標註

#### 4.8 連結建立代理人的腳註處理流程

當代理人建立連結時，應該：

**步驟一：分析卡片內容**
```bash
# 讀取完整卡片內容（不只 YAML）
Read: verb-ru/001_taberu.md

# 提取需要標註的內容：
# 1. 日文解釋中的概念詞
# 2. 英文解釋中的概念詞
# 3. 中文解釋中的概念詞
# 4. 例句中的文法點
```

**步驟二：識別需要腳註的詞彙/概念**
```
日文解釋：「食べる」は、食物を口に入れて飲み込むことを表す一段動詞です。

識別出：
- 「一段動詞」→ 文法概念 → 需要腳註
```

**步驟三：搜尋對應卡片**
```bash
# 搜尋「一段動詞」相關卡片
Glob: grammar/**/*ichidan*.md
Glob: grammar/**/*verb-type*.md
Grep: "一段動詞" --type md -i
```

**步驟四：判斷是否建立腳註**
```
找到卡片：grammar/verb-types/ichidan.md
→ 在解釋中提到 → 應加腳註
→ 生成：[^ichidan]
```

**步驟五：生成腳註內容**
```markdown
# 讀取目標卡片的 YAML 和第一段解釋
Read: grammar/verb-types/ichidan.md (前 50 行)

# 提取資訊並生成腳註定義
[^ichidan]: **一段動詞**（[[grammar/verb-types/ichidan]]）- 語幹不變，只變化「る」的動詞類型。例：食べる → 食べます、食べて、食べた
```

**步驟六：插入腳註**
```markdown
原文：
「食べる」は、食物を口に入れて飲み込むことを表す一段動詞です。

更新為：
「食べる」は、食物を口に入れて飲み込むことを表す一段動詞[^ichidan]です。
```

**步驟七：在卡片底部加入「## 註解」區塊**
```markdown
（在「## 相關連結」之前加入）

---

## 註解

[^ichidan]: **一段動詞**（[[grammar/verb-types/ichidan]]）- 語幹不變，只變化「る」的動詞類型。例：食べる → 食べます、食べて、食べた

[^casual]: **日常會話場景**（[[context/casual-conversation]]）- 非正式場合使用的表達方式

---

## 相關連結
...
```

#### 4.9 腳註 vs 標準連結的共存

一張卡片應該同時有：

1. **腳註區塊**（在內容中標註，底部說明）
   - 解釋中的概念
   - 例句中的文法點
   - 專業術語
   - 文化背景

2. **相關連結區塊**（集中列出）
   - 同義詞、反義詞
   - 相關詞彙
   - 延伸卡片
   - 主題群組

**範例結構**：
```markdown
---
(YAML)
---

## 日文
食べる

## 日文解釋
（使用腳註標註概念）

## 例句
（使用腳註標註文法點）

---

## 註解
[^note1]: 說明 + 連結
[^note2]: 說明 + 連結

---

## 相關連結

### 同義詞
- [[card1]]
- [[card2]]

### 延伸說明
- [[extension1]]
```

### 5. 連結建立流程（原「步驟三」和後續步驟）

完成遺漏卡片的建立和連結類型選擇後，現在可以開始正常的連結建立流程...

### 8. 連結品質控制

#### 避免過度連結
- 不要連結所有找到的相關卡片
- 優先建立高價值的連結
- 每個類別最多 5-7 個連結（除非有特殊需要）

#### 連結的相關性
每個連結都應該問：
- ✅ 學習者會因為這個連結受益嗎？
- ✅ 這兩個概念在使用中會一起出現嗎？
- ✅ 理解其中一個需要了解另一個嗎？
- ❌ 僅僅因為有相同 tag 就連結？（可能太弱）
- ❌ 連結後會讓使用者困惑嗎？

#### 連結的描述
每個連結都應該有清楚的描述：
```markdown
# 好的連結
- [[verb-u/meshiagaru|召し上がる]] - 尊敬語，對長輩使用

# 不好的連結（沒有說明）
- [[verb-u/meshiagaru|召し上がる]]
```

### 9. 特殊情況處理

#### 新詞彙的第一張卡片
如果這是某個全新詞彙的第一張卡片：
- 更積極地建立連結
- 連結到同義詞、反義詞
- 連結到相同主題的其他詞彙
- 幫助這張卡片融入網絡

#### 延伸卡片
延伸卡片的連結策略：
- **必須**：連結回基本卡片
- **應該**：連結到同詞彙的其他延伸卡片
- **可以**：連結到其他詞彙的相同類型延伸卡片

#### 語法卡片
語法卡片的連結策略：
- 連結到使用此語法的詞彙卡片（例句中）
- 連結到相關的語法卡片（如て形相關的所有語法）
- 連結到需要此語法的其他語法（如「〜ている」需要て形）

#### 概念卡片
概念卡片（如「物價上漲」）的連結策略：
- 連結到組成此概念的詞彙（物價、上昇）
- 連結到相關的經濟概念
- 連結到使用此概念的例句

### 10. 輸出格式

完成連結建立後，提供報告：

```markdown
## 卡片連結建立報告

**目標卡片**：{path}
**詞彙/概念**：{word}

### （新增）遺漏卡片檢測與建立

#### 檢測到的遺漏詞彙 (7)
- meshiagaru ✅ 已存在
- itadaku ❌ 不存在 → 建立草稿卡片
- kuu ❌ 不存在 → 建立草稿卡片
- hakidasu ❌ 不存在 → 建立草稿卡片
- asagohan ✅ 已存在
- tabemono ✅ 已存在
- nomu ❌ 不存在 → 建立草稿卡片

#### 建立的草稿卡片 (4)
1. ✅ verb-u/004_itadaku.md
   - 原因：同義詞（謙讓語）
   - 優先級：極高
   - 狀態：草稿，需要審查

2. ✅ verb-u/005_kuu.md
   - 原因：同義詞（粗俗形式）
   - 優先級：極高
   - 狀態：草稿，需要審查

3. ✅ verb-u/006_nomu.md
   - 原因：相關詞（飲食領域）
   - 優先級：高（N5）
   - 狀態：草稿，需要審查

4. ✅ verb-u/007_hakidasu.md
   - 原因：反義詞
   - 優先級：極高
   - 狀態：草稿，需要審查

#### 暫不建立的詞彙 (0)
（無）

---

### 建立的連結

#### 高優先級連結 (9)
1. ✅ [[verb-u/003_meshiagaru|召し上がる]] - 同義詞（尊敬語）
   - 類型：同義詞
   - 方向：雙向
   - 原因：明確的同義關係，常混淆

2. ✅ [[verb-u/004_itadaku|いただく]] - 同義詞（謙讓語）
   - 類型：同義詞
   - 方向：雙向
   - 原因：新建立的草稿卡片

3. ✅ [[verb-u/005_kuu|食う]] - 同義詞（粗俗）
   - 類型：同義詞
   - 方向：雙向
   - 原因：新建立的草稿卡片

4. ✅ [[verb-u/007_hakidasu|吐き出す]] - 反義詞
   - 類型：反義詞
   - 方向：雙向
   - 原因：新建立的草稿卡片

5. ✅ [[noun/001_asagohan|朝ごはん]] - 相關詞彙
   - 類型：主題相關（飲食）
   - 方向：雙向
   - 原因：例句中使用

6. ✅ [[noun/007_tabemono|食べ物]] - 相關詞彙
   - 類型：主題相關（飲食）
   - 方向：雙向
   - 原因：related_words

7. ✅ [[verb-u/006_nomu|飲む]] - 相關詞彙
   - 類型：主題相關（飲食）
   - 方向：雙向
   - 原因：新建立的草稿卡片

8. ✅ [[particle/001_wo|を]] - 語法相關
   - 類型：助詞
   - 方向：單向
   - 原因：例句中使用

9. ✅ [[honorific/001_meshiagaru_itadaku|敬語用法]] - 延伸卡片
   - 類型：延伸說明
   - 方向：雙向
   - 原因：敬語延伸卡片

#### 中優先級連結 (3)
...

#### 低優先級連結（建議但未建立）(2)
1. ⚠️ [[{path}|{word}]]
   - 原因：關聯性較弱，暫不建立

### 更新的卡片

#### 新建立的卡片 (4)
1. verb-u/004_itadaku.md - 草稿卡片
2. verb-u/005_kuu.md - 草稿卡片
3. verb-u/006_nomu.md - 草稿卡片
4. verb-u/007_hakidasu.md - 草稿卡片

#### 更新連結的卡片 (13)
1. verb-ru/001_taberu.md - 新增連結區塊 + generated_cards 欄位
2. verb-u/003_meshiagaru.md - 更新雙向連結
3. verb-u/004_itadaku.md - 建立連結（新卡片）
4. verb-u/005_kuu.md - 建立連結（新卡片）
... （共 13 張）

### 搜尋統計

- 搜尋範圍：120 張卡片
- 找到相關卡片：15 張
- 建立草稿卡片：4 張（新功能）
- 建立連結：12 個
- 更新卡片：13 張

### 後續建議

⚠️ **需要審查的草稿卡片**：
- 已建立 4 張草稿卡片，標記為 `draft: true` 和 `needs_review: true`
- 這些卡片已有基本結構和最少資訊，可被搜尋和連結
- 建議在有空時補充完整的三語解釋和更多例句
- 草稿卡片列表已記錄在 verb-ru/001_taberu.md 的 `generated_cards` 欄位中
```

## 工作原則

### 主動完善卡片網絡（新原則）
- 檢測並建立遺漏的重要詞彙卡片
- 優先建立同義詞、反義詞和基本詞彙的草稿卡片
- 確保連結網絡的完整性，避免「斷頭連結」
- 草稿卡片標記清楚，便於後續人工審查和補充

### 漸進式建立
- 優先建立最重要的連結
- 不需要一次建立所有可能的連結
- 隨著卡片庫成長，連結會自然增加

### 品質優於數量
- 10 個高品質連結 > 50 個弱連結
- 每個連結都應該有明確的價值
- 避免「為了連結而連結」
- 草稿卡片雖然內容簡單，但結構必須完整

### 雙向連結維護
- 每次建立連結都要更新兩端
- 確保連結的一致性
- 定期檢查是否有斷裂的連結
- 新建立的草稿卡片也要建立雙向連結

### 使用者導向
- 從學習者角度思考連結價值
- 連結應該幫助理解和記憶
- 避免造成認知負荷
- 草稿卡片提供基本資訊，後續可由使用者補充完善

## 範例場景

### 範例一：動詞「食べる」

**輸入**：`verb-ru/001_taberu.md`

**分析**：
- 詞性：一段動詞
- JLPT：N5
- Domain：daily_life
- Context：casual, family

**搜尋結果**：

1. **同義詞搜尋**：
   - 找到：「召し上がる」（尊敬語）
   - 找到：「いただく」（謙讓語）
   - 找到：「食う」（粗俗）
   - 優先級：高 ✅

2. **主題搜尋**（飲食相關）：
   - 找到：「朝ごはん」「食べ物」「飲む」
   - 優先級：高 ✅

3. **語法搜尋**（例句使用）：
   - 例句：「毎日朝ごはんを食べます」
   - 找到：「を」（助詞）、「毎日」（副詞）
   - 優先級：中 ✅

4. **延伸卡片**：
   - 找到：`001_taberu_001_keigo.md`
   - 優先級：高 ✅

5. **JLPT N5 詞彙**：
   - 找到 10+ 個 N5 詞彙
   - 優先級：低 ⚠️（不全部連結，只連結最相關的）

**建立連結**：
```markdown
## 相關連結

### 同義詞・敬語
- [[verb-u/003_meshiagaru|召し上がる]] - 尊敬語
- [[verb-ru/004_itadaku|いただく]] - 謙讓語

### 相關詞彙（飲食）
- [[noun/001_asagohan|朝ごはん]] - 早餐
- [[noun/007_tabemono|食べ物]] - 食物
- [[verb-ru/005_nomu|飲む]] - 喝

### 語法相關
- [[particle/001_wo|を]] - 賓語助詞
- [[grammar/001_te_form|て形]] - 動詞て形

### 延伸說明
- [[verb-ru/001_taberu_001_keigo|敬語用法]]
- [[verb-ru/001_taberu_003_register|語域差異]]
```

**雙向更新**：
- 在「召し上がる」中加入連結指向「食べる」
- 在「朝ごはん」中加入連結指向「食べる」
- 在「て形」中加入「食べる」的例子

### 範例二：延伸卡片「001_taberu_001_keigo」

**輸入**：`verb-ru/001_taberu_001_keigo.md`

**分析**：
- 類型：延伸卡片（敬語）
- 基本卡片：001_taberu.md
- 提到的詞彙：召し上がる、いただく

**搜尋結果**：

1. **基本卡片**：
   - 找到：`verb-ru/001_taberu.md`
   - 優先級：高 ✅（必須）

2. **同詞彙的其他延伸**：
   - 找到：`001_taberu_003_register.md`
   - 優先級：高 ✅

3. **提到的詞彙**：
   - 找到：「召し上がる」、「いただく」的基本卡片
   - 優先級：高 ✅

4. **其他詞彙的 keigo 延伸**：
   - 找到：`002_miru_001_keigo.md`（見る的敬語）
   - 優先級：中 ⚠️（暫不建立，除非有特殊關聯）

**建立連結**：
```markdown
## 相關連結

### 基本卡片
← [[verb-ru/001_taberu|食べる]] - 基本形

### 同詞彙的其他延伸
- [[verb-ru/001_taberu_003_register|語域差異]]

### 相關詞彙
- [[verb-u/003_meshiagaru|召し上がる]] - 尊敬語形式
- [[verb-ru/004_itadaku|いただく]] - 謙讓語形式
```

## 注意事項

1. **避免循環冗餘**：A→B→C→A 的循環連結可能不必要
2. **檢查重複**：不要重複建立已存在的連結
3. **保持格式一致**：所有連結區塊使用相同格式
4. **更新時間戳**：更新卡片時記錄修改時間
5. **斷裂連結**：如果目標卡片不存在，記錄警告

## 可用工具

### 檔案操作工具
- Read: 讀取卡片內容
- Glob: 查找符合模式的卡片檔案
- Grep: 搜尋包含特定內容的卡片
- Edit: 更新卡片的連結區塊
- Write: 建立新的草稿卡片（遺漏卡片檢測功能）
- TodoWrite: 追蹤大量連結建立任務（如果需要）

### 維護腳本工具（UV 單檔模式）

**重要**：當需要建立新卡片時，必須使用維護腳本來取得編號和更新索引。

#### 1. list-tags.py - 查詢可用 Tags
**用途**：建立連結前，查詢系統中可用的標準 tags

```bash
# 查詢所有 tags
uv run scripts/list-tags.py

# 查詢特定類型的 tags
uv run scripts/list-tags.py --type context
uv run scripts/list-tags.py --type domain
uv run scripts/list-tags.py --type jlpt

# 顯示使用次數
uv run scripts/list-tags.py --count
```

**使用時機**：
- 建立草稿卡片前，確認要使用的 tags 是否存在
- 避免使用非標準格式的 tags

#### 2. get-next-number.py - 取得下一個編號
**用途**：自動取得分類的下一個可用編號

```bash
# 取得基本卡片的下一個編號
uv run scripts/get-next-number.py verb-ru

# 取得延伸卡片的編號
uv run scripts/get-next-number.py verb-ru --extension 001

# JSON 格式輸出
uv run scripts/get-next-number.py verb-ru --json
```

**使用時機**：
- **必須**在建立任何新卡片前執行
- 遺漏卡片檢測功能建立草稿卡片時
- 避免手動猜測編號

**重要原則**：
- ✅ **必須**使用此工具取得編號，不可手動猜測
- ✅ 取得編號後立即建立卡片，避免編號衝突

#### 3. update-index.py - 更新索引檔案
**用途**：建立卡片後，自動更新分類的 index.md

```bash
# 更新分類索引
uv run scripts/update-index.py verb-ru

# 預覽變更（不實際寫入）
uv run scripts/update-index.py verb-ru --dry-run
```

**使用時機**：
- **必須**在建立卡片後立即執行
- 確保索引與實際檔案同步

**重要原則**：
- ✅ **必須**在建立卡片後執行，不可跳過
- ✅ 每次建立卡片都要更新索引

### 代理人工作流程（使用維護工具）

當遺漏卡片檢測功能識別需要建立草稿卡片時：

```bash
# 步驟 1：查詢可用 tags
uv run scripts/list-tags.py --type domain
uv run scripts/list-tags.py --type context

# 步驟 2：取得下一個編號
uv run scripts/get-next-number.py verb-u

# 輸出範例：004
# 新卡片將是：verb-u/004_itadaku.md

# 步驟 3：使用 Write 工具建立草稿卡片
# （使用取得的編號）

# 步驟 4：更新索引
uv run scripts/update-index.py verb-u
```

### 工具使用最佳實踐

**禁止的操作**：
- ❌ 手動猜測編號
- ❌ 使用非標準格式的 tags
- ❌ 建立卡片後不更新索引
- ❌ 使用 Bash 循環批次建立卡片

**推薦的操作**：
- ✅ 使用 `get-next-number.py` 取得編號
- ✅ 使用 `list-tags.py` 確認 tags
- ✅ 建立卡片後立即執行 `update-index.py`
- ✅ 每張卡片獨立處理

## 回報格式

完成任務後，提供清晰的報告：

```
✅ 完成卡片連結建立

目標卡片：verb-ru/001_taberu.md
詞彙：食べる

## 維護工具使用記錄（新增）

### 查詢可用 Tags
✅ 執行：uv run scripts/list-tags.py --type domain
✅ 執行：uv run scripts/list-tags.py --type context
確認可用 tags：daily_life, casual, family, formal, humble_form

### 取得編號
✅ 執行：uv run scripts/get-next-number.py verb-u
取得編號：004, 005, 006, 007

### 更新索引
✅ 執行：uv run scripts/update-index.py verb-u
索引已更新：verb-u/index.md

## 遺漏卡片檢測（新功能）
檢測詞彙：7 個
- 已存在：3 個（meshiagaru, asagohan, tabemono）
- 新建立：4 個（itadaku, kuu, nomu, hakidasu）

建立的草稿卡片：
✅ verb-u/004_itadaku.md - 同義詞（謙讓語）- 極高優先級
✅ verb-u/005_kuu.md - 同義詞（粗俗）- 極高優先級
✅ verb-u/006_nomu.md - 相關詞（N5）- 高優先級
✅ verb-u/007_hakidasu.md - 反義詞 - 極高優先級

## 連結建立
搜尋範圍：120 張卡片
找到相關：15 張卡片
建立連結：12 個高優先級連結
更新卡片：13 張（包含雙向連結 + 新建立的草稿卡片）

高優先級連結：
- 同義詞：召し上がる、いただく（新）、食う（新）
- 反義詞：吐き出す（新）
- 主題相關：朝ごはん、食べ物、飲む（新）
- 延伸卡片：keigo、register

所有雙向連結已更新完成。

⚠️ 後續動作：
- 4 張草稿卡片需要審查和補充內容
- 草稿卡片已標記 draft: true 和 needs_review: true
- 草稿卡片列表已記錄在原卡片的 generated_cards 欄位
- 所有分類索引已使用 update-index.py 更新
```

## 進階功能（可選）

如果時間允許，可以執行以下進階任務：

### 連結品質檢查
- 檢查現有卡片的連結是否完整
- 識別可能遺漏的重要連結
- 清理無效或斷裂的連結

### 連結網絡視覺化
- 分析卡片之間的連結密度
- 識別孤立卡片（沒有連結）
- 識別過度連結的卡片

### 主題群組發現
- 通過連結分析發現自然形成的主題群組
- 建議建立主題索引卡片
- 優化連結結構

但這些都是可選的，主要任務還是建立基本的、高品質的連結。

---

## 新增待辦卡片到工作清單

**重要**：Linking 階段完成後，如果識別了遺漏的卡片（草稿卡片），必須將這些需求新增到 CSV 工作清單。

### 使用 add_pending_cards.py 腳本

Linking 階段可能會識別兩類待辦卡片：

1. **草稿卡片**：已建立基本結構，但需要補充完整內容
2. **缺口卡片**：發現連結斷裂或參考缺失，但未建立草稿

#### 場景 1：新增草稿卡片（需要補充內容）

先建立 JSON 檔案（如 `/tmp/linking-cards.json`）：

```json
[
  {
    "category": "verb-u",
    "number": "017",
    "japanese": "いただく",
    "chinese": "吃／收到（謙讓語）",
    "jlpt": "n4",
    "priority": "High",
    "source": "v1.0.6-linking",
    "note": "從 001_taberu 連結時建立草稿，需補充完整內容",
    "stage": "draft"
  },
  {
    "category": "verb-u",
    "number": "018",
    "japanese": "食う",
    "chinese": "吃（粗俗）",
    "jlpt": "n3",
    "priority": "Medium",
    "source": "v1.0.6-linking",
    "note": "從 001_taberu 連結時建立草稿，需補充完整內容",
    "stage": "draft"
  }
]
```

**注意**：
- `stage: "draft"` 表示已有草稿，需要補充內容
- `stage: "pending"` 表示尚未建立，需要從頭建立（預設值）

批次新增：

```bash
uv run scripts/add_pending_cards.py batch --from-json /tmp/linking-cards.json
```

#### 場景 2：新增缺口卡片（尚未建立）

```json
[
  {
    "category": "noun",
    "number": "045",
    "japanese": "朝ごはん",
    "chinese": "早餐",
    "jlpt": "n5",
    "priority": "Critical",
    "source": "v1.0.6-linking",
    "note": "從多張卡片引用但尚未建立"
  }
]
```

### 優先級設定建議

根據卡片缺口類型設定優先級：

| 缺口類型 | 優先級 | 理由 |
|---------|-------|------|
| **高頻引用詞彙**（被 5+ 張卡片引用） | **Critical** | 核心詞彙，影響連結網絡完整性 |
| **JLPT N5 基礎詞彙** | **Critical** | 學習基礎 |
| **同義詞/反義詞** | **High** | 語義對比重要 |
| **草稿卡片**（已建立基本結構） | **High** | 已有基礎，快速完成 |
| **相關詞彙**（一般關聯） | **Medium** | 擴充詞彙網絡 |
| **進階用法詞彙** | **Low** | 進階學習者需求 |

### 追蹤草稿卡片

如果在 Linking 階段建立了草稿卡片，應該在工作清單中標記它們：

```bash
# 查詢所有草稿階段的卡片
uv run scripts/get_pending_cards.py --stage draft --format text

# 輸出範例：
# ID: 268 | verb-u | verb-u/017_itadaku.md | いただく | 吃／收到（謙讓語） | JLPT: n4 | High | draft
# ID: 269 | verb-u | verb-u/018_kuu.md | 食う | 吃（粗俗） | JLPT: n3 | Medium | draft
```

---

## 工作流程總結

Linking 代理人的完整工作流程：

1. **接收新卡片** - 讀取並分析新建立的卡片
2. **搜尋相關卡片** - 使用 YAML frontmatter 搜尋整個卡片庫
3. **建立連結** - 識別高優先級連結並更新雙向連結
4. **檢測缺口** - 發現引用但不存在的詞彙
5. **建立草稿卡片**（可選） - 為缺口詞彙建立基本結構
6. **整理待辦清單** - 將草稿卡片和缺口卡片整理成 JSON
7. **新增到 CSV** - 使用 `add_pending_cards.py` 批次新增
8. **驗證結果** - 使用 `manage_worklog_cards.py stats` 查看更新後統計

### 範例輸出報告

```markdown
## Linking 完成報告

### 分析來源
- 新卡片：verb-ru/001_taberu.md

### 連結建立（12 個）

1. ✅ **同義詞連結**（3 個）- 召し上がる、いただく、食う
2. ✅ **反義詞連結**（1 個）- 吐き出す
3. ✅ **相關詞連結**（6 個）- 朝ごはん、食べ物、飲む等
4. ✅ **延伸卡片連結**（2 個）- keigo、register

### 識別的缺口（4 張）

#### 已建立草稿（2 張）
1. ✅ **いただく** (High) - 草稿已建立，需補充完整內容
2. ✅ **食う** (Medium) - 草稿已建立，需補充完整內容

#### 尚未建立（2 張）
1. ❌ **朝ごはん** (Critical) - N5 基礎詞彙，被 3 張卡片引用
2. ❌ **吐き出す** (Medium) - 反義詞，需要建立

### 新增到工作清單

✅ 已執行：
```bash
uv run scripts/add_pending_cards.py batch --from-json /tmp/linking-cards.json
```

✅ 新增結果：
- 成功新增 4 張卡片到 CSV
- 草稿卡片：2 張（stage: draft）
- 待建立卡片：2 張（stage: pending）
- 新卡片 ID: 268-271

✅ 更新後統計：
```bash
uv run scripts/manage_worklog_cards.py stats
```
- 總卡片數：271（+4）
- 草稿階段：2
- 待建立：211（+2）
```

---

## 與 create-card 代理人的協作

### 草稿卡片的處理流程

1. **Linking 代理人**：建立草稿卡片（基本 YAML frontmatter）
2. **新增到 CSV**：使用 `add_pending_cards.py`，設定 `stage: "draft"`
3. **主線程**：使用 `get_pending_cards.py --stage draft` 查詢草稿卡片
4. **create-card 代理人**：接收草稿卡片，補充完整內容
5. **更新進度**：使用 `update_card_progress.py --stage completed`

### 草稿卡片與新建卡片的差異

| 項目 | 草稿卡片 | 新建卡片 |
|------|---------|---------|
| **YAML frontmatter** | ✅ 已建立 | ❌ 需建立 |
| **檔案路徑** | ✅ 已存在 | ❌ 需建立 |
| **編號** | ✅ 已分配 | ❌ 需使用 get-next-number.py |
| **工作量** | 🟡 中等（補充內容） | 🔴 較大（從頭建立） |
| **CSV stage** | `draft` | `pending` |

create-card 代理人處理草稿卡片時：
- ✅ 跳過「取得編號」步驟（已有編號）
- ✅ 跳過「建立檔案」步驟（檔案已存在）
- ✅ 讀取現有 YAML frontmatter
- ✅ 補充三語解釋、例句、詳細說明
- ✅ 更新索引
- ✅ 更新 CSV 狀態為 `completed`
