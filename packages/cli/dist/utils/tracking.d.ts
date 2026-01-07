import type { Changeset } from '../types/codewalker.js';
import type { CommitInfo, ParsedHunk } from './git.js';
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
export declare function loadTrackingFiles(cwd: string, commits: CommitInfo[]): Promise<TrackedCommit[]>;
export declare function getTrackedCommits(trackedCommits: TrackedCommit[]): TrackedCommit[];
/**
 * Aggregates all tracking data into reasoning groups with actual diff hunks.
 * This is the "By Reasoning" view - grouping changes by their logical purpose.
 */
export declare function aggregateByReasoning(cwd: string, trackedCommits: TrackedCommit[]): ReasoningGroup[];
//# sourceMappingURL=tracking.d.ts.map