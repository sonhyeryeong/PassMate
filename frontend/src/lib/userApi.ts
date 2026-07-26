import type { CreateUserRequest, User, UserListResponse } from '@/types/user';
import { request } from '@/lib/apiClient';

export async function getUsers(): Promise<User[]> {
  const data = await request<UserListResponse>('/users');
  return data.items;
}

export async function getUser(userId: number): Promise<User> {
  return request<User>(`/users/${userId}`);
}

export async function createUser(payload: CreateUserRequest): Promise<User> {
  return request<User>('/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
