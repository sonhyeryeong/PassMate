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

export interface ReviewHistoryItem {
  id: number;
  flashCardId: number;
  cardFront: string;
  materialId: number;
  materialTitle: string;
  deckId: number;
  deckName: string;
  result: ReviewResult;
  reviewedAt: string;
}

export interface ReviewHistoryResponse {
  items: ReviewHistoryItem[];
}
