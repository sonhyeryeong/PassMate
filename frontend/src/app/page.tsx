'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { getErrorMessage } from '@/lib/apiClient';
import { getDashboard } from '@/lib/dashboardApi';
import { useCurrentUser } from '@/components/AuthGate';
import type { Dashboard, LearningQueue } from '@/types/dashboard';





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
 const selectedUser = useCurrentUser();
 const [dashboard,setDashboard]=useState<Dashboard|null>(null);
 const [dashboardState,setDashboardState]=useState<DashboardState>('loading');
 const [dashboardMessage,setDashboardMessage]=useState('');
 async function loadSelectedUserDashboard(userId: number) {
  setDashboardState('loading');
  try { setDashboard(await getDashboard(userId)); setDashboardState('success'); }
  catch(e) { setDashboardMessage(getErrorMessage(e,'학습 현황을 불러오지 못했습니다.'));setDashboardState('error'); }
 }
 useEffect(()=>{void loadSelectedUserDashboard(selectedUser.id);},[selectedUser.id]);
  return (
    <AppShell
      active="dashboard"
      eyebrow={`${selectedUser.nickname}님의 학습 공간`}
      title="대시보드"
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
