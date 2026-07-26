import type { Dashboard } from '@/types/dashboard';
import { request } from '@/lib/apiClient';

export async function getDashboard(userId: number): Promise<Dashboard> {
  return request<Dashboard>(`/dashboard?userId=${userId}`);
}
