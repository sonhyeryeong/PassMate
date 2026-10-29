 'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { getUser } from '@/lib/userApi';
import { getErrorMessage } from '@/lib/apiClient';
import type { User } from '@/types/user';
const UserContext = createContext<User | null>(null);
export function useCurrentUser(): User {
 const user = useContext(UserContext);
 if (!user) throw new Error('로그인 상태가 필요합니다.');
 return user;
}
export function AuthGate({children}: {children:ReactNode}) {
 const pathname=usePathname();
 const publicPage=pathname==='/login'||pathname==='/signup';
 const [user,setUser]=useState<User|null>(null);
 const [error,setError]=useState('');
 useEffect(()=>{
  if(publicPage) { setUser(null); return; }
  let active=true;
  setError('');
  getUser().then(value=>{if(active)setUser(value);}).catch(e=>{if(active){setUser(null);setError(getErrorMessage(e,'로그인 상태를 확인하지 못했습니다.'));}});
  return ()=>{active=false;};
 },[publicPage,pathname]);
 if(publicPage) return children;
 if(!user) return <main className="auth-panel surface-panel"><p role={error?'alert':'status'}>{error||'로그인 상태를 확인하는 중입니다.'}</p>{error&&<a href="/login">로그인으로 이동</a>}</main>;
 return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}
