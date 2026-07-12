import type {
  CreateMaterialRequest,
  CreateMaterialWithCardsRequest,
  Material,
  MaterialListResponse,
  MaterialWithCardsResponse,
  UpdateMaterialRequest,
} from '@/types/material';

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

export async function getMaterials(categoryId: number): Promise<Material[]> {
  const data = await request<MaterialListResponse>(`/categories/${categoryId}/materials`);
  return data.items;
}

export async function getMaterial(categoryId: number, materialId: number): Promise<Material> {
  return request<Material>(`/categories/${categoryId}/materials/${materialId}`);
}

export async function createMaterial(
  categoryId: number,
  payload: CreateMaterialRequest,
): Promise<Material> {
  return request<Material>(`/categories/${categoryId}/materials`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createMaterialWithCards(
  categoryId: number,
  payload: CreateMaterialWithCardsRequest,
): Promise<MaterialWithCardsResponse> {
  return request<MaterialWithCardsResponse>(`/categories/${categoryId}/materials/with-cards`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateMaterial(
  categoryId: number,
  materialId: number,
  payload: UpdateMaterialRequest,
): Promise<Material> {
  return request<Material>(`/categories/${categoryId}/materials/${materialId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteMaterial(categoryId: number, materialId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/categories/${categoryId}/materials/${materialId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.');
  }
}
