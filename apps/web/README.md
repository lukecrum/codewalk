# codewalk Web App

A Next.js web application that visualizes code changes tracked by codewalk in GitHub pull requests.

## Features

- **GitHub Integration**: Browse pull requests from any GitHub repository
- **Commit Tracking**: View all commits within a pull request
- **Change Visualization**: See code changes with syntax highlighting
- **Reasoning View**: Display structured explanations from `.codewalk/*.json` tracking files
- **Grouped Changes**: View hunks grouped by logical purpose

## Getting Started

### Prerequisites

- Node.js 18+
- (Optional) GitHub Personal Access Token for private repos or higher rate limits

### Installation

From the monorepo root:

```bash
# Install dependencies
npm install

# Run the web app
npm run dev
```

Or from this directory:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Copy `.env.local.example` to `.env.local` and configure:

```bash
# Optional: GitHub token for private repos / higher rate limits
GITHUB_TOKEN=your_token_here

# Supabase (for authentication)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Usage

1. **Sign in** with GitHub
2. **Select a repository** from your accessible repos
3. **Choose a pull request** to review
4. **View commits** grouped by reasoning (if tracking files exist) or by file

### Viewing Changes

- If a `.codewalk/<commit-hash>.json` file exists, changes are grouped by logical purpose
- Each change shows:
  - **Reasoning**: Why the change was made
  - **Files**: Which files were affected
  - **Hunks**: The specific code changes with line numbers
- If no tracking file exists, all diffs are shown ungrouped

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
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **GitHub API**: Octokit
- **Auth**: Supabase

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

## Deployment

Ready for deployment on Vercel, Netlify, or any Node.js host.

```bash
npm run build
npm start
```
