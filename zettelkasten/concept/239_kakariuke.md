---
title: "係り受け（かかりうけ）"
description: "日文句子中修飾語與被修飾語之間的依存關係"
type: concept
subtype: syntax
jlpt: n3
stage: extension-review
draft: true
auto_generated: false
needs_review: true
tags:
  - grammar
  - 言語学的概念
created: 2025-12-28
updated: 2025-12-28

version_history:
  - version: "1.5.6"
    stage: "pending"
    date: 2025-12-28

content_verification:
  japanese: true
  english: true
  chinese: true
  examples_count: 5
  pending_links: []

link_status:
  incoming: 0
  outgoing: 0
  pending: 0
  verified_date: 2025-12-28
---

係り受け是日文語法學中描述句子成分之間修飾關係的核心概念。

<!--more-->

## 日文

係り受け（かかりうけ）

## 日文解釋

「係り受け」とは、文の中である語（係り）が別の語（受け）を修飾したり、意味的に関係したりする構造のことである。日本語では、修飾語は被修飾語の前に置かれるのが基本であり、この「係る」側と「受ける」側の関係を正しく理解することが、文の意味を正確に把握する上で極めて重要である。

例えば「赤い花」という表現では、「赤い」が「花」に係っている。また、「昨日買った本を読んだ」という文では、「昨日買った」が「本」に係り、「昨日買った本を」が「読んだ」に係っている。このように、係り受けは単語レベルから節レベルまで、様々な層で成立する。

係り受けの解析は、日本語の文法研究や自然言語処理においても重要な分析手法であり、文の構造を樹形図（依存木）として表現することができる。

## 英文解釋

"Kakariuke" refers to the dependency relationship between words in Japanese sentences, where a modifier (kakari) semantically depends on or modifies another word (uke). This concept is fundamental to understanding Japanese sentence structure.

In Japanese, modifiers typically precede the words they modify. The term literally means "modifying and receiving" - the modifier "hangs on" (kakaru) to the word that "receives" (ukeru) its modification. Understanding these relationships is essential for parsing complex sentences correctly.

This concept is particularly important in Japanese linguistics and natural language processing, as Japanese sentence structure differs significantly from English. While English often uses word order and prepositions to indicate relationships, Japanese relies heavily on particles and this modifier-modified structure.

## 中文解釋

「係り受け」是日文語法學中的核心概念，指的是句子中修飾語（係り）與被修飾語（受け）之間的依存關係。這個概念對於理解日文句子結構至關重要。

在日文中，修飾語通常放在被修飾語之前。例如：
- 「大きな家」中，「大きな」修飾「家」
- 「昨日会った人」中，「昨日会った」修飾「人」

係り受け分析可以幫助學習者：
1. 正確理解長句的結構
2. 避免修飾關係的誤解
3. 寫出結構清晰的日文句子

這個概念在日文教育、翻譯、以及自然語言處理等領域都有重要應用。透過依存樹（樹形圖）的方式，可以視覺化呈現句子成分之間的修飾關係。

## 核心用法

### 用法 1：名詞修飾（連體修飾）

修飾語直接修飾名詞，形成「連體修飾」關係。

**例句 1**
```
美しい花が咲いている。
Beautiful flowers are blooming.
美麗的花正在盛開。
```

**例句 2**
```
昨日買った本はとても面白かった。
The book I bought yesterday was very interesting.
昨天買的書非常有趣。
```

### 用法 2：動詞修飾（連用修飾）

副詞或副詞性表達修飾動詞，形成「連用修飾」關係。

**例句 3**
```
彼女は静かに本を読んでいる。
She is reading a book quietly.
她安靜地讀著書。
```

### 用法 3：複合係り受け（多層修飾）

多個修飾語形成層層嵌套的結構。

**例句 4**
```
去年東京で開催された国際会議に参加した研究者が発表した論文
The paper presented by a researcher who participated in the international conference held in Tokyo last year
去年在東京舉辦的國際會議上發表論文的研究者所提出的論文
```

**例句 5**
```
友達が作ってくれたケーキを食べた。
I ate the cake that my friend made for me.
我吃了朋友為我做的蛋糕。
```

## 係り受けの規則

### 規則 1：修飾語前置原則

日文的修飾語必須放在被修飾語之前。這是日文句法的基本規則。

```
✅ 大きい犬（大的狗）
❌ 犬大きい（狗大的）
```

### 規則 2：係り受け不交差原則

在標準日文中，係り受け關係不應該交叉。如果畫出依存線，這些線不應該相互交叉。

```
「彼が昨日買った本を読んだ」
彼が → 読んだ
昨日 → 買った
買った → 本
本を → 読んだ
（這些依存關係不交叉）
```

### 規則 3：就近原則

當存在歧義時，修飾語通常修飾最近的可修飾對象。

```
「赤い花と葉」
通常理解為：（赤い花）と葉 = 紅花和葉子
而非：赤い（花と葉）= 紅色的花和葉子
```

## 常見錯誤

### 錯誤 1：修飾語位置錯誤

❌ 誤：本を昨日買った読んだ。
✅ 正：昨日買った本を読んだ。
說明：修飾「本」的「昨日買った」必須放在「本」之前，形成完整的名詞短語後，再作為賓語出現。

### 錯誤 2：修飾關係歧義

❌ 誤：きれいな花瓶の花（歧義表達）
✅ 正：花瓶のきれいな花（清晰：漂亮的花在花瓶裡）
✅ 正：きれいな花瓶にある花（清晰：漂亮花瓶裡的花）
說明：當有多個可能的被修飾對象時，需要調整語序或增加助詞以消除歧義。

### 錯誤 3：過長的係り受け距離

❌ 誤：私が三年前に大学時代の友人から借りたまだ返していない本を読み終えた。
✅ 正：大学時代の友人から三年前に借りた本がある。まだ返していないが、ようやく読み終えた。
說明：修飾語與被修飾語距離過遠會造成理解困難，應該將長句拆分。

## 學習要點

1. **前置原則**：日文修飾語必須放在被修飾語之前，這與中文和英文的部分規則不同。

2. **識別核心詞**：在複雜句子中，先找出核心的主語和謂語，再分析修飾關係。

3. **畫依存樹**：初學階段可以嘗試畫出句子的依存樹，視覺化各成分間的關係。

4. **注意歧義**：當句子有多種解讀可能時，要考慮語境和常識來判斷正確的係り受け。

5. **控制距離**：寫作時避免過長的修飾關係，以提高句子的可讀性。

## 相關連結

### 基礎文法概念
- [主語](concept/011_shugo.md) - 句子主語概念（待建立）
- [述語](concept/012_jutsugo.md) - 句子謂語概念（待建立）
- [語順](concept/019_go_jun.md) - 日文語序規則（待建立）

### 修飾相關
- [連體修飾](grammar/rentai_shuushoku.md) - 名詞修飾（待建立）
- [連用修飾](grammar/renyou_shuushoku.md) - 動詞修飾（待建立）
- [形容詞](adj-i/index.md) - 常見修飾語類型（待建立）

### 進階概念
- [文構造](concept/bun_kouzou.md) - 日文句子結構（待建立）
- [依存文法](concept/izon_bunpou.md) - 依存文法理論（待建立）

---

**建立日期**: 2025-12-28
**最後更新**: 2025-12-28
**字數**: ~1,800
**例句數**: 5
