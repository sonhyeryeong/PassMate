import type { Dashboard } from '@/types/dashboard';
import { request } from '@/lib/apiClient';

export async function getDashboard(_userId: number): Promise<Dashboard> {
  return request<Dashboard>(`/dashboard`);
}
