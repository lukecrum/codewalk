'use client';

import { useState } from 'react';
import PRSelector from '@/components/PRSelector';
import CommitList from '@/components/CommitList';
import TrackingVisualizer from '@/components/TrackingVisualizer';

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

type Commit = {
  sha: string;
  shortSha: string;
  message: string;
  author: string;
  date: string;
};

export default function Home() {
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [token, setToken] = useState('');
  const [configured, setConfigured] = useState(false);
  const [selectedPR, setSelectedPR] = useState<PR | null>(null);
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null);

  const handleConfigure = (e: React.FormEvent) => {
    e.preventDefault();
    if (owner && repo) {
      setConfigured(true);
    }
  };

  const handleBackToPRs = () => {
    setSelectedPR(null);
    setSelectedCommit(null);
  };

  const handleBackToCommits = () => {
    setSelectedCommit(null);
  };

  if (!configured) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold mb-6 text-gray-900">
            CodeWalker Visualizer
          </h1>
          <p className="text-gray-600 mb-6">
            Visualize code changes tracked by the CodeWalker skill in your GitHub pull requests.
          </p>
          <form onSubmit={handleConfigure} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Repository Owner
              </label>
              <input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="e.g., octocat"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Repository Name
              </label>
              <input
                type="text"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                placeholder="e.g., my-repo"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GitHub Token (Optional)
              </label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave blank to use GITHUB_TOKEN from .env.local (if set).
                <br />
                For private repos, token needs 'repo' scope.
              </p>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">CodeWalker Visualizer</h1>
              <p className="text-sm text-gray-600">
                {owner}/{repo}
                {selectedPR && ` • PR #${selectedPR.number}`}
                {selectedCommit && ` • ${selectedCommit.shortSha}`}
              </p>
            </div>
            <button
              onClick={() => {
                setConfigured(false);
                setSelectedPR(null);
                setSelectedCommit(null);
              }}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Change Repository
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {!selectedPR && (
          <PRSelector
            owner={owner}
            repo={repo}
            token={token}
            onSelectPR={setSelectedPR}
          />
        )}

        {selectedPR && !selectedCommit && (
          <div>
            <button
              onClick={handleBackToPRs}
              className="mb-4 text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
            >
              ← Back to pull requests
            </button>
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-bold mb-2">
                PR #{selectedPR.number}: {selectedPR.title}
              </h2>
              <p className="text-sm text-gray-600">
                {selectedPR.user.login} wants to merge {selectedPR.head.ref} into{' '}
                {selectedPR.base.ref}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <CommitList
                owner={owner}
                repo={repo}
                prNumber={selectedPR.number}
                token={token}
                onSelectCommit={setSelectedCommit}
              />
            </div>
          </div>
        )}

        {selectedPR && selectedCommit && (
          <div>
            <button
              onClick={handleBackToCommits}
              className="mb-4 text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
            >
              ← Back to commits
            </button>
            <div className="bg-white rounded-lg shadow p-6">
              <TrackingVisualizer
                owner={owner}
                repo={repo}
                ref={selectedPR.head.ref}
                commitSha={selectedCommit.sha}
                token={token}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
