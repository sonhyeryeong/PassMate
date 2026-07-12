'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
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

  return (
    <AppShell
      active="folder"
      eyebrow="학습 세트"
      title={studySet?.title ?? '학습 세트'}
      actions={
        studySet && (
          <Link className="submit-button submit-button--fit" href="/review">
            복습 시작
          </Link>
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
              <span className="deck-count">{cards.length}개</span>
            </div>

            {cards.length === 0 && (
              <div className="empty-state">
                <h3>아직 카드가 없습니다</h3>
                <p>학습 세트 편집에서 앞면과 뒷면 카드를 추가해 주세요.</p>
              </div>
            )}

            {cards.length > 0 && (
              <div className="flashcard-list">
                {cards.map((card, index) => (
                  <article className="flashcard-card" key={card.id}>
                    <div>
                      <small>카드 {index + 1}</small>
                      <strong>{card.front}</strong>
                      <p>{card.back}</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </AppShell>
  );
}
