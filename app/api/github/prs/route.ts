import { NextRequest, NextResponse } from 'next/server';
import { getOctokit } from '@/lib/github';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');
  const token = searchParams.get('token');

  if (!owner || !repo) {
    return NextResponse.json(
      { error: 'owner and repo are required' },
      { status: 400 }
    );
  }

  try {
    const octokit = getOctokit(token || undefined);
    const { data: prs } = await octokit.pulls.list({
      owner,
      repo,
      state: 'all',
      sort: 'updated',
      direction: 'desc',
      per_page: 30,
    });

    return NextResponse.json({
      prs: prs.map(pr => ({
        number: pr.number,
        title: pr.title,
        state: pr.state,
        created_at: pr.created_at,
        updated_at: pr.updated_at,
        head: {
          ref: pr.head.ref,
          sha: pr.head.sha,
        },
        base: {
          ref: pr.base.ref,
        },
        user: {
          login: pr.user?.login,
        },
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch pull requests' },
      { status: error.status || 500 }
    );
  }
}
