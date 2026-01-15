# codewalk - Claude Marketplace Plugin

A Claude plugin that helps you track and visualize AI-assisted code changes with structured reasoning.

## What It Does

When Claude makes code changes in your repository, this plugin ensures:

1. **All changes are committed** to git with descriptive messages
2. **A tracking file is created** at `.codewalk/<commit-hash>.json`
3. **The tracking file explains** why each change was made, not just what changed

## Installation

Install from the Claude marketplace:

```
claude plugin install codewalk
```

## Configuration

Create `.claude/codewalk.local.md` in your project root to customize behavior:

```markdown
---
storage: local
autoCommit: true
globalDir: ~/.codewalk
---
```

### Settings

| Setting | Values | Default | Description |
|---------|--------|---------|-------------|
| `storage` | `local`, `global` | `local` | Where to store tracking files |
| `autoCommit` | `true`, `false` | `true` | Auto-commit tracking files (local only) |
| `globalDir` | path | `~/.codewalk` | Directory for global storage |

### Storage Modes

| Mode | Tracking Location | Git Behavior |
|------|-------------------|--------------|
| `local` + `autoCommit: true` | `.codewalk/<hash>.json` | Amended to code commit |
| `local` + `autoCommit: false` | `.codewalk/<hash>.json` | Left untracked |
| `global` | `~/.codewalk/<repo>/<hash>.json` | Not in repo |

### Gitignore

For `autoCommit: false` mode, add to `.gitignore`:

```gitignore
.codewalk/
```

Always gitignore the settings file:

```gitignore
.claude/*.local.md
```

## Usage

Once installed, Claude will automatically:

1. Create git commits for code changes
2. Generate `.codewalk/<commit>.json` files with structured reasoning
3. Group related hunks by logical purpose
4. Enforce the workflow via the Stop hook

## Tracking File Schema

```typescript
type Changeset = {
  version: number;      // Schema version
  commit: string;       // Git commit SHA
  author: string;       // Who made the changes
  changes: Change[];    // List of logical changes
};

type Change = {
  reasoning: string;    // Why this change was made
  files: FileChange[];  // Files affected
};

type FileChange = {
  path: string;         // File path relative to repo root
  hunks: number[];      // Which hunks (1-indexed) belong to this change
};
```

## Example Tracking File

```json
{
  "version": 1,
  "commit": "a1b2c3d",
  "author": "claude",
  "changes": [
    {
      "reasoning": "Add dark mode toggle that persists to localStorage",
      "files": [
        { "path": "index.html", "hunks": [1] },
        { "path": "styles.css", "hunks": [1, 2, 3] },
        { "path": "app.js", "hunks": [1, 2, 3] }
      ]
    }
  ]
}
```

## Visualization

Use the companion tools to visualize tracked changes:

- **Web App**: Browse PRs and see grouped changes with reasoning
- **CLI**: `npx codewalk` to visualize changes locally

## License

MIT
