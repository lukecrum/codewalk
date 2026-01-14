import { Octokit } from '@octokit/rest';
import { CommitInfo, FileDiff, ParsedHunk } from '@codewalk/types';

export function getOctokit(token?: string) {
  return new Octokit({
    auth: token || process.env.GITHUB_TOKEN,
  });
}

export function parseHunks(diff: string, filePath: string): ParsedHunk[] {
  const hunks: ParsedHunk[] = [];
  const lines = diff.split('\n');

  let currentHunk: ParsedHunk | null = null;
  let hunkNumber = 0;
  let oldLineNum = 0;
  let newLineNum = 0;

  for (const line of lines) {
    // Check for hunk header
    const hunkMatch = line.match(/^@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@(.*)$/);
    if (hunkMatch) {
      if (currentHunk) {
        hunks.push(currentHunk);
      }

      hunkNumber++;
      oldLineNum = parseInt(hunkMatch[1]);
      newLineNum = parseInt(hunkMatch[3]);
      const oldLines = hunkMatch[2] ? parseInt(hunkMatch[2]) : 1;
      const newLines = hunkMatch[4] ? parseInt(hunkMatch[4]) : 1;

      currentHunk = {
        hunkNumber,
        header: line,
        oldStart: oldLineNum,
        oldLines,
        newStart: newLineNum,
        newLines,
        content: '',
        lines: [],
      };
      continue;
    }

    if (currentHunk) {
      currentHunk.content += line + '\n';

      if (line.startsWith('+') && !line.startsWith('+++')) {
        currentHunk.lines.push({
          type: 'add',
          content: line.slice(1),
          newLineNum: newLineNum++,
        });
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        currentHunk.lines.push({
          type: 'remove',
          content: line.slice(1),
          oldLineNum: oldLineNum++,
        });
      } else if (line.startsWith(' ')) {
        currentHunk.lines.push({
          type: 'context',
          content: line.slice(1),
          oldLineNum: oldLineNum++,
          newLineNum: newLineNum++,
        });
      } else if (line === '') {
        // Handle empty lines as context
        currentHunk.lines.push({
          type: 'context',
          content: '',
          oldLineNum: oldLineNum++,
          newLineNum: newLineNum++,
        });
      }
      // Ignore other lines (like "\ No newline at end of file")
    }
  }

  if (currentHunk) {
    hunks.push(currentHunk);
  }

  return hunks;
}

export function parseCommitDiff(diff: string): FileDiff[] {
  const files: FileDiff[] = [];
  const fileSections = diff.split(/^diff --git /m).filter(Boolean);

  for (const section of fileSections) {
    const lines = section.split('\n');
    const firstLine = lines[0];

    // Extract file path from "a/path b/path"
    const match = firstLine.match(/a\/(.*?) b\/(.*)/);
    if (!match) continue;

    const path = match[2];

    // Find where the actual diff content starts (after the +++ line)
    const startIdx = lines.findIndex(l => l.startsWith('+++'));
    if (startIdx === -1) continue;

    const diffContent = lines.slice(startIdx + 1).join('\n');
    const hunks = parseHunks(diffContent, path);

    files.push({ path, hunks });
  }

  return files;
}

export async function getCommitInfo(
  octokit: Octokit,
  owner: string,
  repo: string,
  sha: string
): Promise<CommitInfo> {
  const { data: commit } = await octokit.repos.getCommit({
    owner,
    repo,
    ref: sha,
  });

  // Parse each file's patch individually
  const files: FileDiff[] = [];
  for (const file of commit.files || []) {
    if (!file.patch) continue;

    const hunks = parseHunks(file.patch, file.filename);
    files.push({
      path: file.filename,
      hunks,
    });
  }

  return {
    sha: commit.sha,
    shortSha: commit.sha.substring(0, 7),
    author: commit.commit.author?.name || 'Unknown',
    message: commit.commit.message,
    diff: commit.files?.map(f => f.patch || '').join('\n\n') || '',
    files,
  };
}

export async function getTrackingFile(
  octokit: Octokit,
  owner: string,
  repo: string,
  ref: string,
  commitHash: string
): Promise<any | null> {
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: `.codewalk/${commitHash}.json`,
      ref,
    });

    if ('content' in data) {
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      return JSON.parse(content);
    }
  } catch (error: any) {
    if (error.status === 404) {
      return null;
    }
    throw error;
  }

  return null;
}
