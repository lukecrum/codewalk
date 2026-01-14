'use client';

import { useState, useEffect } from 'react';
import { GitPullRequest, GitMerge, CircleDot, User, ArrowRight, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  const [filteredPRs, setFilteredPRs] = useState<PR[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
        setFilteredPRs(data.prs);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchPRs();
  }, [owner, repo, token]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPRs(prs);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = prs.filter(
      pr =>
        pr.title.toLowerCase().includes(query) ||
        pr.number.toString().includes(query) ||
        pr.user.login.toLowerCase().includes(query)
    );
    setFilteredPRs(filtered);
  }, [searchQuery, prs]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full" />
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
            <p className="text-destructive font-medium">Failed to load pull requests</p>
            <p className="text-destructive/80 text-sm mt-1">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (prs.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <GitPullRequest className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground font-medium">No pull requests found</p>
            <p className="text-sm text-muted-foreground mt-1">
              This repository has no open or closed pull requests
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <GitPullRequest className="h-5 w-5" />
          Pull Requests
        </CardTitle>
        <CardDescription>
          Select a pull request to view changes and commit tracking
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pull requests..."
            className="pl-9"
          />
        </div>

        <p className="text-sm text-muted-foreground">
          {filteredPRs.length} {filteredPRs.length === 1 ? 'pull request' : 'pull requests'}
          {searchQuery && ` matching "${searchQuery}"`}
        </p>

        <ScrollArea className="h-[500px] pr-4 -mr-4">
          <div className="space-y-2">
            {filteredPRs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No pull requests found</p>
                {searchQuery && (
                  <p className="text-sm mt-1">Try a different search term</p>
                )}
              </div>
            ) : (
              filteredPRs.map((pr) => (
                <button
                  key={pr.number}
                  onClick={() => onSelectPR(pr)}
                  className="w-full text-left p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 ${pr.state === 'open' ? 'text-green-600' : 'text-purple-600'}`}>
                      {pr.state === 'open' ? (
                        <CircleDot className="h-5 w-5" />
                      ) : (
                        <GitMerge className="h-5 w-5" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-medium text-foreground group-hover:text-primary transition-colors leading-snug">
                          {pr.title}
                        </h4>
                        <Badge
                          variant={pr.state === 'open' ? 'default' : 'secondary'}
                          className={`shrink-0 ${pr.state === 'open' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-purple-100 text-purple-700 hover:bg-purple-100'}`}
                        >
                          {pr.state}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground mb-2">
                        #{pr.number} opened by {pr.user.login}
                      </p>

                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded w-fit">
                        <span className="truncate max-w-[120px]">{pr.head.ref}</span>
                        <ArrowRight className="h-3 w-3 shrink-0" />
                        <span className="truncate max-w-[120px]">{pr.base.ref}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
