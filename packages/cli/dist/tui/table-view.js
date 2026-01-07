"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildTableRows = buildTableRows;
exports.renderTableView = renderTableView;
exports.getTableRowCount = getTableRowCount;
const picocolors_1 = __importDefault(require("picocolors"));
const app_1 = require("./app");
function buildTableRows(state) {
    const rows = [];
    for (const tc of state.trackedCommits) {
        if (!tc.tracking)
            continue;
        for (const change of tc.tracking.changes) {
            for (const file of change.files) {
                rows.push({
                    commit: tc.commit.shortSha,
                    file: file.path,
                    reasoning: change.reasoning,
                });
            }
        }
    }
    return rows;
}
function renderTableView(state) {
    const { cols, rows: termRows } = (0, app_1.getTerminalSize)();
    const lines = [];
    const tableRows = buildTableRows(state);
    // Header
    const trackedCount = state.trackedCommits.filter((tc) => tc.tracking).length;
    const header = ` CodeWalker - ${picocolors_1.default.cyan(state.branch)} (${trackedCount} commits tracked)`;
    const viewIndicator = picocolors_1.default.dim(' Tree ') + picocolors_1.default.bgBlue(picocolors_1.default.white(' Table '));
    const headerLine = header.padEnd(cols - 15) + viewIndicator;
    lines.push(picocolors_1.default.bold(headerLine));
    lines.push(picocolors_1.default.dim('─'.repeat(cols)));
    // Column widths
    const commitWidth = 9;
    const fileWidth = Math.floor((cols - commitWidth - 6) * 0.35);
    const reasoningWidth = cols - commitWidth - fileWidth - 6;
    // Table header
    const tableHeader = picocolors_1.default.bold(' Commit'.padEnd(commitWidth)) +
        ' │ ' +
        picocolors_1.default.bold('File'.padEnd(fileWidth)) +
        ' │ ' +
        picocolors_1.default.bold('Reasoning');
    lines.push(tableHeader);
    lines.push(picocolors_1.default.dim('─'.repeat(cols)));
    // Content area height
    const contentHeight = termRows - 7; // headers, separators, footer
    // Apply scroll offset
    const visibleRows = tableRows.slice(state.scrollOffset, state.scrollOffset + contentHeight);
    for (let i = 0; i < visibleRows.length; i++) {
        const row = visibleRows[i];
        const absoluteIndex = state.scrollOffset + i;
        const isSelected = absoluteIndex === state.selectedIndex;
        const commitCell = picocolors_1.default.yellow(row.commit.padEnd(commitWidth));
        const fileCell = (0, app_1.truncate)(row.file, fileWidth).padEnd(fileWidth);
        const reasoningCell = (0, app_1.truncate)(row.reasoning, reasoningWidth);
        const line = ` ${commitCell} │ ${picocolors_1.default.blue(fileCell)} │ ${picocolors_1.default.dim(reasoningCell)}`;
        if (isSelected) {
            lines.push(picocolors_1.default.inverse(line.padEnd(cols)));
        }
        else {
            lines.push(line);
        }
    }
    // Pad remaining lines
    while (lines.length < termRows - 3) {
        lines.push('');
    }
    // Footer
    lines.push(picocolors_1.default.dim('─'.repeat(cols)));
    const footer = picocolors_1.default.dim(' j/k: navigate │ Tab: switch view │ q: quit');
    lines.push(footer);
    return lines;
}
function getTableRowCount(state) {
    return buildTableRows(state).length;
}
