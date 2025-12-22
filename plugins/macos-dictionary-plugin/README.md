# macOS Dictionary Plugin for Claude Code

> **Platform**: macOS only

A Claude Code plugin that integrates with macOS built-in dictionaries to provide authoritative Japanese word lookups, including readings, parts of speech, and definitions.

## Features

- Query Japanese words from **Super Daijirin** (スーパー大辞林)
- Get English translations from **Wisdom Japanese-English Dictionary** (ウィズダム和英辞典)
- Query English-to-Japanese from **Wisdom English-Japanese Dictionary** (ウィズダム英和辞典)
- Support for Traditional Chinese dictionaries (optional)
- Structured JSON output for easy parsing
- Handles Chinese-Japanese shared kanji with smart detection

## System Requirements

| Requirement | Details |
|-------------|---------|
| OS | macOS 10.15+ |
| Python | 3.10+ |
| Package Manager | [uv](https://github.com/astral-sh/uv) |
| Dependencies | pyobjc-framework-DictionaryServices |

## Installation

### 1. Add the Marketplace

```bash
/plugin marketplace add your-username/japanese-learning-tools
```

### 2. Install the Plugin

```bash
/plugin install macos-dictionary-plugin@japanese-learning-tools
```

### 3. Enable macOS Dictionaries

1. Open **Dictionary.app** on your Mac
2. Go to **Dictionary** → **Preferences** (or press `⌘,`)
3. Enable the following dictionaries:
   - ✅ **スーパー大辞林** (Japanese-Japanese)
   - ✅ **ウィズダム和英辞典** (Japanese-English)
   - ✅ **ウィズダム英和辞典** (English-Japanese)
   - ✅ **國語辭典** (Traditional Chinese, optional)

### 4. Install uv (if not already installed)

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### 5. Verify Installation

```bash
uv run scripts/lookup-dictionary.py 食べる
```

## Usage

Once installed, Claude Code will automatically use this skill when you ask about:
- Japanese word readings (「食べる 怎麼唸」)
- Word definitions (「勉強 是什麼意思」)
- Parts of speech (「高い 的詞性」)
- English translations (「食べる 的英文」)

### Example Queries

```
查 食べる
查 高い
召し上がる 是什麼意思
```

### Direct Script Usage

```bash
# JSON output (default)
uv run scripts/lookup-dictionary.py 食べる

# Raw dictionary text
uv run scripts/lookup-dictionary.py 美しい --raw

# English word lookup
uv run scripts/lookup-dictionary.py "national debt"
```

## Output Format

The skill provides structured responses with:

- **Basic Info**: Reading, kanji, part of speech
- **Definitions**: Japanese (日文), English (英文), Chinese (中文)
- **Conjugations**: For verbs and adjectives
- **Honorific Forms**: For keigo vocabulary
- **Usage Warnings**: For commonly confused words

### Example Output

```
【食べる】たべる

| 項目 | 內容 |
|------|------|
| 詞性 | 一段動詞（下一段） |
| 日文 | 食物を口に入れ、かんで飲み込む |
| 英文 | eat; have a meal |
| 中文 | 吃 |

**活用形**：
| 形式 | 變化 |
|------|------|
| 辭書形 | 食べる |
| ます形 | 食べます |
| て形 | 食べて |

例句：
- 朝ごはんを食べます。（我吃早餐。）
```

## Limitations

| Limitation | Description |
|------------|-------------|
| Platform | macOS only (requires DictionaryServices.framework) |
| Dictionary Required | Users must enable Japanese dictionaries in Dictionary.app |
| Not Found | Proper nouns, neologisms, compound words may not be found |
| CJK Ambiguity | Some kanji may return Chinese results instead of Japanese |

## Troubleshooting

### "platform_unsupported" Error
- This plugin only works on macOS

### "not_found" Error
- Ensure Japanese dictionaries are enabled in Dictionary.app
- Try searching with hiragana instead of kanji

### Empty Results
- Run: `uv pip install pyobjc-framework-DictionaryServices`

## Plugin Structure

```
macos-dictionary-plugin/
├── README.md
├── scripts/
│   └── lookup-dictionary.py    # Dictionary query script
└── skills/
    └── macos-dictionary/
        ├── SKILL.md            # Core skill instructions
        ├── references/
        │   ├── output-format.md    # Response format specification
        │   └── cjk-handling.md     # CJK character handling guide
        └── scripts/
            └── README.md       # Script location reference
```

## Changelog

### v1.1.0 (2024-12-22)

- **Refactored**: Applied skill-creator best practices
- **Improved**: Progressive disclosure with references/ directory
- **Reduced**: SKILL.md from 495 lines to 92 lines
- **Added**: Dedicated format specification (output-format.md)
- **Added**: CJK handling guide (cjk-handling.md)

### v1.0.0 (2024-12-22)

- Initial release
- Japanese dictionary lookup support
- Multi-language support (Japanese, English, Traditional Chinese)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.
