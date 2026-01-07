import * as fs from 'fs/promises';
import * as path from 'path';
import type { Changeset } from '../types/codewalker';
import type { CommitInfo } from './git';

export interface TrackedCommit {
  commit: CommitInfo;
  tracking: Changeset | null;
}

export async function loadTrackingFiles(
  cwd: string,
  commits: CommitInfo[]
): Promise<TrackedCommit[]> {
  const result: TrackedCommit[] = [];

  for (const commit of commits) {
    const trackingPath = path.join(cwd, '.codewalker', `${commit.shortSha}.json`);
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
