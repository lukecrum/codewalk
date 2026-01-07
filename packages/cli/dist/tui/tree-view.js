"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildRenderLines = buildRenderLines;
exports.getSelectableLines = getSelectableLines;
exports.renderView = renderView;
exports.getItemCount = getItemCount;
exports.getItemIdAtIndex = getItemIdAtIndex;
exports.toggleExpand = toggleExpand;
const picocolors_1 = __importDefault(require("picocolors"));
const app_1 = require("./app");
function formatDiffLine(line, cols) {
    const truncatedLine = line.length > cols - 6 ? line.slice(0, cols - 9) + '...' : line;
    if (line.startsWith('+') && !line.startsWith('+++')) {
        return picocolors_1.default.green(truncatedLine);
    }
    else if (line.startsWith('-') && !line.startsWith('---')) {
        return picocolors_1.default.red(truncatedLine);
    }
    else if (line.startsWith('@@')) {
        return picocolors_1.default.cyan(truncatedLine);
    }
    return picocolors_1.default.dim(truncatedLine);
}
function renderHunks(hunks, cols) {
    const lines = [];
    for (const hunk of hunks) {
        // Hunk header
        lines.push('      ' + picocolors_1.default.cyan(picocolors_1.default.bold(hunk.header)));
        // Hunk content
        const contentLines = hunk.content.split('\n').filter(Boolean);
        for (const line of contentLines) {
            lines.push('      ' + formatDiffLine(line, cols));
        }
        lines.push(''); // Empty line between hunks
    }
    return lines;
}
function buildRenderLines(state) {
    const lines = [];
    state.reasoningGroups.forEach((group, reasoningIdx) => {
        const isReasoningExpanded = state.expandedReasonings.has(reasoningIdx);
        // Reasoning line
        lines.push({
            id: `r-${reasoningIdx}`,
            type: 'reasoning',
            depth: 0,
            content: group.reasoning,
            isExpandable: true,
            isExpanded: isReasoningExpanded,
        });
        if (isReasoningExpanded) {
            // File lines
            group.files.forEach((file) => {
                const fileKey = `${reasoningIdx}|${file.path}`;
                const isFileExpanded = state.expandedFiles.has(fileKey);
                lines.push({
                    id: `f-${fileKey}`,
                    type: 'file',
                    depth: 1,
                    content: file.path,
                    isExpandable: true,
                    isExpanded: isFileExpanded,
                });
                if (isFileExpanded) {
                    // Add diff content as non-selectable lines
                    lines.push({
                        id: `d-${fileKey}`,
                        type: 'diff',
                        depth: 2,
                        content: JSON.stringify(file.hunks), // Will be rendered specially
                        isExpandable: false,
                        isExpanded: false,
                    });
                }
            });
        }
    });
    return lines;
}
function getSelectableLines(state) {
    return buildRenderLines(state).filter((line) => line.type !== 'diff');
}
function renderView(state) {
    const { cols, rows } = (0, app_1.getTerminalSize)();
    const output = [];
    // Header
    const totalChanges = state.reasoningGroups.length;
    const header = ` CodeWalker - ${picocolors_1.default.cyan(state.branch)} (${totalChanges} logical changes)`;
    output.push(picocolors_1.default.bold(header));
    output.push(picocolors_1.default.dim('─'.repeat(cols)));
    // Build all render lines
    const allLines = buildRenderLines(state);
    const selectableLines = allLines.filter((line) => line.type !== 'diff');
    // Calculate content height
    const contentHeight = rows - 4; // header, separator, footer
    // Build the visual output
    const visualLines = [];
    let selectableIndex = 0;
    for (const line of allLines) {
        if (line.type === 'diff') {
            // Render diff content
            const hunks = JSON.parse(line.content);
            const diffLines = renderHunks(hunks, cols);
            visualLines.push(...diffLines);
        }
        else {
            // Render reasoning or file line
            const isSelected = selectableIndex === state.selectedIndex;
            const indent = '  '.repeat(line.depth);
            const prefix = line.isExpandable
                ? (line.isExpanded ? '▼ ' : '▶ ')
                : '  ';
            let label = (0, app_1.truncate)(line.content, cols - indent.length - prefix.length - 4);
            if (line.type === 'reasoning') {
                // Count files in this reasoning
                const reasoningIdx = parseInt(line.id.split('-')[1]);
                const fileCount = state.reasoningGroups[reasoningIdx].files.length;
                label = `${label} ${picocolors_1.default.dim(`(${fileCount} files)`)}`;
            }
            else if (line.type === 'file') {
                label = picocolors_1.default.blue(label);
            }
            const fullLine = indent + prefix + label;
            if (isSelected) {
                visualLines.push(picocolors_1.default.inverse(fullLine.padEnd(cols)));
            }
            else {
                visualLines.push(fullLine);
            }
            selectableIndex++;
        }
    }
    // Apply scrolling
    const visibleLines = visualLines.slice(state.scrollOffset, state.scrollOffset + contentHeight);
    output.push(...visibleLines);
    // Pad if needed
    while (output.length < rows - 2) {
        output.push('');
    }
    // Footer
    output.push(picocolors_1.default.dim('─'.repeat(cols)));
    output.push(picocolors_1.default.dim(' j/k: navigate │ Enter: expand/collapse │ q: quit'));
    return output;
}
function getItemCount(state) {
    return getSelectableLines(state).length;
}
function getItemIdAtIndex(state, index) {
    const lines = getSelectableLines(state);
    return lines[index]?.id || null;
}
function toggleExpand(state) {
    const lines = getSelectableLines(state);
    const line = lines[state.selectedIndex];
    if (!line || !line.isExpandable)
        return;
    if (line.type === 'reasoning') {
        const reasoningIdx = parseInt(line.id.split('-')[1]);
        if (state.expandedReasonings.has(reasoningIdx)) {
            state.expandedReasonings.delete(reasoningIdx);
            // Also collapse all files in this reasoning
            for (const key of state.expandedFiles) {
                if (key.startsWith(`${reasoningIdx}|`)) {
                    state.expandedFiles.delete(key);
                }
            }
        }
        else {
            state.expandedReasonings.add(reasoningIdx);
        }
    }
    else if (line.type === 'file') {
        const fileKey = line.id.replace('f-', '');
        if (state.expandedFiles.has(fileKey)) {
            state.expandedFiles.delete(fileKey);
        }
        else {
            state.expandedFiles.add(fileKey);
        }
    }
}
