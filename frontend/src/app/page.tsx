'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { getFolders } from '@/lib/folderApi';
import { createUser, getUsers } from '@/lib/userApi';
import type { User } from '@/types/user';

const SELECTED_USER_KEY = 'passmate.selectedUser';

type LoadState = 'loading' | 'success' | 'error';
type SubmitState = 'idle' | 'submitting';

export default function DashboardPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [folderCount, setFolderCount] = useState(0);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadUsers() {
      setLoadState('loading');
      setMessage('');

      try {
        const items = await getUsers();
        setUsers(items);

        const savedUserId = window.localStorage.getItem(SELECTED_USER_KEY);
        const savedUser = items.find((user) => String(user.id) === savedUserId);

        if (savedUser) {
          setSelectedUser(savedUser);
          const folders = await getFolders(savedUser.id);
          setFolderCount(folders.length);
        }

        setLoadState('success');
      } catch {
        setLoadState('error');
        setMessage('프로필 정보를 불러오지 못했습니다. 백엔드 서버 상태를 확인해 주세요.');
      }
    }

    void loadUsers();
  }, []);

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedNickname = nickname.trim();
    const trimmedEmail = email.trim();

    if (!trimmedNickname || !trimmedEmail) {
      setMessage('닉네임과 이메일을 모두 입력해 주세요.');
      return;
    }

    setSubmitState('submitting');
    setMessage('');

    try {
      const createdUser = await createUser({
        nickname: trimmedNickname,
        email: trimmedEmail,
      });

      window.localStorage.setItem(SELECTED_USER_KEY, String(createdUser.id));
      setSelectedUser(createdUser);
      setUsers((currentUsers) => [createdUser, ...currentUsers]);
      setFolderCount(0);
      setNickname('');
      setEmail('');
    } catch {
      setMessage('프로필을 만들지 못했습니다. 이미 사용 중인 이메일일 수 있습니다.');
    } finally {
      setSubmitState('idle');
    }
  }

  async function handleSelectUser(user: User) {
    window.localStorage.setItem(SELECTED_USER_KEY, String(user.id));
    setSelectedUser(user);
    setMessage('');

    try {
      const folders = await getFolders(user.id);
      setFolderCount(folders.length);
    } catch {
      setFolderCount(0);
    }
  }

  function handleChangeUser() {
    window.localStorage.removeItem(SELECTED_USER_KEY);
    setSelectedUser(null);
    setFolderCount(0);
  }

  if (!selectedUser) {
    return (
      <AppShell active="dashboard" eyebrow="시작하기" title="프로필 선택">
        <section className="workspace-grid">
          <form className="surface-panel primary-form" onSubmit={handleCreateUser}>
            <div>
              <h2>새 프로필 만들기</h2>
              <p>로컬 MVP에서는 간단한 프로필을 선택해 학습 데이터를 구분합니다.</p>
            </div>

            <div className="form-field">
              <label htmlFor="nickname">닉네임</label>
              <input
                id="nickname"
                maxLength={40}
                onChange={(event) => setNickname(event.target.value)}
                placeholder="예: 수진"
                value={nickname}
              />
            </div>

            <div className="form-field">
              <label htmlFor="email">이메일</label>
              <input
                id="email"
                maxLength={120}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="sujin@example.com"
                type="email"
                value={email}
              />
            </div>

            <button className="submit-button" disabled={submitState === 'submitting'} type="submit">
              {submitState === 'submitting' ? '만드는 중' : '프로필 만들고 시작'}
            </button>

            {message && <div className="inline-alert" role="alert">{message}</div>}
          </form>

          <section className="surface-panel">
            <div className="section-heading compact-heading">
              <div>
                <h2>기존 프로필</h2>
                <p>이미 만든 프로필을 선택해 이어서 학습하세요.</p>
              </div>
            </div>

            {loadState === 'loading' && (
              <div className="status-box" role="status">
                <h3>프로필을 불러오는 중</h3>
                <p>저장된 프로필을 확인하고 있습니다.</p>
              </div>
            )}

            {loadState === 'error' && (
              <div className="status-box error-box" role="alert">
                <h3>프로필을 볼 수 없습니다</h3>
                <p>{message}</p>
              </div>
            )}

            {loadState === 'success' && users.length === 0 && (
              <div className="empty-state">
                <h3>아직 프로필이 없습니다</h3>
                <p>첫 프로필을 만들면 폴더와 학습 세트를 관리할 수 있습니다.</p>
              </div>
            )}

            {loadState === 'success' && users.length > 0 && (
              <div className="user-list">
                {users.map((user) => (
                  <button
                    className="user-list-item"
                    key={user.id}
                    onClick={() => void handleSelectUser(user)}
                    type="button"
                  >
                    <span>{user.nickname}</span>
                    <small>{user.email}</small>
                  </button>
                ))}
              </div>
            )}
          </section>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell
      active="dashboard"
      eyebrow={`${selectedUser.nickname}님의 학습 공간`}
      title="대시보드"
      actions={<button className="secondary-button" onClick={handleChangeUser} type="button">프로필 변경</button>}
    >
      <section className="dashboard-stats">
        <article className="stat-card">
          <span>오늘 복습할 카드</span>
          <strong>0개</strong>
        </article>
        <article className="stat-card">
          <span>폴더</span>
          <strong>{folderCount}개</strong>
        </article>
        <article className="stat-card">
          <span>이번 주 복습</span>
          <strong>0회</strong>
        </article>
      </section>

      <section className="workspace-grid">
        <article className="surface-panel">
          <h2>학습 세트 만들기</h2>
          <p>폴더를 만들고, 그 안에서 앞면/뒷면 카드를 여러 개 입력해 학습 세트를 구성하세요.</p>
          <div className="status-actions">
            <Link className="submit-button submit-button--fit" href="/folder">
              폴더로 이동
            </Link>
          </div>
        </article>

        <article className="surface-panel">
          <h2>오늘의 복습</h2>
          <p>만든 카드가 있으면 복습 화면에서 한 장씩 확인하고 결과를 남길 수 있습니다.</p>
          <div className="status-actions">
            <Link className="secondary-button" href="/review">
              복습 시작
            </Link>
          </div>
        </article>
      </section>
    </AppShell>
  );
}
