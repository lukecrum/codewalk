'use client';

import { useState, useEffect } from 'react';
import DiffViewer from './DiffViewer';

type PRInfo = {
  number: number;
  title: string;
  body: string | null;
  state: string;
  user: string;
  created_at: string;
  updated_at: string;
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
    sha: string;
  };
};

type FileWithTracking = {
  path: string;
  hunks: any[];
  tracking: Array<{
    commitSha: string;
    commitMessage: string;
    reasoning: string;
    hunkNumbers: number[];
  }>;
};

type PRDiffViewerProps = {
  owner: string;
  repo: string;
  prNumber: number;
  token?: string;
};

export default function PRDiffViewer({ owner, repo, prNumber, token }: PRDiffViewerProps) {
  const [prInfo, setPRInfo] = useState<PRInfo | null>(null);
  const [files, setFiles] = useState<FileWithTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filesExpanded, setFilesExpanded] = useState(false);

  useEffect(() => {
    const fetchPRDiff = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          owner,
          repo,
          pr_number: prNumber.toString(),
        });
        if (token) params.append('token', token);

        const response = await fetch(`/api/github/pr-diff?${params}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch PR diff');
        }

        setPRInfo(data.pr);
        setFiles(data.files);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPRDiff();
  }, [owner, repo, prNumber, token]);

  if (loading) {
    return <div className="text-gray-600">Loading pull request...</div>;
  }

  if (error) {
    return <div className="text-red-600">Error: {error}</div>;
  }

  if (!prInfo) {
    return <div className="text-gray-600">No pull request data available.</div>;
  }

  return (
    <div className="space-y-6">
      {/* PR Header */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">{prInfo.title}</h1>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                prInfo.state === 'open'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-purple-100 text-purple-800'
              }`}>
                {prInfo.state}
              </span>
              <span>
                {prInfo.user} wants to merge {prInfo.head.ref} into {prInfo.base.ref}
              </span>
            </div>
          </div>
        </div>

        {prInfo.body && (
          <div className="mt-4 prose prose-sm max-w-none">
            <div className="text-gray-700 whitespace-pre-wrap">{prInfo.body}</div>
          </div>
        )}
      </div>

      {/* Files Changed Summary */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <button
          onClick={() => setFilesExpanded(!filesExpanded)}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <h2 className="font-semibold">
            Files changed ({files.length})
          </h2>
          <span className={`text-gray-500 text-sm transition-transform ${filesExpanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
        {filesExpanded && (
          <div className="border-t px-4 py-3 flex flex-col gap-2">
            {files.map((file) => (
              <a
                key={file.path}
                href={`#file-${file.path.replace(/\//g, '-')}`}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                {file.path}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* File Diffs */}
      <div className="space-y-6">
        {files.map((file) => {
          const diffContent = file.hunks
            .map((hunk) => hunk.header + '\n' + hunk.content)
            .join('');

          return (
            <div
              key={file.path}
              id={`file-${file.path.replace(/\//g, '-')}`}
            >
              <DiffViewer
                diff={diffContent}
                filename={file.path}
                tracking={file.tracking.length > 0 ? file.tracking : undefined}
              />
            </div>
          );
        })}
      </div>

      {files.length === 0 && (
        <div className="bg-white border rounded-lg p-8 text-center text-gray-500">
          No file changes in this pull request.
        </div>
      )}
    </div>
  );
}
