export interface Category {
  id: number;
  deckId: number;
  name: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryListResponse {
  items: Category[];
}

export interface CreateCategoryRequest {
  name: string;
  sortOrder?: number;
}
