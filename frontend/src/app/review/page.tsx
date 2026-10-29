'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { getErrorMessage } from '@/lib/apiClient';
import { createReview, getTodayReviewCards } from '@/lib/reviewApi';
import type { FlashCard } from '@/types/flashcard';
import type { ReviewResult } from '@/types/review';

import { useCurrentUser } from '@/components/AuthGate';

type LoadState = 'loading' | 'success' | 'error';
type SubmitState = 'idle' | 'submitting';

const resultOptions: Array<{ result: ReviewResult; label: string; description: string }> = [
  { result: 'AGAIN', label: '다시', description: '곧 다시 볼 카드' },
  { result: 'HARD', label: '어려움', description: '헷갈린 카드' },
  { result: 'GOOD', label: '좋음', description: '잘 기억한 카드' },
  { result: 'EASY', label: '쉬움', description: '아주 쉬운 카드' },
];

function ReviewContent({ materialParam, hasDuplicateScope }: {
  materialParam: string | null;
  hasDuplicateScope: boolean;
}) {
  const currentUser = useCurrentUser();
  const materialId = materialParam === null ? undefined : Number(materialParam);
  const invalidScope = hasDuplicateScope
    || (materialId !== undefined && (!Number.isSafeInteger(materialId) || materialId <= 0));
  const [userId, setUserId] = useState<number | null>(null);
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [message, setMessage] = useState('');

  const currentCard = cards[currentIndex] ?? null;
  const progressText = useMemo(() => {
    if (cards.length === 0) {
      return '0 / 0';
    }

    return `${Math.min(currentIndex + 1, cards.length)} / ${cards.length}`;
  }, [cards.length, currentIndex]);

  useEffect(() => {
    const savedUserId = String(currentUser.id);

    if (!savedUserId || !Number.isSafeInteger(Number(savedUserId)) || Number(savedUserId) <= 0) {
      setLoadState('error');
      setMessage('로그인이 필요합니다.');
      return;
    }

    setUserId(Number(savedUserId));
  }, [currentUser.id]);

  useEffect(() => {
    if (invalidScope) {
      setLoadState('error');
      setMessage('올바르지 않은 학습 세트 주소입니다.');
      return;
    }
    if (!userId) {
      return;
    }

    async function loadReviewCards(nextUserId: number) {
      setLoadState('loading');
      setMessage('');

      try {
        const items = await getTodayReviewCards(nextUserId, materialId);
        if (!active) return;
        setCards(items);
        setCurrentIndex(0);
        setIsAnswerVisible(false);
        setIsComplete(false);
        setLoadState('success');
      } catch (error) {
        if (!active) return;
        setLoadState('error');
        setMessage(getErrorMessage(error, '오늘 복습할 카드를 불러오지 못했습니다.'));
      }
    }

    let active = true;
    void loadReviewCards(userId);
    return () => { active = false; };
  }, [userId, materialId, invalidScope]);

  async function handleSubmitResult(result: ReviewResult) {
    if (!userId || !currentCard) {
      return;
    }

    setSubmitState('submitting');
    setMessage('');

    try {
      await createReview(userId, currentCard.id, { result });

      if (currentIndex + 1 >= cards.length) {
        setIsComplete(true);
        setIsAnswerVisible(false);
        return;
      }

      setCurrentIndex((nextIndex) => nextIndex + 1);
      setIsAnswerVisible(false);
    } catch (error) {
      setMessage(getErrorMessage(error, '복습 결과를 저장하지 못했습니다.'));
    } finally {
      setSubmitState('idle');
    }
  }

  return (
    <AppShell
      active="review"
      eyebrow={materialId === undefined ? '오늘의 복습' : '학습 세트 복습'}
      title="카드 복습"
      actions={(
        <>
          <Link className="secondary-button" href="/review/history">복습 기록</Link>
          <span className="deck-count">{progressText}</span>
        </>
      )}
    >
      {loadState === 'loading' && (
        <div className="status-box" role="status">
          <h3>복습 카드를 불러오는 중</h3>
          <p>오늘 다시 볼 카드를 준비하고 있습니다.</p>
        </div>
      )}

      {loadState === 'error' && (
        <div className="status-box error-box" role="alert">
          <h3>복습을 시작할 수 없습니다</h3>
          <p>{message}</p>
          <div className="status-actions">
            <Link className="secondary-button" href="/">
              로그인으로 이동
            </Link>
          </div>
        </div>
      )}

      {loadState === 'success' && cards.length === 0 && (
        <div className="empty-state">
          <h3>{materialId === undefined ? '오늘 복습할 카드가 없습니다' : '이 학습 세트에 지금 복습할 카드가 없습니다'}</h3>
          <p>복습 기한이 되면 목록을 새로 열어 확인해 주세요. 새 카드도 복습할 수 있습니다.</p>
          <div className="status-actions">
            <Link className="submit-button submit-button--fit" href="/folder">
              카드 만들러 가기
            </Link>
          </div>
        </div>
      )}

      {loadState === 'success' && isComplete && (
        <div className="empty-state review-complete">
          <h3>이번 복습을 마쳤습니다</h3>
          <p>이번 목록의 복습 결과를 저장했습니다. 다시를 선택한 카드는 10분 뒤 복습 목록을 새로 열면 확인할 수 있습니다.</p>
          <div className="status-actions">
            <Link className="secondary-button" href="/folder">
              폴더로 이동
            </Link>
          </div>
        </div>
      )}

      {loadState === 'success' && currentCard && !isComplete && (
        <section className="review-panel" aria-labelledby="review-card-title">
          <div className="review-progress">
            <span>{progressText}</span>
            <strong>이번 복습 {cards.length}장</strong>
          </div>

          <article className="review-card">
            <p className="review-card__label">앞면</p>
            <h2 id="review-card-title">{currentCard.front}</h2>

            {!isAnswerVisible && (
              <button
                className="submit-button"
                onClick={() => setIsAnswerVisible(true)}
                type="button"
              >
                뒷면 보기
              </button>
            )}

            {isAnswerVisible && (
              <div className="review-answer">
                <p className="review-card__label">뒷면</p>
                <p>{currentCard.back}</p>
              </div>
            )}
          </article>

          {isAnswerVisible && (
            <div className="review-actions" aria-label="복습 결과 선택">
              {resultOptions.map((option) => (
                <button
                  className="review-result-button"
                  disabled={submitState === 'submitting'}
                  key={option.result}
                  onClick={() => void handleSubmitResult(option.result)}
                  type="button"
                >
                  <strong>{option.label}</strong>
                  <span>{option.description}</span>
                </button>
              ))}
            </div>
          )}

          {message && (
            <div className="inline-alert" role="alert">
              {message}
            </div>
          )}
        </section>
      )}
    </AppShell>
  );
}

function ReviewScope() {
  const searchParams = useSearchParams();
  // 범위가 바뀌면 상태를 분리해 이전 제출 응답이 새 복습에 반영되지 않게 한다.
  return (
    <ReviewContent
      key={searchParams.toString()}
      materialParam={searchParams.get('materialId')}
      hasDuplicateScope={searchParams.getAll('materialId').length > 1}
    />
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<p role="status">복습 카드를 준비하고 있습니다.</p>}>
      <ReviewScope />
    </Suspense>
  );
}
