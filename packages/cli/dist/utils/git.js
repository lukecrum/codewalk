"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentBranch = getCurrentBranch;
exports.getCommitList = getCommitList;
exports.isGitRepo = isGitRepo;
const child_process_1 = require("child_process");
function getCurrentBranch(cwd) {
    try {
        return (0, child_process_1.execSync)('git rev-parse --abbrev-ref HEAD', {
            cwd,
            encoding: 'utf-8',
        }).trim();
    }
    catch {
        throw new Error('Not a git repository or git is not installed');
    }
}
function getCommitList(cwd) {
    try {
        const output = (0, child_process_1.execSync)('git log --format="%H|%h|%an|%s" --first-parent', {
            cwd,
            encoding: 'utf-8',
        });
        return output
            .trim()
            .split('\n')
            .filter(Boolean)
            .map((line) => {
            const [sha, shortSha, author, ...messageParts] = line.split('|');
            return {
                sha,
                shortSha,
                author,
                message: messageParts.join('|'), // Handle messages with | in them
            };
        });
    }
    catch {
        throw new Error('Failed to get commit list');
    }
}
function isGitRepo(cwd) {
    try {
        (0, child_process_1.execSync)('git rev-parse --git-dir', { cwd, encoding: 'utf-8' });
        return true;
    }
    catch {
        return false;
    }
}
