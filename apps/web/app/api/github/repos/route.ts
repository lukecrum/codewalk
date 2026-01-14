import { NextRequest, NextResponse } from 'next/server';
import { getOctokit } from '@/lib/github';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');

  try {
    const octokit = getOctokit(token || undefined);

    // Get authenticated user's repositories
    const { data: repos } = await octokit.repos.listForAuthenticatedUser({
      sort: 'updated',
      direction: 'desc',
      per_page: 100,
    });

    return NextResponse.json({
      repos: repos.map(repo => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        owner: repo.owner.login,
        private: repo.private,
        description: repo.description,
        updated_at: repo.updated_at,
        language: repo.language,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch repositories' },
      { status: error.status || 500 }
    );
  }
}
