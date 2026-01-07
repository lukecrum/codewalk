"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.visualizeCommand = visualizeCommand;
const picocolors_1 = __importDefault(require("picocolors"));
const git_1 = require("../utils/git");
const tracking_1 = require("../utils/tracking");
const app_1 = require("../tui/app");
const tree_view_1 = require("../tui/tree-view");
function render(state) {
    (0, app_1.clearScreen)();
    const lines = (0, tree_view_1.renderView)(state);
    for (const line of lines) {
        console.log(line);
    }
}
function handleKeyPress(state, key) {
    const itemCount = (0, tree_view_1.getItemCount)(state);
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
            (0, tree_view_1.toggleExpand)(state);
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
async function visualizeCommand(options) {
    const { cwd } = options;
    // Check if in git repo
    if (!(0, git_1.isGitRepo)(cwd)) {
        console.error(picocolors_1.default.red('Error: Not a git repository'));
        process.exit(1);
    }
    // Load data
    console.log(picocolors_1.default.dim('Loading tracking data...'));
    const branch = (0, git_1.getCurrentBranch)(cwd);
    const commits = (0, git_1.getCommitList)(cwd);
    const allTrackedCommits = await (0, tracking_1.loadTrackingFiles)(cwd, commits);
    const trackedCommits = (0, tracking_1.getTrackedCommits)(allTrackedCommits);
    if (trackedCommits.length === 0) {
        console.log(picocolors_1.default.yellow('No tracked commits found in .codewalker/'));
        console.log(picocolors_1.default.dim('Run some tasks with Claude Code to generate tracking data.'));
        return;
    }
    console.log(picocolors_1.default.dim('Aggregating changes by reasoning...'));
    // Aggregate changes by reasoning (like the PR "By Reasoning" view)
    const reasoningGroups = (0, tracking_1.aggregateByReasoning)(cwd, trackedCommits);
    if (reasoningGroups.length === 0) {
        console.log(picocolors_1.default.yellow('No changes with diffs found.'));
        return;
    }
    // Create app state
    const state = (0, app_1.createAppState)(branch, reasoningGroups);
    // Setup terminal
    (0, app_1.hideCursor)();
    let running = true;
    const cleanup = () => {
        running = false;
        (0, app_1.cleanupInput)();
        (0, app_1.clearScreen)();
        console.log(picocolors_1.default.dim('Goodbye!'));
        process.exit(0);
    };
    // Handle resize
    process.stdout.on('resize', () => {
        if (running)
            render(state);
    });
    // Setup keyboard input
    (0, app_1.setupKeyboardInput)((key) => {
        if (!handleKeyPress(state, key)) {
            cleanup();
            return;
        }
        render(state);
    }, cleanup);
    // Initial render
    render(state);
}
