import { createCliRenderer, type CliRenderer, BoxRenderable, TextRenderable, ScrollBoxRenderable, DiffRenderable } from '@opentui/core';
import type { ReasoningGroup } from '../utils/tracking.js';
export interface AppState {
    branch: string;
    reasoningGroups: ReasoningGroup[];
    selectedIndex: number;
    expandedReasonings: Set<number>;
    expandedFiles: Set<string>;
}
export declare function createAppState(branch: string, reasoningGroups: ReasoningGroup[]): AppState;
export { createCliRenderer, BoxRenderable, TextRenderable, ScrollBoxRenderable, DiffRenderable };
export type { CliRenderer };
//# sourceMappingURL=app.d.ts.map