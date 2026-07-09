import type {
  CreateFlashCardRequest,
  FlashCard,
  FlashCardListResponse,
  UpdateFlashCardRequest,
} from '@/types/flashcard';

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
  await fetch(`${API_BASE_URL}/materials/${materialId}/cards/${cardId}`, {
    method: 'DELETE',
  }).then((response) => {
    if (!response.ok) {
      throw new Error('요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    }
  });
}
