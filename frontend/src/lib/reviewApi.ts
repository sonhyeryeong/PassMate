import type {
  CreateReviewRequest,
  Review,
  ReviewHistoryItem,
  ReviewHistoryResponse,
  TodayReviewResponse,
} from '@/types/review';
import type { FlashCard } from '@/types/flashcard';
import { request } from '@/lib/apiClient';

export async function getTodayReviewCards(_userId: number, materialId?: number): Promise<FlashCard[]> {
  const query = materialId === undefined ? '' : `?materialId=${materialId}`;
  const data = await request<TodayReviewResponse>(`/reviews/today${query}`);
  return data.items;
}

export async function createReview(
  _userId: number,
  cardId: number,
  payload: CreateReviewRequest,
): Promise<Review> {
  return request<Review>(`/reviews/cards/${cardId}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getReviewHistory(_userId: number): Promise<ReviewHistoryItem[]> {
  const data = await request<ReviewHistoryResponse>(`/reviews/history`);
  return data.items;
}
