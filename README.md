# codewalk

A toolkit for tracking and visualizing AI-assisted code changes with structured reasoning.

When Claude makes changes to your code, codewalk captures *why* each change was made—not just what changed. This makes code review faster and helps you understand AI-generated code.

## How It Works

1. **Claude makes changes** to your codebase
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
