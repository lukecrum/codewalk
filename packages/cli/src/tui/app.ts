import * as readline from 'readline';
import pc from 'picocolors';
import type { TrackedCommit } from '../utils/tracking';

export type ViewMode = 'tree' | 'table';

export interface AppState {
  branch: string;
  trackedCommits: TrackedCommit[];
  viewMode: ViewMode;
  selectedIndex: number;
  expandedSet: Set<string>;
  scrollOffset: number;
}

export function createAppState(
  branch: string,
  trackedCommits: TrackedCommit[]
): AppState {
  return {
    branch,
    trackedCommits,
    viewMode: 'tree',
    selectedIndex: 0,
    expandedSet: new Set(),
    scrollOffset: 0,
  };
}

export function clearScreen(): void {
  process.stdout.write('\x1B[2J\x1B[H');
}

export function hideCursor(): void {
  process.stdout.write('\x1B[?25l');
}

export function showCursor(): void {
  process.stdout.write('\x1B[?25h');
}

export function getTerminalSize(): { rows: number; cols: number } {
  return {
    rows: process.stdout.rows || 24,
    cols: process.stdout.columns || 80,
  };
}

export function setupKeyboardInput(
  onKey: (key: string, ctrl: boolean) => void,
  onExit: () => void
): void {
  readline.emitKeypressEvents(process.stdin);

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }

  process.stdin.on('keypress', (str, key) => {
    if (key.ctrl && key.name === 'c') {
      onExit();
      return;
    }

    onKey(key.name || str, key.ctrl || false);
  });

  process.stdin.resume();
}

export function cleanupInput(): void {
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
  showCursor();
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}
