'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { getErrorMessage } from '@/lib/apiClient';
import { getDashboard } from '@/lib/dashboardApi';
import { createUser, getUsers } from '@/lib/userApi';
import type { Dashboard, LearningQueue } from '@/types/dashboard';
import type { User } from '@/types/user';

const SELECTED_USER_KEY = 'passmate.selectedUser';

type LoadState = 'loading' | 'success' | 'error';
type SubmitState = 'idle' | 'submitting';
type DashboardState = 'idle' | 'loading' | 'success' | 'error';

const LEARNING_QUEUE_PRESENTATIONS: Record<
  string,
  {
    title: string;
    activeActionLabel: string;
    activeActionPath: string;
    emptyActionLabel: string;
    emptyActionPath: string;
  }
> = {
  FLASH_CARD_REVIEW: {
    title: '오늘의 카드 복습',
    activeActionLabel: '카드 복습 시작',
    activeActionPath: '/review',
    emptyActionLabel: '학습 세트 보기',
    emptyActionPath: '/folder',
  },
};

function getQueuePresentation(queue: LearningQueue) {
  return LEARNING_QUEUE_PRESENTATIONS[queue.type] ?? {
    title: '오늘의 학습',
    activeActionLabel: '학습 시작',
    activeActionPath: '/folder',
    emptyActionLabel: '학습 자료 보기',
    emptyActionPath: '/folder',
  };
}

export default function DashboardPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [dashboardState, setDashboardState] = useState<DashboardState>('idle');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [dashboardMessage, setDashboardMessage] = useState('');

  async function loadSelectedUserDashboard(userId: number) {
    setDashboardState('loading');
    setDashboardMessage('');

    try {
      const dashboardData = await getDashboard(userId);
      setDashboard(dashboardData);
      setDashboardState('success');
    } catch (error) {
      setDashboard(null);
      setDashboardState('error');
      setDashboardMessage(getErrorMessage(error, '학습 현황을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'));
    }
  }

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
          await loadSelectedUserDashboard(savedUser.id);
        }

        setLoadState('success');
      } catch (error) {
        setLoadState('error');
        setMessage(getErrorMessage(error, '프로필 정보를 불러오지 못했습니다.'));
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
      setNickname('');
      setEmail('');
      await loadSelectedUserDashboard(createdUser.id);
    } catch (error) {
      setMessage(getErrorMessage(error, '프로필을 만들지 못했습니다.'));
    } finally {
      setSubmitState('idle');
    }
  }

  async function handleSelectUser(user: User) {
    window.localStorage.setItem(SELECTED_USER_KEY, String(user.id));
    setSelectedUser(user);
    setMessage('');
    await loadSelectedUserDashboard(user.id);
  }

  function handleChangeUser() {
    window.localStorage.removeItem(SELECTED_USER_KEY);
    setSelectedUser(null);
    setDashboard(null);
    setDashboardState('idle');
    setDashboardMessage('');
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
      {dashboardState === 'loading' && (
        <div className="status-box" role="status">
          <h3>오늘의 학습을 준비하는 중</h3>
          <p>남은 학습과 완료한 활동을 확인하고 있습니다.</p>
        </div>
      )}

      {dashboardState === 'error' && (
        <div className="status-box error-box" role="alert">
          <h3>학습 현황을 불러오지 못했습니다</h3>
          <p>{dashboardMessage}</p>
          <div className="status-actions">
            <button
              className="secondary-button"
              onClick={() => void loadSelectedUserDashboard(selectedUser.id)}
              type="button"
            >
              다시 시도
            </button>
          </div>
        </div>
      )}

      {dashboardState === 'success' && dashboard && (
        <div className="stack-layout">
          <section className="dashboard-stats" aria-label="오늘의 학습 요약">
            <article className="stat-card">
              <span>오늘 남은 학습</span>
              <strong>{dashboard.summary.pendingLearningCount}개</strong>
            </article>
            <article className="stat-card">
              <span>오늘 완료</span>
              <strong>{dashboard.summary.completedTodayCount}개</strong>
            </article>
            <article className="stat-card">
              <span>폴더</span>
              <strong>{dashboard.summary.folderCount}개</strong>
            </article>
          </section>

          <section aria-labelledby="learning-queue-title">
            <div className="section-heading">
              <div>
                <h2 id="learning-queue-title">오늘의 학습</h2>
                <p>지금 해야 할 학습을 확인하고 바로 시작하세요.</p>
              </div>
            </div>

            {dashboard.learningQueues.length === 0 && (
              <div className="empty-state">
                <h3>오늘 예정된 학습이 없습니다</h3>
                <p>새 학습 세트를 만들거나 기존 학습 자료를 확인해 보세요.</p>
                <div className="status-actions">
                  <Link className="submit-button submit-button--fit" href="/folder">
                    폴더 보기
                  </Link>
                </div>
              </div>
            )}

            {dashboard.learningQueues.length > 0 && (
              <div className="learning-queue-list">
                {dashboard.learningQueues.map((queue) => {
                  const presentation = getQueuePresentation(queue);
                  const hasPendingLearning = queue.pendingCount > 0;

                  return (
                    <article className="surface-panel learning-queue-card" key={queue.type}>
                      <div>
                        <p className="eyebrow">학습 활동</p>
                        <h3>{presentation.title}</h3>
                        <p>
                          {hasPendingLearning
                            ? `오늘 진행할 학습이 ${queue.pendingCount}개 남았습니다.`
                            : '오늘 예정된 학습을 모두 마쳤습니다.'}
                        </p>
                      </div>
                      <dl className="learning-queue-card__counts">
                        <div>
                          <dt>남은 학습</dt>
                          <dd>{queue.pendingCount}개</dd>
                        </div>
                        <div>
                          <dt>오늘 완료</dt>
                          <dd>{queue.completedTodayCount}개</dd>
                        </div>
                      </dl>
                      <Link
                        className={hasPendingLearning ? 'submit-button submit-button--fit' : 'secondary-button'}
                        href={
                          hasPendingLearning
                            ? presentation.activeActionPath
                            : presentation.emptyActionPath
                        }
                      >
                        {hasPendingLearning
                          ? presentation.activeActionLabel
                          : presentation.emptyActionLabel}
                      </Link>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </AppShell>
  );
}
