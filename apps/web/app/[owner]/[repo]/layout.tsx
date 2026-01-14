'use client';

import { GitBranch } from 'lucide-react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import UserMenu from '@/components/UserMenu';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RepoLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  const owner = params.owner as string;
  const repo = params.repo as string;
  const number = params.number as string | undefined;
  const sha = params.sha as string | undefined;

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <GitBranch className="h-4 w-4 text-primary" />
                </div>
                <span className="font-semibold">codewalk</span>
              </Link>

              {/* Breadcrumb */}
              <nav className="flex items-center gap-1.5 text-sm">
                <span className="text-muted-foreground">/</span>
                <Link
                  href={`/${owner}/${repo}`}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {owner}/{repo}
                </Link>
                {number && (
                  <>
                    <span className="text-muted-foreground">/</span>
                    <Link
                      href={`/${owner}/${repo}/pull/${number}`}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      #{number}
                    </Link>
                  </>
                )}
                {sha && (
                  <>
                    <span className="text-muted-foreground">/</span>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                      {sha.slice(0, 7)}
                    </code>
                  </>
                )}
              </nav>
            </div>

            <UserMenu />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-[1400px] mx-auto px-6 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
