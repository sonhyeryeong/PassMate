import type {
  Category,
  CategoryListResponse,
  CreateCategoryRequest,
} from '@/types/category';
import { request } from '@/lib/apiClient';

export async function getCategories(deckId: number): Promise<Category[]> {
  const data = await request<CategoryListResponse>(`/decks/${deckId}/categories`);
  return data.items;
}

export async function getCategory(deckId: number, categoryId: number): Promise<Category> {
  return request<Category>(`/decks/${deckId}/categories/${categoryId}`);
}

export async function createCategory(
  deckId: number,
  payload: CreateCategoryRequest,
): Promise<Category> {
  return request<Category>(`/decks/${deckId}/categories`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
