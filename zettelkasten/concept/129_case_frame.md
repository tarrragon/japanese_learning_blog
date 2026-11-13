---
title: "格框架（かくわくぐみ）"
description: "描述動詞所需格助詞與語意角色的結構框架"
type: concept
jlpt: none
stage: extension-review
tags:
  - linguistics
  - grammar_theory
  - syntax
created: 2025-12-26
updated: 2025-12-26
version_history:
  - version: "1.5.0"
    stage: "draft"
    date: 2025-12-26
content_verification:
  japanese: true
  english: true
  chinese: true
  examples_count: 0
  pending_links: []
link_status:
  incoming: 0
  outgoing: 0
  pending: 0
  verified_date: 2025-12-26
---
語言學中用於描述動詞與其論元（argument）之間語法與語意關係的理論框架。

<!--more-->

## 日文

格框架（かくわくぐみ）

### 概念情報

| 項目 | 內容 |
|------|------|
| 日文名稱 | 格框架 |
| 讀音 | かくわくぐみ |
| 英文 | Case Frame |
| 領域 | 語言學、計算語言學 |
| 適用範圍 | 動詞語法分析 |

## 日文解釋

格框架とは、動詞が必要とする格助詞とその意味役割を体系的に記述する言語学的枠組みである。

日本語において、動詞は特定の格助詞（が、を、に、で等）と結びつき、それぞれの格が特定の意味役割（動作主、対象、受益者等）を担う。例えば「食べる」という動詞の格框架は「XがYを食べる」と表現され、「が」格が動作主、「を」格が対象を示す。

この概念は特に計算言語学や自然言語処理において重要で、文の構造を正確に解析し、意味を理解するための基礎となる。格框架理論により、動詞の振る舞いを予測可能な形で記述でき、言語学習者にとっても動詞の使い方を体系的に理解する助けとなる。

格の種類には、必須格（必ず出現しなければならない格）と任意格（省略可能な格）があり、文脈や動詞の性質によって決まる。

## 英文解釋

A case frame is a linguistic framework that systematically describes the case particles required by a verb and their associated semantic roles.

In Japanese, verbs combine with specific case particles (が, を, に, で, etc.), where each case carries a particular semantic role (agent, patient, beneficiary, etc.). For example, the case frame for the verb 食べる (to eat) can be represented as "X が Y を食べる," where the が-case indicates the agent and the を-case indicates the patient.

This concept is particularly important in computational linguistics and natural language processing, serving as a foundation for accurately parsing sentence structure and understanding meaning. Case frame theory enables predictable description of verb behavior and helps language learners systematically understand verb usage.

Cases are classified into obligatory cases (cases that must appear) and optional cases (cases that can be omitted), determined by context and the nature of the verb.

## 中文解釋

格框架是語言學中系統性描述動詞所需格助詞及其語意角色的理論框架。

在日文中，動詞與特定的格助詞（が、を、に、で等）結合，每個格承擔特定的語意角色（施事者、受事者、受益者等）。例如，動詞「食べる」的格框架可表示為「XがYを食べる」，其中「が」格表示施事者，「を」格表示受事者。

此概念在計算語言學和自然語言處理領域特別重要，是準確解析句子結構和理解語意的基礎。格框架理論使動詞行為能以可預測的方式描述，對語言學習者而言也有助於系統性地理解動詞用法。

格的種類包括必須格（必須出現的格）和任意格（可省略的格），由上下文和動詞性質決定。

## 核心用法

### 用法 1：描述基本格框架

動詞的格框架通常表示為「X が Y を V」的形式。

**例句 1**
```
「食べる」の格框架：X が Y を食べる
The case frame of "taberu": X ga Y wo taberu
「食べる」的格框架：X が Y を食べる
```

**例句 2**
```
「与える」の格框架：X が Y に Z を与える
The case frame of "ataeru": X ga Y ni Z wo ataeru
「與える」的格框架：X が Y に Z を與える
```

### 用法 2：區分必須格與任意格

必須格是句子成立所必需的，任意格則可省略。

**例句 3**
```
「行く」の必須格は「が」で、「に」は任意格である
The obligatory case of "iku" is "ga", while "ni" is optional
「行く」的必須格是「が」，「に」是任意格
```

**例句 4**
```
格框架分析により、この動詞には三つの格が必要だとわかる
Case frame analysis reveals that this verb requires three cases
透過格框架分析，可知此動詞需要三個格
```

### 用法 3：語意角色標註

每個格對應特定的語意角色。

**例句 5**
```
格框架では「が」格が動作主の役割を果たす
In the case frame, the "ga"-case functions as the agent role
在格框架中，「が」格承擔施事者的角色
```

## 理論背景

### 格理論的發展

格框架理論源於查爾斯·菲爾莫爾（Charles Fillmore）的格語法（Case Grammar），後來在日本語言學中得到發展和應用，特別是在日語動詞分析和計算語言學領域。

### 在日語研究中的應用

日語的格助詞系統使格框架理論特別適用於日語分析。透過格框架，可以清晰地描述動詞的論元結構，對於自然語言處理系統（如機器翻譯、資訊提取）至關重要。

### 與其他理論的關聯

格框架理論與配價理論（Valency Theory）、論元結構理論（Argument Structure Theory）密切相關，共同構成現代語法理論的重要組成部分。

## 學習要點

1. **核心概念**：格框架描述動詞與格助詞及語意角色的關係
2. **實用價值**：幫助理解動詞的句法行為和語意結構
3. **必須格 vs 任意格**：區分動詞所需的必要成分和可選成分
4. **語意角色**：每個格對應特定的語意功能（施事、受事等）
5. **應用領域**：語言學研究、NLP、語言教學都廣泛應用此理論

## 相關連結

### 格助詞系統
- [001_ga.md](../particle/001_ga.md) - が格的用法（待建立）
- [002_wo.md](../particle/002_wo.md) - を格的用法（待建立）
- [003_ni.md](../particle/003_ni.md) - に格的用法（待建立）

### 語言學理論
- [070_valency.md](070_valency.md) - 配價理論（待建立）
- [071_argument_structure.md](071_argument_structure.md) - 論元結構（待建立）
- [072_semantic_role.md](072_semantic_role.md) - 語意角色理論（待建立）

### 動詞分析
- [073_verb_classification.md](073_verb_classification.md) - 動詞分類系統（待建立）
- [074_transitivity.md](074_transitivity.md) - 及物性分析（待建立）

---

**建立日期**: 2025-12-26
**最後更新**: 2025-12-26
**字數**: ~1,200
**例句數**: 5
