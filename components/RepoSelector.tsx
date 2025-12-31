'use client';

import { useState, useEffect } from 'react';

type Repo = {
  id: number;
  name: string;
  full_name: string;
  owner: string;
  private: boolean;
  description: string | null;
  updated_at: string;
  language: string | null;
};

type RepoSelectorProps = {
  token?: string;
  onSelectRepo: (owner: string, repo: string) => void;
  onManualEntry: () => void;
};

export default function RepoSelector({ token, onSelectRepo, onManualEntry }: RepoSelectorProps) {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [filteredRepos, setFilteredRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams();
        if (token) params.append('token', token);

        const response = await fetch(`/api/github/repos?${params}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch repositories');
        }

        setRepos(data.repos);
        setFilteredRepos(data.repos);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRepos();
  }, [token]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredRepos(repos);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = repos.filter(
      repo =>
        repo.name.toLowerCase().includes(query) ||
        repo.full_name.toLowerCase().includes(query) ||
        repo.description?.toLowerCase().includes(query)
    );
    setFilteredRepos(filtered);
  }, [searchQuery, repos]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-600">Loading your repositories...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">Error loading repositories</p>
          <p className="text-red-700 text-sm mt-1">{error}</p>
        </div>
        <button
          onClick={onManualEntry}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          Enter Repository Manually
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Select a Repository</h2>
        <button
          onClick={onManualEntry}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Enter manually
        </button>
      </div>

      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search repositories..."
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="text-sm text-gray-600">
        {filteredRepos.length} {filteredRepos.length === 1 ? 'repository' : 'repositories'}
      </div>

      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {filteredRepos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No repositories found matching "{searchQuery}"
          </div>
        ) : (
          filteredRepos.map((repo) => (
            <button
              key={repo.id}
              onClick={() => onSelectRepo(repo.owner, repo.name)}
              className="w-full text-left p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-blue-600 truncate">
                      {repo.full_name}
                    </span>
                    {repo.private && (
                      <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded">
                        Private
                      </span>
                    )}
                    {repo.language && (
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                        {repo.language}
                      </span>
                    )}
                  </div>
                  {repo.description && (
                    <p className="text-sm text-gray-600 overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {repo.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Updated {new Date(repo.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
