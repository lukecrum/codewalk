'use client';

import { Github, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

export default function SignInButton() {
  const { signInWithGitHub } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    await signInWithGitHub();
  };

  return (
    <Button onClick={handleSignIn} disabled={loading} size="lg" className="gap-2">
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Github className="h-5 w-5" />
      )}
      Sign in with GitHub
    </Button>
  );
}
