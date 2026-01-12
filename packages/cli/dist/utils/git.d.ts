export interface CommitInfo {
    sha: string;
    shortSha: string;
    author: string;
    message: string;
}
export interface ParsedHunk {
    hunkNumber: number;
    header: string;
    content: string;
}
export interface FileDiff {
    path: string;
    hunks: ParsedHunk[];
}
export declare function getCurrentBranch(cwd: string): string;
export declare function getCommitList(cwd: string): CommitInfo[];
export declare function isGitRepo(cwd: string): boolean;
export declare function getMainBranch(cwd: string): string;
export declare function getMergeBase(cwd: string, branch1: string, branch2: string): string;
export declare function getCommitDiff(cwd: string, commitSha: string): string;
export declare function parseDiffIntoFiles(diffOutput: string): FileDiff[];
export declare function getCommitFileDiffs(cwd: string, commitSha: string): FileDiff[];
//# sourceMappingURL=git.d.ts.map