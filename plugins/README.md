# Japanese Learning Tools - Claude Code Plugin Marketplace

A collection of Claude Code plugins for Japanese language learning.

## Available Plugins

| Plugin | Description | Platform |
|--------|-------------|----------|
| [macos-dictionary-plugin](./macos-dictionary-plugin/) | macOS Dictionary integration for Japanese word lookup | macOS only |

## Installation

### Add this Marketplace

```bash
/plugin marketplace add your-username/japanese-learning-tools
```

### Install a Plugin

```bash
/plugin install macos-dictionary-plugin@japanese-learning-tools
```

### List Available Plugins

```bash
/plugin marketplace list
```

## For Developers

### Marketplace Structure

```
plugins/
├── .claude-plugin/
│   └── marketplace.json       # Marketplace definition
├── README.md                  # This file
└── macos-dictionary-plugin/   # Plugin directory
    ├── .claude-plugin/
    │   └── plugin.json        # Plugin definition
    ├── skills/
    │   └── macos-dictionary/
    │       └── SKILL.md       # Skill definition
    ├── scripts/
    │   └── lookup-dictionary.py
    └── README.md
```

### Adding a New Plugin

1. Create a new directory under `plugins/`
2. Add `.claude-plugin/plugin.json`
3. Add your skills under `skills/`
4. Update `plugins/.claude-plugin/marketplace.json`

## License

MIT
