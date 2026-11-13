"""
card_numbering 編號分配測試

重現過去造成重複編號的情境：
  1. 連續取號但尚未建立檔案（v1.5.2 缺口批次：341 張卡片共用 123 號）
  2. 兩位數檔名（39_ga_vs_wa.md）不被 3 位數掃描看到
  3. 多個程序同時取號
  4. allocate_card_numbers 在檔案建立前重複執行
  5. add_pending_cards --csv-only 批次

執行：python3 -m unittest discover -s scripts/tests -v
"""

import csv
import json
import sys
import tempfile
import unittest
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(SCRIPTS_DIR))

from card_numbering import CardNumbering  # noqa: E402


def _reserve_in_process(args):
    zettel_dir, lock_dir, count = args
    return CardNumbering("noun", Path(zettel_dir), Path(lock_dir)).reserve(count)


class CardNumberingTestBase(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        root = Path(self.tmp.name)
        self.zettel = root / "zettelkasten"
        self.locks = root / ".locks"
        (self.zettel / "noun").mkdir(parents=True)

    def tearDown(self):
        self.tmp.cleanup()

    def touch(self, name, category="noun"):
        (self.zettel / category / name).write_text("---\n---\n", encoding="utf-8")

    def numbering(self, category="noun"):
        return CardNumbering(category, self.zettel, self.locks)


class TestReserve(CardNumberingTestBase):
    def test_consecutive_reservations_without_files_never_repeat(self):
        self.touch("001_a.md")
        numbers = [self.numbering().reserve()[0] for _ in range(20)]
        self.assertEqual(numbers, list(range(2, 22)))

    def test_peek_does_not_reserve(self):
        self.touch("001_a.md")
        self.assertEqual(self.numbering().peek(), 2)
        self.assertEqual(self.numbering().peek(), 2)
        self.assertEqual(self.numbering().reserve(), [2])
        self.assertEqual(self.numbering().peek(), 3)

    def test_batch_reserves_range(self):
        self.assertEqual(self.numbering().reserve(3), [1, 2, 3])
        self.assertEqual(self.numbering().reserve(), [4])

    def test_two_digit_filenames_are_counted(self):
        self.touch("039_a.md")
        self.touch("40_b.md")
        self.assertEqual(self.numbering().files_max_number(), 40)
        self.assertEqual(self.numbering().reserve(), [41])

    def test_extension_cards_do_not_count_as_base(self):
        self.touch("005_taberu.md")
        self.touch("005_taberu_001_keigo.md")
        self.assertEqual(self.numbering().duplicate_numbers(), {})

    def test_index_last_number_is_respected(self):
        (self.zettel / "noun" / "index.md").write_text("最後編號：050\n", encoding="utf-8")
        self.assertEqual(self.numbering().reserve(), [51])

    def test_floor_is_respected(self):
        self.assertEqual(self.numbering().reserve(floor=70), [71])

    def test_created_files_are_pruned_from_ledger(self):
        n = self.numbering()
        self.assertEqual(n.reserve(2), [1, 2])
        self.touch("001_a.md")
        n.reserve()  # 觸發清理
        self.assertNotIn(1, n.reservations())
        self.assertIn(2, n.reservations())

    def test_release_frees_only_that_reservation(self):
        n = self.numbering()
        n.reserve(2)
        self.assertTrue(n.release(2))
        self.assertFalse(n.release(2))
        self.assertEqual(n.peek(), 2)

    def test_concurrent_processes_get_unique_numbers(self):
        jobs = [(str(self.zettel), str(self.locks), 1)] * 16 + [(str(self.zettel), str(self.locks), 3)] * 4
        with ProcessPoolExecutor(max_workers=8) as pool:
            results = list(pool.map(_reserve_in_process, jobs))
        flat = [n for r in results for n in r]
        self.assertEqual(len(flat), 28)
        self.assertEqual(sorted(flat), list(range(1, 29)))


class TestConflicts(CardNumberingTestBase):
    def test_find_conflicts_excludes_self(self):
        self.touch("010_a.md")
        self.touch("10_b.md")
        n = self.numbering()
        self.assertEqual(n.find_conflicts(10, "010_a.md"), ["10_b.md"])
        self.assertEqual(n.find_conflicts(11, "011_c.md"), [])

    def test_duplicate_numbers(self):
        self.touch("123_a.md")
        self.touch("123_b.md")
        self.touch("124_c.md")
        self.assertEqual(self.numbering().duplicate_numbers(), {123: ["123_a.md", "123_b.md"]})


class TestScriptsIntegration(CardNumberingTestBase):
    """以暫存目錄替換腳本內的路徑常數，驗證腳本實際行為"""

    def setUp(self):
        super().setUp()
        import card_numbering
        self._saved = (card_numbering.ZETTELKASTEN_DIR, card_numbering.LOCK_DIR)
        card_numbering.ZETTELKASTEN_DIR = self.zettel
        card_numbering.LOCK_DIR = self.locks
        # CardNumbering 的預設參數在定義時已綁定，改用替換 __init__ 預設值
        self._saved_defaults = CardNumbering.__init__.__defaults__
        CardNumbering.__init__.__defaults__ = (self.zettel, self.locks)

    def tearDown(self):
        import card_numbering
        card_numbering.ZETTELKASTEN_DIR, card_numbering.LOCK_DIR = self._saved
        CardNumbering.__init__.__defaults__ = self._saved_defaults
        super().tearDown()

    def write_csv(self, rows):
        path = Path(self.tmp.name) / "cards.csv"
        fields = ['id', 'category', 'number', 'path', 'japanese', 'chinese',
                  'jlpt', 'source', 'priority', 'stage', 'note', 'created', 'updated', 'batch']
        with open(path, "w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fields)
            writer.writeheader()
            for row in rows:
                writer.writerow({k: row.get(k, "") for k in fields})
        return path

    def read_csv(self, path):
        with open(path, encoding="utf-8") as f:
            return list(csv.DictReader(f))

    def test_csv_only_batch_does_not_assign_numbers(self):
        import add_pending_cards
        add_pending_cards.ZETTELKASTEN_DIR = self.zettel
        csv_path = self.write_csv([])
        adder = add_pending_cards.PendingCardAdder(str(csv_path), csv_only=True)
        cards = [
            {"category": "noun", "japanese": f"語{i}", "chinese": "詞", "jlpt": "n5", "priority": "High"}
            for i in range(5)
        ]
        self.assertEqual(adder.add_batch_cards(cards), 5)
        adder.save_cards()
        rows = self.read_csv(csv_path)
        self.assertEqual([r["number"] for r in rows], [""] * 5)
        self.assertEqual([r["path"] for r in rows], [""] * 5)
        self.assertEqual(self.numbering().reservations(), {})

    def test_batch_with_files_assigns_unique_numbers(self):
        import add_pending_cards
        add_pending_cards.ZETTELKASTEN_DIR = self.zettel
        csv_path = self.write_csv([])
        adder = add_pending_cards.PendingCardAdder(str(csv_path), csv_only=False)
        cards = [
            {"category": "noun", "japanese": f"語{i}", "chinese": "詞", "jlpt": "n5", "priority": "High"}
            for i in range(4)
        ]
        self.assertEqual(adder.add_batch_cards(cards), 4)
        self.assertEqual(self.numbering().duplicate_numbers(), {})
        self.assertEqual(self.numbering().files_max_number(), 4)

    def test_add_rejects_existing_base_number(self):
        import add_pending_cards
        add_pending_cards.ZETTELKASTEN_DIR = self.zettel
        self.touch("007_inu.md")
        csv_path = self.write_csv([])
        adder = add_pending_cards.PendingCardAdder(str(csv_path), csv_only=False)
        ok = adder.add_single_card("noun", "007", "猫", "貓", "n5", "High")
        self.assertFalse(ok)

    def test_allocate_twice_before_files_exist(self):
        import allocate_card_numbers
        self.touch("010_a.md")
        rows = [
            {"id": str(i), "category": "noun", "japanese": f"語{i}", "stage": "pending", "priority": "High"}
            for i in range(1, 4)
        ]
        csv_path = self.write_csv(rows)

        allocate_card_numbers.CardNumberAllocator(str(csv_path)).allocate_numbers(limit=2)
        allocate_card_numbers.CardNumberAllocator(str(csv_path)).allocate_numbers()

        result = self.read_csv(csv_path)
        numbers = [r["allocated_number"] for r in result]
        self.assertEqual(numbers, ["011", "012", "013"])
        self.assertEqual(result[0]["path"], "noun/011_語1.md")

    def test_allocate_respects_csv_numbers_without_ledger(self):
        """舊 CSV 已有分配編號但保留紀錄不存在時，仍不可重發"""
        import allocate_card_numbers
        rows = [
            {"id": "1", "category": "noun", "number": "020", "path": "noun/020_x.md",
             "japanese": "x", "stage": "draft"},
            {"id": "2", "category": "noun", "japanese": "y", "stage": "pending"},
        ]
        csv_path = self.write_csv(rows)
        allocate_card_numbers.CardNumberAllocator(str(csv_path)).allocate_numbers()
        self.assertEqual(self.read_csv(csv_path)[1]["allocated_number"], "021")


if __name__ == "__main__":
    unittest.main()
