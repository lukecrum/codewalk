![codewalk](logo.png)

A toolkit for tracking and visualizing AI-assisted code changes with structured reasoning, known as logical changes.

## What is a "Logical Change"?

A logical change is a group of code modifications that serve a single purpose. A single commit often contains multiple logical changes - for example, adding a feature might involve:

1. Adding a new component (logical change #1)
2. Updating the router to include it (logical change #2)
3. Adding styles (logical change #3)

Traditional diffs show these as a flat list of file changes, making it hard to understand which parts go together. Codewalk groups related hunks across files by their shared reasoning, so reviewers see changes organized by *intent* rather than by file path.

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

Interactive TUI for reviewing tracked changes grouped by reasoning:

```bash
npx codewalk visualize   # or: npx codewalk viz
```

Groups all changes by their reasoning text across commits, sorted by impact (most files first). Shows the current branch, tracking directory, and actual diff hunks with syntax highlighting.

**Controls:**
- `↑`/`↓` or `j`/`k` - Navigate
- `Enter` or `Space` - Expand/collapse
- `g`/`G` - Jump to top/bottom
- `q` - Quit
- Mouse scroll and click supported

**Live updates:** Watches for new tracking files and branch switches automatically.

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
