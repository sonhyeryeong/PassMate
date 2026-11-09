'use client';

import { useEffect, useState } from 'react';
import { request } from '@/lib/apiClient';

export function GoogleLoginLink() {
  const [enabled, setEnabled] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    setFailed(new URLSearchParams(window.location.search).get('google') === 'failed');
    request<{enabled: boolean}>('/auth/google')
      .then(({enabled}) => { if (active) setEnabled(enabled); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, []);

  return <>
    {failed && <p role="alert">Google 로그인을 완료하지 못했습니다. 다시 시도해 주세요.</p>}
    {enabled && <a className="secondary-button" href="/api/oauth2/authorization/google">Google로 로그인</a>}
  </>;
}
