import { NextRequest, NextResponse } from 'next/server';
import { getOctokit, getTrackingFile } from '@/lib/github';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');
  const ref = searchParams.get('ref');
  const commitHash = searchParams.get('commit_hash');
  const token = searchParams.get('token');

  if (!owner || !repo || !ref || !commitHash) {
    return NextResponse.json(
      { error: 'owner, repo, ref, and commit_hash are required' },
      { status: 400 }
    );
  }

  try {
    const octokit = getOctokit(token || undefined);
    const tracking = await getTrackingFile(octokit, owner, repo, ref, commitHash);

    if (!tracking) {
      return NextResponse.json(
        { error: 'Tracking file not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ tracking });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tracking file' },
      { status: error.status || 500 }
    );
  }
}
