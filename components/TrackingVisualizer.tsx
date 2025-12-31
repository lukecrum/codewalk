'use client';

import { useState, useEffect } from 'react';
import { Changeset, CommitInfo, ParsedHunk } from '@/types/codewalker';
import DiffViewer from './DiffViewer';

type TrackingVisualizerProps = {
  owner: string;
  repo: string;
  ref: string;
  commitSha: string;
  token?: string;
};

export default function TrackingVisualizer({
  owner,
  repo,
  ref,
  commitSha,
  token,
}: TrackingVisualizerProps) {
  const [tracking, setTracking] = useState<Changeset | null>(null);
  const [commitInfo, setCommitInfo] = useState<CommitInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({ owner, repo });
        if (token) params.append('token', token);

        // Fetch tracking file
        const trackingParams = new URLSearchParams(params);
        trackingParams.append('ref', ref);
        trackingParams.append('commit_hash', commitSha.substring(0, 7));

        const trackingResponse = await fetch(`/api/github/tracking?${trackingParams}`);

        let trackingData = null;
        if (trackingResponse.ok) {
          const data = await trackingResponse.json();
          trackingData = data.tracking;
        }

        // Fetch commit info
        const commitParams = new URLSearchParams(params);
        commitParams.append('sha', commitSha);

        const commitResponse = await fetch(`/api/github/commits?${commitParams}`);
        const commitData = await commitResponse.json();

        if (!commitResponse.ok) {
          throw new Error(commitData.error || 'Failed to fetch commit');
        }

        setTracking(trackingData);
        setCommitInfo(commitData.commit);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [owner, repo, ref, commitSha, token]);

  if (loading) {
    return <div className="text-gray-600">Loading tracking data...</div>;
  }

  if (error) {
    return <div className="text-red-600">Error: {error}</div>;
  }

  if (!commitInfo) {
    return <div className="text-gray-600">No commit data available.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Commit Header */}
      <div className="border-b pb-4">
        <div className="flex items-center gap-2 mb-2">
          <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
            {commitInfo.shortSha}
          </code>
          <span className="text-sm text-gray-500">by {commitInfo.author}</span>
        </div>
        <div className="text-lg font-medium">{commitInfo.message}</div>
      </div>

      {!tracking && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            No tracking file found for this commit. The commit changes are shown below.
          </p>
        </div>
      )}

      {tracking && (
        <div className="space-y-6">
          {tracking.changes.map((change, changeIdx) => (
            <div key={changeIdx} className="border rounded-lg overflow-hidden">
              {/* Change Reasoning */}
              <div className="bg-blue-50 border-b border-blue-200 p-4">
                <h3 className="font-semibold text-blue-900 mb-2">
                  Change {changeIdx + 1}
                </h3>
                <p className="text-blue-800">{change.reasoning}</p>
              </div>

              {/* Files and Hunks */}
              <div className="divide-y">
                {change.files.map((fileChange, fileIdx) => {
                  const fileDiff = commitInfo.files.find(
                    (f) => f.path === fileChange.path
                  );

                  return (
                    <div key={fileIdx} className="bg-white">
                      <div className="bg-gray-50 px-4 py-2 font-mono text-sm border-b">
                        {fileChange.path}
                      </div>

                      {fileDiff && (
                        <div>
                          {(() => {
                            // Reconstruct diff for selected hunks
                            const selectedHunks = fileChange.hunks
                              .map((hunkNum) => fileDiff.hunks[hunkNum - 1])
                              .filter((h) => h != null);

                            if (selectedHunks.length === 0) return null;

                            const diffContent = selectedHunks
                              .map((hunk) => hunk.header + '\n' + hunk.content)
                              .join('');

                            return (
                              <DiffViewer
                                diff={diffContent}
                                filename={fileChange.path}
                              />
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Show all diffs if no tracking file */}
      {!tracking && commitInfo.files.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">All Changes</h3>
          {commitInfo.files.map((fileDiff, fileIdx) => {
            const diffContent = fileDiff.hunks
              .map((hunk) => hunk.header + '\n' + hunk.content)
              .join('');

            return (
              <div key={fileIdx} className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 font-mono text-sm border-b">
                  {fileDiff.path}
                </div>
                <DiffViewer diff={diffContent} filename={fileDiff.path} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
