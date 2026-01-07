import type { ReasoningGroup } from '../utils/tracking';
export interface AppState {
    branch: string;
    reasoningGroups: ReasoningGroup[];
    selectedIndex: number;
    expandedReasonings: Set<number>;
    expandedFiles: Set<string>;
    scrollOffset: number;
}
export declare function createAppState(branch: string, reasoningGroups: ReasoningGroup[]): AppState;
export declare function clearScreen(): void;
export declare function hideCursor(): void;
export declare function showCursor(): void;
export declare function getTerminalSize(): {
    rows: number;
    cols: number;
};
export declare function setupKeyboardInput(onKey: (key: string, ctrl: boolean) => void, onExit: () => void): void;
export declare function cleanupInput(): void;
export declare function truncate(str: string, maxLen: number): string;
//# sourceMappingURL=app.d.ts.map