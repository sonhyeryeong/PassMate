export interface Material {
  id: number;
  categoryId: number;
  title: string;
  content: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialListResponse {
  items: Material[];
}

export interface CreateMaterialRequest {
  title: string;
  content?: string;
}

export interface UpdateMaterialRequest {
  title: string;
  content?: string;
}
