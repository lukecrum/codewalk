'use client';

import { useState, useEffect } from 'react';

type Commit = {
  sha: string;
  shortSha: string;
  message: string;
  author: string;
  date: string;
};

type CommitListProps = {
  owner: string;
  repo: string;
  prNumber: number;
  token?: string;
  onSelectCommit: (commit: Commit) => void;
};

export default function CommitList({ owner, repo, prNumber, token, onSelectCommit }: CommitListProps) {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCommits = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams({
          owner,
          repo,
          pr_number: prNumber.toString()
        });
        if (token) params.append('token', token);

        const response = await fetch(`/api/github/commits?${params}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch commits');
        }

        setCommits(data.commits);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCommits();
  }, [owner, repo, prNumber, token]);

  if (loading) {
    return <div className="text-gray-600">Loading commits...</div>;
  }

  if (error) {
    return <div className="text-red-600">Error: {error}</div>;
  }

  if (commits.length === 0) {
    return <div className="text-gray-600">No commits found.</div>;
  }

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold mb-3">Commits</h3>
      <div className="space-y-2">
        {commits.map((commit) => (
          <button
            key={commit.sha}
            onClick={() => onSelectCommit(commit)}
            className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                {commit.shortSha}
              </code>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-900 truncate">
                  {commit.message.split('\n')[0]}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {commit.author} • {new Date(commit.date).toLocaleString()}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
