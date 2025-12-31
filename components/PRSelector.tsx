'use client';

import { useState, useEffect } from 'react';

type PR = {
  number: number;
  title: string;
  state: string;
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
  };
  user: {
    login: string;
  };
};

type PRSelectorProps = {
  owner: string;
  repo: string;
  token?: string;
  onSelectPR: (pr: PR) => void;
};

export default function PRSelector({ owner, repo, token, onSelectPR }: PRSelectorProps) {
  const [prs, setPRs] = useState<PR[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!owner || !repo) return;

    const fetchPRs = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams({ owner, repo });
        if (token) params.append('token', token);

        const response = await fetch(`/api/github/prs?${params}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch PRs');
        }

        setPRs(data.prs);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPRs();
  }, [owner, repo, token]);

  if (loading) {
    return <div className="text-gray-600">Loading pull requests...</div>;
  }

  if (error) {
    return <div className="text-red-600">Error: {error}</div>;
  }

  if (prs.length === 0) {
    return <div className="text-gray-600">No pull requests found.</div>;
  }

  return (
    <div className="space-y-2">
      <h2 className="text-xl font-bold mb-4">Select a Pull Request</h2>
      <div className="space-y-2">
        {prs.map((pr) => (
          <button
            key={pr.number}
            onClick={() => onSelectPR(pr)}
            className="w-full text-left p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">#{pr.number}</span>
                  <span className={`px-2 py-1 text-xs rounded ${
                    pr.state === 'open' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                  }`}>
                    {pr.state}
                  </span>
                </div>
                <div className="mt-1 text-gray-900">{pr.title}</div>
                <div className="mt-1 text-sm text-gray-500">
                  {pr.user.login} wants to merge {pr.head.ref} into {pr.base.ref}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
