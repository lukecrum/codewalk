import { execSync } from 'child_process';
export function getCurrentBranch(cwd) {
    try {
        return execSync('git rev-parse --abbrev-ref HEAD', {
            cwd,
            encoding: 'utf-8',
        }).trim();
    }
    catch {
        throw new Error('Not a git repository or git is not installed');
    }
}
export function getCommitList(cwd) {
    try {
        const output = execSync('git log --format="%H|%h|%an|%s" --first-parent', {
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
                message: messageParts.join('|'),
            };
        });
    }
    catch {
        throw new Error('Failed to get commit list');
    }
}
export function isGitRepo(cwd) {
    try {
        execSync('git rev-parse --git-dir', { cwd, encoding: 'utf-8' });
        return true;
    }
    catch {
        return false;
    }
}
export function getMainBranch(cwd) {
    try {
        // Try to get the default branch from origin
        const result = execSync('git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null || echo "refs/heads/main"', {
            cwd,
            encoding: 'utf-8',
        }).trim();
        return result.replace('refs/remotes/origin/', '').replace('refs/heads/', '');
    }
    catch {
        return 'main';
    }
}
export function getMergeBase(cwd, branch1, branch2) {
    try {
        return execSync(`git merge-base ${branch1} ${branch2}`, {
            cwd,
            encoding: 'utf-8',
        }).trim();
    }
    catch {
        throw new Error(`Failed to find merge base between ${branch1} and ${branch2}`);
    }
}
export function getCommitDiff(cwd, commitSha) {
    try {
        return execSync(`git show ${commitSha} --format="" --patch`, {
            cwd,
            encoding: 'utf-8',
            maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large diffs
        });
    }
    catch {
        return '';
    }
}
export function parseDiffIntoFiles(diffOutput) {
    const files = [];
    // Split by file headers (diff --git a/... b/...)
    const fileChunks = diffOutput.split(/^diff --git /m).filter(Boolean);
    for (const chunk of fileChunks) {
        const lines = chunk.split('\n');
        // Extract file path from the first line (a/path b/path)
        const headerMatch = lines[0]?.match(/a\/(.+?) b\/(.+)/);
        if (!headerMatch)
            continue;
        const filePath = headerMatch[2];
        const hunks = [];
        let currentHunk = null;
        let hunkNumber = 0;
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            // Start of a new hunk
            if (line.startsWith('@@')) {
                if (currentHunk) {
                    hunks.push(currentHunk);
                }
                hunkNumber++;
                currentHunk = {
                    hunkNumber,
                    header: line,
                    content: '',
                };
            }
            else if (currentHunk) {
                // Skip binary file markers and other metadata
                if (line.startsWith('Binary files') || line.startsWith('index ') ||
                    line.startsWith('---') || line.startsWith('+++') ||
                    line.startsWith('new file') || line.startsWith('deleted file')) {
                    continue;
                }
                currentHunk.content += line + '\n';
            }
        }
        if (currentHunk) {
            hunks.push(currentHunk);
        }
        if (hunks.length > 0) {
            files.push({ path: filePath, hunks });
        }
    }
    return files;
}
export function getCommitFileDiffs(cwd, commitSha) {
    const diffOutput = getCommitDiff(cwd, commitSha);
    return parseDiffIntoFiles(diffOutput);
}
