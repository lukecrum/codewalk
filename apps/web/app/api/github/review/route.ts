import { NextRequest, NextResponse } from 'next/server';
import { getOctokit } from '@/lib/github';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { owner, repo, prNumber, token, event, body: reviewBody } = body;

    if (!owner || !repo || !prNumber) {
      return NextResponse.json(
        { error: 'owner, repo, and prNumber are required' },
        { status: 400 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { error: 'A GitHub token is required to submit reviews' },
        { status: 401 }
      );
    }

    if (!event || !['APPROVE', 'COMMENT', 'REQUEST_CHANGES'].includes(event)) {
      return NextResponse.json(
        { error: 'event must be one of: APPROVE, COMMENT, REQUEST_CHANGES' },
        { status: 400 }
      );
    }

    if (event === 'REQUEST_CHANGES' && !reviewBody) {
      return NextResponse.json(
        { error: 'A comment body is required when requesting changes' },
        { status: 400 }
      );
    }

    const octokit = getOctokit(token);

    const { data: review } = await octokit.pulls.createReview({
      owner,
      repo,
      pull_number: prNumber,
      event: event as 'APPROVE' | 'COMMENT' | 'REQUEST_CHANGES',
      body: reviewBody || undefined,
    });

    return NextResponse.json({
      success: true,
      review: {
        id: review.id,
        state: review.state,
        submitted_at: review.submitted_at,
        user: review.user?.login,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to submit review' },
      { status: error.status || 500 }
    );
  }
}
