import type { CreateReviewRequest, Review, TodayReviewResponse } from '@/types/review';
import type { FlashCard } from '@/types/flashcard';
import { request } from '@/lib/apiClient';

export async function getTodayReviewCards(userId: number): Promise<FlashCard[]> {
  const data = await request<TodayReviewResponse>(`/reviews/users/${userId}/today`);
  return data.items;
}

export async function createReview(
  userId: number,
  cardId: number,
  payload: CreateReviewRequest,
): Promise<Review> {
  return request<Review>(`/reviews/cards/${cardId}?userId=${userId}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
