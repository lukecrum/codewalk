import type { AppState } from './app';
interface TableRow {
    commit: string;
    file: string;
    reasoning: string;
}
export declare function buildTableRows(state: AppState): TableRow[];
export declare function renderTableView(state: AppState): string[];
export declare function getTableRowCount(state: AppState): number;
export {};
//# sourceMappingURL=table-view.d.ts.map