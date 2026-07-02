import type { CreateUserRequest, User, UserListResponse } from '@/types/user';

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

export async function getUsers(): Promise<User[]> {
  const data = await request<UserListResponse>('/users');
  return data.items;
}

export async function createUser(payload: CreateUserRequest): Promise<User> {
  return request<User>('/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
