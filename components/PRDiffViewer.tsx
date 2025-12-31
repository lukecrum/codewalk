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

      {/* Diffs grouped by reasoning/logical chunks */}
      <div className="space-y-6">
        {(() => {
          // Group by reasoning
          const reasoningGroups = new Map<
            string,
            Array<{
              filePath: string;
              commitSha: string;
              commitMessage: string;
              hunkNumbers: number[];
            }>
          >();

          // Collect all reasoning -> file mappings
          files.forEach((file) => {
            file.tracking.forEach((track) => {
              const key = `${track.reasoning}|${track.commitSha}`;
              if (!reasoningGroups.has(key)) {
                reasoningGroups.set(key, []);
              }
              reasoningGroups.get(key)!.push({
                filePath: file.path,
                commitSha: track.commitSha,
                commitMessage: track.commitMessage,
                hunkNumbers: track.hunkNumbers,
              });
            });
          });

          // If no tracking, fall back to file-based display
          if (reasoningGroups.size === 0) {
            return files.map((file) => {
              const diffContent = file.hunks
                .map((hunk) => hunk.header + '\n' + hunk.content)
                .join('');

              return (
                <div
                  key={file.path}
                  id={`file-${file.path.replace(/\//g, '-')}`}
                  className="border rounded-lg overflow-hidden"
                >
                  <div className="bg-gray-50 px-4 py-2 font-mono text-sm border-b">
                    {file.path}
                  </div>
                  <DiffViewer diff={diffContent} filename={file.path} />
                </div>
              );
            });
          }

          // Render by reasoning
          return Array.from(reasoningGroups.entries()).map(([key, fileInfos], idx) => {
            const reasoning = key.split('|')[0];
            const commitSha = fileInfos[0].commitSha;
            const commitMessage = fileInfos[0].commitMessage;

            return (
              <div key={idx} className="border rounded-lg overflow-hidden">
                {/* Reasoning Header */}
                <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
                  <div className="flex items-start gap-2 mb-2">
                    <div className="flex-shrink-0 w-2 h-2 mt-1.5 bg-blue-500 rounded-full"></div>
                    <p className="text-sm font-medium text-blue-900">{reasoning}</p>
                  </div>
                  <div className="text-xs text-blue-700 ml-4">
                    <code className="bg-blue-100 px-2 py-0.5 rounded">
                      {commitSha.substring(0, 7)}
                    </code>
                    {' '}
                    {commitMessage.split('\n')[0]}
                  </div>
                </div>

                {/* Files for this reasoning */}
                <div className="divide-y divide-gray-200">
                  {fileInfos.map((fileInfo, fileIdx) => {
                    const file = files.find((f) => f.path === fileInfo.filePath);
                    if (!file) return null;

                    const selectedHunks = fileInfo.hunkNumbers
                      .map((hunkNum) => file.hunks[hunkNum - 1])
                      .filter((h) => h != null);

                    if (selectedHunks.length === 0) return null;

                    const diffContent = selectedHunks
                      .map((hunk) => hunk.header + '\n' + hunk.content)
                      .join('');

                    return (
                      <div key={fileIdx} id={`file-${file.path.replace(/\//g, '-')}`}>
                        <div className="bg-gray-50 px-4 py-2 font-mono text-sm border-b">
                          {file.path}
                        </div>
                        <DiffViewer diff={diffContent} filename={file.path} />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          });
        })()}
      </div>

      {files.length === 0 && (
        <div className="bg-white border rounded-lg p-8 text-center text-gray-500">
          No file changes in this pull request.
        </div>
      )}
    </div>
  );
}
