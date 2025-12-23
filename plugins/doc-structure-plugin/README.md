# doc-structure-plugin

Documentation structure management tool for Claude Code projects.

## Features

- **Hierarchical Aggregation Pattern**: Standardize README structure with design purpose, index, and references
- **File Header Templates**: Consistent file header comments for JS and Python
- **Validation Scripts**: Verify link validity and structure completeness

## Installation

```bash
/plugin install doc-structure-plugin@japanese-learning-tools
```

## Usage

### Create README

Use templates from `skills/doc-structure/templates/`:
- `readme-top.md` - Top-level directory README
- `readme-sub.md` - Subdirectory README

### Add File Headers

Use templates:
- `header-js.txt` - JavaScript file header
- `header-py.txt` - Python file header

### Validation

```bash
# Validate README links (run from project root)
uv run validate-readme-links.py .

# Or specify path
uv run validate-readme-links.py /path/to/project

# Check structure completeness
uv run check-doc-structure.py .
```

## Core Principles

1. **Upper indexes lower**: Each README only indexes its direct children
2. **Design purpose is stable**: Describes "why", doesn't change with code
3. **Rewrite only on refactoring**: Only update when architecture changes

## Structure

```
doc-structure-plugin/
├── .claude-plugin/
│   └── plugin.json
├── skills/
│   └── doc-structure/
│       ├── SKILL.md
│       ├── references/
│       │   ├── readme-format.md
│       │   └── file-header-format.md
│       ├── scripts/
│       │   ├── validate-readme-links.py
│       │   └── check-doc-structure.py
│       └── templates/
│           ├── readme-top.md
│           ├── readme-sub.md
│           ├── header-js.txt
│           └── header-py.txt
└── README.md
```

## License

MIT
