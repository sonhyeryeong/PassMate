'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BottomNav } from '@/components/BottomNav';
import { createFlashCard, getFlashCards } from '@/lib/flashcardApi';
import { getMaterial } from '@/lib/materialApi';
import type { FlashCard } from '@/types/flashcard';
import type { Material } from '@/types/material';

type LoadState = 'loading' | 'success' | 'error';
type SubmitState = 'idle' | 'submitting';

export default function MaterialDetailPage() {
  const params = useParams<{ deckId: string; categoryId: string; materialId: string }>();
  const router = useRouter();
  const deckId = useMemo(() => Number(params.deckId), [params.deckId]);
  const categoryId = useMemo(() => Number(params.categoryId), [params.categoryId]);
  const materialId = useMemo(() => Number(params.materialId), [params.materialId]);

  const [material, setMaterial] = useState<Material | null>(null);
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [frontError, setFrontError] = useState('');
  const [backError, setBackError] = useState('');
  const [message, setMessage] = useState('');

  const loadMaterialDetail = useCallback(async () => {
    setLoadState('loading');
    setMessage('');

    try {
      const [materialData, cardItems] = await Promise.all([
        getMaterial(categoryId, materialId),
        getFlashCards(materialId),
      ]);

      setMaterial(materialData);
      setCards(cardItems);
      setLoadState('success');
    } catch {
      setLoadState('error');
      setMessage('자료 정보를 불러오지 못했습니다. 백엔드 서버 상태를 확인해 주세요.');
    }
  }, [categoryId, materialId]);

  useEffect(() => {
    if (Number.isNaN(deckId) || Number.isNaN(categoryId) || Number.isNaN(materialId)) {
      setLoadState('error');
      setMessage('잘못된 자료 주소입니다.');
      return;
    }

    void loadMaterialDetail();
  }, [categoryId, deckId, loadMaterialDetail, materialId]);

  async function handleCreateCard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedFront = front.trim();
    const trimmedBack = back.trim();

    setFrontError(trimmedFront ? '' : '앞면 내용을 입력해 주세요.');
    setBackError(trimmedBack ? '' : '뒷면 내용을 입력해 주세요.');

    if (!trimmedFront || !trimmedBack) {
      return;
    }

    setMessage('');
    setSubmitState('submitting');

    try {
      const createdCard = await createFlashCard(materialId, {
        front: trimmedFront,
        back: trimmedBack,
      });

      setCards((currentCards) => [createdCard, ...currentCards]);
      setFront('');
      setBack('');
      setLoadState('success');
      setMessage('카드를 만들었습니다.');
    } catch {
      setMessage('카드를 만들지 못했습니다. 입력값과 서버 상태를 확인해 주세요.');
    } finally {
      setSubmitState('idle');
    }
  }

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="top-bar__inner top-bar__inner--center">
          <Link
            className="icon-link"
            href={`/deck/${deckId}/category/${categoryId}`}
            aria-label="카테고리 상세로 돌아가기"
          >
            ‹
          </Link>
          <h1 className="screen-title">{material?.title ?? '자료 상세'}</h1>
          <span className="top-placeholder" aria-hidden="true" />
        </div>
      </header>

      <main className="page page--with-nav">
        {loadState === 'loading' && (
          <div className="status-box" role="status">
            <h3>자료를 불러오는 중</h3>
            <p>자료 내용과 카드 목록을 준비하고 있습니다.</p>
          </div>
        )}

        {loadState === 'error' && (
          <div className="status-box error-box" role="alert">
            <h3>자료를 볼 수 없습니다</h3>
            <p>{message}</p>
            <div className="status-actions">
              <button
                className="secondary-button"
                onClick={() => router.push(`/deck/${deckId}/category/${categoryId}`)}
                type="button"
              >
                카테고리 상세로 돌아가기
              </button>
            </div>
          </div>
        )}

        {loadState === 'success' && material && (
          <>
            <section className="detail-card" aria-labelledby="material-detail-title">
              <h2 id="material-detail-title">{material.title}</h2>
              <p className="material-content">
                {material.content || '이 자료에 입력된 내용이 아직 없습니다.'}
              </p>
              <div className="detail-meta">
                <span>카드 {cards.length}개</span>
                <span>자료 번호 {material.id}</span>
              </div>
            </section>

            <form className="deck-form primary-form" onSubmit={handleCreateCard}>
              <h2>카드 추가</h2>
              <div className="form-field">
                <label htmlFor="card-front">앞면</label>
                <textarea
                  id="card-front"
                  maxLength={200}
                  onChange={(event) => setFront(event.target.value)}
                  placeholder="예: 제2정규형은 무엇인가요?"
                  value={front}
                />
                {frontError && <span className="field-error">{frontError}</span>}
              </div>

              <div className="form-field">
                <label htmlFor="card-back">뒷면</label>
                <textarea
                  id="card-back"
                  maxLength={500}
                  onChange={(event) => setBack(event.target.value)}
                  placeholder="정답이나 설명을 입력해 주세요."
                  value={back}
                />
                {backError && <span className="field-error">{backError}</span>}
              </div>

              <button
                className="submit-button"
                disabled={submitState === 'submitting'}
                type="submit"
              >
                {submitState === 'submitting' ? '저장하는 중' : '+ 카드 추가'}
              </button>

              {message && <p className="form-help">{message}</p>}
            </form>

            <section aria-labelledby="card-list-title">
              <div className="section-heading">
                <div>
                  <h2 id="card-list-title">FlashCard</h2>
                  <p>자료에서 만든 복습 카드를 확인합니다.</p>
                </div>
                <span className="deck-count">{cards.length}개</span>
              </div>

              {cards.length === 0 && (
                <div className="empty-state">
                  <h3>아직 카드가 없습니다</h3>
                  <p>첫 카드를 만들면 오늘의 복습에서 사용할 수 있습니다.</p>
                </div>
              )}

              {cards.length > 0 && (
                <div className="flashcard-list">
                  {cards.map((card, index) => (
                    <article className="flashcard-card" key={card.id}>
                      <div>
                        <strong>{card.front}</strong>
                        <p>{card.back}</p>
                      </div>
                      <small>카드 {index + 1}</small>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <BottomNav active="deck" />
    </div>
  );
}
