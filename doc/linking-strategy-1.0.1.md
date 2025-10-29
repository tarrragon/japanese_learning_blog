# Linking Strategy - v1.0.1
## 連結建立策略

**階段**: Stage 3 - Linking
**日期**: 2025-10-28
**範圍**: 31 張草稿卡片

---

## 連結類型定義

### 1. 內文連結 (Inline Links)
在卡片正文中，當提及其他概念時添加 wikilink：
- 文法形式：`[[grammar/007_masu_form|ます形]]`
- 動詞：`[[verb-u/002_nomu|飲む]]`
- 助詞：`[[particle/001_ga|が]]`
- 敬語：`[[honorific/002_ossharu_mousu|おっしゃる]]`

### 2. 相關連結區塊 (Related Links Section)
每張卡片末尾的「相關連結」區塊，分類列出：
- 相關文法
- 相關動詞
- 相關助詞
- 相關敬語
- 比較卡片

### 3. 待建立連結 (Pending Links)
對於 Extension-Review 中識別但尚未建立的卡片，標註為：
- `[[particle/006_wa|は]]`（待建立）
- 或使用註釋：`<!-- TODO: Link to particle/006_wa when created -->`

---

## 連結原則

### 必須添加連結的情況

1. **首次提及重要概念**
   - 第一次提到其他文法形式、動詞、助詞時
   - 例：「與**[[particle/001_ga|が]]**的區別」

2. **對比說明**
   - 說明兩個概念的差異時
   - 例：「**[[grammar/007_masu_form|ます形]]** vs **[[grammar/010_dictionary_form|辞書形]]**」

3. **派生關係**
   - 說明某概念源自另一概念時
   - 例：「從**[[grammar/007_masu_form|ます形]]**的語幹加上たい」

4. **相關連結區塊**
   - 所有提及的相關卡片都應列出

### 不需要重複連結

1. **同一概念多次出現**
   - 在同一段落或區塊中，相同概念只在首次出現時加連結
   - 避免過度連結造成閱讀困擾

2. **例句中的概念**
   - 例句主要用於示範，通常不加連結
   - 除非例句是用來對比說明

---

## 連結語法規範

### Wikilink 格式
```markdown
[[path/filename|display_text]]
```

### 路徑結構
- Grammar: `[[grammar/007_masu_form|ます形]]`
- Particle: `[[particle/001_ga|が]]`
- Verb-ru: `[[verb-ru/003_miru|見る]]`
- Verb-u: `[[verb-u/002_nomu|飲む]]`
- Verb-irr: `[[verb-irr/001_suru|する]]`
- Honorific: `[[honorific/002_ossharu_mousu|おっしゃる・申す]]`
- Comparison: `[[comparison/001_masu_vs_dictionary|ます形 vs 辞書形]]`

### 顯示文字
- 使用日文：`[[grammar/007_masu_form|ます形]]`
- 使用中文描述：`[[grammar/007_masu_form|禮貌形]]`
- 使用完整標題：`[[honorific/002_ossharu_mousu|おっしゃる・申す]]`

---

## 實施計劃

### Phase 1: Particle Cards (4 張)
**檔案**:
1. particle/001_ga.md
2. particle/003_kara.md
3. particle/004_de.md
4. particle/005_to.md

**重點連結**:
- 與 は、を、に 的對比（標註待建立）
- 與文法形式的搭配
- 相關動詞用法

### Phase 2: Grammar Cards (9 張)
**檔案**:
1. grammar/007_masu_form.md
2. grammar/008_nai_form.md
3. grammar/009_ta_form.md
4. grammar/010_dictionary_form.md
5. grammar/011_potential_form.md
6. grammar/012_passive_form.md
7. grammar/013_causative_form.md
8. grammar/014_ato_de.md
9. grammar/015_te_kara.md

**重點連結**:
- 動詞分類（一段動詞、五段動詞）
- 派生文法（たい形、ましょう形等，標註待建立）
- 互相引用的文法形式

### Phase 3: Ichidan Verb Cards (7 張)
**檔案**:
1. verb-ru/003_miru.md
2. verb-ru/004_neru.md
3. verb-ru/005_okiru.md
4. verb-ru/006_kiru.md
5. verb-ru/007_deru.md
6. verb-ru/008_dekakeru.md
7. verb-ru/009_kangaeru.md

**重點連結**:
- 文法形式（て形、ます形、可能形等）
- 反義動詞（標註待建立）
- 相似動詞對比

### Phase 4: Godan Verb Cards (8 張)
**檔案**:
1. verb-u/002_nomu.md
2. verb-u/003_yomu.md
3. verb-u/004_kaku.md
4. verb-u/005_kiku.md
5. verb-u/007_hanasu.md
6. verb-u/006_kau.md
7. verb-u/008_aruku.md
8. verb-u/009_iku.md

**重點連結**:
- 文法形式
- 敬語形式
- 五段動詞系統

### Phase 5: Honorific Cards (4 張)
**檔案**:
1. honorific/002_ossharu_mousu.md
2. honorific/003_irassharu_mairu.md
3. honorific/004_nasaru_itasu.md
4. honorific/005_goran_haiken.md

**重點連結**:
- 基本動詞形式（標註待建立：する、来る、いる等）
- 敬語系統（grammar/005_keigo_system.md）
- 敬語文法模式（標註待建立）

---

## 品質檢查清單

每張卡片完成後檢查：

- [ ] 所有「相關連結」區塊的引用都使用 wikilink 格式
- [ ] 重要概念首次提及時有內文連結
- [ ] 對比說明處有雙向連結
- [ ] 派生關係清楚標示
- [ ] 待建立的卡片有適當標註
- [ ] 連結路徑正確（符合 zettelkasten 結構）
- [ ] 顯示文字清晰易懂
- [ ] 無重複過度的連結

---

## 預期成果

### 連結數量預估
- **總連結數**: 150-200 個 wikilinks
- **每卡平均**: 5-7 個連結
- **待建立標註**: 40-50 個

### 連結網絡
- Particle cards: 互相引用 + 文法引用
- Grammar cards: 密集互連 + 動詞示範
- Verb cards: 文法形式 + 相似動詞
- Honorific cards: 基本動詞 + 敬語系統

---

## 實施步驟

1. **讀取卡片** - 了解現有內容和引用
2. **識別連結點** - 找出應添加連結的位置
3. **添加內文連結** - 在正文中適當位置添加 wikilink
4. **更新相關連結區塊** - 確保所有引用使用正確格式
5. **標註待建立** - 對 Extension-Review 中的卡片標註
6. **品質檢查** - 確認連結正確且適量
7. **提交變更** - 分批提交，每批 5-10 張卡片

---

## 注意事項

1. **保持原有內容** - 只添加連結，不改動原文
2. **連結準確性** - 確保路徑和檔名正確
3. **閱讀流暢性** - 避免過度連結影響閱讀
4. **一致性** - 相同概念使用相同的連結方式
5. **文檔化** - 記錄重要的連結決策

---

## 工具與方法

### 自動化協助
- 使用 Agent 協助識別應連結的概念
- 批次處理同類型卡片
- 模式匹配找出常見引用

### 手動檢查
- 驗證連結準確性
- 確認語義正確
- 調整顯示文字

---

## 完成標準

Stage 3: Linking 完成條件：
1. ✅ 所有 31 張卡片都添加了適當的 wikilinks
2. ✅ 相關連結區塊格式統一且完整
3. ✅ 待建立的卡片有清楚標註
4. ✅ 連結網絡形成，卡片之間互相引用
5. ✅ 通過品質檢查
6. ✅ 所有變更已提交並推送

完成後，v1.0.1 的 31 張卡片將形成一個緊密連結的知識網絡，為後續的學習和擴展奠定基礎。
