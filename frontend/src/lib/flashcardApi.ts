import type {
  CreateFlashCardRequest,
  FlashCard,
  FlashCardListResponse,
  UpdateFlashCardRequest,
} from '@/types/flashcard';
import { request } from '@/lib/apiClient';

export async function getFlashCards(materialId: number): Promise<FlashCard[]> {
  const data = await request<FlashCardListResponse>(`/materials/${materialId}/cards`);
  return data.items;
}

export async function createFlashCard(
  materialId: number,
  payload: CreateFlashCardRequest,
): Promise<FlashCard> {
  return request<FlashCard>(`/materials/${materialId}/cards`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateFlashCard(
  materialId: number,
  cardId: number,
  payload: UpdateFlashCardRequest,
): Promise<FlashCard> {
  return request<FlashCard>(`/materials/${materialId}/cards/${cardId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteFlashCard(materialId: number, cardId: number): Promise<void> {
  await request<void>(`/materials/${materialId}/cards/${cardId}`, {
    method: 'DELETE',
  });
}
