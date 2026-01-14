'use client';

import { useState, useEffect } from 'react';
import { Lightbulb, User, GitCommit, AlertTriangle, File, ChevronDown, ChevronRight } from 'lucide-react';
import { Changeset, CommitInfo } from '@codewalk/types';
import DiffViewer from './DiffViewer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

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
  ref: branchRef,
  commitSha,
  token,
}: TrackingVisualizerProps) {
  const [tracking, setTracking] = useState<Changeset | null>(null);
  const [commitInfo, setCommitInfo] = useState<CommitInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({ owner, repo });
        if (token) params.append('token', token);

        // Fetch tracking file
        const trackingParams = new URLSearchParams(params);
        trackingParams.append('ref', branchRef);
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

        // Initialize all groups and files as expanded
        if (trackingData) {
          setExpandedGroups(new Set(trackingData.changes.map((_: unknown, idx: number) => idx)));
          const fileKeys: string[] = [];
          trackingData.changes.forEach((change: { files: Array<{ path: string }> }, changeIdx: number) => {
            change.files.forEach((file: { path: string }) => {
              fileKeys.push(`${changeIdx}|${file.path}`);
            });
          });
          setExpandedFiles(new Set(fileKeys));
        } else if (commitData.commit?.files) {
          // For fallback view, expand all files
          setExpandedFiles(new Set(commitData.commit.files.map((f: { path: string }) => f.path)));
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [owner, repo, branchRef, commitSha, token]);

  const toggleGroup = (idx: number) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const toggleFile = (key: string) => {
    setExpandedFiles(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
        <p className="text-destructive font-medium">Failed to load commit data</p>
        <p className="text-destructive/80 text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (!commitInfo) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No commit data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Commit Header */}
      <div className="flex items-start gap-4 pb-4 border-b">
        <div className="p-2 rounded-lg bg-muted">
          <GitCommit className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-2">
            <Badge variant="outline" className="font-mono text-xs">
              {commitInfo.shortSha}
            </Badge>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              {commitInfo.author}
            </span>
          </div>
          <p className="font-medium leading-snug">{commitInfo.message}</p>
        </div>
      </div>

      {/* No Tracking Warning */}
      {!tracking && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">No tracking file found</p>
                <p className="text-sm text-amber-700 mt-1">
                  This commit doesn&apos;t have a codewalk tracking file. All changes are shown below without reasoning context.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tracked Changes */}
      {tracking && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lightbulb className="h-4 w-4" />
            <span>{tracking.changes.length} logical {tracking.changes.length === 1 ? 'change' : 'changes'}</span>
          </div>

          {tracking.changes.map((change, changeIdx) => {
            const isGroupExpanded = expandedGroups.has(changeIdx);

            return (
              <Card key={changeIdx} className="overflow-hidden border-l-4 border-l-primary/40">
                {/* Reasoning Header */}
                <button
                  onClick={() => toggleGroup(changeIdx)}
                  className="w-full text-left"
                >
                  <CardHeader className="bg-primary/5 pb-3 hover:bg-primary/10 transition-colors">
                    <div className="flex items-start gap-3">
                      {isGroupExpanded ? (
                        <ChevronDown className="h-4 w-4 text-primary mt-1 shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-primary mt-1 shrink-0" />
                      )}
                      <div className="p-1.5 rounded bg-primary/10 mt-0.5">
                        <Lightbulb className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium leading-relaxed">{change.reasoning}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {change.files.length} {change.files.length === 1 ? 'file' : 'files'} affected
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                </button>

                {/* Files modified */}
                {isGroupExpanded && (
                  <CardContent className="p-0">
                    {change.files.map((fileChange, fileIdx) => {
                      const fileDiff = commitInfo.files.find(
                        (f) => f.path === fileChange.path
                      );

                      if (!fileDiff) return null;

                      const selectedHunks = fileChange.hunks
                        .map((hunkNum) => fileDiff.hunks[hunkNum - 1])
                        .filter((h) => h != null);

                      if (selectedHunks.length === 0) return null;

                      const diffContent = selectedHunks
                        .map((hunk) => hunk.header + '\n' + hunk.content)
                        .join('');

                      const fileKey = `${changeIdx}|${fileChange.path}`;
                      const isFileExpanded = expandedFiles.has(fileKey);

                      return (
                        <div key={fileIdx}>
                          {fileIdx > 0 && <Separator />}
                          <button
                            onClick={() => toggleFile(fileKey)}
                            className="w-full file-path-header hover:bg-muted/70 transition-colors"
                          >
                            {isFileExpanded ? (
                              <ChevronDown className="h-4 w-4 file-icon shrink-0" />
                            ) : (
                              <ChevronRight className="h-4 w-4 file-icon shrink-0" />
                            )}
                            <span className="truncate flex-1 text-left">{fileChange.path}</span>
                          </button>
                          {isFileExpanded && (
                            <DiffViewer diff={diffContent} filename={fileChange.path} />
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Fallback: Show all diffs if no tracking */}
      {!tracking && commitInfo.files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <File className="h-4 w-4" />
            <span>{commitInfo.files.length} {commitInfo.files.length === 1 ? 'file' : 'files'} changed</span>
          </div>

          {commitInfo.files.map((fileDiff, fileIdx) => {
            const diffContent = fileDiff.hunks
              .map((hunk) => hunk.header + '\n' + hunk.content)
              .join('');
            const isFileExpanded = expandedFiles.has(fileDiff.path);

            return (
              <Card key={fileIdx} className="overflow-hidden">
                <button
                  onClick={() => toggleFile(fileDiff.path)}
                  className="w-full file-path-header hover:bg-muted/70 transition-colors"
                >
                  {isFileExpanded ? (
                    <ChevronDown className="h-4 w-4 file-icon shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 file-icon shrink-0" />
                  )}
                  <span className="truncate flex-1 text-left">{fileDiff.path}</span>
                </button>
                {isFileExpanded && (
                  <DiffViewer diff={diffContent} filename={fileDiff.path} />
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
