![codewalk](logo.png)

Track and visualize AI-assisted code changes with structured reasoning.

## What is a "Logical Change"?

A logical change groups code modifications that serve a single purpose. A commit often contains multiple—adding a feature might involve a new component, router update, and styles. Codewalk groups related hunks by shared reasoning, so reviewers see changes by *intent* rather than file path.

## Visualizer

```bash
npx codewalk visualize   # or: bunx codewalk viz
```

![codewalk](visualizer.png)

| Key | Action |
|-----|--------|
| `↑`/`↓` or `j`/`k` | Navigate |
| `Enter`/`Space` | Expand/collapse |
| `g`/`G` | Top/bottom |
| `q` | Quit |

## Claude Code Plugin

### Installation

```
/plugin marketplace add lukecrum/codewalk
/plugin install codewalk
```

Claude will automatically create tracking files for every commit via a stop hook.

### Configuration

```
/codewalk-config
```

Or manually create `.claude/codewalk.local.md`:

```yaml
---
storage: global        # or "local" for in-repo storage
globalDir: ~/.codewalk
---
```

**Global** (default): Files in `~/.codewalk/<repo>/<hash>.json` — keeps tracking out of repo.
**Local**: Files in `.codewalk/<hash>.json` — visible to team (add to `.gitignore` if unwanted).

### Troubleshooting

If a session won't end due to uncommitted changes or missing tracking, commit manually and ask Claude to create the tracking file, or run `/codewalk`.

## Tracking File Schema

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
