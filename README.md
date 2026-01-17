# codewalk

A toolkit for tracking and visualizing AI-assisted code changes with structured reasoning.

When Claude makes changes to your code, codewalk captures *why* each change was changed, not just what changed. This makes code review faster and helps you understand AI-generated code.

## How It Works

1. **An agent makes changes** to your codebase
2. **codewalk tracks** each logical change with reasoning in `.codewalk/<commit>.json`
3. **You review** changes grouped by intent, not just by file

## Install the Plugin

```bash
# Add the marketplace
/plugin marketplace add lukecrum/codewalk

# Install codewalk
/plugin install codewalk
```

Once installed, Claude will automatically create tracking files for every commit.

## Run the visualizer

```
npx codewalk visualize
```
or
```
bunx codewalk visualize
```

## Configure Command

Run the interactive configuration wizard to set up codewalk for your project:

```
/codewalk-config
```

This command will prompt you to choose:
- **Storage mode**: Local (in-repo) or global (outside repo)
- **Auto-commit**: Whether tracking files should be committed automatically
- **Global directory**: Custom path for global storage (if using global mode)

Settings are saved to `.claude/codewalk.local.md`.

## Plugin Settings

Codewalk can be configured via `.claude/codewalk.local.md` in your project root. If no settings file exists, defaults are used. You can create this file manually or use the `/codewalk-config` command above.

### Settings File Format

```markdown
---
storage: local
autoCommit: true
globalDir: ~/.codewalk
---

Optional markdown notes here (ignored by the plugin).
```

### Available Settings

| Setting | Values | Default | Description |
|---------|--------|---------|-------------|
| `storage` | `local`, `global` | `local` | Where to store tracking files |
| `globalDir` | path | `~/.codewalk` | Directory for global storage (supports `~`) |
| `autoCommit` | `true`, `false` | `true` | Auto-commit tracking files (local storage only) |

### Storage Modes

**Local storage** (`storage: local`):
- Tracking files stored in `.codewalk/<hash>.json` in the project
- When `autoCommit: true`: Files are amended into the code commit
- When `autoCommit: false`: Files are created but left untracked
- Best for: Projects where team visibility of tracking data is important

**Global storage** (`storage: global`):
- Tracking files stored in `<globalDir>/<repo-name>/<hash>.json`
- Files are NOT in the git repo (never committed)
- Repo name is derived from the directory name
- Best for: Personal tracking without adding files to the repo

## Tracking File Schema

Tracking files are stored at `.codewalk/<commit-hash>.json` and follow this schema:

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

### Key Concepts

- **One tracking file per commit** - Each commit gets its own `.codewalk/<hash>.json`
- **Logical grouping** - Related changes across multiple files share one reasoning
- **Hunk mapping** - Links reasoning to specific diff hunks (the `@@` sections in git diff)
- **Intent over description** - Reasoning explains *why*, not *what* (the diff shows what)

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
