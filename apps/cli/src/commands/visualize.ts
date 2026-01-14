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

/**
 * Load tracking data for the current branch
 */
async function loadBranchData(cwd: string) {
  const branch = getCurrentBranch(cwd);
  const commits = getBranchCommits(cwd);

  if (commits.length === 0) {
    return { branch, reasoningGroups: [] };
  }

  const allTrackedCommits = await loadTrackingFiles(cwd, commits);
  const trackedCommits = getTrackedCommits(allTrackedCommits);

  if (trackedCommits.length === 0) {
    return { branch, reasoningGroups: [] };
  }

  const reasoningGroups = aggregateByReasoning(cwd, trackedCommits);
  return { branch, reasoningGroups };
}

export async function visualizeCommand(options: VisualizeOptions): Promise<void> {
  const { cwd } = options;

  // Check if in git repo
  if (!isGitRepo(cwd)) {
    console.error(pc.red('Error: Not a git repository'));
    process.exit(1);
  }

  // Load initial data
  console.log(pc.dim('Loading tracking data...'));
  const { branch, reasoningGroups } = await loadBranchData(cwd);

  // Create OpenTUI renderer (start even if no data - we'll watch for changes)
  console.log(pc.dim('Starting visualizer...'));

  const renderer = await createCliRenderer({
    exitOnCtrlC: true,
    useAlternateScreen: true,
    useMouse: true,
    backgroundColor: '#0f0f1a',
  });

  // Create app state (may have empty reasoningGroups)
  const state = createAppState(branch, reasoningGroups);

  // Create tree view
  const treeView = new TreeView(renderer, state);

  // Track current branch to detect switches
  let currentBranch = branch;

  // Watch for new tracking files
  const codewalkDir = path.join(cwd, '.codewalk');
  const gitHeadPath = path.join(cwd, '.git', 'HEAD');
  let trackingWatcher: fs.FSWatcher | null = null;
  let branchWatcher: fs.FSWatcher | null = null;
  let debounceTimer: NodeJS.Timeout | null = null;

  const reloadData = async (branchChanged = false) => {
    const { branch: newBranch, reasoningGroups: newGroups } = await loadBranchData(cwd);

    if (branchChanged || newBranch !== currentBranch) {
      // Branch changed - update with new branch name and clear state
      currentBranch = newBranch;
      treeView.updateData(newGroups, newBranch);
    } else if (newGroups.length > 0) {
      // Same branch, just new data
      treeView.updateData(newGroups);
    }
  };

  // Watch .codewalk/ for new tracking files
  try {
    trackingWatcher = fs.watch(codewalkDir, (eventType, filename) => {
      if (filename && filename.endsWith('.json')) {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => reloadData(), 100);
      }
    });
  } catch {
    // Directory might not exist yet
  }

  // Watch .git/HEAD for branch switches
  try {
    branchWatcher = fs.watch(gitHeadPath, () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => reloadData(true), 100);
    });
  } catch {
    // .git/HEAD might not be accessible
  }

  // Handle keyboard input
  renderer.keyInput.on('keypress', (event) => {
    const key = event.name;

    switch (key) {
      case 'q':
        if (trackingWatcher) trackingWatcher.close();
        if (branchWatcher) branchWatcher.close();
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
