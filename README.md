# codewalk Visualizer

A Next.js web application that visualizes code changes tracked by the [codewalk skill](./.claude/skills/codewalk.md) in GitHub pull requests.

## Features

- **GitHub Integration**: Browse pull requests from any GitHub repository
- **Commit Tracking**: View all commits within a pull request
- **Change Visualization**: See code changes with syntax highlighting
- **codewalk Support**: Display structured explanations from `.codewalk/*.json` tracking files
- **Grouped Changes**: View hunks grouped by logical purpose with reasoning

## Getting Started

### Prerequisites

- Node.js 18+ installed
- (Optional) GitHub Personal Access Token for private repos or higher rate limits

### Installation

1. Install dependencies:
```bash
npm install
```

2. (Optional) Configure GitHub token:
```bash
cp .env.local.example .env.local
# Edit .env.local and add your GitHub token
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Configure Repository**:
   - Enter the repository owner (e.g., `octocat`)
   - Enter the repository name (e.g., `my-repo`)
   - (Optional) Provide a GitHub token

2. **Select Pull Request**:
   - Browse available pull requests
   - Click on a PR to view its commits

3. **View Commits**:
   - See all commits in the selected PR
   - Click on a commit to view detailed changes

4. **Visualize Changes**:
   - If a `.codewalk/<commit-hash>.json` file exists, changes are grouped by logical purpose
   - Each change includes:
     - **Reasoning**: Why the change was made
     - **Files**: Which files were affected
     - **Hunks**: The specific code changes with line numbers
   - If no tracking file exists, all diffs are shown

## codewalk Tracking Files

This app reads tracking files from `.codewalk/<commit-hash>.json` in your repository. These files are created by the codewalk skill and follow this schema:

```typescript
type Changeset = {
  version: number;
  commit: string;
  author: string;
  changes: Change[];
};

type Change = {
  reasoning: string;  // Why this change was made
  files: FileChange[];
};

type FileChange = {
  path: string;       // File path relative to repo root
  hunks: number[];    // Which hunks (1-indexed) belong to this change
};
```

## GitHub Token

A GitHub token is optional but recommended for:
- Accessing private repositories
- Higher API rate limits (5,000 requests/hour vs 60 requests/hour)

Create a token at: [https://github.com/settings/tokens](https://github.com/settings/tokens)

Required scopes:
- `repo` (for private repositories)
- `public_repo` (for public repositories only)

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **GitHub API**: Octokit
- **Deployment**: Ready for Vercel, Netlify, or any Node.js host

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Run production server
npm start

# Run linter
npm run lint
```

## Claude Marketplace Plugin

This project includes a Claude marketplace plugin at `packages/claude-plugin/` for external distribution. Install it with:

```
claude plugin install codewalk
```

## License

ISC
