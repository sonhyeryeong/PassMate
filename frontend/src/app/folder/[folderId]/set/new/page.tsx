'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { createStudySet, type StudySetCardInput } from '@/lib/studySetApi';

type SubmitState = 'idle' | 'submitting';

interface CardRow extends StudySetCardInput {
  id: string;
}

function createEmptyCard(): CardRow {
  return {
    id: crypto.randomUUID(),
    front: '',
    back: '',
  };
}

export default function NewStudySetPage() {
  const params = useParams<{ folderId: string }>();
  const router = useRouter();
  const folderId = useMemo(() => Number(params.folderId), [params.folderId]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cards, setCards] = useState<CardRow[]>([createEmptyCard(), createEmptyCard(), createEmptyCard()]);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [message, setMessage] = useState('');

  function updateCard(cardId: string, field: 'front' | 'back', value: string) {
    setCards((currentCards) =>
      currentCards.map((card) => (card.id === cardId ? { ...card, [field]: value } : card)),
    );
  }

  function addCard() {
    setCards((currentCards) => [...currentCards, createEmptyCard()]);
  }

  function removeCard(cardId: string) {
    setCards((currentCards) =>
      currentCards.length <= 1 ? currentCards : currentCards.filter((card) => card.id !== cardId),
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const filledCards = cards
      .map((card) => ({
        front: card.front.trim(),
        back: card.back.trim(),
      }))
      .filter((card) => card.front || card.back);

    if (!trimmedTitle) {
      setMessage('학습 세트 제목을 입력해 주세요.');
      return;
    }

    if (filledCards.length === 0) {
      setMessage('최소 1개의 카드를 입력해 주세요.');
      return;
    }

    if (filledCards.some((card) => !card.front || !card.back)) {
      setMessage('카드의 앞면과 뒷면을 모두 입력해 주세요.');
      return;
    }

    setSubmitState('submitting');
    setMessage('');

    try {
      const { studySet } = await createStudySet(folderId, {
        title: trimmedTitle,
        description: description.trim() || undefined,
        cards: filledCards,
      });

      router.push(`/folder/${folderId}/set/${studySet.id}`);
    } catch {
      setMessage('학습 세트를 저장하지 못했습니다. 입력값과 서버 상태를 확인해 주세요.');
    } finally {
      setSubmitState('idle');
    }
  }

  return (
    <AppShell
      active="folder"
      eyebrow="새 학습 세트"
      title="학습 세트 만들기"
      actions={<Link className="secondary-button" href={`/folder/${folderId}`}>취소</Link>}
    >
      <form className="stack-layout" onSubmit={handleSubmit}>
        <section className="surface-panel primary-form">
          <div className="form-field">
            <label htmlFor="study-set-title">학습 세트 제목</label>
            <input
              id="study-set-title"
              maxLength={120}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="예: 데이터베이스 정규화"
              value={title}
            />
          </div>

          <div className="form-field">
            <label htmlFor="study-set-description">설명</label>
            <textarea
              id="study-set-description"
              maxLength={1200}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="이 학습 세트에서 다룰 내용을 간단히 적어 주세요."
              value={description}
            />
          </div>
        </section>

        <section className="surface-panel">
          <div className="section-heading">
            <div>
              <h2>카드 입력</h2>
              <p>앞면에는 질문이나 단어를, 뒷면에는 답이나 설명을 입력하세요.</p>
            </div>
            <button className="secondary-button" onClick={addCard} type="button">
              카드 추가
            </button>
          </div>

          <div className="card-editor-table" role="table" aria-label="카드 입력 목록">
            <div className="card-editor-row card-editor-row--head" role="row">
              <span>#</span>
              <span>앞면</span>
              <span>뒷면</span>
              <span>삭제</span>
            </div>

            {cards.map((card, index) => (
              <div className="card-editor-row" role="row" key={card.id}>
                <span className="card-editor-index">{index + 1}</span>
                <textarea
                  aria-label={`${index + 1}번 카드 앞면`}
                  maxLength={300}
                  onChange={(event) => updateCard(card.id, 'front', event.target.value)}
                  placeholder="예: 제1정규형이란?"
                  value={card.front}
                />
                <textarea
                  aria-label={`${index + 1}번 카드 뒷면`}
                  maxLength={600}
                  onChange={(event) => updateCard(card.id, 'back', event.target.value)}
                  placeholder="예: 모든 속성 값이 원자값인 상태"
                  value={card.back}
                />
                <button
                  className="secondary-button"
                  disabled={cards.length <= 1}
                  onClick={() => removeCard(card.id)}
                  type="button"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>

          {message && (
            <div className="inline-alert" role="alert">
              {message}
            </div>
          )}

          <div className="editor-actions">
            <Link className="secondary-button" href={`/folder/${folderId}`}>
              취소
            </Link>
            <button className="submit-button submit-button--fit" disabled={submitState === 'submitting'} type="submit">
              {submitState === 'submitting' ? '저장 중' : '학습 세트 저장'}
            </button>
          </div>
        </section>
      </form>
    </AppShell>
  );
}
