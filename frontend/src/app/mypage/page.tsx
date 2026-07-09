'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BottomNav } from '@/components/BottomNav';
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
      setMessage('먼저 사용자를 선택해 주세요.');
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
        setMessage('사용자 정보를 불러오지 못했습니다. 백엔드 서버 상태를 확인해 주세요.');
      }
    }

    void loadUser(Number(savedUserId));
  }, []);

  function handleSwitchUser() {
    window.localStorage.removeItem(SELECTED_USER_KEY);
    router.push('/');
  }

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="top-bar__inner">
          <div className="brand">
            <p className="brand__caption">내 정보</p>
            <h1 className="brand__name">마이페이지</h1>
          </div>
        </div>
      </header>

      <main className="page page--mypage page--with-nav">
        {loadState === 'loading' && (
          <div className="status-box" role="status">
            <h3>사용자 정보를 불러오는 중</h3>
            <p>현재 선택된 사용자를 확인하고 있습니다.</p>
          </div>
        )}

        {loadState === 'error' && (
          <div className="status-box error-box" role="alert">
            <h3>마이페이지를 볼 수 없습니다</h3>
            <p>{message}</p>
            <div className="status-actions">
              <Link className="secondary-button" href="/">
                사용자 선택으로 이동
              </Link>
            </div>
          </div>
        )}

        {loadState === 'success' && user && (
          <section className="detail-card profile-panel" aria-labelledby="profile-title">
            <h2 id="profile-title">{user.nickname}</h2>
            <dl className="profile-list">
              <div>
                <dt>이메일</dt>
                <dd>{user.email}</dd>
              </div>
              <div>
                <dt>사용자 번호</dt>
                <dd>{user.id}</dd>
              </div>
              <div>
                <dt>시작일</dt>
                <dd>{formatDate(user.createdAt)}</dd>
              </div>
            </dl>

            <button className="submit-button" onClick={handleSwitchUser} type="button">
              사용자 변경
            </button>
          </section>
        )}
      </main>

      <BottomNav active="mypage" />
    </div>
  );
}
