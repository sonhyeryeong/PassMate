'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { BottomNav } from '@/components/BottomNav';
import { createDeck, getDecks } from '@/lib/deckApi';
import { createUser, getUsers } from '@/lib/userApi';
import type { Deck } from '@/types/deck';
import type { User } from '@/types/user';

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

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userLoadState, setUserLoadState] = useState<LoadState>('loading');
  const [userSubmitState, setUserSubmitState] = useState<SubmitState>('idle');
  const [userMessage, setUserMessage] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [userErrors, setUserErrors] = useState({ nickname: '', email: '' });

  const [decks, setDecks] = useState<Deck[]>([]);
  const [deckName, setDeckName] = useState('');
  const [deckDescription, setDeckDescription] = useState('');
  const [deckNameError, setDeckNameError] = useState('');
  const [deckLoadState, setDeckLoadState] = useState<LoadState>('success');
  const [deckSubmitState, setDeckSubmitState] = useState<SubmitState>('idle');
  const [deckMessage, setDeckMessage] = useState('');

  useEffect(() => {
    async function loadUsers() {
      setUserLoadState('loading');
      setUserMessage('');

      try {
        const items = await getUsers();
        setUsers(items);
        setUserLoadState('success');

        const savedUserId = window.localStorage.getItem(SELECTED_USER_KEY);
        const savedUser = items.find((user) => String(user.id) === savedUserId);

        if (savedUser) {
          setSelectedUser(savedUser);
        }
      } catch {
        setUserLoadState('error');
        setUserMessage('사용자 목록을 불러오지 못했습니다. 백엔드 서버 상태를 확인해 주세요.');
      }
    }

    void loadUsers();
  }, []);

  useEffect(() => {
    if (!selectedUser) {
      setDecks([]);
      setDeckLoadState('success');
      return;
    }

    void loadDecks(selectedUser.id);
  }, [selectedUser]);

  async function loadDecks(userId: number) {
    setDeckLoadState('loading');
    setDeckMessage('');

    try {
      const items = await getDecks(userId);
      setDecks(items);
      setDeckLoadState('success');
    } catch {
      setDeckLoadState('error');
      setDeckMessage('폴더 목록을 불러오지 못했습니다. 백엔드 서버 상태를 확인해 주세요.');
    }
  }

  function selectUser(user: User) {
    setSelectedUser(user);
    window.localStorage.setItem(SELECTED_USER_KEY, String(user.id));
  }

  function switchUser() {
    setSelectedUser(null);
    window.localStorage.removeItem(SELECTED_USER_KEY);
    setDecks([]);
    setDeckMessage('');
  }

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedNickname = nickname.trim();
    const trimmedEmail = email.trim();
    const nextErrors = {
      nickname: trimmedNickname ? '' : '닉네임을 입력해 주세요.',
      email: trimmedEmail ? '' : '이메일을 입력해 주세요.',
    };

    setUserErrors(nextErrors);

    if (nextErrors.nickname || nextErrors.email) {
      return;
    }

    setUserSubmitState('submitting');
    setUserMessage('');

    try {
      const createdUser = await createUser({
        nickname: trimmedNickname,
        email: trimmedEmail,
      });

      setUsers((currentUsers) => [createdUser, ...currentUsers]);
      setNickname('');
      setEmail('');
      selectUser(createdUser);
    } catch {
      setUserMessage('사용자를 만들지 못했습니다. 이미 사용 중인 이메일일 수 있습니다.');
    } finally {
      setUserSubmitState('idle');
    }
  }

  async function handleCreateDeck(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedUser) {
      setDeckMessage('먼저 사용자를 선택해 주세요.');
      return;
    }

    const trimmedName = deckName.trim();
    const trimmedDescription = deckDescription.trim();

    if (!trimmedName) {
      setDeckNameError('폴더 이름을 입력해 주세요.');
      return;
    }

    setDeckNameError('');
    setDeckMessage('');
    setDeckSubmitState('submitting');

    try {
      const createdDeck = await createDeck(selectedUser.id, {
        name: trimmedName,
        description: trimmedDescription || undefined,
      });

      setDecks((currentDecks) => [createdDeck, ...currentDecks]);
      setDeckName('');
      setDeckDescription('');
      setDeckLoadState('success');
      setDeckMessage('폴더를 만들었습니다.');
    } catch {
      setDeckMessage('폴더를 만들지 못했습니다. 입력값과 서버 상태를 확인해 주세요.');
    } finally {
      setDeckSubmitState('idle');
    }
  }

  if (!selectedUser) {
    return (
      <div className="app-shell">
        <header className="top-bar">
          <div className="top-bar__inner">
            <div className="brand">
              <p className="brand__caption">PassMate MVP1</p>
              <h1 className="brand__name">사용자 시작</h1>
            </div>
          </div>
        </header>

        <main className="page">
          <section className="start-panel" aria-labelledby="start-title">
            <h2 id="start-title">새 사용자</h2>
            <p className="panel-copy">
              MVP 단계에서는 간단한 사용자 선택으로 학습 폴더를 관리합니다.
            </p>

            <form className="user-form" onSubmit={handleCreateUser}>
              <div className="form-field">
                <label htmlFor="nickname">닉네임</label>
                <input
                  id="nickname"
                  maxLength={40}
                  onChange={(event) => setNickname(event.target.value)}
                  placeholder="예: 수진"
                  value={nickname}
                />
                {userErrors.nickname && <span className="field-error">{userErrors.nickname}</span>}
              </div>

              <div className="form-field">
                <label htmlFor="email">이메일</label>
                <input
                  id="email"
                  maxLength={120}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="sujin@example.com"
                  type="email"
                  value={email}
                />
                {userErrors.email && <span className="field-error">{userErrors.email}</span>}
              </div>

              <button
                className="submit-button"
                disabled={userSubmitState === 'submitting'}
                type="submit"
              >
                {userSubmitState === 'submitting' ? '시작하는 중' : '사용자 만들고 시작'}
              </button>
            </form>

            {userMessage && (
              <div className="inline-alert" role="alert">
                {userMessage}
              </div>
            )}
          </section>

          <section className="start-panel" aria-labelledby="users-title">
            <div className="section-heading compact-heading">
              <div>
                <h2 id="users-title">기존 사용자</h2>
                <p>저장된 사용자로 바로 이어서 시작합니다.</p>
              </div>
            </div>

            {userLoadState === 'loading' && (
              <div className="status-box" role="status">
                <h3>사용자를 불러오는 중</h3>
                <p>저장된 사용자를 확인하고 있습니다.</p>
              </div>
            )}

            {userLoadState === 'error' && (
              <div className="status-box error-box" role="alert">
                <h3>사용자를 볼 수 없습니다</h3>
                <p>{userMessage}</p>
              </div>
            )}

            {userLoadState === 'success' && users.length === 0 && (
              <div className="empty-state">
                <h3>아직 사용자가 없습니다</h3>
                <p>첫 사용자를 만들면 폴더 목록으로 이동합니다.</p>
              </div>
            )}

            {userLoadState === 'success' && users.length > 0 && (
              <div className="user-list">
                {users.map((user) => (
                  <button
                    className="user-list-item"
                    key={user.id}
                    onClick={() => selectUser(user)}
                    type="button"
                  >
                    <span>{user.nickname}</span>
                    <small>{user.email}</small>
                  </button>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="top-bar__inner">
          <div className="brand">
            <p className="brand__caption">{selectedUser.nickname}</p>
            <h1 className="brand__name">폴더</h1>
          </div>
          <button className="icon-button" onClick={switchUser} type="button" aria-label="사용자 변경">
            변경
          </button>
        </div>
      </header>

      <main className="page page--with-nav">
        <form className="deck-form primary-form" onSubmit={handleCreateDeck}>
          <h2>새 폴더 만들기</h2>
          <div className="form-field">
            <label htmlFor="deck-name">폴더 이름</label>
            <input
              id="deck-name"
              maxLength={80}
              onChange={(event) => setDeckName(event.target.value)}
              placeholder="예: 정보처리기사"
              value={deckName}
            />
            {deckNameError && <span className="field-error">{deckNameError}</span>}
          </div>

          <div className="form-field">
            <label htmlFor="deck-description">설명</label>
            <textarea
              id="deck-description"
              maxLength={300}
              onChange={(event) => setDeckDescription(event.target.value)}
              placeholder="이 폴더에서 공부할 내용을 적어 주세요."
              value={deckDescription}
            />
          </div>

          <button
            className="submit-button"
            disabled={deckSubmitState === 'submitting'}
            type="submit"
          >
            {deckSubmitState === 'submitting' ? '만드는 중' : '+ 새 폴더 만들기'}
          </button>

          {deckMessage && deckLoadState !== 'error' && <p className="form-help">{deckMessage}</p>}
        </form>

        <section aria-labelledby="deck-list-title">
          <div className="section-heading">
            <div>
              <h2 id="deck-list-title">폴더 목록</h2>
              <p>학습 자료를 주제별 폴더로 관리합니다.</p>
            </div>
            <span className="deck-count">{decks.length}개</span>
          </div>

          {deckLoadState === 'loading' && (
            <div className="status-box" role="status">
              <h3>폴더를 불러오는 중</h3>
              <p>저장된 폴더 목록을 준비하고 있습니다.</p>
            </div>
          )}

          {deckLoadState === 'error' && (
            <div className="status-box error-box" role="alert">
              <h3>폴더를 볼 수 없습니다</h3>
              <p>{deckMessage}</p>
            </div>
          )}

          {deckLoadState === 'success' && decks.length === 0 && (
            <div className="empty-state">
              <h3>아직 폴더가 없습니다</h3>
              <p>첫 학습 폴더를 만들면 여기에 표시됩니다.</p>
            </div>
          )}

          {deckLoadState === 'success' && decks.length > 0 && (
            <div className="deck-list">
              {decks.map((deck) => (
                <Link className="list-card list-card--link" href={`/deck/${deck.id}`} key={deck.id}>
                  <span className="list-card__icon" aria-hidden="true" />
                  <span className="list-card__body">
                    <strong>{deck.name}</strong>
                    {deck.description && <span>{deck.description}</span>}
                    <small>수정일 {formatDate(deck.updatedAt)}</small>
                  </span>
                  <span className="list-card__chevron" aria-hidden="true">
                    ›
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <BottomNav active="deck" />
    </div>
  );
}
