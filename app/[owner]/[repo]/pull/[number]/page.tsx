'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import PRDiffViewer from '@/components/PRDiffViewer';
import CommitList from '@/components/CommitList';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

type Commit = {
  sha: string;
  shortSha: string;
  message: string;
  author: string;
  date: string;
};

type PRInfo = {
  head: {
    ref: string;
  };
};

export default function PRPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'files' | 'commits'>('files');
  const [prInfo, setPRInfo] = useState<PRInfo | null>(null);

  const owner = params.owner as string;
  const repo = params.repo as string;
  const number = parseInt(params.number as string);

  // Fetch PR info to get the head ref for commit navigation
  useEffect(() => {
    const fetchPRInfo = async () => {
      const tokenParam = token ? `&token=${token}` : '';
      const response = await fetch(
        `/api/github/pr-diff?owner=${owner}&repo=${repo}&pr_number=${number}${tokenParam}`
      );
      if (response.ok) {
        const data = await response.json();
        setPRInfo({ head: { ref: data.pr.head.ref } });
      }
    };
    fetchPRInfo();
  }, [owner, repo, number, token]);

  const handleSelectCommit = (commit: Commit) => {
    router.push(`/${owner}/${repo}/pull/${number}/commits/${commit.sha}`);
  };

  return (
    <div className="animate-fade-in space-y-4">
      <Link href={`/${owner}/${repo}`}>
        <Button variant="ghost" size="sm" className="mb-2">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          All Pull Requests
        </Button>
      </Link>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'files' | 'commits')}
        className="w-full"
      >
        <TabsList className="w-full justify-start bg-card border rounded-lg p-1 h-auto">
          <TabsTrigger value="files" className="data-[state=active]:bg-background">
            Files Changed
          </TabsTrigger>
          <TabsTrigger value="commits" className="data-[state=active]:bg-background">
            Commits
          </TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="mt-4">
          <PRDiffViewer
            owner={owner}
            repo={repo}
            prNumber={number}
            token={token || undefined}
          />
        </TabsContent>

        <TabsContent value="commits" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <CommitList
                owner={owner}
                repo={repo}
                prNumber={number}
                token={token || undefined}
                onSelectCommit={handleSelectCommit}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
