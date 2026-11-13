"""
fill_card_fields / audit_card_fields 測試

執行：python3 -m unittest discover -s scripts/tests -v
"""

import sys
import tempfile
import unittest
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(SCRIPTS_DIR))

from fill_card_fields import h1_title, set_fields  # noqa: E402
from audit_card_fields import audit_card  # noqa: E402


class SetFieldsTest(unittest.TestCase):
    def test_inserts_title_first_and_description_after(self):
        src = "---\njlpt: n3\ntags: []\n---\n# 物価（ぶっか）\n"
        out, written = set_fields(src, {"title": "物価（ぶっか）", "description": "物價"})
        self.assertEqual(written, ["title", "description"])
        self.assertTrue(out.startswith('---\ntitle: "物価（ぶっか）"\ndescription: "物價"\njlpt: n3\n'))

    def test_does_not_overwrite_existing(self):
        src = '---\ntitle: "原本"\ndescription: 原本說明\n---\n'
        out, written = set_fields(src, {"title": "新", "description": "新"})
        self.assertEqual(written, [])
        self.assertEqual(out, src)

    def test_replaces_empty_field_in_place(self):
        src = '---\ntitle: ""\ntype: noun\ndescription:\n---\n'
        out, _ = set_fields(src, {"title": "語", "description": "詞"})
        self.assertEqual(out, '---\ntitle: "語"\ntype: noun\ndescription: "詞"\n---\n')

    def test_escapes_quotes(self):
        out, _ = set_fields("---\ntype: x\n---\n", {"title": 'A "B"'})
        self.assertIn('title: "A \\"B\\""', out)

    def test_h1_title(self):
        self.assertEqual(h1_title("---\na: 1\n---\n\n# 株式\n## 日文解釋\n"), "株式")
        self.assertEqual(h1_title("---\na: 1\n---\n## 只有二級\n"), "")


class AuditTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.zettel = Path(self.tmp.name)
        (self.zettel / "noun").mkdir()

    def tearDown(self):
        self.tmp.cleanup()

    def audit(self, body, fm="title: x\ndescription: y\nstage: pending\n"):
        path = self.zettel / "noun" / "001_x.md"
        path.write_text(f"---\n{fm}---\n{body}", encoding="utf-8")
        return audit_card(path, self.zettel)

    def test_complete_trilingual_pending_card_flags_stage(self):
        a = self.audit(
            "## 日文解釋\n商品やサービスの価格の総合的な水準を示す指標である。\n"
            "## 英文解釋\nThe overall level of prices of goods.\n"
            "## 中文解釋\n對不起（口語）\n"
        )
        self.assertEqual(a.issues, ["stage"])

    def test_placeholder_sections_are_stub(self):
        a = self.audit("## 日文解釋\n{待填充}\n## 英文解釋\n{待填充}\n## 中文解釋\n{待填充}\n")
        self.assertIn("stub", a.issues)

    def test_chinese_written_without_heading_counts(self):
        body = "## 核心概念\n" + "這個副詞表示時間上的馬上與距離上的很近。\n" * 3
        a = self.audit(body)
        self.assertTrue(a.has_chinese)
        self.assertNotIn("chinese", a.issues)

    def test_japanese_only_card_misses_chinese(self):
        body = "## 定義\n" + "経費とは、事業を行うために必要な費用のことである。\n" * 3
        a = self.audit(body)
        self.assertIn("chinese", a.issues)

    def test_example_translations_do_not_count_as_chinese(self):
        body = "## 例句\n" + "**中文翻譯**：我今天要去公司開會討論預算。\n" * 4 + "今日は会社で予算について話し合います。\n" * 3
        a = self.audit(body)
        self.assertIn("chinese", a.issues)


if __name__ == "__main__":
    unittest.main()
