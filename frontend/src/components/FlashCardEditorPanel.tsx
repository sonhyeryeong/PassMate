'use client';

import { FormEvent, useState } from 'react';
import { getErrorMessage } from '@/lib/apiClient';
import type { FlashCard } from '@/types/flashcard';

interface FlashCardEditorPanelProps {
  card?: FlashCard;
  onCancel: () => void;
  onSave: (front: string, back: string) => Promise<void>;
}

export function FlashCardEditorPanel({
  card,
  onCancel,
  onSave,
}: FlashCardEditorPanelProps) {
  const [front, setFront] = useState(card?.front ?? '');
  const [back, setBack] = useState(card?.back ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedFront = front.trim();
    const trimmedBack = back.trim();

    if (!trimmedFront || !trimmedBack) {
      setMessage('카드의 앞면과 뒷면을 모두 입력해 주세요.');
      return;
    }

    setIsSaving(true);
    setMessage('');

    try {
      await onSave(trimmedFront, trimmedBack);
    } catch (error) {
      setMessage(getErrorMessage(error, '카드를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.'));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="editor-overlay" role="presentation" onMouseDown={onCancel}>
      <aside
        aria-labelledby="card-editor-title"
        aria-modal="true"
        className="card-editor-panel"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="card-editor-panel__header">
          <div>
            <p className="eyebrow">{card ? '카드 수정' : '새 카드'}</p>
            <h2 id="card-editor-title">{card ? '카드 수정' : '카드 추가'}</h2>
          </div>
          <button aria-label="카드 편집 닫기" className="icon-button" onClick={onCancel} type="button">
            닫기
          </button>
        </div>

        <form className="card-editor-panel__form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="card-front">앞면</label>
            <textarea
              autoFocus
              id="card-front"
              maxLength={300}
              onChange={(event) => setFront(event.target.value)}
              placeholder="질문이나 용어를 입력하세요."
              value={front}
            />
            <span className="form-help">{front.length} / 300</span>
          </div>

          <div className="form-field">
            <label htmlFor="card-back">뒷면</label>
            <textarea
              id="card-back"
              maxLength={600}
              onChange={(event) => setBack(event.target.value)}
              placeholder="답변이나 설명을 입력하세요."
              value={back}
            />
            <span className="form-help">{back.length} / 600</span>
          </div>

          {message && <div className="inline-alert" role="alert">{message}</div>}

          <div className="editor-actions">
            <button className="secondary-button" disabled={isSaving} onClick={onCancel} type="button">
              취소
            </button>
            <button className="submit-button submit-button--fit" disabled={isSaving} type="submit">
              {isSaving ? '저장 중' : '저장'}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}
