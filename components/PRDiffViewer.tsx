'use client';

import { useState, useEffect } from 'react';
import { Brain } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'changes' | 'files'>('changes');

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
          <div className="mt-4 text-sm text-gray-700 whitespace-pre-wrap max-w-none">
            {prInfo.body}
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('changes')}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeTab === 'changes'
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Changes
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeTab === 'files'
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Files Changed ({files.length})
          </button>
        </div>
      </div>

      {/* Changes Tab - Diffs grouped by reasoning/logical chunks */}
      {activeTab === 'changes' && (
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
              <div key={idx} className="border border-blue-200 rounded-lg overflow-hidden shadow-sm mt-4">
                {/* Reasoning Header */}
                <div style={{ backgroundColor: '#dbeafe', paddingLeft: '1rem', paddingRight: '1rem', marginBottom: '1rem' }} className="py-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <p className="text-base text-blue-900 leading-relaxed font-medium">{reasoning}</p>
                    </div>
                  </div>
                </div>

                {/* Files for this reasoning - Indented */}
                <div className="bg-white">
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
                      <div key={fileIdx} id={`file-${file.path.replace(/\//g, '-')}`} className="py-4">
                        <DiffViewer diff={diffContent} filename={file.path} indent={true} />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          });
        })()}
      </div>
      )}

      {/* Files Tab - Plain file-based view with full diffs */}
      {activeTab === 'files' && (
        <div className="space-y-6">
          {files.length === 0 ? (
            <div className="bg-white border rounded-lg p-8 text-center text-gray-500">
              No file changes in this pull request.
            </div>
          ) : (
            files.map((file) => {
              const diffContent = file.hunks
                .map((hunk) => hunk.header + '\n' + hunk.content)
                .join('');

              return (
                <div
                  key={file.path}
                  id={`file-${file.path.replace(/\//g, '-')}`}
                  className="border rounded-lg overflow-hidden shadow-sm"
                >
                  <div className="bg-gray-50 px-4 py-3 font-mono text-sm border-b border-gray-200">
                    {file.path}
                  </div>
                  <DiffViewer diff={diffContent} filename={file.path} />
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
