'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BottomNav } from '@/components/BottomNav';
import { createCategory, getCategories } from '@/lib/categoryApi';
import { getDeck } from '@/lib/deckApi';
import type { Category } from '@/types/category';
import type { Deck } from '@/types/deck';

const SELECTED_USER_KEY = 'passmate.selectedUser';

type LoadState = 'loading' | 'success' | 'error';
type SubmitState = 'idle' | 'submitting';

export default function DeckDetailPage() {
  const params = useParams<{ deckId: string }>();
  const router = useRouter();
  const deckId = useMemo(() => Number(params.deckId), [params.deckId]);

  const [userId, setUserId] = useState<number | null>(null);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [categoryName, setCategoryName] = useState('');
  const [categoryNameError, setCategoryNameError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const savedUserId = window.localStorage.getItem(SELECTED_USER_KEY);

    if (!savedUserId) {
      setLoadState('error');
      setMessage('먼저 사용자를 선택해 주세요.');
      return;
    }

    setUserId(Number(savedUserId));
  }, []);

  const loadDeckDetail = useCallback(
    async (nextUserId: number) => {
      setLoadState('loading');
      setMessage('');

      try {
        const [deckData, categoryItems] = await Promise.all([
          getDeck(deckId, nextUserId),
          getCategories(deckId),
        ]);

        setDeck(deckData);
        setCategories(categoryItems);
        setLoadState('success');
      } catch {
        setLoadState('error');
        setMessage('덱 정보를 불러오지 못했습니다. 사용자 선택 상태와 서버를 확인해 주세요.');
      }
    },
    [deckId],
  );

  useEffect(() => {
    if (!userId || Number.isNaN(deckId)) {
      return;
    }

    void loadDeckDetail(userId);
  }, [deckId, loadDeckDetail, userId]);

  async function handleCreateCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = categoryName.trim();

    if (!trimmedName) {
      setCategoryNameError('카테고리 이름을 입력해 주세요.');
      return;
    }

    setCategoryNameError('');
    setMessage('');
    setSubmitState('submitting');

    try {
      const createdCategory = await createCategory(deckId, {
        name: trimmedName,
        sortOrder: categories.length,
      });

      setCategories((currentCategories) => [...currentCategories, createdCategory]);
      setCategoryName('');
      setLoadState('success');
      setMessage('카테고리를 만들었습니다.');
    } catch {
      setMessage('카테고리를 만들지 못했습니다. 입력값과 서버 상태를 확인해 주세요.');
    } finally {
      setSubmitState('idle');
    }
  }

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="top-bar__inner top-bar__inner--center">
          <Link className="icon-link" href="/" aria-label="덱 목록으로 돌아가기">
            ‹
          </Link>
          <h1 className="screen-title">{deck?.name ?? '덱 상세'}</h1>
          <span className="top-placeholder" aria-hidden="true" />
        </div>
      </header>

      <main className="page page--with-nav">
        {loadState === 'loading' && (
          <div className="status-box" role="status">
            <h3>덱을 불러오는 중</h3>
            <p>덱 정보와 카테고리 목록을 준비하고 있습니다.</p>
          </div>
        )}

        {loadState === 'error' && (
          <div className="status-box error-box" role="alert">
            <h3>덱을 볼 수 없습니다</h3>
            <p>{message}</p>
            <div className="status-actions">
              <button className="secondary-button" onClick={() => router.push('/')} type="button">
                덱 목록으로 돌아가기
              </button>
            </div>
          </div>
        )}

        {loadState === 'success' && deck && (
          <>
            <section className="detail-card" aria-labelledby="deck-detail-title">
              <h2 id="deck-detail-title">{deck.name}</h2>
              <p>{deck.description || '이 덱에 대한 설명이 아직 없습니다.'}</p>
              <div className="detail-meta">
                <span>카테고리 {categories.length}개</span>
                <span>덱 번호 {deck.id}</span>
              </div>
              <div className="detail-actions">
                <button className="secondary-button" type="button" disabled>
                  덱 수정
                </button>
                <button className="secondary-button danger-button" type="button" disabled>
                  덱 삭제
                </button>
              </div>
            </section>

            <form className="deck-form primary-form" onSubmit={handleCreateCategory}>
              <h2>카테고리 추가</h2>
              <div className="form-field">
                <label htmlFor="category-name">카테고리 이름</label>
                <input
                  id="category-name"
                  maxLength={80}
                  onChange={(event) => setCategoryName(event.target.value)}
                  placeholder="예: 데이터베이스"
                  value={categoryName}
                />
                {categoryNameError && <span className="field-error">{categoryNameError}</span>}
              </div>

              <button
                className="submit-button"
                disabled={submitState === 'submitting'}
                type="submit"
              >
                {submitState === 'submitting' ? '만드는 중' : '+ 카테고리 추가'}
              </button>

              {message && <p className="form-help">{message}</p>}
            </form>

            <section aria-labelledby="category-list-title">
              <div className="section-heading">
                <div>
                  <h2 id="category-list-title">카테고리</h2>
                  <p>자료를 넣기 전에 학습 범위를 나눕니다.</p>
                </div>
                <span className="deck-count">{categories.length}개</span>
              </div>

              {categories.length === 0 && (
                <div className="empty-state">
                  <h3>아직 카테고리가 없습니다</h3>
                  <p>첫 카테고리를 만들면 자료를 추가할 수 있습니다.</p>
                </div>
              )}

              {categories.length > 0 && (
                <div className="category-list">
                  {categories.map((category) => (
                    <Link
                      className="list-card list-card--link"
                      href={`/deck/${deckId}/category/${category.id}`}
                      key={category.id}
                    >
                      <span className="list-card__icon list-card__icon--folder" aria-hidden="true" />
                      <span className="list-card__body">
                        <strong>{category.name}</strong>
                        <small>자료를 추가하고 카드로 바꿔 보세요</small>
                      </span>
                      <span className="list-card__chevron" aria-hidden="true">
                        ›
                      </span>
                    </Link>
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
