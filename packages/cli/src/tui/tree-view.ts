import pc from 'picocolors';
import type { AppState } from './app';
import { truncate, getTerminalSize } from './app';

interface TreeNode {
  id: string;
  depth: number;
  label: string;
  isExpanded: boolean;
  hasChildren: boolean;
  type: 'commit' | 'change' | 'file';
}

export function buildTreeNodes(state: AppState): TreeNode[] {
  const nodes: TreeNode[] = [];

  for (const tc of state.trackedCommits) {
    if (!tc.tracking) continue;

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

export function renderTreeView(state: AppState): string[] {
  const { cols, rows } = getTerminalSize();
  const lines: string[] = [];
  const nodes = buildTreeNodes(state);

  // Header
  const trackedCount = state.trackedCommits.filter((tc) => tc.tracking).length;
  const header = ` CodeWalker - ${pc.cyan(state.branch)} (${trackedCount} commits tracked)`;
  const viewIndicator = pc.bgBlue(pc.white(' Tree ')) + pc.dim(' Table ');
  const headerLine = header.padEnd(cols - 15) + viewIndicator;
  lines.push(pc.bold(headerLine));
  lines.push(pc.dim('─'.repeat(cols)));

  // Content area height
  const contentHeight = rows - 5; // header, separator, footer, padding

  // Apply scroll offset
  const visibleNodes = nodes.slice(
    state.scrollOffset,
    state.scrollOffset + contentHeight
  );

  for (let i = 0; i < visibleNodes.length; i++) {
    const node = visibleNodes[i];
    const absoluteIndex = state.scrollOffset + i;
    const isSelected = absoluteIndex === state.selectedIndex;

    let prefix = '';
    let indent = '  '.repeat(node.depth);

    if (node.hasChildren) {
      prefix = node.isExpanded ? '▼ ' : '▶ ';
    } else {
      prefix = node.depth > 0 ? '├─ ' : '  ';
    }

    let label = truncate(node.label, cols - indent.length - prefix.length - 4);

    // Apply styling based on type
    if (node.type === 'commit') {
      const [hash, ...rest] = label.split(' - ');
      label = pc.yellow(hash) + ' - ' + rest.join(' - ');
    } else if (node.type === 'change') {
      label = pc.dim(label);
    } else if (node.type === 'file') {
      label = pc.blue(label);
    }

    const line = indent + prefix + label;

    if (isSelected) {
      lines.push(pc.inverse(line.padEnd(cols)));
    } else {
      lines.push(line);
    }
  }

  // Pad remaining lines
  while (lines.length < rows - 3) {
    lines.push('');
  }

  // Footer
  lines.push(pc.dim('─'.repeat(cols)));
  const footer = pc.dim(
    ' j/k: navigate │ Enter: expand │ Tab: switch view │ q: quit'
  );
  lines.push(footer);

  return lines;
}

export function getTreeNodeCount(state: AppState): number {
  return buildTreeNodes(state).length;
}

export function getNodeIdAtIndex(state: AppState, index: number): string | null {
  const nodes = buildTreeNodes(state);
  return nodes[index]?.id || null;
}
