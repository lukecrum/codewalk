import { NextRequest, NextResponse } from 'next/server';
import { getOctokit, getTrackingFile, parseHunks } from '@/lib/github';
import { Changeset, FileDiff } from '@/types/codewalker';

type FileWithTracking = {
  path: string;
  hunks: any[];
  tracking: Array<{
    commitSha: string;
    commitMessage: string;
    reasoning: string;
    hunkNumbers: number[];
  }>;
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');
  const prNumber = searchParams.get('pr_number');
  const token = searchParams.get('token');

  if (!owner || !repo || !prNumber) {
    return NextResponse.json(
      { error: 'owner, repo, and pr_number are required' },
      { status: 400 }
    );
  }

  try {
    const octokit = getOctokit(token || undefined);

    // Get PR details
    const { data: pr } = await octokit.pulls.get({
      owner,
      repo,
      pull_number: parseInt(prNumber),
    });

    // Get all commits in the PR
    const { data: commits } = await octokit.pulls.listCommits({
      owner,
      repo,
      pull_number: parseInt(prNumber),
    });

    // Fetch tracking files for all commits
    const trackingFiles = new Map<string, Changeset>();
    for (const commit of commits) {
      const shortSha = commit.sha.substring(0, 7);
      const tracking = await getTrackingFile(
        octokit,
        owner,
        repo,
        pr.head.ref,
        shortSha
      );
      if (tracking) {
        trackingFiles.set(commit.sha, tracking);
      }
    }

    // Get the full PR diff (comparison between base and head)
    const { data: comparison } = await octokit.repos.compareCommits({
      owner,
      repo,
      base: pr.base.sha,
      head: pr.head.sha,
    });

    // Parse files and build file map with tracking info
    const fileMap = new Map<string, FileWithTracking>();

    for (const file of comparison.files || []) {
      if (!file.patch) continue;

      const hunks = parseHunks(file.patch, file.filename);

      const fileWithTracking: FileWithTracking = {
        path: file.filename,
        hunks,
        tracking: [],
      };

      // Find tracking info for this file from all commits
      for (const commit of commits) {
        const tracking = trackingFiles.get(commit.sha);
        if (!tracking) continue;

        for (const change of tracking.changes) {
          const fileChange = change.files.find((f) => f.path === file.filename);
          if (fileChange) {
            fileWithTracking.tracking.push({
              commitSha: commit.sha,
              commitMessage: commit.commit.message,
              reasoning: change.reasoning,
              hunkNumbers: fileChange.hunks,
            });
          }
        }
      }

      fileMap.set(file.filename, fileWithTracking);
    }

    return NextResponse.json({
      pr: {
        number: pr.number,
        title: pr.title,
        body: pr.body,
        state: pr.state,
        user: pr.user?.login,
        created_at: pr.created_at,
        updated_at: pr.updated_at,
        head: {
          ref: pr.head.ref,
          sha: pr.head.sha,
        },
        base: {
          ref: pr.base.ref,
          sha: pr.base.sha,
        },
      },
      files: Array.from(fileMap.values()),
      commits: commits.map((c) => ({
        sha: c.sha,
        shortSha: c.sha.substring(0, 7),
        message: c.commit.message,
        author: c.commit.author?.name,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch PR diff' },
      { status: error.status || 500 }
    );
  }
}
