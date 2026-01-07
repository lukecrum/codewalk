import pc from 'picocolors';
import type { AppState } from './app';
import { truncate, getTerminalSize } from './app';

interface TableRow {
  commit: string;
  file: string;
  reasoning: string;
}

export function buildTableRows(state: AppState): TableRow[] {
  const rows: TableRow[] = [];

  for (const tc of state.trackedCommits) {
    if (!tc.tracking) continue;

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

export function renderTableView(state: AppState): string[] {
  const { cols, rows: termRows } = getTerminalSize();
  const lines: string[] = [];
  const tableRows = buildTableRows(state);

  // Header
  const trackedCount = state.trackedCommits.filter((tc) => tc.tracking).length;
  const header = ` CodeWalker - ${pc.cyan(state.branch)} (${trackedCount} commits tracked)`;
  const viewIndicator = pc.dim(' Tree ') + pc.bgBlue(pc.white(' Table '));
  const headerLine = header.padEnd(cols - 15) + viewIndicator;
  lines.push(pc.bold(headerLine));
  lines.push(pc.dim('─'.repeat(cols)));

  // Column widths
  const commitWidth = 9;
  const fileWidth = Math.floor((cols - commitWidth - 6) * 0.35);
  const reasoningWidth = cols - commitWidth - fileWidth - 6;

  // Table header
  const tableHeader =
    pc.bold(' Commit'.padEnd(commitWidth)) +
    ' │ ' +
    pc.bold('File'.padEnd(fileWidth)) +
    ' │ ' +
    pc.bold('Reasoning');
  lines.push(tableHeader);
  lines.push(pc.dim('─'.repeat(cols)));

  // Content area height
  const contentHeight = termRows - 7; // headers, separators, footer

  // Apply scroll offset
  const visibleRows = tableRows.slice(
    state.scrollOffset,
    state.scrollOffset + contentHeight
  );

  for (let i = 0; i < visibleRows.length; i++) {
    const row = visibleRows[i];
    const absoluteIndex = state.scrollOffset + i;
    const isSelected = absoluteIndex === state.selectedIndex;

    const commitCell = pc.yellow(row.commit.padEnd(commitWidth));
    const fileCell = truncate(row.file, fileWidth).padEnd(fileWidth);
    const reasoningCell = truncate(row.reasoning, reasoningWidth);

    const line = ` ${commitCell} │ ${pc.blue(fileCell)} │ ${pc.dim(reasoningCell)}`;

    if (isSelected) {
      lines.push(pc.inverse(line.padEnd(cols)));
    } else {
      lines.push(line);
    }
  }

  // Pad remaining lines
  while (lines.length < termRows - 3) {
    lines.push('');
  }

  // Footer
  lines.push(pc.dim('─'.repeat(cols)));
  const footer = pc.dim(' j/k: navigate │ Tab: switch view │ q: quit');
  lines.push(footer);

  return lines;
}

export function getTableRowCount(state: AppState): number {
  return buildTableRows(state).length;
}
