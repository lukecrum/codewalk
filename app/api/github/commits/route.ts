import { NextRequest, NextResponse } from 'next/server';
import { getOctokit, getCommitInfo } from '@/lib/github';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');
  const prNumber = searchParams.get('pr_number');
  const sha = searchParams.get('sha');
  const token = searchParams.get('token');

  if (!owner || !repo) {
    return NextResponse.json(
      { error: 'owner and repo are required' },
      { status: 400 }
    );
  }

  try {
    const octokit = getOctokit(token || undefined);

    // If sha is provided, get info for specific commit
    if (sha) {
      const commitInfo = await getCommitInfo(octokit, owner, repo, sha);
      return NextResponse.json({ commit: commitInfo });
    }

    // If pr_number is provided, get all commits for that PR
    if (prNumber) {
      const { data: commits } = await octokit.pulls.listCommits({
        owner,
        repo,
        pull_number: parseInt(prNumber),
      });

      return NextResponse.json({
        commits: commits.map(c => ({
          sha: c.sha,
          shortSha: c.sha.substring(0, 7),
          message: c.commit.message,
          author: c.commit.author?.name,
          date: c.commit.author?.date,
        })),
      });
    }

    return NextResponse.json(
      { error: 'Either pr_number or sha is required' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch commits' },
      { status: error.status || 500 }
    );
  }
}
