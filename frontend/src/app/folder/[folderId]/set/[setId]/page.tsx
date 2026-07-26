'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { FlashCardEditorPanel } from '@/components/FlashCardEditorPanel';
import { createFlashCard, deleteFlashCard, updateFlashCard } from '@/lib/flashcardApi';
import { getFolder, type Folder } from '@/lib/folderApi';
import { getStudySetInFolder, type StudySet } from '@/lib/studySetApi';
import type { FlashCard } from '@/types/flashcard';

const SELECTED_USER_KEY = 'passmate.selectedUser';

type LoadState = 'loading' | 'success' | 'error';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
}

export default function StudySetDetailPage() {
  const params = useParams<{ folderId: string; setId: string }>();
  const folderId = useMemo(() => Number(params.folderId), [params.folderId]);
  const setId = useMemo(() => Number(params.setId), [params.setId]);

  const [folder, setFolder] = useState<Folder | null>(null);
  const [studySet, setStudySet] = useState<StudySet | null>(null);
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [message, setMessage] = useState('');
  const [editingCard, setEditingCard] = useState<FlashCard | 'new' | null>(null);
  const [selectedCardIds, setSelectedCardIds] = useState<number[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const savedUserId = window.localStorage.getItem(SELECTED_USER_KEY);

    if (!savedUserId) {
      setLoadState('error');
      setMessage('먼저 사용할 프로필을 선택해 주세요.');
      return;
    }

    if (Number.isNaN(folderId) || Number.isNaN(setId)) {
      setLoadState('error');
      setMessage('올바르지 않은 학습 세트 주소입니다.');
      return;
    }

    async function loadStudySet(userId: number) {
      setLoadState('loading');
      setMessage('');

      try {
        const [folderData, detail] = await Promise.all([
          getFolder(folderId, userId),
          getStudySetInFolder(folderId, setId),
        ]);

        setFolder(folderData);
        setStudySet(detail.studySet);
        setCards(detail.cards);
        setLoadState('success');
      } catch {
        setLoadState('error');
        setMessage('학습 세트를 불러오지 못했습니다. 서버 상태를 확인해 주세요.');
      }
    }

    void loadStudySet(Number(savedUserId));
  }, [folderId, setId]);

  async function handleSaveCard(front: string, back: string) {
    if (editingCard === null) {
      return;
    }

    if (editingCard === 'new') {
      const createdCard = await createFlashCard(setId, { front, back });
      setCards((currentCards) => [...currentCards, createdCard]);
      setMessage('카드를 추가했습니다.');
    } else {
      const updatedCard = await updateFlashCard(setId, editingCard.id, { front, back });
      setCards((currentCards) =>
        currentCards.map((card) => (card.id === updatedCard.id ? updatedCard : card)),
      );
      setMessage('카드를 수정했습니다.');
    }

    setSelectedCardIds([]);
    setEditingCard(null);
  }

  function handleToggleCard(cardId: number) {
    setSelectedCardIds((currentIds) =>
      currentIds.includes(cardId)
        ? currentIds.filter((selectedId) => selectedId !== cardId)
        : [...currentIds, cardId],
    );
  }

  function handleToggleAllCards() {
    setSelectedCardIds((currentIds) =>
      currentIds.length === cards.length ? [] : cards.map((card) => card.id),
    );
  }

  function handleEditSelectedCard() {
    if (selectedCardIds.length !== 1) {
      return;
    }

    const selectedCard = cards.find((card) => card.id === selectedCardIds[0]);
    if (selectedCard) {
      setEditingCard(selectedCard);
    }
  }

  async function handleDeleteCards() {
    if (selectedCardIds.length === 0) {
      return;
    }

    setIsDeleting(true);
    setMessage('');

    const deletedCardIds: number[] = [];

    for (const cardId of selectedCardIds) {
      try {
        await deleteFlashCard(setId, cardId);
        deletedCardIds.push(cardId);
      } catch {
        break;
      }
    }

    setCards((currentCards) =>
      currentCards.filter((card) => !deletedCardIds.includes(card.id)),
    );
    setSelectedCardIds((currentIds) =>
      currentIds.filter((cardId) => !deletedCardIds.includes(cardId)),
    );
    setIsDeleteDialogOpen(false);
    setIsDeleting(false);

    if (deletedCardIds.length === selectedCardIds.length) {
      setMessage(`${deletedCardIds.length}장의 카드와 관련 복습 기록을 삭제했습니다.`);
      return;
    }

    setMessage(
      deletedCardIds.length > 0
        ? `${deletedCardIds.length}장은 삭제했지만 일부 카드를 삭제하지 못했습니다.`
        : '카드를 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.',
    );
  }

  return (
    <AppShell
      active="folder"
      eyebrow="학습 세트"
      title={studySet?.title ?? '학습 세트'}
      actions={
        studySet && (
          <div className="page-actions">
            <button className="secondary-button" onClick={() => setEditingCard('new')} type="button">
              카드 추가
            </button>
            <Link className="submit-button submit-button--fit" href="/review">
              복습 시작
            </Link>
          </div>
        )
      }
    >
      {loadState === 'loading' && (
        <div className="status-box" role="status">
          <h3>학습 세트를 불러오는 중</h3>
          <p>카드 목록을 준비하고 있습니다.</p>
        </div>
      )}

      {loadState === 'error' && (
        <div className="status-box error-box" role="alert">
          <h3>학습 세트를 볼 수 없습니다</h3>
          <p>{message}</p>
          <div className="status-actions">
            <Link className="secondary-button" href={`/folder/${folderId}`}>
              폴더로 돌아가기
            </Link>
          </div>
        </div>
      )}

      {loadState === 'success' && folder && studySet && (
        <div className="stack-layout">
          <section className="surface-panel">
            <p className="breadcrumb">
              <Link href="/folder">폴더</Link> &gt;{' '}
              <Link href={`/folder/${folder.id}`}>{folder.name}</Link> &gt; {studySet.title}
            </p>
            <h2>{studySet.title}</h2>
            <p>{studySet.content || '설명이 아직 없습니다.'}</p>
            <div className="detail-meta">
              <span>카드 {cards.length}개</span>
              <span>최근 수정 {formatDate(studySet.updatedAt)}</span>
            </div>
          </section>

          <section aria-labelledby="card-list-title">
            <div className="section-heading">
              <div>
                <h2 id="card-list-title">카드</h2>
                <p>앞면과 뒷면을 확인하고 복습을 시작할 수 있습니다.</p>
              </div>
              <div className="section-actions">
                <span className="deck-count">{cards.length}개</span>
                <button className="secondary-button" onClick={() => setEditingCard('new')} type="button">
                  카드 추가
                </button>
              </div>
            </div>

            {cards.length === 0 && (
              <div className="empty-state">
                <h3>아직 카드가 없습니다</h3>
                <p>첫 카드를 추가하고 복습을 시작해 보세요.</p>
                <div className="status-actions">
                  <button className="submit-button submit-button--fit" onClick={() => setEditingCard('new')} type="button">
                    첫 카드 추가
                  </button>
                </div>
              </div>
            )}

            {cards.length > 0 && (
              <div className="flashcard-selection">
                <div className="flashcard-selection__toolbar">
                  <label className="flashcard-select-all">
                    <input
                      checked={selectedCardIds.length === cards.length}
                      onChange={handleToggleAllCards}
                      type="checkbox"
                    />
                    전체 선택
                  </label>
                  <span>{selectedCardIds.length}장 선택</span>
                  <div className="flashcard-selection__actions">
                    <button
                      className="secondary-button"
                      disabled={selectedCardIds.length !== 1}
                      onClick={handleEditSelectedCard}
                      type="button"
                    >
                      수정
                    </button>
                    <button
                      className="secondary-button danger-button"
                      disabled={selectedCardIds.length === 0}
                      onClick={() => setIsDeleteDialogOpen(true)}
                      type="button"
                    >
                      삭제
                    </button>
                  </div>
                </div>

                <div className="flashcard-table-wrap">
                  <table className="flashcard-table">
                    <colgroup>
                      <col className="flashcard-table__check-column" />
                      <col className="flashcard-table__number-column" />
                      <col className="flashcard-table__front-column" />
                      <col className="flashcard-table__back-column" />
                    </colgroup>
                    <thead>
                      <tr>
                        <th className="flashcard-table__check" scope="col">
                          선택
                        </th>
                        <th className="flashcard-table__number" scope="col">
                          번호
                        </th>
                        <th scope="col">앞면</th>
                        <th scope="col">뒷면</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cards.map((card, index) => {
                        const isSelected = selectedCardIds.includes(card.id);

                        return (
                          <tr className={isSelected ? 'flashcard-table__row--selected' : undefined} key={card.id}>
                            <td className="flashcard-table__check">
                              <input
                                aria-label={`카드 ${index + 1} 선택`}
                                checked={isSelected}
                                onChange={() => handleToggleCard(card.id)}
                                type="checkbox"
                              />
                            </td>
                            <td className="flashcard-table__number">{index + 1}</td>
                            <td>
                              <div className="flashcard-table__content" title={card.front}>
                                {card.front}
                              </div>
                            </td>
                            <td>
                              <div className="flashcard-table__content" title={card.back}>
                                {card.back}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {message && <div className="inline-alert card-feedback" role="status">{message}</div>}
          </section>
        </div>
      )}

      {editingCard && (
        <FlashCardEditorPanel
          card={editingCard === 'new' ? undefined : editingCard}
          onCancel={() => setEditingCard(null)}
          onSave={handleSaveCard}
        />
      )}

      {isDeleteDialogOpen && (
        <div className="dialog-overlay" role="presentation" onMouseDown={() => !isDeleting && setIsDeleteDialogOpen(false)}>
          <div
            aria-labelledby="delete-card-title"
            aria-modal="true"
            className="confirm-dialog"
            role="alertdialog"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 id="delete-card-title">선택한 카드 {selectedCardIds.length}장을 삭제할까요?</h2>
            <p>삭제한 카드와 관련 복습 기록은 복구할 수 없습니다.</p>
            <div className="editor-actions">
              <button
                className="secondary-button"
                disabled={isDeleting}
                onClick={() => setIsDeleteDialogOpen(false)}
                type="button"
              >
                취소
              </button>
              <button
                className="submit-button submit-button--fit delete-button"
                disabled={isDeleting}
                onClick={handleDeleteCards}
                type="button"
              >
                {isDeleting ? '삭제 중' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
