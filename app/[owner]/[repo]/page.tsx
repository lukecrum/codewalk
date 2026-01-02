'use client';

import { useParams, useRouter } from 'next/navigation';
import PRSelector from '@/components/PRSelector';
import { useAuth } from '@/contexts/AuthContext';

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

export default function RepoPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();

  const owner = params.owner as string;
  const repo = params.repo as string;

  const handleSelectPR = (pr: PR) => {
    router.push(`/${owner}/${repo}/pull/${pr.number}`);
  };

  return (
    <div className="animate-fade-in">
      <PRSelector
        owner={owner}
        repo={repo}
        token={token || undefined}
        onSelectPR={handleSelectPR}
      />
    </div>
  );
}
