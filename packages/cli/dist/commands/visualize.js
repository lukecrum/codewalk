import pc from 'picocolors';
import { createCliRenderer } from '@opentui/core';
import { getCurrentBranch, getCommitList, isGitRepo } from '../utils/git.js';
import { loadTrackingFiles, getTrackedCommits, aggregateByReasoning } from '../utils/tracking.js';
import { createAppState } from '../tui/app.js';
import { TreeView } from '../tui/tree-view.js';
export async function visualizeCommand(options) {
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
    // Handle keyboard input
    renderer.keyInput.on('keypress', (event) => {
        const key = event.name;
        switch (key) {
            case 'q':
                treeView.destroy();
                renderer.destroy();
                process.exit(0);
                break;
            case 'j':
            case 'ArrowDown':
                treeView.moveSelection(1);
                break;
            case 'k':
            case 'ArrowUp':
                treeView.moveSelection(-1);
                break;
            case 'Enter':
            case ' ':
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
