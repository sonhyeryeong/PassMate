import type { CreateFlashCardRequest, FlashCard } from '@/types/flashcard';

export interface Material {
  id: number;
  categoryId: number;
  title: string;
  content: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialListResponse {
  items: Material[];
}

export interface CreateMaterialRequest {
  title: string;
  content?: string;
}

export interface CreateMaterialWithCardsRequest {
  title: string;
  content?: string;
  cards: CreateFlashCardRequest[];
}

export interface UpdateMaterialRequest {
  title: string;
  content?: string;
}

export interface MaterialWithCardsResponse {
  material: Material;
  cards: FlashCard[];
}
