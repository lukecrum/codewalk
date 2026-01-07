export interface CommitInfo {
    sha: string;
    shortSha: string;
    author: string;
    message: string;
}
export declare function getCurrentBranch(cwd: string): string;
export declare function getCommitList(cwd: string): CommitInfo[];
export declare function isGitRepo(cwd: string): boolean;
//# sourceMappingURL=git.d.ts.map