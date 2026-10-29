import type { CreateDeckRequest, Deck, DeckListResponse } from '@/types/deck';
import { request } from '@/lib/apiClient';

export async function getDecks(_userId: number): Promise<Deck[]> {
  const data = await request<DeckListResponse>(`/decks`);
  return data.items;
}

export async function getDeck(deckId: number, _userId: number): Promise<Deck> {
  return request<Deck>(`/decks/${deckId}`);
}

export async function createDeck(_userId: number, payload: CreateDeckRequest): Promise<Deck> {
  return request<Deck>(`/decks`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
