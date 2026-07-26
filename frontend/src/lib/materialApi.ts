import type {
  CreateMaterialRequest,
  CreateMaterialWithCardsRequest,
  Material,
  MaterialListResponse,
  MaterialWithCardsResponse,
  UpdateMaterialRequest,
} from '@/types/material';
import { request } from '@/lib/apiClient';

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
  await request<void>(`/categories/${categoryId}/materials/${materialId}`, {
    method: 'DELETE',
  });
}
