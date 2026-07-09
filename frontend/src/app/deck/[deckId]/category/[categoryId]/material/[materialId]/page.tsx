'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BottomNav } from '@/components/BottomNav';
import {
  createFlashCard,
  deleteFlashCard,
  getFlashCards,
  updateFlashCard,
} from '@/lib/flashcardApi';
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
  const [editingCardId, setEditingCardId] = useState<number | null>(null);
  const [editFront, setEditFront] = useState('');
  const [editBack, setEditBack] = useState('');
  const [editFrontError, setEditFrontError] = useState('');
  const [editBackError, setEditBackError] = useState('');
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
      setMessage('학습 세트 정보를 불러오지 못했습니다. 백엔드 서버 상태를 확인해 주세요.');
    }
  }, [categoryId, materialId]);

  useEffect(() => {
    if (Number.isNaN(deckId) || Number.isNaN(categoryId) || Number.isNaN(materialId)) {
      setLoadState('error');
      setMessage('잘못된 학습 세트 주소입니다.');
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

  function startEditCard(card: FlashCard) {
    setEditingCardId(card.id);
    setEditFront(card.front);
    setEditBack(card.back);
    setEditFrontError('');
    setEditBackError('');
    setMessage('');
  }

  function cancelEditCard() {
    setEditingCardId(null);
    setEditFront('');
    setEditBack('');
    setEditFrontError('');
    setEditBackError('');
  }

  async function handleUpdateCard(cardId: number) {
    const trimmedFront = editFront.trim();
    const trimmedBack = editBack.trim();

    setEditFrontError(trimmedFront ? '' : '앞면 내용을 입력해 주세요.');
    setEditBackError(trimmedBack ? '' : '뒷면 내용을 입력해 주세요.');

    if (!trimmedFront || !trimmedBack) {
      return;
    }

    setMessage('');
    setSubmitState('submitting');

    try {
      const updatedCard = await updateFlashCard(materialId, cardId, {
        front: trimmedFront,
        back: trimmedBack,
      });

      setCards((currentCards) =>
        currentCards.map((card) => (card.id === updatedCard.id ? updatedCard : card)),
      );
      cancelEditCard();
      setMessage('카드를 수정했습니다.');
    } catch {
      setMessage('카드를 수정하지 못했습니다. 입력값과 서버 상태를 확인해 주세요.');
    } finally {
      setSubmitState('idle');
    }
  }

  async function handleDeleteCard(cardId: number) {
    const shouldDelete = window.confirm('이 카드를 삭제할까요? 복습 기록은 보존됩니다.');

    if (!shouldDelete) {
      return;
    }

    setMessage('');
    setSubmitState('submitting');

    try {
      await deleteFlashCard(materialId, cardId);
      setCards((currentCards) => currentCards.filter((card) => card.id !== cardId));
      if (editingCardId === cardId) {
        cancelEditCard();
      }
      setMessage('카드를 삭제했습니다.');
    } catch {
      setMessage('카드를 삭제하지 못했습니다. 서버 상태를 확인해 주세요.');
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
            href={`/deck/${deckId}`}
            aria-label="폴더 상세로 돌아가기"
          >
            ‹
          </Link>
          <h1 className="screen-title">{material?.title ?? '학습 세트 상세'}</h1>
          <span className="top-placeholder" aria-hidden="true" />
        </div>
      </header>

      <main className="page page--with-nav">
        {loadState === 'loading' && (
          <div className="status-box" role="status">
            <h3>학습 세트를 불러오는 중</h3>
            <p>학습 세트 내용과 카드 목록을 준비하고 있습니다.</p>
          </div>
        )}

        {loadState === 'error' && (
          <div className="status-box error-box" role="alert">
            <h3>학습 세트를 볼 수 없습니다</h3>
            <p>{message}</p>
            <div className="status-actions">
              <button
                className="secondary-button"
                onClick={() => router.push(`/deck/${deckId}`)}
                type="button"
              >
                폴더 상세로 돌아가기
              </button>
            </div>
          </div>
        )}

        {loadState === 'success' && material && (
          <>
            <section className="detail-card" aria-labelledby="material-detail-title">
              <h2 id="material-detail-title">{material.title}</h2>
              <p className="material-content">
                {material.content || '이 학습 세트에 입력된 설명이 아직 없습니다.'}
              </p>
              <div className="detail-meta">
                <span>카드 {cards.length}개</span>
                <span>학습 세트 번호 {material.id}</span>
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
                  <h2 id="card-list-title">카드</h2>
                  <p>학습 세트에서 만든 복습 카드를 확인합니다.</p>
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
                      {editingCardId === card.id ? (
                        <div className="flashcard-edit-form">
                          <div className="form-field">
                            <label htmlFor={`edit-front-${card.id}`}>앞면</label>
                            <textarea
                              id={`edit-front-${card.id}`}
                              maxLength={200}
                              onChange={(event) => setEditFront(event.target.value)}
                              value={editFront}
                            />
                            {editFrontError && (
                              <span className="field-error">{editFrontError}</span>
                            )}
                          </div>

                          <div className="form-field">
                            <label htmlFor={`edit-back-${card.id}`}>뒷면</label>
                            <textarea
                              id={`edit-back-${card.id}`}
                              maxLength={500}
                              onChange={(event) => setEditBack(event.target.value)}
                              value={editBack}
                            />
                            {editBackError && <span className="field-error">{editBackError}</span>}
                          </div>

                          <div className="flashcard-actions">
                            <button
                              className="secondary-button"
                              disabled={submitState === 'submitting'}
                              onClick={cancelEditCard}
                              type="button"
                            >
                              취소
                            </button>
                            <button
                              className="submit-button"
                              disabled={submitState === 'submitting'}
                              onClick={() => void handleUpdateCard(card.id)}
                              type="button"
                            >
                              저장
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div>
                            <strong>{card.front}</strong>
                            <p>{card.back}</p>
                          </div>
                          <div className="flashcard-side">
                            <small>카드 {index + 1}</small>
                            <button
                              className="secondary-button"
                              onClick={() => startEditCard(card)}
                              type="button"
                            >
                              수정
                            </button>
                            <button
                              className="secondary-button danger-button"
                              disabled={submitState === 'submitting'}
                              onClick={() => void handleDeleteCard(card.id)}
                              type="button"
                            >
                              삭제
                            </button>
                          </div>
                        </>
                      )}
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
