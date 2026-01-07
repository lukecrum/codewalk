import { createCliRenderer, BoxRenderable, TextRenderable, ScrollBoxRenderable, DiffRenderable, } from '@opentui/core';
export function createAppState(branch, reasoningGroups) {
    return {
        branch,
        reasoningGroups,
        selectedIndex: 0,
        expandedReasonings: new Set(),
        expandedFiles: new Set(),
    };
}
export { createCliRenderer, BoxRenderable, TextRenderable, ScrollBoxRenderable, DiffRenderable };
