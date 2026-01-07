import type { AppState } from './app';
interface RenderLine {
    id: string;
    type: 'reasoning' | 'file' | 'diff';
    depth: number;
    content: string;
    isExpandable: boolean;
    isExpanded: boolean;
}
export declare function buildRenderLines(state: AppState): RenderLine[];
export declare function getSelectableLines(state: AppState): RenderLine[];
export declare function renderView(state: AppState): string[];
export declare function getItemCount(state: AppState): number;
export declare function getItemIdAtIndex(state: AppState, index: number): string | null;
export declare function toggleExpand(state: AppState): void;
export {};
//# sourceMappingURL=tree-view.d.ts.map