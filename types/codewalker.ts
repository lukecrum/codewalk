export type Changeset = {
  // Schema version for forward compatibility
  version: number;

  // Git commit SHA this changeset describes
  commit: string;

  // Who made the changes (human name, "claude", etc.)
  author: string;

  // List of logical changes, each with its own reasoning
  changes: Change[];
};

export type Change = {
  // Human-readable explanation of why this change was made.
  // Should explain the intent, not just describe what changed.
  reasoning: string;

  // Files affected by this logical change
  files: FileChange[];
};

export type FileChange = {
  // Path to the file, relative to repo root
  path: string;

  // Which hunks from `git show <commit>` belong to this change.
  // 1-indexed, in order of appearance in the diff.
  // Example: [1, 3] means the first and third hunks in this file's diff.
  hunks: number[];
};

export type ParsedHunk = {
  hunkNumber: number;
  header: string;
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  content: string;
  lines: {
    type: 'add' | 'remove' | 'context';
    content: string;
    oldLineNum?: number;
    newLineNum?: number;
  }[];
};

export type FileDiff = {
  path: string;
  hunks: ParsedHunk[];
};

export type CommitInfo = {
  sha: string;
  shortSha: string;
  author: string;
  message: string;
  diff: string;
  files: FileDiff[];
};
