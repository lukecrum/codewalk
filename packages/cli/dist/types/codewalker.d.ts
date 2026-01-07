export type Changeset = {
    version: number;
    commit: string;
    author: string;
    changes: Change[];
};
export type Change = {
    reasoning: string;
    files: FileChange[];
};
export type FileChange = {
    path: string;
    hunks: number[];
};
//# sourceMappingURL=codewalker.d.ts.map