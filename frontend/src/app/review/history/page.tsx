'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { ApiError, getErrorMessage } from '@/lib/apiClient';
import { getReviewHistory } from '@/lib/reviewApi';
import type { ReviewHistoryItem, ReviewResult } from '@/types/review';

const SELECTED_USER_KEY = 'passmate.selectedUser';

type LoadState = 'loading' | 'success' | 'error';
type ErrorKind = 'profile' | 'request';

const RESULT_LABELS: Record<ReviewResult, string> = {
  AGAIN: '다시',
  HARD: '어려움',
  GOOD: '좋음',
  EASY: '쉬움',
};

function formatReviewedAt(value: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function ReviewHistoryPage() {
  const [userId, setUserId] = useState<number | null>(null);
  const [items, setItems] = useState<ReviewHistoryItem[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [errorKind, setErrorKind] = useState<ErrorKind | null>(null);
  const [message, setMessage] = useState('');
  const [selectedDeckId, setSelectedDeckId] = useState('all');
  const [selectedMaterialId, setSelectedMaterialId] = useState('all');

  const loadHistory = useCallback(async (nextUserId: number) => {
    setLoadState('loading');
    setErrorKind(null);
    setMessage('');

    try {
      setItems(await getReviewHistory(nextUserId));
      setLoadState('success');
    } catch (error) {
      setLoadState('error');
      setErrorKind(error instanceof ApiError && error.code === 'USER_NOT_FOUND' ? 'profile' : 'request');
      setMessage(getErrorMessage(error, '복습 기록을 불러오지 못했습니다.'));
    }
  }, []);

  useEffect(() => {
    const savedUserId = window.localStorage.getItem(SELECTED_USER_KEY);
    const userId = savedUserId ? Number(savedUserId) : null;

    if (!userId || !Number.isInteger(userId)) {
      setLoadState('error');
      setErrorKind('profile');
      setMessage('먼저 사용할 프로필을 선택해 주세요.');
      return;
    }

    setUserId(userId);
    void loadHistory(userId);
  }, [loadHistory]);

  const deckOptions = useMemo(
    () => Array.from(
      new Map(items.map((item) => [item.deckId, item.deckName])).entries(),
    ),
    [items],
  );
  const materialOptions = useMemo(
    () => Array.from(
      new Map(
        items
          .filter((item) => selectedDeckId === 'all' || String(item.deckId) === selectedDeckId)
          .map((item) => [item.materialId, item.materialTitle]),
      ).entries(),
    ),
    [items, selectedDeckId],
  );
  const filteredItems = useMemo(
    () => items.filter((item) => (
      (selectedDeckId === 'all' || String(item.deckId) === selectedDeckId)
      && (selectedMaterialId === 'all' || String(item.materialId) === selectedMaterialId)
    )),
    [items, selectedDeckId, selectedMaterialId],
  );

  function handleDeckChange(deckId: string) {
    setSelectedDeckId(deckId);
    setSelectedMaterialId('all');
  }

  return (
    <AppShell
      active="review"
      eyebrow="학습 기록"
      title="복습 기록"
      actions={<Link className="secondary-button" href="/review">오늘의 복습</Link>}
    >
      {loadState === 'loading' && (
        <div className="status-box" role="status">
          <h3>복습 기록을 불러오는 중</h3>
          <p>최근 학습 결과를 정리하고 있습니다.</p>
        </div>
      )}

      {loadState === 'error' && (
        <div className="status-box error-box" role="alert">
          <h3>복습 기록을 불러올 수 없습니다</h3>
          <p>{message}</p>
          <div className="status-actions">
            {errorKind === 'profile' ? (
              <Link className="secondary-button" href="/">프로필 선택으로 이동</Link>
            ) : (
              <button
                className="secondary-button"
                disabled={!userId}
                onClick={() => userId && void loadHistory(userId)}
                type="button"
              >
                다시 시도
              </button>
            )}
          </div>
        </div>
      )}

      {loadState === 'success' && items.length === 0 && (
        <div className="empty-state">
          <h3>아직 복습 기록이 없습니다</h3>
          <p>카드를 복습하면 결과와 시간이 이곳에 기록됩니다.</p>
          <div className="status-actions">
            <Link className="submit-button submit-button--fit" href="/review">복습 시작하기</Link>
          </div>
        </div>
      )}

      {loadState === 'success' && items.length > 0 && (
        <section className="stack-layout" aria-labelledby="review-history-title">
          <div className="surface-panel review-history-filter">
            <div>
              <h2 id="review-history-title">최근 복습</h2>
              <p>폴더와 학습 세트별로 복습 결과를 확인할 수 있습니다.</p>
            </div>
            <div className="review-history-filter__fields">
              <label>
                <span>폴더</span>
                <select value={selectedDeckId} onChange={(event) => handleDeckChange(event.target.value)}>
                  <option value="all">전체</option>
                  {deckOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                </select>
              </label>
              <label>
                <span>학습 세트</span>
                <select
                  value={selectedMaterialId}
                  onChange={(event) => setSelectedMaterialId(event.target.value)}
                >
                  <option value="all">전체</option>
                  {materialOptions.map(([id, title]) => <option key={id} value={id}>{title}</option>)}
                </select>
              </label>
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className="empty-state">
              <h3>조건에 맞는 복습 기록이 없습니다</h3>
              <p>다른 폴더나 학습 세트를 선택해 보세요.</p>
            </div>
          ) : (
            <div className="review-history-table-wrap">
              <table className="review-history-table">
                <thead>
                  <tr>
                    <th>카드 질문</th>
                    <th>폴더 / 학습 세트</th>
                    <th>결과</th>
                    <th>복습 시간</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id}>
                      <td>{item.cardFront}</td>
                      <td>
                        <strong>{item.deckName}</strong>
                        <span>{item.materialTitle}</span>
                      </td>
                      <td>
                        <span className={`review-result-badge review-result-badge--${item.result.toLowerCase()}`}>
                          {RESULT_LABELS[item.result]}
                        </span>
                      </td>
                      <td>{formatReviewedAt(item.reviewedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </AppShell>
  );
}
