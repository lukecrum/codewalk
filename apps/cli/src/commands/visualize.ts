import pc from 'picocolors';
import * as fs from 'fs';
import * as path from 'path';
import { createCliRenderer } from '@opentui/core';
import { getCurrentBranch, getBranchCommits, isGitRepo, getRepoRoot } from '../utils/git.js';
import { loadTrackingFiles, getTrackedCommits, aggregateByReasoning } from '../utils/tracking.js';
import { loadSettings, getTrackingDirectory } from '../utils/settings.js';
import { createAppState } from '../tui/app.js';
import { TreeView } from '../tui/tree-view.js';

export interface VisualizeOptions {
  cwd: string;
}

/**
 * Load tracking data for the current branch
 */
async function loadBranchData(cwd: string, trackingDir: string) {
  const branch = getCurrentBranch(cwd);
  const commits = getBranchCommits(cwd);

  if (commits.length === 0) {
    return { branch, reasoningGroups: [] };
  }

  const allTrackedCommits = await loadTrackingFiles(trackingDir, commits);
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

  // Get repo root to work from anywhere in the repository
  const repoRoot = getRepoRoot(cwd);

  // Load settings from .claude/codewalk.local.md
  const settings = await loadSettings(repoRoot);
  const trackingDir = getTrackingDirectory(repoRoot, settings);

  // Load initial data
  console.log(pc.dim('Loading tracking data...'));
  const { branch, reasoningGroups } = await loadBranchData(repoRoot, trackingDir);

  // Create OpenTUI renderer (start even if no data - we'll watch for changes)
  console.log(pc.dim('Starting visualizer...'));

  const renderer = await createCliRenderer({
    exitOnCtrlC: true,
    useAlternateScreen: true,
    useMouse: true,
    backgroundColor: '#0f0f1a',
  });

  // Create app state (may have empty reasoningGroups)
  const state = createAppState(branch, reasoningGroups, trackingDir);

  // Create tree view
  const treeView = new TreeView(renderer, state);

  // Track current branch to detect switches
  let currentBranch = branch;

  // Watch for new tracking files
  const gitHeadPath = path.join(repoRoot, '.git', 'HEAD');
  let trackingWatcher: fs.FSWatcher | null = null;
  let branchWatcher: fs.FSWatcher | null = null;
  let debounceTimer: NodeJS.Timeout | null = null;

  const reloadData = async (branchChanged = false) => {
    const { branch: newBranch, reasoningGroups: newGroups } = await loadBranchData(repoRoot, trackingDir);

    if (branchChanged || newBranch !== currentBranch) {
      // Branch changed - update with new branch name and clear state
      currentBranch = newBranch;
      treeView.updateData(newGroups, newBranch);
    } else if (newGroups.length > 0) {
      // Same branch, just new data
      treeView.updateData(newGroups);
    }
  };

  // Watch tracking directory for new tracking files
  try {
    // Ensure directory exists before watching (for global storage)
    await fs.promises.mkdir(trackingDir, { recursive: true });
    trackingWatcher = fs.watch(trackingDir, (eventType, filename) => {
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
