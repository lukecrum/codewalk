'use client';

import { useRouter } from 'next/navigation';
import { GitBranch, Lightbulb, GitPullRequest, Eye, Download } from 'lucide-react';
import RepoSelector from '@/components/RepoSelector';
import SignInButton from '@/components/SignInButton';
import UserMenu from '@/components/UserMenu';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const router = useRouter();
  const { user, token, loading } = useAuth();

  const handleSelectRepo = (repoOwner: string, repoName: string) => {
    router.push(`/${repoOwner}/${repoName}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b bg-card">
          <div className="max-w-7xl mx-auto px-6 py-4">
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
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md space-y-4">
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto" />
            <Skeleton className="h-10 w-48 mx-auto" />
          </div>
        </main>
      </div>
    );
  }

  // Signed out - show landing page
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="border-b bg-card">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <GitBranch className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold">CodeWalker</h1>
                  <p className="text-xs text-muted-foreground">Visualize code changes with context</p>
                </div>
              </div>
              <SignInButton />
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-1">
          <div className="max-w-5xl mx-auto px-6 py-16">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold tracking-tight mb-4">
                Code reviews that make sense
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                CodeWalker groups code changes by their reasoning, so you can understand
                the &quot;why&quot; behind every line &mdash; not just the &quot;what&quot;.
              </p>
              <SignInButton />
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-t-4 border-t-blue-500/50">
                <CardContent className="pt-6">
                  <div className="p-2 rounded-lg bg-blue-500/10 w-fit mb-4">
                    <Lightbulb className="h-5 w-5 text-blue-500" />
                  </div>
                  <h3 className="font-semibold mb-2">Reasoning-First View</h3>
                  <p className="text-sm text-muted-foreground">
                    See changes grouped by intent. Understand what each set of changes
                    accomplishes before diving into the code.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-t-4 border-t-green-500/50">
                <CardContent className="pt-6">
                  <div className="p-2 rounded-lg bg-green-500/10 w-fit mb-4">
                    <GitPullRequest className="h-5 w-5 text-green-500" />
                  </div>
                  <h3 className="font-semibold mb-2">Full PR Integration</h3>
                  <p className="text-sm text-muted-foreground">
                    Review pull requests, approve changes, and leave comments &mdash;
                    all from a single, focused interface.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-t-4 border-t-purple-500/50">
                <CardContent className="pt-6">
                  <div className="p-2 rounded-lg bg-purple-500/10 w-fit mb-4">
                    <Eye className="h-5 w-5 text-purple-500" />
                  </div>
                  <h3 className="font-semibold mb-2">Commit-Level Detail</h3>
                  <p className="text-sm text-muted-foreground">
                    Drill down into individual commits to see exactly how each
                    piece of the puzzle fits together.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Start */}
            <div className="mt-20">
              <h3 className="text-2xl font-bold text-center mb-4">Quick Start</h3>
              <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
                Set up your repository so Claude Code generates tracking files automatically with every commit.
              </p>

              <div className="space-y-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0 mt-1">
                        1
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold mb-2">Add <code className="text-sm bg-muted px-1.5 py-0.5 rounded">CLAUDE.md</code> to your repo root</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          This file tells Claude Code to follow the CodeWalker workflow and create tracking files.
                        </p>
                        <a
                          href="/templates/CLAUDE.md"
                          download="CLAUDE.md"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors"
                        >
                          <Download className="h-4 w-4" />
                          Download CLAUDE.md
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0 mt-1">
                        2
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold mb-2">Add <code className="text-sm bg-muted px-1.5 py-0.5 rounded">.claude/skills/codewalker.md</code></h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          This skill file defines the tracking file schema and provides detailed examples for Claude.
                        </p>
                        <a
                          href="/templates/codewalker.md"
                          download="codewalker.md"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors"
                        >
                          <Download className="h-4 w-4" />
                          Download codewalker.md
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0 mt-1">
                        3
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold mb-2">Start coding with Claude Code</h4>
                        <p className="text-sm text-muted-foreground">
                          That&apos;s it! When you use Claude Code in your repo, it will automatically create
                          tracking files in <code className="text-xs bg-muted px-1.5 py-0.5 rounded">.codewalker/</code> for
                          each commit. Push your changes and view them here with full reasoning context.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t bg-card py-6">
          <div className="max-w-5xl mx-auto px-6 text-center text-sm text-muted-foreground">
            Built with Claude Code
          </div>
        </footer>
      </div>
    );
  }

  // Signed in - show repo selector
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <GitBranch className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">CodeWalker</h1>
                <p className="text-xs text-muted-foreground">Visualize code changes with context</p>
              </div>
            </div>
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-8">
        <div className="max-w-3xl mx-auto px-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Select a repository</h2>
            <p className="text-muted-foreground">
              Choose a repository to view its pull requests
            </p>
          </div>
          <Card>
            <CardContent className="pt-6">
              <RepoSelector
                token={token || undefined}
                onSelectRepo={handleSelectRepo}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
