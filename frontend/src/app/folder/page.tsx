'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { createFolder, getFolders, type Folder } from '@/lib/folderApi';

const SELECTED_USER_KEY = 'passmate.selectedUser';

type LoadState = 'loading' | 'success' | 'error';
type SubmitState = 'idle' | 'submitting';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
}

export default function FolderListPage() {
  const [userId, setUserId] = useState<number | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const savedUserId = window.localStorage.getItem(SELECTED_USER_KEY);

    if (!savedUserId) {
      setLoadState('error');
      setMessage('먼저 사용할 프로필을 선택해 주세요.');
      return;
    }

    setUserId(Number(savedUserId));
  }, []);

  useEffect(() => {
    if (!userId) {
      return;
    }

    async function loadFolders(nextUserId: number) {
      setLoadState('loading');
      setMessage('');

      try {
        const items = await getFolders(nextUserId);
        setFolders(items);
        setLoadState('success');
      } catch {
        setLoadState('error');
        setMessage('폴더 목록을 불러오지 못했습니다. 백엔드 서버 상태를 확인해 주세요.');
      }
    }

    void loadFolders(userId);
  }, [userId]);

  async function handleCreateFolder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!userId) {
      setMessage('먼저 사용할 프로필을 선택해 주세요.');
      return;
    }

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();

    if (!trimmedName) {
      setNameError('폴더 이름을 입력해 주세요.');
      return;
    }

    setNameError('');
    setMessage('');
    setSubmitState('submitting');

    try {
      const createdFolder = await createFolder(userId, {
        name: trimmedName,
        description: trimmedDescription || undefined,
      });

      setFolders((currentFolders) => [createdFolder, ...currentFolders]);
      setName('');
      setDescription('');
      setLoadState('success');
      setMessage('새 폴더를 만들었습니다.');
    } catch {
      setMessage('폴더를 만들지 못했습니다. 입력값과 서버 상태를 확인해 주세요.');
    } finally {
      setSubmitState('idle');
    }
  }

  return (
    <AppShell
      active="folder"
      eyebrow="학습 주제 관리"
      title="폴더"
      actions={<Link className="secondary-button" href="/">대시보드</Link>}
    >
      <section className="workspace-grid">
        <form className="surface-panel primary-form" onSubmit={handleCreateFolder}>
          <div>
            <h2>새 폴더 만들기</h2>
            <p>자격증, 과목, 면접 주제처럼 학습 세트를 묶을 큰 주제를 만듭니다.</p>
          </div>

          <div className="form-field">
            <label htmlFor="folder-name">폴더 이름</label>
            <input
              id="folder-name"
              maxLength={80}
              onChange={(event) => setName(event.target.value)}
              placeholder="예: 정보처리기사"
              value={name}
            />
            {nameError && <span className="field-error">{nameError}</span>}
          </div>

          <div className="form-field">
            <label htmlFor="folder-description">설명</label>
            <textarea
              id="folder-description"
              maxLength={300}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="이 폴더에서 공부할 내용을 적어 주세요."
              value={description}
            />
          </div>

          <button className="submit-button" disabled={submitState === 'submitting'} type="submit">
            {submitState === 'submitting' ? '만드는 중' : '폴더 만들기'}
          </button>

          {message && loadState !== 'error' && <p className="form-help">{message}</p>}
        </form>

        <section aria-labelledby="folder-list-title">
          <div className="section-heading">
            <div>
              <h2 id="folder-list-title">내 폴더</h2>
              <p>폴더를 열어 학습 세트를 만들고 카드를 추가하세요.</p>
            </div>
            <span className="deck-count">{folders.length}개</span>
          </div>

          {loadState === 'loading' && (
            <div className="status-box" role="status">
              <h3>폴더를 불러오는 중</h3>
              <p>저장된 학습 주제를 확인하고 있습니다.</p>
            </div>
          )}

          {loadState === 'error' && (
            <div className="status-box error-box" role="alert">
              <h3>폴더를 볼 수 없습니다</h3>
              <p>{message}</p>
              <div className="status-actions">
                <Link className="secondary-button" href="/">
                  프로필 선택으로 이동
                </Link>
              </div>
            </div>
          )}

          {loadState === 'success' && folders.length === 0 && (
            <div className="empty-state">
              <h3>아직 폴더가 없습니다</h3>
              <p>첫 폴더를 만들면 그 안에 학습 세트를 추가할 수 있습니다.</p>
            </div>
          )}

          {loadState === 'success' && folders.length > 0 && (
            <div className="deck-list">
              {folders.map((folder) => (
                <Link
                  className="list-card list-card--link"
                  href={`/folder/${folder.id}`}
                  key={folder.id}
                >
                  <span className="list-card__icon" aria-hidden="true" />
                  <span className="list-card__body">
                    <strong>{folder.name}</strong>
                    {folder.description && <span>{folder.description}</span>}
                    <small>최근 수정 {formatDate(folder.updatedAt)}</small>
                  </span>
                  <span className="list-card__chevron" aria-hidden="true">
                    →
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </section>
    </AppShell>
  );
}
