'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GitBranch, ArrowLeft } from 'lucide-react';
import RepoSelector from '@/components/RepoSelector';
import SignInButton from '@/components/SignInButton';
import UserMenu from '@/components/UserMenu';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const router = useRouter();
  const { user, token, loading } = useAuth();
  const [manualEntry, setManualEntry] = useState(false);
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');

  const handleSelectRepo = (repoOwner: string, repoName: string) => {
    router.push(`/${repoOwner}/${repoName}`);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (owner && repo) {
      router.push(`/${owner}/${repo}`);
    }
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
          <Card className="w-full max-w-3xl">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <Skeleton className="h-8 w-48 mx-auto" />
                <Skeleton className="h-4 w-64 mx-auto" />
                <Skeleton className="h-10 w-48 mx-auto" />
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

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
            {user && <UserMenu />}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-3xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl">Welcome to CodeWalker</CardTitle>
            <CardDescription className="text-base">
              {user
                ? 'Select a repository to visualize pull request changes with structured reasoning'
                : 'Sign in with GitHub to get started'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {!user ? (
              <div className="flex flex-col items-center gap-4">
                <SignInButton />
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  CodeWalker helps you understand code changes by grouping them by reasoning,
                  making code reviews faster and more effective.
                </p>
              </div>
            ) : !manualEntry ? (
              <RepoSelector
                token={token || undefined}
                onSelectRepo={handleSelectRepo}
                onManualEntry={() => setManualEntry(true)}
              />
            ) : (
              <form onSubmit={handleManualSubmit} className="space-y-5">
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
                    <label className="text-sm font-medium">Repository Owner</label>
                    <Input
                      type="text"
                      value={owner}
                      onChange={(e) => setOwner(e.target.value)}
                      placeholder="octocat"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Repository Name</label>
                    <Input
                      type="text"
                      value={repo}
                      onChange={(e) => setRepo(e.target.value)}
                      placeholder="my-repo"
                      required
                    />
                  </div>
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
