import type {
  Category,
  CategoryListResponse,
  CreateCategoryRequest,
} from '@/types/category';

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
