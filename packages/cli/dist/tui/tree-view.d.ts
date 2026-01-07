import { type CliRenderer } from '@opentui/core';
import type { AppState } from './app.js';
export declare class TreeView {
    private renderer;
    private state;
    private rootBox;
    private headerBox;
    private scrollBox;
    private footerBox;
    private selectableItems;
    constructor(renderer: CliRenderer, state: AppState);
    private buildUI;
    private buildHeader;
    private buildContent;
    private buildFooter;
    private isReasoningSelected;
    private isFileSelected;
    getItemCount(): number;
    toggleExpand(): void;
    moveSelection(delta: number): void;
    refresh(): void;
    destroy(): void;
}
//# sourceMappingURL=tree-view.d.ts.map