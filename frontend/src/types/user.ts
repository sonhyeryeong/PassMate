export interface User {
  id: number;
  email: string;
  nickname: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserListResponse {
  items: User[];
}

export interface CreateUserRequest {
  email: string;
  nickname: string;
}
