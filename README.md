![codewalk](logo.png)

A toolkit for tracking and visualizing AI-assisted code changes with structured reasoning, known as **_logical changes_**.

## What is a "Logical Change"?

A logical change is a group of code modifications that serve a single purpose. A single commit often contains multiple logical changes - for example, adding a feature might involve:

- Adding a new component (logical change #1)
- Updating the router to include it (logical change #2)
- Adding styles (logical change #3)

Traditional diffs show these as a flat list of file changes, making it hard to understand which parts go together. Codewalk groups related hunks across files by their shared reasoning, so reviewers see changes organized by *intent* rather than by file path.

## Visualizer

Interactive TUI for viewing logical changes on the current branch:

```bash
npx codewalk visualize   # or viz
```
or
```bash
bunx codewalk visualize   # or viz
```

Groups all changes by their reasoning text across commits, sorted by impact (most files first). Shows the current branch, tracking directory, and actual diff hunks with syntax highlighting.

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
- Tracking files stored in `<~ or path>/.codewalk/<repo-name>/<hash>.json`
- Files are NOT in the git repo (never committed)
- Best for: Personal tracking without adding files to the repo

**Local storage** (`storage: local`):
- Tracking files stored in `.codewalk/<hash>.json` in the project
- Best for: Projects where team visibility of tracking data is important

## Appendix A - Tracking files

### Schema


### Example
```json
{
  "commit": "a1b2c3d",
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

## Appendix B - Visualizer controls

- `↑`/`↓` or `j`/`k` - Navigate
- `Enter` or `Space` - Expand/collapse
- `g`/`G` - Jump to top/bottom
- `q` - Quit
- Mouse scroll and click supported