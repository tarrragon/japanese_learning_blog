"""
fix-numbering.py 測試：兩位數檔名、重複編號、安全改名

執行：python3 -m unittest discover -s scripts/tests -v
"""

import importlib.util
import io
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent.parent / "fix-numbering.py"
spec = importlib.util.spec_from_file_location("fix_numbering", SCRIPT)
fix_numbering = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fix_numbering)


class FixNumberingTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.cat = Path(self.tmp.name) / "noun"
        self.cat.mkdir()

    def tearDown(self):
        self.tmp.cleanup()

    def touch(self, name, content=None):
        (self.cat / name).write_text(content or f"content of {name}", encoding="utf-8")

    def names(self):
        return sorted(p.name for p in self.cat.iterdir())

    def run_fix(self, dry_run=False):
        result = fix_numbering.check_category_numbering(self.cat)
        plan = fix_numbering.generate_renumbering_plan(result)
        with redirect_stdout(io.StringIO()):
            ok = fix_numbering.execute_renumbering(plan, dry_run=dry_run)
        return result, plan, ok

    def test_parse_two_digit_filename(self):
        parsed = fix_numbering.parse_filename("39_ga_vs_wa.md")
        self.assertEqual(parsed["number"], 39)
        self.assertFalse(parsed["padded"])
        self.assertFalse(parsed["is_extension"])

    def test_detects_duplicates_and_unpadded(self):
        self.touch("001_a.md")
        self.touch("002_b.md")
        self.touch("2_c.md")
        result = fix_numbering.check_category_numbering(self.cat)
        types = {g["type"] for g in result["gaps"]}
        self.assertIn("duplicate", types)
        self.assertIn("unpadded", types)
        self.assertTrue(result["has_issues"])

    def test_unpadded_with_correct_number_is_renamed(self):
        self.touch("001_a.md")
        self.touch("2_b.md")
        _, _, ok = self.run_fix()
        self.assertTrue(ok)
        self.assertEqual(self.names(), ["001_a.md", "002_b.md"])

    def test_duplicates_are_renumbered_without_losing_files(self):
        # 重複編號：直接 rename 會讓 002_c 覆蓋 002_x（舊版的資料遺失情境）
        for name in ["001_a.md", "001_b.md", "001_c.md", "002_x.md", "3_y.md"]:
            self.touch(name)
        contents_before = sorted((self.cat / n).read_text() for n in self.names())

        _, _, ok = self.run_fix()

        self.assertTrue(ok)
        self.assertEqual(
            self.names(),
            ["001_a.md", "002_b.md", "003_c.md", "004_x.md", "005_y.md"],
        )
        contents_after = sorted((self.cat / n).read_text() for n in self.names())
        self.assertEqual(contents_before, contents_after)

    def test_extension_follows_its_own_base_card(self):
        self.touch("001_a.md")
        self.touch("001_b.md")
        self.touch("001_b_001_keigo.md", "ext of b")
        _, _, ok = self.run_fix()
        self.assertTrue(ok)
        self.assertEqual(self.names(), ["001_a.md", "002_b.md", "002_b_001_keigo.md"])
        self.assertEqual((self.cat / "002_b_001_keigo.md").read_text(), "ext of b")

    def test_dry_run_changes_nothing(self):
        self.touch("001_a.md")
        self.touch("001_b.md")
        before = self.names()
        _, plan, ok = self.run_fix(dry_run=True)
        self.assertTrue(ok)
        self.assertTrue(plan)
        self.assertEqual(self.names(), before)

    def test_validate_plan_rejects_collision_outside_plan(self):
        self.touch("001_a.md")
        self.touch("002_a.md")
        plan = [{
            "type": "base",
            "old_file": self.cat / "001_a.md",
            "new_file": self.cat / "002_a.md",
            "old_number": 1,
            "new_number": 2,
        }]
        self.assertTrue(fix_numbering.validate_plan(plan))
        with redirect_stdout(io.StringIO()):
            self.assertFalse(fix_numbering.execute_renumbering(plan))
        self.assertEqual(self.names(), ["001_a.md", "002_a.md"])

    def test_format_check_suggests_padding(self):
        self.touch("8_ii.md")
        result = fix_numbering.check_filename_format(self.cat)
        self.assertEqual(result["invalid_files"][0]["suggestion"], "008_ii.md")


if __name__ == "__main__":
    unittest.main()
