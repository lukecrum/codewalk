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

## Project Structure

```
codewalk/
├── packages/
│   ├── claude-plugin/    # Claude marketplace plugin
│   └── types/            # Shared TypeScript types
├── apps/
│   ├── web/              # Web app for visualizing PRs
│   └── cli/              # Terminal UI for local visualization
└── marketplace.json      # Plugin marketplace definition
```

## Packages

| Package | Description |
|---------|-------------|
| [claude-plugin](./packages/claude-plugin) | Claude marketplace plugin - install this to enable tracking |
| [web](./apps/web) | Next.js app for visualizing tracked changes in GitHub PRs |
| [cli](./apps/cli) | Terminal UI for browsing tracked changes locally |
| [types](./packages/types) | Shared TypeScript type definitions |

## Development

```bash
# Install dependencies
npm install

# Run web app
npm run dev

# Build all packages
npm run build

# Type check
npm run typecheck
```

## License

MIT
