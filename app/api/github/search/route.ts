import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

const GITHUB_API_URL = 'https://api.github.com';

export async function GET(req: NextRequest) {
  try {
    const userId = await getCurrentUser();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const page = searchParams.get('page') || '1';

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: 'Query must be at least 2 characters' },
        { status: 400 }
      );
    }

    const githubToken = process.env.GITHUB_TOKEN;
    const response = await fetch(
      `${GITHUB_API_URL}/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&page=${page}&per_page=15`,
      {
        headers: {
          Authorization: githubToken ? `token ${githubToken}` : '',
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('GitHub API error');
    }

    const data = await response.json();

    const repos = data.items?.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      owner: repo.owner.login,
      full_name: repo.full_name,
      description: repo.description,
      url: repo.html_url,
      stars: repo.stargazers_count,
      language: repo.language,
      avatar: repo.owner.avatar_url,
    })) || [];

    return NextResponse.json({
      repos,
      total_count: data.total_count,
      page: parseInt(page),
    });
  } catch (error) {
    console.error('Error searching GitHub:', error);
    return NextResponse.json(
      { error: 'Failed to search GitHub' },
      { status: 500 }
    );
  }
}
