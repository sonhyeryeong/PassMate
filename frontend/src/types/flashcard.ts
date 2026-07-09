export interface FlashCard {
  id: number;
  materialId: number;
  front: string;
  back: string;
  nextReviewAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FlashCardListResponse {
  items: FlashCard[];
}

export interface CreateFlashCardRequest {
  front: string;
  back: string;
}

export interface UpdateFlashCardRequest {
  front: string;
  back: string;
}
