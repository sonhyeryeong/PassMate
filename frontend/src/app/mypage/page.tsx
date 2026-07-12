'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { getUser } from '@/lib/userApi';
import type { User } from '@/types/user';

const SELECTED_USER_KEY = 'passmate.selectedUser';

type LoadState = 'loading' | 'success' | 'error';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
}

export default function MyPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const savedUserId = window.localStorage.getItem(SELECTED_USER_KEY);

    if (!savedUserId) {
      setLoadState('error');
      setMessage('먼저 사용할 프로필을 선택해 주세요.');
      return;
    }

    async function loadUser(userId: number) {
      setLoadState('loading');
      setMessage('');

      try {
        const userData = await getUser(userId);
        setUser(userData);
        setLoadState('success');
      } catch {
        setLoadState('error');
        setMessage('내 정보를 불러오지 못했습니다. 백엔드 서버 상태를 확인해 주세요.');
      }
    }

    void loadUser(Number(savedUserId));
  }, []);

  function handleSwitchUser() {
    window.localStorage.removeItem(SELECTED_USER_KEY);
    router.push('/');
  }

  return (
    <AppShell active="mypage" eyebrow="프로필" title="내 정보">
      {loadState === 'loading' && (
        <div className="status-box" role="status">
          <h3>내 정보를 불러오는 중</h3>
          <p>현재 선택한 프로필을 확인하고 있습니다.</p>
        </div>
      )}

      {loadState === 'error' && (
        <div className="status-box error-box" role="alert">
          <h3>내 정보를 볼 수 없습니다</h3>
          <p>{message}</p>
          <div className="status-actions">
            <Link className="secondary-button" href="/">
              프로필 선택으로 이동
            </Link>
          </div>
        </div>
      )}

      {loadState === 'success' && user && (
        <section className="surface-panel profile-panel" aria-labelledby="profile-title">
          <h2 id="profile-title">{user.nickname}</h2>
          <dl className="profile-list">
            <div>
              <dt>이메일</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>프로필 번호</dt>
              <dd>{user.id}</dd>
            </div>
            <div>
              <dt>시작한 날</dt>
              <dd>{formatDate(user.createdAt)}</dd>
            </div>
          </dl>

          <button className="submit-button submit-button--fit" onClick={handleSwitchUser} type="button">
            다른 프로필 선택
          </button>
        </section>
      )}
    </AppShell>
  );
}
