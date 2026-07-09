'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { BottomNav } from '@/components/BottomNav';
import { createReview, getTodayReviewCards } from '@/lib/reviewApi';
import type { FlashCard } from '@/types/flashcard';
import type { ReviewResult } from '@/types/review';

const SELECTED_USER_KEY = 'passmate.selectedUser';

type LoadState = 'loading' | 'success' | 'error';
type SubmitState = 'idle' | 'submitting';

const resultOptions: Array<{ result: ReviewResult; label: string; description: string }> = [
  { result: 'AGAIN', label: '다시', description: '10분 뒤' },
  { result: 'HARD', label: '어려움', description: '내일' },
  { result: 'GOOD', label: '좋음', description: '3일 뒤' },
  { result: 'EASY', label: '쉬움', description: '7일 뒤' },
];

export default function ReviewPage() {
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
    const savedUserId = window.localStorage.getItem(SELECTED_USER_KEY);

    if (!savedUserId) {
      setLoadState('error');
      setMessage('먼저 사용자를 선택해 주세요.');
      return;
    }

    setUserId(Number(savedUserId));
  }, []);

  useEffect(() => {
    if (!userId) {
      return;
    }

    async function loadReviews(nextUserId: number) {
      setLoadState('loading');
      setMessage('');

      try {
        const items = await getTodayReviewCards(nextUserId);
        setCards(items);
        setCurrentIndex(0);
        setIsAnswerVisible(false);
        setIsComplete(false);
        setLoadState('success');
      } catch {
        setLoadState('error');
        setMessage('오늘의 복습 카드를 불러오지 못했습니다. 백엔드 서버 상태를 확인해 주세요.');
      }
    }

    void loadReviews(userId);
  }, [userId]);

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
    } catch {
      setMessage('복습 결과를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitState('idle');
    }
  }

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="top-bar__inner">
          <div className="brand">
            <p className="brand__caption">오늘 할 일</p>
            <h1 className="brand__name">복습</h1>
          </div>
          <span className="deck-count">{progressText}</span>
        </div>
      </header>

      <main className="page page--review page--with-nav">
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
                폴더 목록으로 이동
              </Link>
            </div>
          </div>
        )}

        {loadState === 'success' && cards.length === 0 && (
          <div className="empty-state">
            <h3>오늘 복습할 카드가 없습니다</h3>
            <p>학습 세트 화면에서 카드를 만들면 바로 복습 대상에 포함됩니다.</p>
            <div className="status-actions">
              <Link className="secondary-button" href="/">
                카드 만들러 가기
              </Link>
            </div>
          </div>
        )}

        {loadState === 'success' && isComplete && (
          <div className="empty-state review-complete">
            <h3>오늘 복습을 마쳤습니다</h3>
            <p>결과가 저장되었고, 카드마다 다음 복습 시간이 잡혔습니다.</p>
            <div className="status-actions">
              <Link className="secondary-button" href="/">
                폴더 목록으로 이동
              </Link>
            </div>
          </div>
        )}

        {loadState === 'success' && currentCard && !isComplete && (
          <section className="review-panel" aria-labelledby="review-card-title">
            <div className="review-progress">
              <span>{progressText}</span>
              <strong>오늘 복습 {cards.length}장</strong>
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
      </main>

      <BottomNav active="review" />
    </div>
  );
}
