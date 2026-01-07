import type { Changeset } from '../types/codewalker';
import type { CommitInfo } from './git';
export interface TrackedCommit {
    commit: CommitInfo;
    tracking: Changeset | null;
}
export declare function loadTrackingFiles(cwd: string, commits: CommitInfo[]): Promise<TrackedCommit[]>;
export declare function getTrackedCommits(trackedCommits: TrackedCommit[]): TrackedCommit[];
//# sourceMappingURL=tracking.d.ts.map