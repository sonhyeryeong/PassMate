'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { getFolder, type Folder } from '@/lib/folderApi';
import { getStudySets, type StudySet } from '@/lib/studySetApi';

const SELECTED_USER_KEY = 'passmate.selectedUser';

type LoadState = 'loading' | 'success' | 'error';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
}

export default function FolderDetailPage() {
  const params = useParams<{ folderId: string }>();
  const folderId = useMemo(() => Number(params.folderId), [params.folderId]);

  const [folder, setFolder] = useState<Folder | null>(null);
  const [studySets, setStudySets] = useState<StudySet[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const savedUserId = window.localStorage.getItem(SELECTED_USER_KEY);

    if (!savedUserId) {
      setLoadState('error');
      setMessage('먼저 사용할 프로필을 선택해 주세요.');
      return;
    }

    async function loadFolderDetail(userId: number) {
      setLoadState('loading');
      setMessage('');

      try {
        const [folderData, setItems] = await Promise.all([
          getFolder(folderId, userId),
          getStudySets(folderId),
        ]);

        setFolder(folderData);
        setStudySets(setItems);
        setLoadState('success');
      } catch {
        setLoadState('error');
        setMessage('폴더 정보를 불러오지 못했습니다. 서버 상태를 확인해 주세요.');
      }
    }

    if (Number.isNaN(folderId)) {
      setLoadState('error');
      setMessage('올바르지 않은 폴더 주소입니다.');
      return;
    }

    void loadFolderDetail(Number(savedUserId));
  }, [folderId]);

  return (
    <AppShell
      active="folder"
      eyebrow="폴더 상세"
      title={folder?.name ?? '폴더'}
      actions={
        folder && (
          <Link className="submit-button submit-button--fit" href={`/folder/${folder.id}/set/new`}>
            학습 세트 만들기
          </Link>
        )
      }
    >
      {loadState === 'loading' && (
        <div className="status-box" role="status">
          <h3>폴더를 불러오는 중</h3>
          <p>폴더 안의 학습 세트를 확인하고 있습니다.</p>
        </div>
      )}

      {loadState === 'error' && (
        <div className="status-box error-box" role="alert">
          <h3>폴더를 볼 수 없습니다</h3>
          <p>{message}</p>
          <div className="status-actions">
            <Link className="secondary-button" href="/folder">
              폴더 목록으로 이동
            </Link>
          </div>
        </div>
      )}

      {loadState === 'success' && folder && (
        <div className="stack-layout">
          <section className="surface-panel">
            <p className="breadcrumb">
              <Link href="/folder">폴더</Link> &gt; {folder.name}
            </p>
            <h2>{folder.name}</h2>
            <p>{folder.description || '설명이 아직 없습니다.'}</p>
            <div className="detail-meta">
              <span>학습 세트 {studySets.length}개</span>
              <span>최근 수정 {formatDate(folder.updatedAt)}</span>
            </div>
          </section>

          <section aria-labelledby="study-set-list-title">
            <div className="section-heading">
              <div>
                <h2 id="study-set-list-title">학습 세트</h2>
                <p>학습 세트를 열어 카드를 확인하거나 새 세트를 만들어 보세요.</p>
              </div>
              <span className="deck-count">{studySets.length}개</span>
            </div>

            {studySets.length === 0 && (
              <div className="empty-state">
                <h3>아직 학습 세트가 없습니다</h3>
                <p>첫 학습 세트를 만들고 앞면/뒷면 카드를 빠르게 추가해 보세요.</p>
                <div className="status-actions">
                  <Link className="submit-button submit-button--fit" href={`/folder/${folder.id}/set/new`}>
                    학습 세트 만들기
                  </Link>
                </div>
              </div>
            )}

            {studySets.length > 0 && (
              <div className="deck-list">
                {studySets.map((studySet) => (
                  <Link
                    className="list-card list-card--link"
                    href={`/folder/${folder.id}/set/${studySet.id}`}
                    key={studySet.id}
                  >
                    <span className="list-card__icon list-card__icon--folder" aria-hidden="true" />
                    <span className="list-card__body">
                      <strong>{studySet.title}</strong>
                      {studySet.content && <span>{studySet.content}</span>}
                      <small>최근 수정 {formatDate(studySet.updatedAt)}</small>
                    </span>
                    <span className="list-card__chevron" aria-hidden="true">
                      →
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </AppShell>
  );
}
