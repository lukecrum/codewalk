'use client';

import { useState } from 'react';
import { GitBranch, ArrowLeft, Settings, GitPullRequest, GitCommit } from 'lucide-react';
import RepoSelector from '@/components/RepoSelector';
import PRSelector from '@/components/PRSelector';
import PRDiffViewer from '@/components/PRDiffViewer';
import CommitList from '@/components/CommitList';
import TrackingVisualizer from '@/components/TrackingVisualizer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

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

type Commit = {
  sha: string;
  shortSha: string;
  message: string;
  author: string;
  date: string;
};

export default function Home() {
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [token, setToken] = useState('');
  const [configured, setConfigured] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [selectedPR, setSelectedPR] = useState<PR | null>(null);
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null);
  const [activeTab, setActiveTab] = useState<'files' | 'commits'>('files');

  const handleSelectRepo = (repoOwner: string, repoName: string) => {
    setOwner(repoOwner);
    setRepo(repoName);
    setConfigured(true);
  };

  const handleConfigure = (e: React.FormEvent) => {
    e.preventDefault();
    if (owner && repo) {
      setConfigured(true);
    }
  };

  const handleBackToPRs = () => {
    setSelectedPR(null);
    setSelectedCommit(null);
    setActiveTab('files');
  };

  const handleBackToCommits = () => {
    setSelectedCommit(null);
  };

  if (!configured) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="border-b bg-card">
          <div className="max-w-5xl mx-auto px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <GitBranch className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">CodeWalker</h1>
                <p className="text-xs text-muted-foreground">Visualize code changes with context</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center p-6">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">Welcome to CodeWalker</CardTitle>
              <CardDescription className="text-base">
                Select a repository to visualize pull request changes with structured reasoning
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {!manualEntry ? (
                <RepoSelector
                  token={token}
                  onSelectRepo={handleSelectRepo}
                  onManualEntry={() => setManualEntry(true)}
                />
              ) : (
                <form onSubmit={handleConfigure} className="space-y-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Manual Repository Entry</h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setManualEntry(false)}
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Back to list
                    </Button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Repository Owner
                      </label>
                      <Input
                        type="text"
                        value={owner}
                        onChange={(e) => setOwner(e.target.value)}
                        placeholder="octocat"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Repository Name
                      </label>
                      <Input
                        type="text"
                        value={repo}
                        onChange={(e) => setRepo(e.target.value)}
                        placeholder="my-repo"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      GitHub Token
                      <Badge variant="secondary" className="font-normal text-xs">Optional</Badge>
                    </label>
                    <Input
                      type="password"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="ghp_..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Required for private repos. Needs &apos;repo&apos; scope.
                    </p>
                  </div>

                  <Button type="submit" className="w-full">
                    Continue
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <GitBranch className="h-4 w-4 text-primary" />
                </div>
                <span className="font-semibold">CodeWalker</span>
              </div>

              {/* Breadcrumb */}
              <nav className="flex items-center gap-1.5 text-sm">
                <span className="text-muted-foreground">/</span>
                <button
                  onClick={handleBackToPRs}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {owner}/{repo}
                </button>
                {selectedPR && (
                  <>
                    <span className="text-muted-foreground">/</span>
                    <button
                      onClick={handleBackToCommits}
                      className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <GitPullRequest className="h-3.5 w-3.5" />
                      #{selectedPR.number}
                    </button>
                  </>
                )}
                {selectedCommit && (
                  <>
                    <span className="text-muted-foreground">/</span>
                    <span className="flex items-center gap-1">
                      <GitCommit className="h-3.5 w-3.5" />
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {selectedCommit.shortSha}
                      </code>
                    </span>
                  </>
                )}
              </nav>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setConfigured(false);
                setSelectedPR(null);
                setSelectedCommit(null);
              }}
            >
              <Settings className="h-4 w-4 mr-1.5" />
              Change Repo
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* PR List */}
          {!selectedPR && (
            <div className="animate-fade-in">
              <PRSelector
                owner={owner}
                repo={repo}
                token={token}
                onSelectPR={setSelectedPR}
              />
            </div>
          )}

          {/* PR Details */}
          {selectedPR && !selectedCommit && (
            <div className="animate-fade-in space-y-4">
              {/* Back button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToPRs}
                className="mb-2"
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                All Pull Requests
              </Button>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'files' | 'commits')} className="w-full">
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
                    prNumber={selectedPR.number}
                    token={token}
                  />
                </TabsContent>

                <TabsContent value="commits" className="mt-4">
                  <Card>
                    <CardContent className="pt-6">
                      <CommitList
                        owner={owner}
                        repo={repo}
                        prNumber={selectedPR.number}
                        token={token}
                        onSelectCommit={setSelectedCommit}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Commit Details */}
          {selectedPR && selectedCommit && (
            <div className="animate-fade-in space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToCommits}
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                All Commits
              </Button>

              <Card>
                <CardContent className="pt-6">
                  <TrackingVisualizer
                    owner={owner}
                    repo={repo}
                    ref={selectedPR.head.ref}
                    commitSha={selectedCommit.sha}
                    token={token}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
