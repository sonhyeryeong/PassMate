export interface Deck {
  id: number;
  userId: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeckListResponse {
  items: Deck[];
}

export interface CreateDeckRequest {
  name: string;
  description?: string;
}
