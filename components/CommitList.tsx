'use client';

import { useState, useEffect } from 'react';
import { GitCommit, User, Calendar, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

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

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

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
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchCommits();
  }, [owner, repo, prNumber, token]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-24" />
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
        <p className="text-destructive font-medium">Failed to load commits</p>
        <p className="text-destructive/80 text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (commits.length === 0) {
    return (
      <div className="text-center py-12">
        <GitCommit className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground font-medium">No commits found</p>
        <p className="text-sm text-muted-foreground mt-1">
          This pull request has no commits
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          {commits.length} {commits.length === 1 ? 'commit' : 'commits'}
        </h3>
      </div>

      <ScrollArea className="h-[450px] pr-4 -mr-4">
        <div className="space-y-2">
          {commits.map((commit, index) => (
            <button
              key={commit.sha}
              onClick={() => onSelectCommit(commit)}
              className="w-full text-left p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
            >
              <div className="flex items-start gap-3">
                {/* Commit indicator */}
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <GitCommit className="h-4 w-4 text-muted-foreground" />
                  </div>
                  {/* Timeline line */}
                  {index < commits.length - 1 && (
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-border" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="font-medium text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                      {commit.message.split('\n')[0]}
                    </p>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <Badge variant="outline" className="font-mono text-xs px-1.5">
                      {commit.shortSha}
                    </Badge>
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {commit.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(commit.date)}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
