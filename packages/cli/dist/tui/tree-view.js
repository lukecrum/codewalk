"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildTreeNodes = buildTreeNodes;
exports.renderTreeView = renderTreeView;
exports.getTreeNodeCount = getTreeNodeCount;
exports.getNodeIdAtIndex = getNodeIdAtIndex;
const picocolors_1 = __importDefault(require("picocolors"));
const app_1 = require("./app");
function buildTreeNodes(state) {
    const nodes = [];
    for (const tc of state.trackedCommits) {
        if (!tc.tracking)
            continue;
        const commitId = tc.commit.shortSha;
        const isExpanded = state.expandedSet.has(commitId);
        nodes.push({
            id: commitId,
            depth: 0,
            label: `${tc.commit.shortSha} - ${tc.commit.message}`,
            isExpanded,
            hasChildren: tc.tracking.changes.length > 0,
            type: 'commit',
        });
        if (isExpanded && tc.tracking) {
            tc.tracking.changes.forEach((change, changeIdx) => {
                const changeId = `${commitId}-${changeIdx}`;
                const isChangeExpanded = state.expandedSet.has(changeId);
                nodes.push({
                    id: changeId,
                    depth: 1,
                    label: change.reasoning,
                    isExpanded: isChangeExpanded,
                    hasChildren: change.files.length > 0,
                    type: 'change',
                });
                if (isChangeExpanded) {
                    change.files.forEach((file, fileIdx) => {
                        nodes.push({
                            id: `${changeId}-${fileIdx}`,
                            depth: 2,
                            label: `${file.path} (hunks: ${file.hunks.join(', ')})`,
                            isExpanded: false,
                            hasChildren: false,
                            type: 'file',
                        });
                    });
                }
            });
        }
    }
    return nodes;
}
function renderTreeView(state) {
    const { cols, rows } = (0, app_1.getTerminalSize)();
    const lines = [];
    const nodes = buildTreeNodes(state);
    // Header
    const trackedCount = state.trackedCommits.filter((tc) => tc.tracking).length;
    const header = ` CodeWalker - ${picocolors_1.default.cyan(state.branch)} (${trackedCount} commits tracked)`;
    const viewIndicator = picocolors_1.default.bgBlue(picocolors_1.default.white(' Tree ')) + picocolors_1.default.dim(' Table ');
    const headerLine = header.padEnd(cols - 15) + viewIndicator;
    lines.push(picocolors_1.default.bold(headerLine));
    lines.push(picocolors_1.default.dim('─'.repeat(cols)));
    // Content area height
    const contentHeight = rows - 5; // header, separator, footer, padding
    // Apply scroll offset
    const visibleNodes = nodes.slice(state.scrollOffset, state.scrollOffset + contentHeight);
    for (let i = 0; i < visibleNodes.length; i++) {
        const node = visibleNodes[i];
        const absoluteIndex = state.scrollOffset + i;
        const isSelected = absoluteIndex === state.selectedIndex;
        let prefix = '';
        let indent = '  '.repeat(node.depth);
        if (node.hasChildren) {
            prefix = node.isExpanded ? '▼ ' : '▶ ';
        }
        else {
            prefix = node.depth > 0 ? '├─ ' : '  ';
        }
        let label = (0, app_1.truncate)(node.label, cols - indent.length - prefix.length - 4);
        // Apply styling based on type
        if (node.type === 'commit') {
            const [hash, ...rest] = label.split(' - ');
            label = picocolors_1.default.yellow(hash) + ' - ' + rest.join(' - ');
        }
        else if (node.type === 'change') {
            label = picocolors_1.default.dim(label);
        }
        else if (node.type === 'file') {
            label = picocolors_1.default.blue(label);
        }
        const line = indent + prefix + label;
        if (isSelected) {
            lines.push(picocolors_1.default.inverse(line.padEnd(cols)));
        }
        else {
            lines.push(line);
        }
    }
    // Pad remaining lines
    while (lines.length < rows - 3) {
        lines.push('');
    }
    // Footer
    lines.push(picocolors_1.default.dim('─'.repeat(cols)));
    const footer = picocolors_1.default.dim(' j/k: navigate │ Enter: expand │ Tab: switch view │ q: quit');
    lines.push(footer);
    return lines;
}
function getTreeNodeCount(state) {
    return buildTreeNodes(state).length;
}
function getNodeIdAtIndex(state, index) {
    const nodes = buildTreeNodes(state);
    return nodes[index]?.id || null;
}
