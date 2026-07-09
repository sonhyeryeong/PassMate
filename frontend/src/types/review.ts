import type { FlashCard } from '@/types/flashcard';

export type ReviewResult = 'AGAIN' | 'HARD' | 'GOOD' | 'EASY';

export interface TodayReviewResponse {
  items: FlashCard[];
  reviewDate: string;
}

export interface CreateReviewRequest {
  result: ReviewResult;
}

export interface Review {
  id: number;
  userId: number;
  flashCardId: number;
  result: ReviewResult;
  reviewedAt: string;
  createdAt: string;
}
