import * as fs from 'fs/promises';
import * as path from 'path';
import type { Changeset } from '@codewalk/types';
import type { CommitInfo, FileDiff, ParsedHunk } from './git.js';
import { getCommitFileDiffs } from './git.js';

export interface TrackedCommit {
  commit: CommitInfo;
  tracking: Changeset | null;
}

export interface FileWithHunks {
  path: string;
  hunks: ParsedHunk[];
  hunkNumbers: number[];
}

export interface ReasoningGroup {
  reasoning: string;
  files: FileWithHunks[];
}

export async function loadTrackingFiles(
  trackingDir: string,
  commits: CommitInfo[]
): Promise<TrackedCommit[]> {
  const result: TrackedCommit[] = [];

  for (const commit of commits) {
    const trackingPath = path.join(trackingDir, `${commit.shortSha}.json`);
    let tracking: Changeset | null = null;

    try {
      const content = await fs.readFile(trackingPath, 'utf-8');
      tracking = JSON.parse(content);
    } catch {
      // No tracking file for this commit
    }

    result.push({ commit, tracking });
  }

  return result;
}

export function getTrackedCommits(trackedCommits: TrackedCommit[]): TrackedCommit[] {
  return trackedCommits.filter((tc) => tc.tracking !== null);
}

/**
 * Aggregates all tracking data into reasoning groups with actual diff hunks.
 * This is the "By Reasoning" view - grouping changes by their logical purpose.
 */
export function aggregateByReasoning(
  cwd: string,
  trackedCommits: TrackedCommit[]
): ReasoningGroup[] {
  const reasoningMap = new Map<string, ReasoningGroup>();

  // Build a map of commit SHA to file diffs for quick lookup
  const commitDiffs = new Map<string, FileDiff[]>();

  for (const tc of trackedCommits) {
    if (!tc.tracking) continue;

    // Get diffs for this commit (lazy load)
    if (!commitDiffs.has(tc.commit.shortSha)) {
      commitDiffs.set(tc.commit.shortSha, getCommitFileDiffs(cwd, tc.commit.shortSha));
    }
    const fileDiffs = commitDiffs.get(tc.commit.shortSha) || [];

    for (const change of tc.tracking.changes) {
      // Use reasoning as the key (could also include commit if you want per-commit grouping)
      const key = change.reasoning;

      if (!reasoningMap.has(key)) {
        reasoningMap.set(key, {
          reasoning: change.reasoning,
          files: [],
        });
      }

      const group = reasoningMap.get(key)!;

      for (const fileChange of change.files) {
        // Find the diff for this file
        const fileDiff = fileDiffs.find((fd) => fd.path === fileChange.path);
        if (!fileDiff) continue;

        // Get only the hunks specified in the tracking file
        const selectedHunks = fileChange.hunks
          .map((hunkNum) => fileDiff.hunks.find((h) => h.hunkNumber === hunkNum))
          .filter((h): h is ParsedHunk => h != null);

        if (selectedHunks.length === 0) continue;

        // Check if this file is already in the group
        const existingFile = group.files.find((f) => f.path === fileChange.path);
        if (existingFile) {
          // Merge hunks (avoid duplicates)
          for (const hunk of selectedHunks) {
            if (!existingFile.hunks.find((h) => h.hunkNumber === hunk.hunkNumber)) {
              existingFile.hunks.push(hunk);
              existingFile.hunkNumbers.push(hunk.hunkNumber);
            }
          }
        } else {
          group.files.push({
            path: fileChange.path,
            hunks: selectedHunks,
            hunkNumbers: fileChange.hunks,
          });
        }
      }
    }
  }

  // Convert map to array and sort by number of files (most impactful first)
  return Array.from(reasoningMap.values())
    .filter((group) => group.files.length > 0)
    .sort((a, b) => b.files.length - a.files.length);
}
