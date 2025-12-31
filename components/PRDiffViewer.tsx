'use client';

import { useState, useEffect } from 'react';
import { FileCode, Lightbulb, GitMerge, ArrowRight, ChevronDown, ChevronRight, File } from 'lucide-react';
import DiffViewer from './DiffViewer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

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
  hunks: Array<{ header: string; content: string }>;
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

function getFileExtension(path: string): string {
  const parts = path.split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

export default function PRDiffViewer({ owner, repo, prNumber, token }: PRDiffViewerProps) {
  const [prInfo, setPRInfo] = useState<PRInfo | null>(null);
  const [files, setFiles] = useState<FileWithTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'changes' | 'files'>('changes');
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

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
        // Expand all files by default
        setExpandedFiles(new Set(data.files.map((f: FileWithTracking) => f.path)));
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchPRDiff();
  }, [owner, repo, prNumber, token]);

  const toggleFile = (path: string) => {
    setExpandedFiles(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
            <p className="text-destructive font-medium">Failed to load pull request</p>
            <p className="text-destructive/80 text-sm mt-1">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!prInfo) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12 text-muted-foreground">
            No pull request data available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group files by reasoning
  const reasoningGroups = new Map<
    string,
    Array<{
      filePath: string;
      commitSha: string;
      commitMessage: string;
      hunkNumbers: number[];
    }>
  >();

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

  const hasTrackingData = reasoningGroups.size > 0;

  return (
    <div className="space-y-4">
      {/* PR Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl leading-tight mb-2">{prInfo.title}</CardTitle>
              <div className="flex items-center flex-wrap gap-2 text-sm">
                <Badge
                  variant={prInfo.state === 'open' ? 'default' : 'secondary'}
                  className={prInfo.state === 'open' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-purple-100 text-purple-700 hover:bg-purple-100'}
                >
                  {prInfo.state}
                </Badge>
                <span className="text-muted-foreground">
                  {prInfo.user} wants to merge
                </span>
                <div className="flex items-center gap-1 font-mono text-xs bg-muted px-2 py-0.5 rounded">
                  <span>{prInfo.head.ref}</span>
                  <ArrowRight className="h-3 w-3" />
                  <span>{prInfo.base.ref}</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        {prInfo.body && (
          <CardContent className="pt-0">
            <Separator className="mb-4" />
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {prInfo.body}
            </p>
          </CardContent>
        )}
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'changes' | 'files')}>
        <TabsList className="w-full justify-start bg-card border rounded-lg p-1 h-auto">
          <TabsTrigger value="changes" className="gap-2 data-[state=active]:bg-background">
            <Lightbulb className="h-4 w-4" />
            By Reasoning
            {hasTrackingData && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {reasoningGroups.size}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="files" className="gap-2 data-[state=active]:bg-background">
            <FileCode className="h-4 w-4" />
            By File
            <Badge variant="secondary" className="ml-1 text-xs">
              {files.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Changes Tab - Grouped by reasoning */}
        <TabsContent value="changes" className="mt-4 space-y-4">
          {!hasTrackingData ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Lightbulb className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground font-medium">No tracking data available</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Changes are not grouped by reasoning. View the Files tab to see all changes.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            Array.from(reasoningGroups.entries()).map(([key, fileInfos], idx) => {
              const reasoning = key.split('|')[0];

              return (
                <Card key={idx} className="overflow-hidden border-l-4 border-l-primary/40">
                  {/* Reasoning Header */}
                  <CardHeader className="bg-primary/5 pb-3">
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded bg-primary/10 mt-0.5">
                        <Lightbulb className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium leading-relaxed">{reasoning}</p>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Files for this reasoning */}
                  <CardContent className="p-0">
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
                        <div key={fileIdx}>
                          {fileIdx > 0 && <Separator />}
                          <div className="file-path-header">
                            <File className="h-4 w-4 file-icon" />
                            <span className="truncate">{file.path}</span>
                          </div>
                          <DiffViewer diff={diffContent} filename={file.path} />
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* Files Tab - Plain file-based view */}
        <TabsContent value="files" className="mt-4 space-y-3">
          {files.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-muted-foreground">
                  No file changes in this pull request
                </div>
              </CardContent>
            </Card>
          ) : (
            files.map((file) => {
              const diffContent = file.hunks
                .map((hunk) => hunk.header + '\n' + hunk.content)
                .join('');
              const isExpanded = expandedFiles.has(file.path);
              const ext = getFileExtension(file.path);

              return (
                <Card key={file.path} className="overflow-hidden">
                  <button
                    onClick={() => toggleFile(file.path)}
                    className="w-full file-path-header hover:bg-muted/70 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 file-icon shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 file-icon shrink-0" />
                    )}
                    <span className="truncate flex-1 text-left">{file.path}</span>
                    {ext && (
                      <Badge variant="outline" className="text-xs font-mono shrink-0">
                        {ext}
                      </Badge>
                    )}
                  </button>
                  {isExpanded && (
                    <DiffViewer diff={diffContent} filename={file.path} />
                  )}
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
