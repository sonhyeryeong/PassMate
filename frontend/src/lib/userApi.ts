import type { User } from '@/types/user';
import { request } from '@/lib/apiClient';
export function getUser(): Promise<User> { return request<User>('/users/me'); }
export function signup(loginId: string, nickname: string, password: string): Promise<void> {
 return request<void>('/auth/signup', {method:'POST', body:JSON.stringify({loginId,nickname,password})});
}
export function login(loginId: string, password: string): Promise<void> {
 return request<void>('/auth/login', {method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body:new URLSearchParams({loginId,password}).toString()});
}
export async function logout(): Promise<void> {
 await request<void>('/auth/logout',{method:'POST'});
 window.location.replace('/login');
}
