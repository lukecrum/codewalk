"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadTrackingFiles = loadTrackingFiles;
exports.getTrackedCommits = getTrackedCommits;
exports.aggregateByReasoning = aggregateByReasoning;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const git_1 = require("./git");
async function loadTrackingFiles(cwd, commits) {
    const result = [];
    for (const commit of commits) {
        const trackingPath = path.join(cwd, '.codewalker', `${commit.shortSha}.json`);
        let tracking = null;
        try {
            const content = await fs.readFile(trackingPath, 'utf-8');
            tracking = JSON.parse(content);
        }
        catch {
            // No tracking file for this commit
        }
        result.push({ commit, tracking });
    }
    return result;
}
function getTrackedCommits(trackedCommits) {
    return trackedCommits.filter((tc) => tc.tracking !== null);
}
/**
 * Aggregates all tracking data into reasoning groups with actual diff hunks.
 * This is the "By Reasoning" view - grouping changes by their logical purpose.
 */
function aggregateByReasoning(cwd, trackedCommits) {
    const reasoningMap = new Map();
    // Build a map of commit SHA to file diffs for quick lookup
    const commitDiffs = new Map();
    for (const tc of trackedCommits) {
        if (!tc.tracking)
            continue;
        // Get diffs for this commit (lazy load)
        if (!commitDiffs.has(tc.commit.shortSha)) {
            commitDiffs.set(tc.commit.shortSha, (0, git_1.getCommitFileDiffs)(cwd, tc.commit.shortSha));
        }
        const fileDiffs = commitDiffs.get(tc.commit.shortSha) || [];
        for (const change of tc.tracking.changes) {
            // Use reasoning as the key (could also include commit if you want per-commit grouping)
            const key = change.reasoning;
            if (!reasoningMap.has(key)) {
                reasoningMap.set(key, {
                    reasoning: change.reasoning,
                    files: [],
                });
            }
            const group = reasoningMap.get(key);
            for (const fileChange of change.files) {
                // Find the diff for this file
                const fileDiff = fileDiffs.find((fd) => fd.path === fileChange.path);
                if (!fileDiff)
                    continue;
                // Get only the hunks specified in the tracking file
                const selectedHunks = fileChange.hunks
                    .map((hunkNum) => fileDiff.hunks.find((h) => h.hunkNumber === hunkNum))
                    .filter((h) => h != null);
                if (selectedHunks.length === 0)
                    continue;
                // Check if this file is already in the group
                const existingFile = group.files.find((f) => f.path === fileChange.path);
                if (existingFile) {
                    // Merge hunks (avoid duplicates)
                    for (const hunk of selectedHunks) {
                        if (!existingFile.hunks.find((h) => h.hunkNumber === hunk.hunkNumber)) {
                            existingFile.hunks.push(hunk);
                            existingFile.hunkNumbers.push(hunk.hunkNumber);
                        }
                    }
                }
                else {
                    group.files.push({
                        path: fileChange.path,
                        hunks: selectedHunks,
                        hunkNumbers: fileChange.hunks,
                    });
                }
            }
        }
    }
    // Convert map to array and sort by number of files (most impactful first)
    return Array.from(reasoningMap.values())
        .filter((group) => group.files.length > 0)
        .sort((a, b) => b.files.length - a.files.length);
}
