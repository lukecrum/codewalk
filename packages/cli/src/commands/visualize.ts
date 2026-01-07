import pc from 'picocolors';
import { getCurrentBranch, getCommitList, isGitRepo } from '../utils/git';
import { loadTrackingFiles, getTrackedCommits, aggregateByReasoning } from '../utils/tracking';
import {
  createAppState,
  clearScreen,
  hideCursor,
  cleanupInput,
  setupKeyboardInput,
  type AppState,
} from '../tui/app';
import { renderView, getItemCount, toggleExpand } from '../tui/tree-view';

export interface VisualizeOptions {
  cwd: string;
}

function render(state: AppState): void {
  clearScreen();

  const lines = renderView(state);
  for (const line of lines) {
    console.log(line);
  }
}

function handleKeyPress(state: AppState, key: string): boolean {
  const itemCount = getItemCount(state);

  switch (key) {
    case 'q':
      return false; // Signal exit

    case 'j':
    case 'down':
      if (state.selectedIndex < itemCount - 1) {
        state.selectedIndex++;
        // Adjust scroll if needed
        const visibleHeight = (process.stdout.rows || 24) - 6;
        if (state.selectedIndex >= state.scrollOffset + visibleHeight) {
          state.scrollOffset = state.selectedIndex - visibleHeight + 1;
        }
      }
      break;

    case 'k':
    case 'up':
      if (state.selectedIndex > 0) {
        state.selectedIndex--;
        // Adjust scroll if needed
        if (state.selectedIndex < state.scrollOffset) {
          state.scrollOffset = state.selectedIndex;
        }
      }
      break;

    case 'return':
    case 'space':
      toggleExpand(state);
      break;

    case 'g':
      // Go to top
      state.selectedIndex = 0;
      state.scrollOffset = 0;
      break;

    case 'G':
      // Go to bottom
      state.selectedIndex = Math.max(0, itemCount - 1);
      const visibleHeight = (process.stdout.rows || 24) - 6;
      state.scrollOffset = Math.max(0, itemCount - visibleHeight);
      break;
  }

  return true; // Continue running
}

export async function visualizeCommand(options: VisualizeOptions): Promise<void> {
  const { cwd } = options;

  // Check if in git repo
  if (!isGitRepo(cwd)) {
    console.error(pc.red('Error: Not a git repository'));
    process.exit(1);
  }

  // Load data
  console.log(pc.dim('Loading tracking data...'));

  const branch = getCurrentBranch(cwd);
  const commits = getCommitList(cwd);
  const allTrackedCommits = await loadTrackingFiles(cwd, commits);
  const trackedCommits = getTrackedCommits(allTrackedCommits);

  if (trackedCommits.length === 0) {
    console.log(pc.yellow('No tracked commits found in .codewalker/'));
    console.log(pc.dim('Run some tasks with Claude Code to generate tracking data.'));
    return;
  }

  console.log(pc.dim('Aggregating changes by reasoning...'));

  // Aggregate changes by reasoning (like the PR "By Reasoning" view)
  const reasoningGroups = aggregateByReasoning(cwd, trackedCommits);

  if (reasoningGroups.length === 0) {
    console.log(pc.yellow('No changes with diffs found.'));
    return;
  }

  // Create app state
  const state = createAppState(branch, reasoningGroups);

  // Setup terminal
  hideCursor();

  let running = true;

  const cleanup = () => {
    running = false;
    cleanupInput();
    clearScreen();
    console.log(pc.dim('Goodbye!'));
    process.exit(0);
  };

  // Handle resize
  process.stdout.on('resize', () => {
    if (running) render(state);
  });

  // Setup keyboard input
  setupKeyboardInput(
    (key) => {
      if (!handleKeyPress(state, key)) {
        cleanup();
        return;
      }
      render(state);
    },
    cleanup
  );

  // Initial render
  render(state);
}
