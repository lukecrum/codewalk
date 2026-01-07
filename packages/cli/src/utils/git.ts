import { execSync } from 'child_process';

export interface CommitInfo {
  sha: string;
  shortSha: string;
  author: string;
  message: string;
}

export function getCurrentBranch(cwd: string): string {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', {
      cwd,
      encoding: 'utf-8',
    }).trim();
  } catch {
    throw new Error('Not a git repository or git is not installed');
  }
}

export function getCommitList(cwd: string): CommitInfo[] {
  try {
    const output = execSync('git log --format="%H|%h|%an|%s" --first-parent', {
      cwd,
      encoding: 'utf-8',
    });

    return output
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [sha, shortSha, author, ...messageParts] = line.split('|');
        return {
          sha,
          shortSha,
          author,
          message: messageParts.join('|'), // Handle messages with | in them
        };
      });
  } catch {
    throw new Error('Failed to get commit list');
  }
}

export function isGitRepo(cwd: string): boolean {
  try {
    execSync('git rev-parse --git-dir', { cwd, encoding: 'utf-8' });
    return true;
  } catch {
    return false;
  }
}
