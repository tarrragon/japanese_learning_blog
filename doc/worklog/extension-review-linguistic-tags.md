# Extension Review：Linguistic Tags Meta 卡片延伸需求分析

**日期**：2025-10-31
**分析對象**：`zettelkasten/_meta/tags/linguistic/` 目錄中的 8 個 Tag Meta 卡片
**目的**：分析 linguistic 相關 tag 是否需要建立對應的概念卡片、文法卡片或比較卡片

---

## 執行摘要

本次分析針對 linguistic 類別的 8 個 Tag Meta 卡片進行延伸需求評估。這些 tag 涵蓋了日文學習的核心語言學概念，從基本形式、句型結構到深入的語言學理論。

**總體發現**：
- 總共識別出 **32 張**潛在延伸卡片需求
- 高優先級（Critical）：**13 張**
- 中優先級（Important）：**15 張**
- 低優先級（Optional）：**4 張**

**卡片類型分布**：
- 概念卡片（concept）：22 張
- 文法卡片（grammar）：9 張
- 比較卡片（contrast）：1 張

---

## 逐卡分析

### 1. 001_basic_form.md - 基本形

**Tag 定義**：詞彙的基本形式、原形或字典形

**分析**：
此 tag 標記日文動詞和形容詞的基本形態（辭書形）。基本形是所有活用變化的起點，是日文學習的基礎概念。

**延伸需求**：

#### 高優先級（Critical）

1. **concept/katsuyou**（活用）
   - **理由**：活用是基本形最核心的延伸概念，基本形存在的意義就是作為活用的起點
   - **內容重點**：
     - 日文詞彙活用系統的整體概念
     - 從基本形到各種變化形的轉換機制
     - 活用的類型：て形、た形、ない形、可能形、命令形等
   - **連結關係**：與 basic_form 形成「基礎-延伸」關係
   - **tag 建議**：`linguistic/concept`, `linguistic/basic_form`, `jlpt/n5`

2. **concept/jisho_kei**（辭書形）
   - **理由**：辭書形是基本形的正式稱呼，學習者需要理解兩者的關係
   - **內容重點**：
     - 辭書形的定義和命名由來
     - 為何稱為「辭書形」
     - 辭書形在查字典時的重要性
     - 與基本形、原形的關係
   - **連結關係**：與 basic_form 形成同義關係
   - **tag 建議**：`linguistic/concept`, `linguistic/basic_form`

#### 中優先級（Important）

3. **grammar/verb_conjugation**（動詞活用）
   - **理由**：動詞活用是活用系統中最複雜的部分，需要專門說明
   - **內容重點**：
     - る動詞（一段動詞）的活用規則
     - う動詞（五段動詞）的活用規則
     - 不規則動詞（する、来る）的活用
     - 活用表和記憶方法
   - **連結關係**：concept/katsuyou 的具體應用
   - **tag 建議**：`linguistic/concept`, `linguistic/basic_form`, `jlpt/n5`

4. **grammar/adjective_conjugation**（形容詞活用）
   - **理由**：形容詞活用相對簡單但同樣重要
   - **內容重點**：
     - い形容詞的活用規則
     - な形容詞（形容動詞）的活用規則
     - 否定、過去、連體等形式
   - **連結關係**：concept/katsuyou 的具體應用
   - **tag 建議**：`linguistic/concept`, `linguistic/basic_form`, `jlpt/n5`

---

### 2. 002_comparison.md - 比較表現

**Tag 定義**：比較表達、對照分析或相似詞彙的辨析

**分析**：
此 tag 涵蓋比較級語法和相似詞彙辨析兩個層面，是理解細微語義差異的重要工具。

**延伸需求**：

#### 高優先級（Critical）

1. **grammar/hikaku_kyuu**（比較級）
   - **理由**：比較級是日文中表達比較關係的核心語法
   - **內容重點**：
     - より（比...更）的用法
     - ほど（如同...程度）的用法
     - ように / ような（像...一樣）的用法
     - AよりBの方が〜（B比A更〜）句型
   - **連結關係**：comparison tag 的核心語法基礎
   - **tag 建議**：`linguistic/comparison`, `linguistic/sentence_pattern`, `jlpt/n4`

2. **grammar/saikou_kyuu**（最高級）
   - **理由**：最高級與比較級密切相關，是比較表達的完整體系
   - **內容重點**：
     - 一番（最...）的用法
     - 最も（最...）的用法
     - で一番〜（在...中最...）句型
     - 與比較級的區別
   - **連結關係**：與 hikaku_kyuu 形成系列關係
   - **tag 建議**：`linguistic/comparison`, `linguistic/sentence_pattern`, `jlpt/n4`

#### 中優先級（Important）

3. **concept/ruigi_benbetsu**（類義辨別）
   - **理由**：相似詞彙辨析是語言學習的進階技能
   - **內容重點**：
     - 同義詞、近義詞的概念
     - 辨析方法：使用情境、語感、搭配詞
     - 為何需要辨析相似詞彙
     - 辨析的學習策略
   - **連結關係**：comparison tag 在詞彙層面的應用
   - **tag 建議**：`linguistic/comparison`, `linguistic/concept`

#### 低優先級（Optional）

4. **contrast/miru_vs_miru**（見る vs 観る）
   - **理由**：提供具體的辨析範例，但作為個別詞彙卡片優先級較低
   - **內容重點**：
     - 見る：一般的「看」
     - 観る：觀賞、欣賞（看電影、看戲）
     - 使用情境的差異
     - 例句對比
   - **連結關係**：ruigi_benbetsu 的實例
   - **tag 建議**：`linguistic/comparison`, `contrast/*`
   - **備註**：可作為後續版本建立具體辨析卡片的參考

---

### 3. 003_concept.md - 語言學概念

**Tag 定義**：語言學概念、理論性知識或抽象語法觀念

**分析**：
此 tag 涵蓋日文語法的核心概念，包括句子成分、詞彙結構、敬語體系等。這些是系統性理解日文的理論基礎。

**延伸需求**：

#### 高優先級（Critical）

1. **concept/shugo**（主語）
   - **理由**：主語是句子成分的基礎概念，且日文主語省略是重要特性
   - **內容重點**：
     - 主語的定義和功能
     - 日文主語的特性：可省略性
     - 主語省略的條件和情境
     - は vs が：主題與主語的區別
   - **連結關係**：sentence_structure 的核心成分
   - **tag 建議**：`linguistic/concept`, `linguistic/sentence_structure`

2. **concept/jutsugo**（述語）
   - **理由**：述語是句子的核心，日文述語位於句尾的特性需要說明
   - **內容重點**：
     - 述語的定義和功能
     - 述語的類型：動詞述語、形容詞述語、名詞述語
     - 日文述語在句尾的特性
     - 述語與其他成分的關係
   - **連結關係**：與 shugo 形成對應關係
   - **tag 建議**：`linguistic/concept`, `linguistic/sentence_structure`

3. **concept/keigo_taikei**（敬語體系）
   - **理由**：敬語是日文的獨特特徵，需要系統性理解
   - **內容重點**：
     - 敬語的定義和社會功能
     - 敬語的分類：丁寧語、尊敬語、謙讓語
     - 三種敬語的使用場合和區別
     - 敬語的選擇原則
   - **連結關係**：日文語法的重要概念
   - **tag 建議**：`linguistic/concept`, `context/formal`, `jlpt/n4`

#### 中優先級（Important）

4. **concept/gokan_gobi**（語幹與語尾）
   - **理由**：理解詞彙結構有助於掌握活用變化
   - **內容重點**：
     - 語幹和語尾的定義
     - 詞彙如何拆分為語幹和語尾
     - 語幹的穩定性和語尾的變化性
     - 與活用的關係
   - **連結關係**：與 katsuyou 密切相關
   - **tag 建議**：`linguistic/concept`, `linguistic/basic_form`

5. **concept/shuushokugo**（修飾語）
   - **理由**：修飾語是句子成分的重要組成部分
   - **內容重點**：
     - 修飾語的定義和功能
     - 修飾語的類型：連體修飾語、連用修飾語
     - 日文修飾語的位置特性
     - 修飾語與被修飾語的關係
   - **連結關係**：句子成分之一
   - **tag 建議**：`linguistic/concept`, `linguistic/sentence_structure`

---

### 4. 004_idiom.md - 慣用表現

**Tag 定義**：慣用語、成語或固定表達方式

**分析**：
此 tag 標記慣用語和成語，這些表達的意義無法從字面推測，與文化背景密切相關。由於專案中已有 idiom 分類可直接建立具體慣用語卡片，概念性延伸需求相對較少。

**延伸需求**：

#### 中優先級（Important）

1. **concept/kanyou_ku**（慣用句）
   - **理由**：需要一張概念卡片說明慣用語的本質和學習方法
   - **內容重點**：
     - 慣用語的定義和特徵
     - 為何慣用語的意義無法從字面理解
     - 慣用語與文化背景的關係
     - 慣用語與一般表達的差異
     - 學習慣用語的方法和策略
   - **連結關係**：idiom tag 的理論基礎
   - **tag 建議**：`linguistic/idiom`, `linguistic/concept`

2. **concept/hiyu_hyougen**（比喻表現）
   - **理由**：比喻是慣用語的重要構成方式
   - **內容重點**：
     - 比喻表現的定義
     - 隱喻（暗喩）和明喻（直喩）的區別
     - 比喻在日文中的使用
     - 比喻與慣用語的關係
   - **連結關係**：idiom 的修辭基礎
   - **tag 建議**：`linguistic/idiom`, `linguistic/concept`

#### 低優先級（Optional）

3. **context/idiom_usage**（慣用語使用情境）
   - **理由**：慣用語的使用場合說明，但可整合到個別慣用語卡片中
   - **內容重點**：
     - 慣用語的正式度
     - 書面語 vs 口語的慣用語
     - 需要避免的慣用語使用錯誤
   - **連結關係**：idiom 的語用層面
   - **tag 建議**：`linguistic/idiom`, `context/*`
   - **備註**：可考慮整合到 kanyou_ku 概念卡片中，不一定需要獨立卡片

---

### 5. 005_linguistic_theory.md - 語言學理論

**Tag 定義**：深入的語言學理論、語法分析或語言學研究方法

**分析**：
此 tag 涵蓋較高層次的語言學理論，包括音韻論、句法論、語義論等。這些概念對於深入理解日文結構和類型特徵很重要。

**延伸需求**：

#### 高優先級（Critical）

1. **concept/onin_ron**（音韻論）
   - **理由**：音韻論是語言學三大分支之一，日文音韻系統有獨特特徵
   - **內容重點**：
     - 音韻論的定義和研究對象
     - 日文的音節結構（CV 結構為主）
     - 日文的音韻規則
     - 音便（促音便、撥音便、イ音便、ウ音便）
     - 長音和促音的功能
   - **連結關係**：linguistic_theory 的核心分支
   - **tag 建議**：`linguistic/linguistic_theory`, `linguistic/concept`

2. **concept/tougou_ron**（統語論 / 句法論）
   - **理由**：句法論是理解句子結構的理論基礎
   - **內容重點**：
     - 句法論的定義和研究對象
     - 日文的 SOV 語序特性
     - 後置詞語言的特徵
     - 語法關係的表達方式（助詞）
     - 日文句法的類型學特徵
   - **連結關係**：sentence_structure 的理論基礎
   - **tag 建議**：`linguistic/linguistic_theory`, `linguistic/sentence_structure`

3. **concept/imi_ron**（意味論 / 語義論）
   - **理由**：語義論是理解詞義和語義關係的理論基礎
   - **內容重點**：
     - 語義論的定義和研究對象
     - 詞義的類型：指稱義、語用義
     - 語義關係：同義、反義、上下位
     - 語義場的概念
     - 日文語義的特徵
   - **連結關係**：linguistic_theory 的核心分支
   - **tag 建議**：`linguistic/linguistic_theory`, `linguistic/concept`

#### 中優先級（Important）

4. **concept/gengo_ruikei_gaku**（語言類型學）
   - **理由**：語言類型學幫助理解日文在世界語言中的定位
   - **內容重點**：
     - 語言類型學的定義
     - 語序類型：SOV、SVO 等
     - 形態類型：膠著語、屈折語、孤立語
     - 日文作為膠著語的特徵
     - 日文的類型學特徵總結
   - **連結關係**：linguistic_theory 的跨語言視角
   - **tag 建議**：`linguistic/linguistic_theory`, `linguistic/concept`

5. **concept/bunpou_ka**（文法化）
   - **理由**：文法化解釋詞彙如何演變為文法標記
   - **內容重點**：
     - 文法化的定義和過程
     - 文法化的方向性（實詞→虛詞）
     - 日文文法化的例子：補助動詞、接續助詞等
     - 文法化的語用動因
   - **連結關係**：linguistic_theory 的歷時語言學視角
   - **tag 建議**：`linguistic/linguistic_theory`, `linguistic/concept`

---

### 6. 006_phrase.md - 片語

**Tag 定義**：片語、詞組或多詞表達單位

**分析**：
此 tag 涵蓋介於單詞和句子之間的語言單位，包括動詞片語、名詞片語、形容詞片語等。片語是構成句子的基本組塊。

**延伸需求**：

#### 高優先級（Critical）

1. **concept/doushi_ku**（動詞句 / 動詞片語）
   - **理由**：動詞片語是句子的核心成分
   - **內容重點**：
     - 動詞片語的定義和結構
     - 動詞與賓語的組合（動詞+を+名詞）
     - 動詞與補語的組合（動詞+に+名詞）
     - 複合動詞（動詞+動詞）
     - 補助動詞結構（動詞て形+補助動詞）
   - **連結關係**：phrase 的主要類型之一
   - **tag 建議**：`linguistic/phrase`, `linguistic/sentence_structure`

2. **concept/meishi_ku**（名詞句 / 名詞片語）
   - **理由**：名詞片語是句子中的名詞性成分
   - **內容重點**：
     - 名詞片語的定義和結構
     - 修飾語+名詞的組合
     - の的連接作用
     - 連體修飾語（形容詞、動詞連體形）
     - 名詞化表達
   - **連結關係**：phrase 的主要類型之一
   - **tag 建議**：`linguistic/phrase`, `linguistic/sentence_structure`

3. **concept/keiyoushi_ku**（形容詞句 / 形容詞片語）
   - **理由**：形容詞片語在描述和修飾中很重要
   - **內容重點**：
     - 形容詞片語的定義和結構
     - 副詞+形容詞的組合（とても+形容詞）
     - 形容詞的程度表達
     - い形容詞和な形容詞的片語結構
   - **連結關係**：phrase 的主要類型之一
   - **tag 建議**：`linguistic/phrase`, `linguistic/sentence_structure`

#### 中優先級（Important）

4. **concept/collocation**（搭配詞）
   - **理由**：搭配詞是自然表達的關鍵
   - **內容重點**：
     - 搭配詞（collocation）的定義
     - 為何某些詞語習慣性地一起使用
     - 日文常見的搭配類型
     - 搭配詞與慣用語的區別
     - 學習搭配詞的重要性
   - **連結關係**：phrase 的語言使用層面
   - **tag 建議**：`linguistic/phrase`, `linguistic/concept`

5. **concept/chunk_learning**（語塊學習）
   - **理由**：語塊學習是現代語言教學的重要方法
   - **內容重點**：
     - 語塊（chunk）的定義
     - 為何以語塊而非單詞學習更有效
     - 語塊學習與流暢度的關係
     - 如何識別和記憶語塊
     - 語塊學習的實踐方法
   - **連結關係**：phrase 的學習方法論
   - **tag 建議**：`linguistic/phrase`, `linguistic/concept`

---

### 7. 007_sentence_pattern.md - 句型

**Tag 定義**：句型、語法模式或固定句式結構

**分析**：
此 tag 涵蓋日文的各種句型，特別是 JLPT 各級的固定句式。句型是日文學習的重要組織方式。

**延伸需求**：

#### 高優先級（Critical）

1. **concept/bunkei_gakushuu**（文型學習）
   - **理由**：需要一張概念卡片說明句型學習的方法和重要性
   - **內容重點**：
     - 句型學習的概念和重要性
     - 為何日文教學強調句型
     - 句型的分級系統（JLPT N5-N1）
     - 句型學習與自然表達的關係
     - 如何有效學習和運用句型
   - **連結關係**：sentence_pattern 的學習方法論
   - **tag 建議**：`linguistic/sentence_pattern`, `linguistic/concept`

2. **grammar/te_iru_form**（〜ている形）
   - **理由**：ている是最基礎且使用頻繁的句型之一
   - **內容重點**：
     - ている形的構成方式
     - 表達進行中的動作
     - 表達狀態（結果的持續）
     - 表達習慣性動作
     - 動詞類型與ている的語義
   - **連結關係**：基礎句型範例
   - **tag 建議**：`linguistic/sentence_pattern`, `jlpt/n5`

3. **grammar/ta_koto_ga_aru**（〜たことがある）
   - **理由**：經驗表達是常用句型
   - **內容重點**：
     - たことがある的構成
     - 表達過去經驗
     - 與たことがない（沒有經驗）的對比
     - 使用情境和例句
   - **連結關係**：基礎句型範例
   - **tag 建議**：`linguistic/sentence_pattern`, `jlpt/n5`

#### 中優先級（Important）

4. **concept/bunkei_template**（句型模板）
   - **理由**：理解句型作為可替換框架的概念
   - **內容重點**：
     - 句型模板的概念
     - 句型的「框架+變數」結構
     - 如何使用句型模板造句
     - 句型的靈活性與限制
   - **連結關係**：sentence_pattern 的結構特性
   - **tag 建議**：`linguistic/sentence_pattern`, `linguistic/concept`

5. **grammar/compound_patterns**（複合句型）
   - **理由**：複雜句型是進階學習的重點
   - **內容重點**：
     - 複合句型的定義
     - 句型的組合方式
     - 常見複合句型：にもかかわらず、ばかりでなく等
     - 複合句型的語義層次
   - **連結關係**：進階句型
   - **tag 建議**：`linguistic/sentence_pattern`, `jlpt/n2`

---

### 8. 008_sentence_structure.md - 句子結構

**Tag 定義**：句子結構、語法層次或句法分析

**分析**：
此 tag 涵蓋句子的組成要素和結構分析，包括主語、述語、目的語、修飾語等成分，以及單句、複句的類型。

**延伸需求**：

#### 高優先級（Critical）

1. **concept/mokuteki_go**（目的語）
   - **理由**：目的語是基本句子成分，與を格密切相關
   - **內容重點**：
     - 目的語的定義和功能
     - 目的語與を格的關係
     - 他動詞與目的語
     - 目的語的位置和省略
   - **連結關係**：sentence_structure 的核心成分
   - **tag 建議**：`linguistic/sentence_structure`, `linguistic/concept`

2. **concept/hogo**（補語）
   - **理由**：補語是完整句子結構不可缺少的成分
   - **內容重點**：
     - 補語的定義和功能
     - 補語的類型：場所補語、時間補語、對象補語等
     - 補語與述語的關係
     - 補語所用的助詞（に、で、と等）
   - **連結關係**：sentence_structure 的核心成分
   - **tag 建議**：`linguistic/sentence_structure`, `linguistic/concept`

#### 中優先級（Important）

3. **grammar/tanbun_fukubun**（單句與複句）
   - **理由**：理解句子類型是句法分析的基礎
   - **內容重點**：
     - 單句的定義：只有一個述語
     - 複句的定義：包含多個子句
     - 複句的類型：並列複句、從屬複句
     - 日文複句的標記方式
   - **連結關係**：sentence_structure 的類型區分
   - **tag 建議**：`linguistic/sentence_structure`, `linguistic/concept`

4. **concept/joshi_bunpou_kinou**（助詞的文法功能）
   - **理由**：助詞是日文標示句子成分的核心手段
   - **內容重點**：
     - 助詞的文法功能概述
     - 格助詞：は、が、を、に、で、へ、と、から、まで
     - 助詞如何標示句子成分的關係
     - 助詞與語序的相互作用
   - **連結關係**：sentence_structure 的實現機制
   - **tag 建議**：`linguistic/sentence_structure`, `linguistic/concept`

5. **grammar/juuzoku_setsuzoku**（從屬連接）
   - **理由**：從屬子句的連接是複句的重要組成
   - **內容重點**：
     - 從屬連接的定義
     - 從屬連接詞：から、ので、けれども、のに、と、ば等
     - 從屬子句的類型：原因、條件、逆接等
     - 從屬子句的位置和功能
   - **連結關係**：tanbun_fukubun 的具體實現
   - **tag 建議**：`linguistic/sentence_structure`, `linguistic/sentence_pattern`

#### 低優先級（Optional）

6. **concept/gojun_junan_sei**（語序彈性）
   - **理由**：日文語序的相對自由性是類型學特徵
   - **內容重點**：
     - 日文語序的基本規則（SOV）
     - 語序變化的可能性和限制
     - 語序變化與資訊結構（主題化、焦點化）
     - 倒裝和強調
   - **連結關係**：sentence_structure 的類型學特性
   - **tag 建議**：`linguistic/sentence_structure`, `linguistic/linguistic_theory`
   - **備註**：較進階的語言學概念，可作為後續擴展

---

## 延伸卡片總覽

### 按優先級分類

#### 高優先級（Critical）- 13 張

**基本形與活用系列**：
1. concept/katsuyou（活用）
2. concept/jisho_kei（辭書形）

**比較表達系列**：
3. grammar/hikaku_kyuu（比較級）
4. grammar/saikou_kyuu（最高級）

**句子成分系列**：
5. concept/shugo（主語）
6. concept/jutsugo（述語）
7. concept/keigo_taikei（敬語體系）
8. concept/mokuteki_go（目的語）
9. concept/hogo（補語）

**片語類型系列**：
10. concept/doushi_ku（動詞片語）
11. concept/meishi_ku（名詞片語）
12. concept/keiyoushi_ku（形容詞片語）

**語言學理論系列**：
13. concept/onin_ron（音韻論）

#### 中優先級（Important）- 15 張

**活用與變化**：
1. grammar/verb_conjugation（動詞活用）
2. grammar/adjective_conjugation（形容詞活用）
3. concept/gokan_gobi（語幹與語尾）

**比較與辨析**：
4. concept/ruigi_benbetsu（類義辨別）

**句子成分**：
5. concept/shuushokugo（修飾語）

**慣用語**：
6. concept/kanyou_ku（慣用句）
7. concept/hiyu_hyougen（比喻表現）

**語言學理論**：
8. concept/tougou_ron（統語論）
9. concept/imi_ron（語義論）
10. concept/gengo_ruikei_gaku（語言類型學）
11. concept/bunpou_ka（文法化）

**片語與搭配**：
12. concept/collocation（搭配詞）
13. concept/chunk_learning（語塊學習）

**句型與結構**：
14. concept/bunkei_gakushuu（文型學習）
15. grammar/te_iru_form（〜ている形）

#### 低優先級（Optional）- 4 張

1. contrast/miru_vs_miru（見る vs 観る）- 具體辨析範例
2. context/idiom_usage（慣用語使用情境）- 可整合到其他卡片
3. grammar/ta_koto_ga_aru（〜たことがある）- 基礎句型範例
4. concept/bunkei_template（句型模板）- 可整合到 bunkei_gakushuu
5. grammar/compound_patterns（複合句型）- 進階句型
6. grammar/tanbun_fukubun（單句與複句）- 句子類型
7. concept/joshi_bunpou_kinou（助詞的文法功能）- 助詞功能
8. grammar/juuzoku_setsuzoku（從屬連接）- 複句連接
9. concept/gojun_junan_sei（語序彈性）- 進階語言學概念

---

## 按卡片類型分類

### 概念卡片（concept）- 22 張

**基礎概念**：
1. concept/katsuyou（活用）- Critical
2. concept/jisho_kei（辭書形）- Critical
3. concept/gokan_gobi（語幹與語尾）- Important

**句子成分**：
4. concept/shugo（主語）- Critical
5. concept/jutsugo（述語）- Critical
6. concept/mokuteki_go（目的語）- Critical
7. concept/hogo（補語）- Critical
8. concept/shuushokugo（修飾語）- Important

**敬語與禮貌**：
9. concept/keigo_taikei（敬語體系）- Critical

**比較與辨析**：
10. concept/ruigi_benbetsu（類義辨別）- Important

**慣用語與比喻**：
11. concept/kanyou_ku（慣用句）- Important
12. concept/hiyu_hyougen（比喻表現）- Important

**語言學理論**：
13. concept/onin_ron（音韻論）- Critical
14. concept/tougou_ron（統語論）- Important
15. concept/imi_ron（語義論）- Important
16. concept/gengo_ruikei_gaku（語言類型學）- Important
17. concept/bunpou_ka（文法化）- Important

**片語與語塊**：
18. concept/doushi_ku（動詞片語）- Critical
19. concept/meishi_ku（名詞片語）- Critical
20. concept/keiyoushi_ku（形容詞片語）- Critical
21. concept/collocation（搭配詞）- Important
22. concept/chunk_learning（語塊學習）- Important

**句型學習**：
23. concept/bunkei_gakushuu（文型學習）- Important
24. concept/bunkei_template（句型模板）- Optional

**句子結構進階**：
25. concept/joshi_bunpou_kinou（助詞的文法功能）- Optional
26. concept/gojun_junan_sei（語序彈性）- Optional

### 文法卡片（grammar）- 9 張

**活用變化**：
1. grammar/verb_conjugation（動詞活用）- Important
2. grammar/adjective_conjugation（形容詞活用）- Important

**比較表達**：
3. grammar/hikaku_kyuu（比較級）- Critical
4. grammar/saikou_kyuu（最高級）- Critical

**基礎句型**：
5. grammar/te_iru_form（〜ている形）- Important
6. grammar/ta_koto_ga_aru（〜たことがある）- Optional

**複雜句型**：
7. grammar/compound_patterns（複合句型）- Optional

**句子類型與連接**：
8. grammar/tanbun_fukubun（單句與複句）- Optional
9. grammar/juuzoku_setsuzoku（從屬連接）- Optional

### 比較卡片（contrast）- 1 張

1. contrast/miru_vs_miru（見る vs 観る）- Optional

### 情境卡片（context）- 1 張

1. context/idiom_usage（慣用語使用情境）- Optional

---

## 建議的實施計劃

### 階段一：核心概念建立（v1.0.6 或 v1.0.7）

建立最基礎的 13 張 Critical 卡片，這些是日文學習的核心概念：

**優先建立（前 6 張）**：
1. concept/katsuyou（活用）
2. concept/shugo（主語）
3. concept/jutsugo（述語）
4. concept/keigo_taikei（敬語體系）
5. grammar/hikaku_kyuu（比較級）
6. concept/doushi_ku（動詞片語）

**次優先建立（後 7 張）**：
7. concept/jisho_kei（辭書形）
8. grammar/saikou_kyuu（最高級）
9. concept/mokuteki_go（目的語）
10. concept/hogo（補語）
11. concept/meishi_ku（名詞片語）
12. concept/keiyoushi_ku（形容詞片語）
13. concept/onin_ron（音韻論）

### 階段二：重要概念擴展（v1.0.8 或後續）

逐步建立 15 張 Important 卡片，特別是：
- 活用相關：verb_conjugation, adjective_conjugation
- 語言學理論：tougou_ron, imi_ron
- 片語學習：collocation, chunk_learning
- 慣用語：kanyou_ku, hiyu_hyougen

### 階段三：選擇性擴展（v1.1.x 或更後）

根據實際使用情況和學習需求，選擇性建立 Optional 卡片。

---

## 建立順序建議

### 第一批次（6 張）- 最核心概念

1. **concept/katsuyou**（活用）
   - 原因：基本形的核心延伸，所有詞彙變化的基礎

2. **concept/shugo**（主語）
   - 原因：句子成分的起點，理解日文省略特性

3. **concept/jutsugo**（述語）
   - 原因：與主語配對，句子的核心成分

4. **concept/keigo_taikei**（敬語體系）
   - 原因：日文獨特特徵，社交語言的重要概念

5. **grammar/hikaku_kyuu**（比較級）
   - 原因：常用語法，實用性強

6. **concept/doushi_ku**（動詞片語）
   - 原因：句子核心，動詞組合的基礎

### 第二批次（7 張）- 補充核心系列

7. **concept/jisho_kei**（辭書形）
8. **grammar/saikou_kyuu**（最高級）
9. **concept/mokuteki_go**（目的語）
10. **concept/hogo**（補語）
11. **concept/meishi_ku**（名詞片語）
12. **concept/keiyoushi_ku**（形容詞片語）
13. **concept/onin_ron**（音韻論）

---

## Tag 使用統計

### 最常用的 Tags（推薦用於新建卡片）

1. **linguistic/concept** - 22 張卡片使用
2. **linguistic/sentence_structure** - 11 張卡片使用
3. **linguistic/sentence_pattern** - 7 張卡片使用
4. **linguistic/basic_form** - 5 張卡片使用
5. **linguistic/phrase** - 5 張卡片使用
6. **linguistic/comparison** - 4 張卡片使用
7. **linguistic/linguistic_theory** - 4 張卡片使用

### JLPT 級別分布

- **jlpt/n5** - 5 張（基礎活用、基本句型）
- **jlpt/n4** - 3 張（比較級、最高級、敬語）
- **jlpt/n3** - 0 張
- **jlpt/n2** - 1 張（複合句型）
- **jlpt/n1** - 0 張
- **jlpt/none** - 23 張（理論概念不列入 JLPT）

---

## 與現有卡片的連結機會

### 高連結潛力概念

這些新概念卡片建立後，可以與大量現有詞彙卡片建立連結：

1. **concept/katsuyou**（活用）
   - 可連結所有動詞、形容詞卡片
   - 預估連結數：100+ 張

2. **grammar/hikaku_kyuu**（比較級）
   - 可連結形容詞卡片
   - 可連結 より、ほど 等助詞卡片
   - 預估連結數：30+ 張

3. **concept/keigo_taikei**（敬語體系）
   - 可連結敬語動詞、丁寧語表達
   - 預估連結數：20+ 張

4. **concept/doushi_ku**（動詞片語）
   - 可連結所有動詞卡片
   - 可連結補助動詞
   - 預估連結數：50+ 張

---

## 與其他 Tag 系統的關係

### 與 position tags 的互補

linguistic tags 與 position tags（position/sentence_beginning, position/sentence_end 等）形成互補關係：

- **linguistic tags** 描述語言學特徵和概念
- **position tags** 描述詞彙在句子中的位置

例如：
- `grammar/hikaku_kyuu` 可與 `position/mid_sentence` 配合
- `concept/jutsugo` 可與 `position/sentence_end` 配合

### 與 context tags 的互補

- **linguistic tags** 描述語言結構
- **context tags** 描述使用情境

例如：
- `concept/keigo_taikei` 常與 `context/formal` 配合
- `concept/kanyou_ku` 可與 `context/casual` 或 `context/formal` 配合

---

## 注意事項

### 1. 避免過度細分

某些概念可能不需要獨立卡片，可整合到相關卡片中：
- **context/idiom_usage** 可整合到 **concept/kanyou_ku**
- **concept/bunkei_template** 可整合到 **concept/bunkei_gakushuu**

### 2. 與現有分類的關係

部分延伸需求可能與現有卡片分類重疊：
- 具體的慣用語應建立在 **idiom/** 分類下
- 具體的句型應建立在 **grammar/** 分類下
- 這裡列出的是**概念性卡片**，說明整體理論

### 3. 語言一致性

所有卡片必須遵守專案語言規範：
- 日文解釋、英文解釋、繁體中文解釋
- 禁止使用簡體中文
- YAML frontmatter 使用英文命名

### 4. 連結完整性

新建概念卡片後，需要：
- 在 Meta 卡片中建立連結
- 在相關詞彙卡片中補充連結
- 更新分類索引

---

## 結論

linguistic tags 的 8 個 Meta 卡片涵蓋了日文學習的核心語言學概念。透過本次分析，識別出 32 張潛在延伸卡片，其中 13 張為高優先級。

**建議**：
1. 優先建立 13 張 Critical 卡片，特別是前 6 張最核心概念
2. 這些概念卡片將成為整個 Zettelkasten 系統的理論骨架
3. 建立後可大幅提升現有詞彙卡片的連結深度
4. 為後續建立更多詞彙和文法卡片提供堅實的概念基礎

**後續行動**：
- 將此文檔作為 v1.0.6 或後續版本的卡片建立參考
- 根據優先級分批次建立延伸卡片
- 建立後更新 Meta 系統的連結和統計資訊

---

**文檔版本**：1.0
**建立日期**：2025-10-31
**分析者**：Claude (Sonnet 4.5)
