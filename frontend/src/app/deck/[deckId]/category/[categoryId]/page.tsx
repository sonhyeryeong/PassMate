'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function CategoryRedirectPage() {
  const params = useParams<{ deckId: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/deck/${params.deckId}`);
  }, [params.deckId, router]);

  return null;
}
