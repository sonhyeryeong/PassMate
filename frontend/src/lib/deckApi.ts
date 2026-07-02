import type { CreateDeckRequest, Deck, DeckListResponse } from '@/types/deck';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error('요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.');
  }

  return response.json() as Promise<T>;
}

export async function getDecks(userId: number): Promise<Deck[]> {
  const data = await request<DeckListResponse>(`/decks?userId=${userId}`);
  return data.items;
}

export async function getDeck(deckId: number, userId: number): Promise<Deck> {
  return request<Deck>(`/decks/${deckId}?userId=${userId}`);
}

export async function createDeck(userId: number, payload: CreateDeckRequest): Promise<Deck> {
  return request<Deck>(`/decks?userId=${userId}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
