'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { getErrorMessage, request } from '@/lib/apiClient';

export default function GoogleSignupPage() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await request<void>('/auth/google/onboarding', {
        method: 'POST',
        body: JSON.stringify({nickname}),
      });
      window.location.replace('/');
    } catch (cause) {
      setError(getErrorMessage(cause, '가입을 완료하지 못했습니다.'));
      setBusy(false);
    }
  }

  return <main className="auth-panel surface-panel">
    <h1>Google 계정으로 가입</h1>
    <p>내 학습 공간에서 사용할 닉네임을 정해 주세요. 기존 아이디의 학습 자료는 별도로 보관됩니다.</p>
    <form className="stack-layout" onSubmit={submit}>
      <label>닉네임<input disabled={!ready || busy} required maxLength={30} autoComplete="nickname" value={nickname}
        onChange={event => setNickname(event.target.value)} /></label>
      {error && <p role="alert">{error}</p>}
      <button className="submit-button" disabled={!ready || busy} type="submit">{busy ? '가입 중…' : '학습 시작'}</button>
    </form>
    <Link href="/login">로그인으로 돌아가기</Link>
  </main>;
}
