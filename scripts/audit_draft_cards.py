# /// script
# requires-python = ">=3.11"
# dependencies = ["pyyaml"]
# ///
"""
審計草稿卡片內容完成度

分類標準：
1. complete - 內容完整（有三語解釋、例句），可直接發布
2. redirect - 重複卡片（有 redirect_to），可刪除或保留
3. partial - 部分內容，需要補充
4. empty - 只有 frontmatter，需要處理
5. inconsistent - stage 與 draft 不一致
"""

import os
import re
import yaml
import json
import csv
from pathlib import Path
from collections import defaultdict
from dataclasses import dataclass, asdict
from typing import Literal

ZETTELKASTEN_DIR = Path(__file__).parent.parent / "zettelkasten"

ContentStatus = Literal["complete", "redirect", "partial", "empty", "inconsistent"]

@dataclass
class CardAudit:
    """卡片審計結果"""
    file_path: str
    category: str
    number: str
    title: str
    stage: str
    draft: bool
    status: ContentStatus
    line_count: int
    has_japanese_section: bool
    has_english_section: bool
    has_chinese_section: bool
    has_examples: bool
    has_redirect: bool
    reason: str


def parse_frontmatter(content: str) -> dict:
    """解析 YAML frontmatter"""
    match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
    if match:
        try:
            return yaml.safe_load(match.group(1)) or {}
        except yaml.YAMLError:
            return {}
    return {}


def analyze_content(content: str) -> dict:
    """分析卡片內容"""
    # 移除 frontmatter
    body = re.sub(r'^---\n.*?\n---\n?', '', content, flags=re.DOTALL)

    return {
        'line_count': len(content.splitlines()),
        'body_lines': len(body.strip().splitlines()),
        'has_japanese_section': bool(re.search(r'^## 日文解釋', content, re.MULTILINE)),
        'has_english_section': bool(re.search(r'^## 英文解釋', content, re.MULTILINE)),
        'has_chinese_section': bool(re.search(r'^## 中文解釋', content, re.MULTILINE)),
        'has_examples': bool(re.search(r'例句\s*\d|例文|Example|```\n[^`]+\n[^`]+\n[^`]+\n```', content)),
        'has_redirect': 'redirect_to' in content,
        'has_usage': bool(re.search(r'^## (核心用法|用法|Usage)', content, re.MULTILINE)),
    }


def determine_status(fm: dict, analysis: dict) -> tuple[ContentStatus, str]:
    """判斷卡片狀態"""
    stage = fm.get('stage', 'unknown')
    draft = fm.get('draft', False)

    # 1. 檢查狀態不一致
    if stage == 'completed' and draft:
        return 'inconsistent', 'stage:completed 但 draft:true'
    if stage == 'extension-review' and draft:
        return 'inconsistent', 'stage:extension-review 但 draft:true'
    if stage == 'linking' and draft:
        return 'inconsistent', 'stage:linking 但 draft:true'

    # 2. 檢查是否為 redirect
    if analysis['has_redirect']:
        return 'redirect', '重複卡片，指向其他卡片'

    # 3. 檢查內容完整度
    lang_count = sum([
        analysis['has_japanese_section'],
        analysis['has_english_section'],
        analysis['has_chinese_section']
    ])

    if lang_count >= 2 and analysis['has_examples']:
        return 'complete', f'{lang_count}/3 語解釋 + 例句'

    if analysis['body_lines'] < 10:
        return 'empty', f'只有 {analysis["body_lines"]} 行內容'

    if lang_count >= 1 or analysis['has_examples']:
        missing = []
        if not analysis['has_japanese_section']:
            missing.append('日文解釋')
        if not analysis['has_english_section']:
            missing.append('英文解釋')
        if not analysis['has_chinese_section']:
            missing.append('中文解釋')
        if not analysis['has_examples']:
            missing.append('例句')
        return 'partial', f'缺少: {", ".join(missing)}'

    return 'partial', f'{analysis["body_lines"]} 行內容，結構不完整'


def audit_card(file_path: Path) -> CardAudit | None:
    """審計單張卡片"""
    try:
        content = file_path.read_text(encoding='utf-8')
    except Exception:
        return None

    fm = parse_frontmatter(content)
    if not fm.get('draft', False):
        return None  # 不是草稿卡片

    analysis = analyze_content(content)
    status, reason = determine_status(fm, analysis)

    # 解析分類和編號
    rel_path = file_path.relative_to(ZETTELKASTEN_DIR)
    category = rel_path.parts[0] if len(rel_path.parts) > 1 else 'unknown'
    filename = file_path.stem
    match = re.match(r'^(\d+)_', filename)
    number = match.group(1) if match else '000'

    return CardAudit(
        file_path=str(file_path.relative_to(ZETTELKASTEN_DIR.parent)),
        category=category,
        number=number,
        title=fm.get('title', filename),
        stage=fm.get('stage', 'unknown'),
        draft=fm.get('draft', False),
        status=status,
        line_count=analysis['line_count'],
        has_japanese_section=analysis['has_japanese_section'],
        has_english_section=analysis['has_english_section'],
        has_chinese_section=analysis['has_chinese_section'],
        has_examples=analysis['has_examples'],
        has_redirect=analysis['has_redirect'],
        reason=reason,
    )


def audit_all_cards() -> list[CardAudit]:
    """審計所有草稿卡片"""
    results = []

    for md_file in ZETTELKASTEN_DIR.rglob("*.md"):
        if md_file.name.startswith('_'):
            continue
        result = audit_card(md_file)
        if result:
            results.append(result)

    return results


def generate_report(results: list[CardAudit], output_dir: Path):
    """產生審計報告"""
    # 按狀態分組
    by_status = defaultdict(list)
    for r in results:
        by_status[r.status].append(r)

    # 按分類分組
    by_category = defaultdict(list)
    for r in results:
        by_category[r.category].append(r)

    # 統計
    stats = {
        'total': len(results),
        'by_status': {k: len(v) for k, v in by_status.items()},
        'by_category': {k: len(v) for k, v in by_category.items()},
    }

    # 輸出 JSON
    json_path = output_dir / 'draft-audit.json'
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump({
            'stats': stats,
            'cards': [asdict(r) for r in results]
        }, f, ensure_ascii=False, indent=2)

    # 輸出 CSV（供 manage_worklog_cards.py 使用）
    csv_path = output_dir / 'cards-1.1.1.csv'
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow([
            'id', 'category', 'number', 'japanese', 'chinese', 'english',
            'jlpt', 'priority', 'stage', 'allocated_number', 'notes'
        ])
        for i, r in enumerate(results, 1):
            # 根據審計狀態決定優先級
            if r.status == 'complete':
                priority = 'Low'  # 只需要移除 draft: true
                stage = 'linking'  # 跳過內容建立
            elif r.status == 'inconsistent':
                priority = 'Critical'  # 優先修復
                stage = 'pending'
            elif r.status == 'redirect':
                priority = 'Low'  # 可能刪除
                stage = 'pending'
            elif r.status == 'partial':
                priority = 'High'  # 需要補充
                stage = 'pending'
            else:  # empty
                priority = 'Medium'  # 可能刪除
                stage = 'pending'

            writer.writerow([
                i, r.category, r.number, r.title, '', '',
                '', priority, stage, r.number, f'{r.status}: {r.reason}'
            ])

    # 輸出 Markdown 報告
    md_path = output_dir / 'draft-audit-report.md'
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write('# 草稿卡片審計報告\n\n')
        f.write(f'**審計時間**: {__import__("datetime").datetime.now().strftime("%Y-%m-%d %H:%M")}\n\n')

        f.write('## 統計摘要\n\n')
        f.write(f'- **總草稿卡片數**: {stats["total"]}\n')
        for status, count in sorted(stats['by_status'].items()):
            f.write(f'- **{status}**: {count}\n')

        f.write('\n### 按分類統計\n\n')
        f.write('| 分類 | 數量 |\n|------|------|\n')
        for cat, count in sorted(stats['by_category'].items(), key=lambda x: -x[1]):
            f.write(f'| {cat} | {count} |\n')

        # 詳細列表
        for status in ['inconsistent', 'complete', 'partial', 'redirect', 'empty']:
            cards = by_status.get(status, [])
            if not cards:
                continue
            f.write(f'\n## {status.upper()} ({len(cards)} 張)\n\n')

            if status == 'complete':
                f.write('> 這些卡片內容完整，只需設定 `draft: false` 即可發布\n\n')
            elif status == 'inconsistent':
                f.write('> 這些卡片的 stage 與 draft 狀態不一致，需要優先修復\n\n')
            elif status == 'redirect':
                f.write('> 這些是重複卡片，建議刪除或保留作為重定向\n\n')
            elif status == 'partial':
                f.write('> 這些卡片有部分內容，需要補充完整\n\n')
            else:
                f.write('> 這些卡片幾乎沒有內容，建議刪除或重新建立\n\n')

            f.write('| 檔案 | 標題 | stage | 原因 |\n')
            f.write('|------|------|-------|------|\n')
            for c in sorted(cards, key=lambda x: (x.category, x.number)):
                f.write(f'| `{c.file_path}` | {c.title} | {c.stage} | {c.reason} |\n')

    return stats, json_path, csv_path, md_path


def main():
    import argparse
    parser = argparse.ArgumentParser(description='審計草稿卡片')
    parser.add_argument('--output', '-o', default='doc/worklog', help='輸出目錄')
    parser.add_argument('--json', action='store_true', help='只輸出 JSON')
    args = parser.parse_args()

    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    print('正在審計草稿卡片...')
    results = audit_all_cards()

    if args.json:
        import json
        print(json.dumps([asdict(r) for r in results], ensure_ascii=False, indent=2))
        return

    stats, json_path, csv_path, md_path = generate_report(results, output_dir)

    print(f'\n審計完成！共 {stats["total"]} 張草稿卡片\n')
    print('按狀態統計:')
    for status, count in sorted(stats['by_status'].items()):
        print(f'  {status}: {count}')

    print(f'\n輸出檔案:')
    print(f'  - {md_path}')
    print(f'  - {csv_path}')
    print(f'  - {json_path}')


if __name__ == '__main__':
    main()
