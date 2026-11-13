#!/usr/bin/env python3
"""
卡片編號分配核心模組（所有取號流程的單一來源）

為什麼需要這個模組：
  舊版 get-next-number.py 只在「讀取」時加鎖，算出編號後沒有任何紀錄。
  在卡片檔案建立之前，所有人看到的資料夾都一樣，於是拿到同一個編號。
  v1.5.2 的缺口批次就因此讓 341 張 concept 卡片共用 123 號。

設計：
  - 保留紀錄（ledger）：.locks/{category}.reserved.json
    取號時在檔案鎖內「讀取 → 計算 → 寫回保留紀錄」，編號一經分配就不會再發出。
  - 下一個編號 = max(實際檔案最大編號, index.md 最後編號, 已保留最大編號, floor) + 1
  - 檔案已建立的保留紀錄會自動清除（檔案本身已經佔住這個編號）。
  - 建立卡片前可用 find_conflicts() 檢查同分類是否已有相同基本編號。

延伸卡片（{base}_{name}_{ext}_{name}.md）共用基本卡片的編號，不視為衝突。
"""

from __future__ import annotations

import fcntl
import json
import re
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, Iterable, List, Optional

PROJECT_ROOT = Path(__file__).parent.parent
ZETTELKASTEN_DIR = PROJECT_ROOT / "zettelkasten"
LOCK_DIR = PROJECT_ROOT / ".locks"

# 與 fix-numbering.py 相同的判斷：延伸卡片 = {base}_{name}_{ext}_{name}
EXTENSION_RE = re.compile(r"^(\d+)_(.+?)_(\d{3})_(.+)$")
BASIC_RE = re.compile(r"^(\d+)_(.+)$")


class FileLock:
    """以 fcntl.flock 實作的獨佔檔案鎖"""

    def __init__(self, lock_file: Path, timeout: float = 10.0):
        self.lock_file = lock_file
        self.timeout = timeout
        self.lock_fd = None

    def __enter__(self):
        self.lock_file.parent.mkdir(parents=True, exist_ok=True)
        self.lock_fd = open(self.lock_file, "w")
        start = time.time()
        while True:
            try:
                fcntl.flock(self.lock_fd.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
                return self
            except BlockingIOError:
                if time.time() - start > self.timeout:
                    self.lock_fd.close()
                    raise TimeoutError(f"無法在 {self.timeout} 秒內取得鎖: {self.lock_file}")
                time.sleep(0.05)

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.lock_fd:
            fcntl.flock(self.lock_fd.fileno(), fcntl.LOCK_UN)
            self.lock_fd.close()


class CardNumbering:
    """單一分類的編號管理"""

    def __init__(
        self,
        category: str,
        zettelkasten_dir: Path = ZETTELKASTEN_DIR,
        lock_dir: Path = LOCK_DIR,
    ):
        self.category = category
        self.category_path = Path(zettelkasten_dir) / category
        self.lock_dir = Path(lock_dir)
        self.lock_file = self.lock_dir / f"{category}.lock"
        self.ledger_file = self.lock_dir / f"{category}.reserved.json"

    # ------------------------------------------------------------------
    # 讀取現況
    # ------------------------------------------------------------------

    def exists(self) -> bool:
        return self.category_path.is_dir()

    @staticmethod
    def parse_base_number(filename: str) -> Optional[int]:
        """回傳基本卡片的編號；延伸卡片、index.md、非編號檔案回傳 None"""
        if not filename.endswith(".md") or filename == "index.md":
            return None
        stem = filename[:-3]
        if EXTENSION_RE.match(stem):
            return None
        match = BASIC_RE.match(stem)
        return int(match.group(1)) if match else None

    def scan_base_numbers(self) -> Dict[int, List[str]]:
        """{編號: [檔名, ...]}，只計基本卡片"""
        numbers: Dict[int, List[str]] = {}
        if not self.exists():
            return numbers
        for file in self.category_path.iterdir():
            if not file.is_file():
                continue
            number = self.parse_base_number(file.name)
            if number is not None:
                numbers.setdefault(number, []).append(file.name)
        return numbers

    def files_max_number(self) -> int:
        numbers = self.scan_base_numbers()
        return max(numbers) if numbers else 0

    def index_last_number(self) -> Optional[int]:
        index_path = self.category_path / "index.md"
        if not index_path.exists():
            return None
        for line in index_path.read_text(encoding="utf-8").split("\n"):
            if "最後編號" in line:
                parts = line.split("：") if "：" in line else line.split(":")
                if len(parts) > 1:
                    try:
                        return int(parts[1].strip())
                    except ValueError:
                        pass
        return None

    def duplicate_numbers(self) -> Dict[int, List[str]]:
        """目前已存在的重複基本編號"""
        return {n: sorted(f) for n, f in self.scan_base_numbers().items() if len(f) > 1}

    # ------------------------------------------------------------------
    # 保留紀錄
    # ------------------------------------------------------------------

    def _load_ledger(self) -> Dict[str, dict]:
        if not self.ledger_file.exists():
            return {}
        try:
            data = json.loads(self.ledger_file.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            return {}
        return data.get("reserved", {}) if isinstance(data, dict) else {}

    def _save_ledger(self, reserved: Dict[str, dict]) -> None:
        self.lock_dir.mkdir(parents=True, exist_ok=True)
        payload = {"category": self.category, "reserved": dict(sorted(reserved.items()))}
        tmp = self.ledger_file.with_suffix(".tmp")
        tmp.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        tmp.replace(self.ledger_file)

    def _prune(self, reserved: Dict[str, dict], existing: Iterable[int]) -> Dict[str, dict]:
        """檔案已建立的編號不需再保留"""
        existing_set = set(existing)
        return {k: v for k, v in reserved.items() if int(k) not in existing_set}

    def reservations(self) -> Dict[int, dict]:
        return {int(k): v for k, v in self._load_ledger().items()}

    # ------------------------------------------------------------------
    # 取號
    # ------------------------------------------------------------------

    def _compute_next(self, reserved: Dict[str, dict], floor: int = 0) -> int:
        index_last = self.index_last_number() or 0
        reserved_max = max((int(k) for k in reserved), default=0)
        return max(self.files_max_number(), index_last, reserved_max, floor) + 1

    def peek(self, floor: int = 0) -> int:
        """查詢下一個編號（不保留）"""
        with FileLock(self.lock_file):
            return self._compute_next(self._load_ledger(), floor)

    def reserve(
        self,
        count: int = 1,
        labels: Optional[List[str]] = None,
        floor: int = 0,
    ) -> List[int]:
        """
        在鎖內分配並保留 count 個連續編號。

        Args:
            count: 數量
            labels: 每個編號的說明（如預定的檔案路徑），長度需與 count 相同
            floor: 額外下限（如 CSV 中已分配但尚未建立檔案的最大編號）
        """
        if count < 1:
            raise ValueError("count 必須 >= 1")
        if labels is not None and len(labels) != count:
            raise ValueError("labels 數量必須與 count 相同")
        if not self.exists():
            raise FileNotFoundError(f"分類「{self.category}」不存在")

        with FileLock(self.lock_file):
            reserved = self._prune(self._load_ledger(), self.scan_base_numbers().keys())
            start = self._compute_next(reserved, floor)
            numbers = list(range(start, start + count))
            now = datetime.now().isoformat(timespec="seconds")
            for i, number in enumerate(numbers):
                reserved[f"{number:03d}"] = {
                    "label": labels[i] if labels else "",
                    "reserved_at": now,
                }
            self._save_ledger(reserved)
            return numbers

    def release(self, number: int) -> bool:
        """取消保留（卡片最後沒有建立時使用）"""
        with FileLock(self.lock_file):
            reserved = self._load_ledger()
            key = f"{number:03d}"
            if key not in reserved:
                return False
            del reserved[key]
            self._save_ledger(reserved)
            return True

    # ------------------------------------------------------------------
    # 衝突檢查
    # ------------------------------------------------------------------

    def find_conflicts(self, number: int, filename: Optional[str] = None) -> List[str]:
        """同分類中已使用該基本編號的其他檔案（排除 filename 本身）"""
        files = self.scan_base_numbers().get(int(number), [])
        return sorted(f for f in files if f != filename)


def format_number(number: int) -> str:
    return f"{number:03d}"


# ----------------------------------------------------------------------
# CLI
# ----------------------------------------------------------------------

def _all_categories() -> List[str]:
    return sorted(
        p.name for p in ZETTELKASTEN_DIR.iterdir()
        if p.is_dir() and not p.name.startswith(("_", "."))
    )


def main(argv: Optional[List[str]] = None) -> int:
    """
    用法：
      uv run scripts/card_numbering.py check <category> <filename>
          建立卡片前/後檢查：同分類已有相同基本編號的其他檔案時回傳 1
      uv run scripts/card_numbering.py duplicates [category ...]
          列出重複的基本編號，有重複時回傳 1
    """
    import sys

    args = list(sys.argv[1:] if argv is None else argv)
    if not args or args[0] not in ("check", "duplicates"):
        print(main.__doc__)
        return 2

    command, rest = args[0], args[1:]

    if command == "check":
        if len(rest) != 2:
            print("❌ 用法：card_numbering.py check <category> <filename>", file=sys.stderr)
            return 2
        category, filename = rest
        filename = Path(filename).name
        number = CardNumbering.parse_base_number(filename)
        if number is None:
            print(f"✅ {filename} 不是基本卡片（延伸卡片或非編號檔案），不需檢查")
            return 0
        conflicts = CardNumbering(category).find_conflicts(number, filename)
        if conflicts:
            print(f"❌ {category}/{number:03d} 已被使用: {', '.join(conflicts)}", file=sys.stderr)
            return 1
        print(f"✅ {category}/{number:03d} 沒有衝突")
        return 0

    categories = rest or _all_categories()
    found = False
    for category in categories:
        duplicates = CardNumbering(category).duplicate_numbers()
        if not duplicates:
            continue
        found = True
        total = sum(len(f) for f in duplicates.values())
        print(f"❌ {category}: {len(duplicates)} 個編號重複，涉及 {total} 個檔案")
        for number, files in sorted(duplicates.items()):
            print(f"   {number:03d}: {', '.join(files)}")
    if not found:
        print("✅ 沒有重複的基本編號")
    return 1 if found else 0


if __name__ == "__main__":
    raise SystemExit(main())
