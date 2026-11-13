"""
migrate_domain_tags 測試

執行：python3 -m unittest discover -s scripts/tests -v
"""

import sys
import unittest
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(SCRIPTS_DIR))

from migrate_domain_tags import DomainConfig, migrate_content  # noqa: E402

CONFIG = DomainConfig(
    domains={
        "economics": {"name_ja": "経済", "topics": {"general", "finance"}},
        "linguistics": {"name_ja": "言語学", "topics": set()},
    },
    aliases={
        "経済学": "economics/general",
        "economics": "economics/general",
        "金融": "economics/finance",
        "finance": "economics/finance",
        "grammar": "linguistics",
        "international": "",
    },
    bare_tags=frozenset({"経済学", "finance"}),
)


def card(frontmatter: str, body: str = "# 本文\n") -> str:
    return f"---\n{frontmatter}---\n{body}"


class MigrateContentTest(unittest.TestCase):
    def test_block_list_tags(self):
        src = card("title: x\ntags:\n  - jlpt/n2\n  - domain/経済学\n  - \"domain/金融\"\ncreated: 2025-01-01\n")
        r = migrate_content(src, CONFIG)
        self.assertTrue(r.changed)
        self.assertEqual(r.content, card(
            "title: x\ntags:\n  - jlpt/n2\ndomains:\n  - economics\n"
            "domain_topics:\n  - economics/finance\ncreated: 2025-01-01\n"
        ))

    def test_inline_tags(self):
        src = card("tags: [context/business, domain/finance, jlpt/n1]\ntitle: x\n")
        r = migrate_content(src, CONFIG)
        self.assertEqual(r.content, card(
            "tags: [context/business, jlpt/n1]\ndomains:\n  - economics\n"
            "domain_topics:\n  - economics/finance\ntitle: x\n"
        ))

    def test_only_domain_tags_leaves_empty_list(self):
        src = card("tags:\n  - domain/grammar\ntitle: x\n")
        r = migrate_content(src, CONFIG)
        self.assertEqual(r.content, card("tags: []\ndomains:\n  - linguistics\ntitle: x\n"))

    def test_modifier_alias_is_dropped(self):
        src = card("tags:\n  - domain/international\n  - domain/金融\n")
        r = migrate_content(src, CONFIG)
        self.assertEqual(r.domains, ["economics"])
        self.assertNotIn("international", r.content)

    def test_unknown_tag_leaves_card_untouched(self):
        src = card("tags:\n  - domain/unknown_field\n")
        r = migrate_content(src, CONFIG)
        self.assertFalse(r.changed)
        self.assertEqual(r.unknown, ["unknown_field"])
        self.assertEqual(r.content, src)

    def test_merges_with_existing_domains(self):
        src = card("tags:\n  - domain/grammar\ndomains:\n  - economics\n")
        r = migrate_content(src, CONFIG)
        self.assertEqual(r.domains, ["economics", "linguistics"])
        self.assertEqual(r.content.count("domains:"), 1)

    def test_idempotent(self):
        src = card("tags:\n  - domain/金融\n")
        once = migrate_content(src, CONFIG).content
        twice = migrate_content(once, CONFIG)
        self.assertFalse(twice.changed)

    def test_card_without_domain_tags_unchanged(self):
        src = card("tags:\n  - jlpt/n5\n")
        self.assertFalse(migrate_content(src, CONFIG).changed)

    def test_meta_links_point_to_domain_page(self):
        src = card(
            "tags:\n  - jlpt/n2\n",
            "- [domain/経済学](../_meta/tags/domain/経済学.md)\n- [位置](_meta/tags/domain/grammar.md) - 說明\n",
        )
        r = migrate_content(src, CONFIG)
        self.assertEqual(r.links_fixed, 2)
        self.assertIn("- [経済](../../domains/economics/)", r.content)
        self.assertIn("- [位置](../../domains/linguistics/) - 說明", r.content)

    def test_alias_takes_precedence_over_domain_slug(self):
        r = migrate_content(card("tags:\n  - domain/economics\n"), CONFIG)
        self.assertEqual(r.topics, ["economics/general"])

    def test_domain_slug_without_alias(self):
        r = migrate_content(card("tags:\n  - domain/linguistics\n"), CONFIG)
        self.assertEqual((r.domains, r.topics), (["linguistics"], []))

    def test_bare_tags_are_migrated(self):
        src = card("tags:\n  - 経済学\n  - finance\n  - business\n")
        r = migrate_content(src, CONFIG)
        self.assertEqual(r.content, card(
            "tags:\n  - business\ndomains:\n  - economics\n"
            "domain_topics:\n  - economics/finance\n"
        ))

    def test_bare_tag_not_in_list_is_kept(self):
        src = card("tags:\n  - grammar\n")
        self.assertFalse(migrate_content(src, CONFIG).changed)

    def test_general_kept_when_no_specific_topic(self):
        r = migrate_content(card("tags:\n  - domain/経済学\n"), CONFIG)
        self.assertEqual(r.topics, ["economics/general"])

    def test_normalizes_already_migrated_topics(self):
        src = card("tags: []\ndomains:\n  - economics\ndomain_topics:\n  - economics/general\n  - economics/finance\n")
        r = migrate_content(src, CONFIG)
        self.assertTrue(r.changed)
        self.assertEqual(r.topics, ["economics/finance"])
        self.assertFalse(migrate_content(r.content, CONFIG).changed)

    def test_real_config_is_valid(self):
        config = DomainConfig.load()
        self.assertIn("economics", config.domains)
        self.assertEqual(config.resolve("経済学"), ("economics", "economics/general"))
        # bare_tags 必須是最上層設定（寫在 [[domains]] 之後會被併入該表格）
        self.assertIn("経済学", config.bare_tags)


if __name__ == "__main__":
    unittest.main()
