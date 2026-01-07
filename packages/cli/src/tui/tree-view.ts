import pc from 'picocolors';
import type { AppState } from './app';
import { truncate, getTerminalSize } from './app';
import type { ParsedHunk } from '../utils/git';

interface RenderLine {
  id: string;
  type: 'reasoning' | 'file' | 'diff';
  depth: number;
  content: string;
  isExpandable: boolean;
  isExpanded: boolean;
}

function formatDiffLine(line: string, cols: number): string {
  const truncatedLine = line.length > cols - 6 ? line.slice(0, cols - 9) + '...' : line;

  if (line.startsWith('+') && !line.startsWith('+++')) {
    return pc.green(truncatedLine);
  } else if (line.startsWith('-') && !line.startsWith('---')) {
    return pc.red(truncatedLine);
  } else if (line.startsWith('@@')) {
    return pc.cyan(truncatedLine);
  }
  return pc.dim(truncatedLine);
}

function renderHunks(hunks: ParsedHunk[], cols: number): string[] {
  const lines: string[] = [];

  for (const hunk of hunks) {
    // Hunk header
    lines.push('      ' + pc.cyan(pc.bold(hunk.header)));

    // Hunk content
    const contentLines = hunk.content.split('\n').filter(Boolean);
    for (const line of contentLines) {
      lines.push('      ' + formatDiffLine(line, cols));
    }

    lines.push(''); // Empty line between hunks
  }

  return lines;
}

export function buildRenderLines(state: AppState): RenderLine[] {
  const lines: RenderLine[] = [];

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

export function getSelectableLines(state: AppState): RenderLine[] {
  return buildRenderLines(state).filter((line) => line.type !== 'diff');
}

export function renderView(state: AppState): string[] {
  const { cols, rows } = getTerminalSize();
  const output: string[] = [];

  // Header
  const totalChanges = state.reasoningGroups.length;
  const header = ` CodeWalker - ${pc.cyan(state.branch)} (${totalChanges} logical changes)`;
  output.push(pc.bold(header));
  output.push(pc.dim('─'.repeat(cols)));

  // Build all render lines
  const allLines = buildRenderLines(state);
  const selectableLines = allLines.filter((line) => line.type !== 'diff');

  // Calculate content height
  const contentHeight = rows - 4; // header, separator, footer

  // Build the visual output
  const visualLines: string[] = [];
  let selectableIndex = 0;

  for (const line of allLines) {
    if (line.type === 'diff') {
      // Render diff content
      const hunks: ParsedHunk[] = JSON.parse(line.content);
      const diffLines = renderHunks(hunks, cols);
      visualLines.push(...diffLines);
    } else {
      // Render reasoning or file line
      const isSelected = selectableIndex === state.selectedIndex;
      const indent = '  '.repeat(line.depth);
      const prefix = line.isExpandable
        ? (line.isExpanded ? '▼ ' : '▶ ')
        : '  ';

      let label = truncate(line.content, cols - indent.length - prefix.length - 4);

      if (line.type === 'reasoning') {
        // Count files in this reasoning
        const reasoningIdx = parseInt(line.id.split('-')[1]);
        const fileCount = state.reasoningGroups[reasoningIdx].files.length;
        label = `${label} ${pc.dim(`(${fileCount} files)`)}`;
      } else if (line.type === 'file') {
        label = pc.blue(label);
      }

      const fullLine = indent + prefix + label;

      if (isSelected) {
        visualLines.push(pc.inverse(fullLine.padEnd(cols)));
      } else {
        visualLines.push(fullLine);
      }

      selectableIndex++;
    }
  }

  // Apply scrolling
  const visibleLines = visualLines.slice(
    state.scrollOffset,
    state.scrollOffset + contentHeight
  );

  output.push(...visibleLines);

  // Pad if needed
  while (output.length < rows - 2) {
    output.push('');
  }

  // Footer
  output.push(pc.dim('─'.repeat(cols)));
  output.push(pc.dim(' j/k: navigate │ Enter: expand/collapse │ q: quit'));

  return output;
}

export function getItemCount(state: AppState): number {
  return getSelectableLines(state).length;
}

export function getItemIdAtIndex(state: AppState, index: number): string | null {
  const lines = getSelectableLines(state);
  return lines[index]?.id || null;
}

export function toggleExpand(state: AppState): void {
  const lines = getSelectableLines(state);
  const line = lines[state.selectedIndex];
  if (!line || !line.isExpandable) return;

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
    } else {
      state.expandedReasonings.add(reasoningIdx);
    }
  } else if (line.type === 'file') {
    const fileKey = line.id.replace('f-', '');
    if (state.expandedFiles.has(fileKey)) {
      state.expandedFiles.delete(fileKey);
    } else {
      state.expandedFiles.add(fileKey);
    }
  }
}
