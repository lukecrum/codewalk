import pc from 'picocolors';
import * as fs from 'fs';
import * as path from 'path';
import { createCliRenderer } from '@opentui/core';
import { getCurrentBranch, getBranchCommits, isGitRepo } from '../utils/git.js';
import { loadTrackingFiles, getTrackedCommits, aggregateByReasoning } from '../utils/tracking.js';
import { createAppState } from '../tui/app.js';
import { TreeView } from '../tui/tree-view.js';

export interface VisualizeOptions {
  cwd: string;
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

  // Get only commits that are unique to this branch (not on main)
  const commits = getBranchCommits(cwd);

  if (commits.length === 0) {
    console.log(pc.yellow('No commits found on this branch.'));
    console.log(pc.dim('This branch has no commits that differ from main.'));
    return;
  }

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

  // Create OpenTUI renderer
  console.log(pc.dim('Starting visualizer...'));

  const renderer = await createCliRenderer({
    exitOnCtrlC: true,
    useAlternateScreen: true,
    useMouse: true,
    backgroundColor: '#0f0f1a',
  });

  // Create app state
  const state = createAppState(branch, reasoningGroups);

  // Create tree view
  const treeView = new TreeView(renderer, state);

  // Watch for new tracking files
  const codewalkerDir = path.join(cwd, '.codewalker');
  let watcher: fs.FSWatcher | null = null;
  let debounceTimer: NodeJS.Timeout | null = null;

  const reloadData = async () => {
    // Get fresh commit list and tracking files
    const freshCommits = getBranchCommits(cwd);
    if (freshCommits.length === 0) return;

    const freshTrackedCommits = await loadTrackingFiles(cwd, freshCommits);
    const freshTracked = getTrackedCommits(freshTrackedCommits);
    if (freshTracked.length === 0) return;

    const freshReasoningGroups = aggregateByReasoning(cwd, freshTracked);
    if (freshReasoningGroups.length > 0) {
      treeView.updateData(freshReasoningGroups);
    }
  };

  try {
    watcher = fs.watch(codewalkerDir, (eventType, filename) => {
      // Only react to new .json files
      if (filename && filename.endsWith('.json')) {
        // Debounce to avoid multiple rapid updates
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          reloadData();
        }, 100);
      }
    });
  } catch {
    // Directory might not exist yet, that's okay
  }

  // Handle keyboard input
  renderer.keyInput.on('keypress', (event) => {
    const key = event.name;

    switch (key) {
      case 'q':
        if (watcher) watcher.close();
        if (debounceTimer) clearTimeout(debounceTimer);
        treeView.destroy();
        renderer.destroy();
        process.exit(0);
        break;

      case 'j':
      case 'down':
        treeView.moveSelection(1);
        break;

      case 'k':
      case 'up':
        treeView.moveSelection(-1);
        break;

      case 'return':
      case 'space':
        treeView.toggleExpand();
        break;

      case 'g':
        // Go to top
        state.selectedIndex = 0;
        treeView.refresh();
        break;

      case 'G':
        // Go to bottom
        state.selectedIndex = Math.max(0, treeView.getItemCount() - 1);
        treeView.refresh();
        break;
    }
  });

  // Start rendering
  renderer.start();
}
