import type { AppState } from './app';
interface TreeNode {
    id: string;
    depth: number;
    label: string;
    isExpanded: boolean;
    hasChildren: boolean;
    type: 'commit' | 'change' | 'file';
}
export declare function buildTreeNodes(state: AppState): TreeNode[];
export declare function renderTreeView(state: AppState): string[];
export declare function getTreeNodeCount(state: AppState): number;
export declare function getNodeIdAtIndex(state: AppState, index: number): string | null;
export {};
//# sourceMappingURL=tree-view.d.ts.map