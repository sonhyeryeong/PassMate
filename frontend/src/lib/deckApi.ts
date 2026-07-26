import type { CreateDeckRequest, Deck, DeckListResponse } from '@/types/deck';
import { request } from '@/lib/apiClient';

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
