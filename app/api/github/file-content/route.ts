import { NextRequest, NextResponse } from 'next/server';
import { getOctokit } from '@/lib/github';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');
  const sha = searchParams.get('sha');
  const path = searchParams.get('path');
  const startLine = searchParams.get('startLine');
  const endLine = searchParams.get('endLine');
  const token = searchParams.get('token');

  if (!owner || !repo || !sha || !path || !startLine || !endLine) {
    return NextResponse.json(
      { error: 'owner, repo, sha, path, startLine, and endLine are required' },
      { status: 400 }
    );
  }

  const start = parseInt(startLine);
  const end = parseInt(endLine);

  if (isNaN(start) || isNaN(end) || start < 1 || end < start) {
    return NextResponse.json(
      { error: 'startLine and endLine must be valid positive integers with startLine <= endLine' },
      { status: 400 }
    );
  }

  try {
    const octokit = getOctokit(token || undefined);

    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref: sha,
    });

    if (Array.isArray(data) || data.type !== 'file' || !('content' in data)) {
      return NextResponse.json(
        { error: 'Path does not point to a file' },
        { status: 400 }
      );
    }

    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    const allLines = content.split('\n');

    // Extract requested lines (1-indexed, inclusive)
    const lines = allLines.slice(start - 1, end).map((lineContent, index) => ({
      lineNumber: start + index,
      content: lineContent,
    }));

    return NextResponse.json({ lines });
  } catch (error: any) {
    if (error.status === 404) {
      return NextResponse.json(
        { error: 'File not found at specified commit' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to fetch file content' },
      { status: error.status || 500 }
    );
  }
}
