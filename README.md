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

## Tracking File Format

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
