'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import TrackingVisualizer from '@/components/TrackingVisualizer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function CommitPage() {
  const params = useParams();
  const { token } = useAuth();
  const [headRef, setHeadRef] = useState<string | null>(null);

  const owner = params.owner as string;
  const repo = params.repo as string;
  const number = params.number as string;
  const sha = params.sha as string;

  // Fetch PR info to get the head ref
  useEffect(() => {
    const fetchPRInfo = async () => {
      const tokenParam = token ? `&token=${token}` : '';
      const response = await fetch(
        `/api/github/pr-diff?owner=${owner}&repo=${repo}&pr_number=${number}${tokenParam}`
      );
      if (response.ok) {
        const data = await response.json();
        setHeadRef(data.pr.head.ref);
      }
    };
    fetchPRInfo();
  }, [owner, repo, number, token]);

  return (
    <div className="animate-fade-in space-y-4">
      <Link href={`/${owner}/${repo}/pull/${number}`}>
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          All Commits
        </Button>
      </Link>

      <Card>
        <CardContent className="pt-6">
          {headRef ? (
            <TrackingVisualizer
              owner={owner}
              repo={repo}
              ref={headRef}
              commitSha={sha}
              token={token || undefined}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Loading commit details...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
