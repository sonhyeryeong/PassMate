'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BottomNav } from '@/components/BottomNav';
import { createCategory, getCategories } from '@/lib/categoryApi';
import { getDeck } from '@/lib/deckApi';
import { createMaterial, deleteMaterial, getMaterials, updateMaterial } from '@/lib/materialApi';
import type { Category } from '@/types/category';
import type { Deck } from '@/types/deck';
import type { Material } from '@/types/material';

const SELECTED_USER_KEY = 'passmate.selectedUser';
const DEFAULT_CATEGORY_NAME = '기본 섹션';

type LoadState = 'loading' | 'success' | 'error';
type SubmitState = 'idle' | 'submitting';

type StudySetItem = Material & {
  categoryId: number;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
}

function previewContent(value: string | null) {
  if (!value) {
    return '설명이 아직 없습니다.';
  }

  return value.length > 44 ? `${value.slice(0, 44)}...` : value;
}

export default function DeckDetailPage() {
  const params = useParams<{ deckId: string }>();
  const router = useRouter();
  const deckId = useMemo(() => Number(params.deckId), [params.deckId]);

  const [userId, setUserId] = useState<number | null>(null);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [defaultCategory, setDefaultCategory] = useState<Category | null>(null);
  const [materials, setMaterials] = useState<StudySetItem[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [titleError, setTitleError] = useState('');
  const [editingMaterialId, setEditingMaterialId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTitleError, setEditTitleError] = useState('');
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

  const ensureDefaultCategory = useCallback(async (categories: Category[]) => {
    const defaultCategory = categories.find((category) => category.name === DEFAULT_CATEGORY_NAME);

    if (defaultCategory) {
      return defaultCategory;
    }

    return createCategory(deckId, {
      name: DEFAULT_CATEGORY_NAME,
      sortOrder: 0,
    });
  }, [deckId]);

  const loadFolderDetail = useCallback(
    async (nextUserId: number) => {
      setLoadState('loading');
      setMessage('');

      try {
        const [deckData, categoryData] = await Promise.all([
          getDeck(deckId, nextUserId),
          getCategories(deckId),
        ]);
        const defaultCategoryData = await ensureDefaultCategory(categoryData);
        const materialGroups = await Promise.all(
          categoryData.map(async (category) => {
            const categoryMaterials = await getMaterials(category.id);
            return categoryMaterials.map((material) => ({
              ...material,
              categoryId: category.id,
            }));
          }),
        );
        const materialItems = materialGroups
          .flat()
          .sort((first, second) => second.updatedAt.localeCompare(first.updatedAt));

        setDeck(deckData);
        setDefaultCategory(defaultCategoryData);
        setMaterials(materialItems);
        setLoadState('success');
      } catch {
        setLoadState('error');
        setMessage('폴더 정보를 불러오지 못했습니다. 사용자 선택 상태와 서버를 확인해 주세요.');
      }
    },
    [deckId, ensureDefaultCategory],
  );

  useEffect(() => {
    if (!userId || Number.isNaN(deckId)) {
      return;
    }

    void loadFolderDetail(userId);
  }, [deckId, loadFolderDetail, userId]);

  async function handleCreateStudySet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!defaultCategory) {
      setMessage('기본 섹션을 준비하지 못했습니다. 새로고침 후 다시 시도해 주세요.');
      return;
    }

    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle) {
      setTitleError('학습 세트 제목을 입력해 주세요.');
      return;
    }

    setTitleError('');
    setMessage('');
    setSubmitState('submitting');

    try {
      const createdMaterial = await createMaterial(defaultCategory.id, {
        title: trimmedTitle,
        content: trimmedContent || undefined,
      });

      setMaterials((currentMaterials) => [
        {
          ...createdMaterial,
          categoryId: defaultCategory.id,
        },
        ...currentMaterials,
      ]);
      setTitle('');
      setContent('');
      setLoadState('success');
      setMessage('학습 세트를 만들었습니다.');
    } catch {
      setMessage('학습 세트를 만들지 못했습니다. 입력값과 서버 상태를 확인해 주세요.');
    } finally {
      setSubmitState('idle');
    }
  }

  function startEditStudySet(material: StudySetItem) {
    setEditingMaterialId(material.id);
    setEditTitle(material.title);
    setEditContent(material.content ?? '');
    setEditTitleError('');
    setMessage('');
  }

  function cancelEditStudySet() {
    setEditingMaterialId(null);
    setEditTitle('');
    setEditContent('');
    setEditTitleError('');
  }

  async function handleUpdateStudySet(material: StudySetItem) {
    const trimmedTitle = editTitle.trim();
    const trimmedContent = editContent.trim();

    if (!trimmedTitle) {
      setEditTitleError('학습 세트 제목을 입력해 주세요.');
      return;
    }

    setEditTitleError('');
    setMessage('');
    setSubmitState('submitting');

    try {
      const updatedMaterial = await updateMaterial(material.categoryId, material.id, {
        title: trimmedTitle,
        content: trimmedContent || undefined,
      });

      setMaterials((currentMaterials) =>
        currentMaterials.map((currentMaterial) =>
          currentMaterial.id === material.id
            ? {
                ...updatedMaterial,
                categoryId: material.categoryId,
              }
            : currentMaterial,
        ),
      );
      cancelEditStudySet();
      setMessage('학습 세트를 수정했습니다.');
    } catch {
      setMessage('학습 세트를 수정하지 못했습니다. 입력값과 서버 상태를 확인해 주세요.');
    } finally {
      setSubmitState('idle');
    }
  }

  async function handleDeleteStudySet(material: StudySetItem) {
    const shouldDelete = window.confirm('이 학습 세트를 삭제할까요? 포함된 카드도 함께 삭제됩니다.');

    if (!shouldDelete) {
      return;
    }

    setMessage('');
    setSubmitState('submitting');

    try {
      await deleteMaterial(material.categoryId, material.id);
      setMaterials((currentMaterials) =>
        currentMaterials.filter((currentMaterial) => currentMaterial.id !== material.id),
      );
      if (editingMaterialId === material.id) {
        cancelEditStudySet();
      }
      setMessage('학습 세트를 삭제했습니다.');
    } catch {
      setMessage('학습 세트를 삭제하지 못했습니다. 서버 상태를 확인해 주세요.');
    } finally {
      setSubmitState('idle');
    }
  }

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="top-bar__inner top-bar__inner--center">
          <Link className="icon-link" href="/" aria-label="폴더 목록으로 돌아가기">
            ‹
          </Link>
          <h1 className="screen-title">{deck?.name ?? '폴더 상세'}</h1>
          <span className="top-placeholder" aria-hidden="true" />
        </div>
      </header>

      <main className="page page--with-nav">
        {loadState === 'loading' && (
          <div className="status-box" role="status">
            <h3>폴더를 불러오는 중</h3>
            <p>폴더 정보와 학습 세트 목록을 준비하고 있습니다.</p>
          </div>
        )}

        {loadState === 'error' && (
          <div className="status-box error-box" role="alert">
            <h3>폴더를 볼 수 없습니다</h3>
            <p>{message}</p>
            <div className="status-actions">
              <button className="secondary-button" onClick={() => router.push('/')} type="button">
                폴더 목록으로 돌아가기
              </button>
            </div>
          </div>
        )}

        {loadState === 'success' && deck && (
          <>
            <section className="detail-card" aria-labelledby="folder-detail-title">
              <h2 id="folder-detail-title">{deck.name}</h2>
              <p>{deck.description || '이 폴더에 대한 설명이 아직 없습니다.'}</p>
              <div className="detail-meta">
                <span>학습 세트 {materials.length}개</span>
                <span>폴더 번호 {deck.id}</span>
              </div>
              <div className="detail-actions">
                <button className="secondary-button" type="button" disabled>
                  폴더 수정
                </button>
                <button className="secondary-button danger-button" type="button" disabled>
                  폴더 삭제
                </button>
              </div>
            </section>

            <form className="deck-form primary-form" onSubmit={handleCreateStudySet}>
              <h2>학습 세트 만들기</h2>
              <div className="form-field">
                <label htmlFor="study-set-title">제목</label>
                <input
                  id="study-set-title"
                  maxLength={120}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="예: 정규화 핵심 요약"
                  value={title}
                />
                {titleError && <span className="field-error">{titleError}</span>}
              </div>

              <div className="form-field">
                <label htmlFor="study-set-content">설명</label>
                <textarea
                  id="study-set-content"
                  maxLength={1200}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="이 학습 세트에서 다룰 내용을 적어 주세요."
                  value={content}
                />
              </div>

              <button
                className="submit-button"
                disabled={submitState === 'submitting'}
                type="submit"
              >
                {submitState === 'submitting' ? '만드는 중' : '+ 학습 세트 만들기'}
              </button>

              {message && <p className="form-help">{message}</p>}
            </form>

            <section aria-labelledby="study-set-list-title">
              <div className="section-heading">
                <div>
                  <h2 id="study-set-list-title">학습 세트</h2>
                  <p>카드를 만들고 복습할 학습 묶음입니다.</p>
                </div>
                <span className="deck-count">{materials.length}개</span>
              </div>

              {materials.length === 0 && (
                <div className="empty-state">
                  <h3>아직 학습 세트가 없습니다</h3>
                  <p>첫 학습 세트를 만들면 카드를 추가할 수 있습니다.</p>
                </div>
              )}

              {materials.length > 0 && defaultCategory && (
                <div className="material-list">
                  {materials.map((material) => (
                    <article
                      className="list-card study-set-card"
                      key={material.id}
                    >
                      {editingMaterialId === material.id ? (
                        <div className="study-set-edit-form">
                          <div className="form-field">
                            <label htmlFor={`study-set-edit-title-${material.id}`}>제목</label>
                            <input
                              id={`study-set-edit-title-${material.id}`}
                              maxLength={120}
                              onChange={(event) => setEditTitle(event.target.value)}
                              value={editTitle}
                            />
                            {editTitleError && (
                              <span className="field-error">{editTitleError}</span>
                            )}
                          </div>

                          <div className="form-field">
                            <label htmlFor={`study-set-edit-content-${material.id}`}>설명</label>
                            <textarea
                              id={`study-set-edit-content-${material.id}`}
                              maxLength={1200}
                              onChange={(event) => setEditContent(event.target.value)}
                              value={editContent}
                            />
                          </div>

                          <div className="flashcard-actions">
                            <button
                              className="secondary-button"
                              disabled={submitState === 'submitting'}
                              onClick={cancelEditStudySet}
                              type="button"
                            >
                              취소
                            </button>
                            <button
                              className="submit-button"
                              disabled={submitState === 'submitting'}
                              onClick={() => void handleUpdateStudySet(material)}
                              type="button"
                            >
                              저장
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Link
                            className="study-set-main-link"
                            href={`/deck/${deckId}/category/${material.categoryId}/material/${material.id}`}
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
                          <div className="study-set-actions">
                            <button
                              className="secondary-button"
                              onClick={() => startEditStudySet(material)}
                              type="button"
                            >
                              수정
                            </button>
                            <button
                              className="secondary-button danger-button"
                              disabled={submitState === 'submitting'}
                              onClick={() => void handleDeleteStudySet(material)}
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
