'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BottomNav } from '@/components/BottomNav';
import { getCategory } from '@/lib/categoryApi';
import { createMaterial, getMaterials } from '@/lib/materialApi';
import type { Category } from '@/types/category';
import type { Material } from '@/types/material';

type LoadState = 'loading' | 'success' | 'error';
type SubmitState = 'idle' | 'submitting';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
}

function previewContent(value: string | null) {
  if (!value) {
    return '내용이 아직 없습니다.';
  }

  return value.length > 44 ? `${value.slice(0, 44)}...` : value;
}

export default function CategoryDetailPage() {
  const params = useParams<{ deckId: string; categoryId: string }>();
  const router = useRouter();
  const deckId = useMemo(() => Number(params.deckId), [params.deckId]);
  const categoryId = useMemo(() => Number(params.categoryId), [params.categoryId]);

  const [category, setCategory] = useState<Category | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [titleError, setTitleError] = useState('');
  const [message, setMessage] = useState('');

  const loadCategoryDetail = useCallback(async () => {
    setLoadState('loading');
    setMessage('');

    try {
      const [categoryData, materialItems] = await Promise.all([
        getCategory(deckId, categoryId),
        getMaterials(categoryId),
      ]);

      setCategory(categoryData);
      setMaterials(materialItems);
      setLoadState('success');
    } catch {
      setLoadState('error');
      setMessage('카테고리 정보를 불러오지 못했습니다. 백엔드 서버 상태를 확인해 주세요.');
    }
  }, [categoryId, deckId]);

  useEffect(() => {
    if (Number.isNaN(deckId) || Number.isNaN(categoryId)) {
      setLoadState('error');
      setMessage('잘못된 카테고리 주소입니다.');
      return;
    }

    void loadCategoryDetail();
  }, [categoryId, deckId, loadCategoryDetail]);

  async function handleCreateMaterial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle) {
      setTitleError('자료 제목을 입력해 주세요.');
      return;
    }

    setTitleError('');
    setMessage('');
    setSubmitState('submitting');

    try {
      const createdMaterial = await createMaterial(categoryId, {
        title: trimmedTitle,
        content: trimmedContent || undefined,
      });

      setMaterials((currentMaterials) => [createdMaterial, ...currentMaterials]);
      setTitle('');
      setContent('');
      setLoadState('success');
      setMessage('자료를 만들었습니다.');
    } catch {
      setMessage('자료를 만들지 못했습니다. 입력값과 서버 상태를 확인해 주세요.');
    } finally {
      setSubmitState('idle');
    }
  }

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="top-bar__inner top-bar__inner--center">
          <Link className="icon-link" href={`/deck/${deckId}`} aria-label="덱 상세로 돌아가기">
            ‹
          </Link>
          <h1 className="screen-title">{category?.name ?? '카테고리 상세'}</h1>
          <span className="top-placeholder" aria-hidden="true" />
        </div>
      </header>

      <main className="page page--with-nav">
        {loadState === 'loading' && (
          <div className="status-box" role="status">
            <h3>자료를 불러오는 중</h3>
            <p>카테고리 정보와 자료 목록을 준비하고 있습니다.</p>
          </div>
        )}

        {loadState === 'error' && (
          <div className="status-box error-box" role="alert">
            <h3>카테고리를 볼 수 없습니다</h3>
            <p>{message}</p>
            <div className="status-actions">
              <button
                className="secondary-button"
                onClick={() => router.push(`/deck/${deckId}`)}
                type="button"
              >
                덱 상세로 돌아가기
              </button>
            </div>
          </div>
        )}

        {loadState === 'success' && category && (
          <>
            <section className="detail-card" aria-labelledby="category-detail-title">
              <p className="breadcrumb">덱 {deckId} &gt; 카테고리</p>
              <h2 id="category-detail-title">{category.name}</h2>
              <div className="detail-meta">
                <span>자료 {materials.length}개</span>
                <span>카테고리 번호 {category.id}</span>
              </div>
            </section>

            <form className="deck-form primary-form" onSubmit={handleCreateMaterial}>
              <h2>자료 추가</h2>
              <div className="form-field">
                <label htmlFor="material-title">자료 제목</label>
                <input
                  id="material-title"
                  maxLength={120}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="예: 정규화 핵심 요약"
                  value={title}
                />
                {titleError && <span className="field-error">{titleError}</span>}
              </div>

              <div className="form-field">
                <label htmlFor="material-content">내용</label>
                <textarea
                  id="material-content"
                  maxLength={1200}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="학습할 원문 내용을 적어 주세요."
                  value={content}
                />
              </div>

              <button
                className="submit-button"
                disabled={submitState === 'submitting'}
                type="submit"
              >
                {submitState === 'submitting' ? '만드는 중' : '+ 자료 추가'}
              </button>

              {message && <p className="form-help">{message}</p>}
            </form>

            <section aria-labelledby="material-list-title">
              <div className="section-heading">
                <div>
                  <h2 id="material-list-title">자료</h2>
                  <p>카드로 바꿀 원문 자료를 모아 둡니다.</p>
                </div>
                <span className="deck-count">{materials.length}개</span>
              </div>

              {materials.length === 0 && (
                <div className="empty-state">
                  <h3>아직 자료가 없습니다</h3>
                  <p>첫 자료를 만들면 여기에 표시됩니다.</p>
                </div>
              )}

              {materials.length > 0 && (
                <div className="material-list">
                  {materials.map((material) => (
                    <Link
                      className="list-card list-card--link"
                      href={`/deck/${deckId}/category/${categoryId}/material/${material.id}`}
                      key={material.id}
                    >
                      <span className="list-card__icon" aria-hidden="true" />
                      <span className="list-card__body">
                        <strong>{material.title}</strong>
                        <span>{previewContent(material.content)}</span>
                        <small>수정일 {formatDate(material.updatedAt)}</small>
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
