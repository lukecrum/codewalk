![codewalk](logo.png)

A toolkit for tracking and visualizing AI-assisted code changes with structured reasoning.

When Claude makes changes to your code, codewalk captures *why* each change was made, not just what changed. This makes code review faster and helps you understand AI-generated code.

## Key Concepts

- **One tracking file per commit** - Each commit gets its own `.codewalk/<hash>.json`
- **Logical grouping** - Related changes across multiple files share one reasoning
- **Hunk mapping** - Links reasoning to specific diff hunks (the `@@` sections in git diff)
- **Intent over description** - Reasoning explains *why*, not *what* (the diff shows what)

## How It Works

1. **An agent makes changes** to your codebase
2. **codewalk tracks** each logical change with reasoning linked to git diff hunks
3. **You review** changes grouped by intent, not just by file

## Tracking File Schema

Tracking files follow this schema:

```typescript
type Changeset = {
  version: number;      // Schema version (currently 1)
  commit: string;       // Git commit SHA this changeset describes
  author: string;       // Who made the changes ("claude", human name, etc.)
  changes: Change[];    // List of logical changes in the commit
};

type Change = {
  reasoning: string;    // Why this change was made (intent, not just what)
  files: FileChange[];  // Files affected by this logical change
};

type FileChange = {
  path: string;         // File path relative to repo root
  hunks: number[];      // Which hunks (1-indexed) belong to this change
};
```

### Example

```json
{
  "version": 1,
  "commit": "a1b2c3d",
  "author": "claude",
  "changes": [
    {
      "reasoning": "Add dark mode toggle that persists to localStorage",
      "files": [
        { "path": "src/App.tsx", "hunks": [1, 2] },
        { "path": "src/styles.css", "hunks": [1] }
      ]
    }
  ]
}
```

This tells reviewers: "Hunks 1-2 in App.tsx and hunk 1 in styles.css all work together to add a dark mode toggle with persistence."

## Visualizer

View tracked changes grouped by reasoning:

```bash
npx codewalk visualize
```

**Features:**
- Tree-based navigation of reasoning groups and files
- Syntax-highlighted diff display
- Live watching for new tracking files
- Keyboard navigation (`j`/`k` to move, `enter` to expand, `q` to quit)

## Claude Code Plugin

### Installation

```bash
# Add the marketplace
/plugin marketplace add lukecrum/codewalk

# Install codewalk
/plugin install codewalk
```

Once installed, Claude will automatically create tracking files for every commit via a stop hook that enforces tracking before session exit.

### Configuration

Run the interactive configuration wizard:

```
/codewalk-config
```

Or manually create `.claude/codewalk.local.md`:

```yaml
---
storage: global
globalDir: ~/.codewalk
---
```

### Settings

| Setting | Values | Default | Description |
|---------|--------|---------|-------------|
| `storage` | `local`, `global` | `global` | Where to store tracking files |
| `globalDir` | path | `~/.codewalk` | Directory for global storage (supports `~`) |

### Storage Modes

**Global storage** (`storage: global`) - Default:
- Tracking files stored in `~/.codewalk/<repo-name>/<hash>.json`
- Files are NOT in the git repo (never committed)
- Best for: Personal tracking without adding files to the repo

**Local storage** (`storage: local`):
- Tracking files stored in `.codewalk/<hash>.json` in the project
- Best for: Projects where team visibility of tracking data is important
