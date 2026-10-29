 'use client';
import { AppShell } from '@/components/AppShell';
import { useCurrentUser } from '@/components/AuthGate';
export default function MyPage() {
 const user=useCurrentUser();
 return <AppShell active="mypage" title="내 정보"><section className="surface-panel profile-panel"><h2>{user.nickname}</h2><p>가입일: {new Date(user.createdAt).toLocaleDateString('ko-KR')}</p><p>현재 비밀번호 찾기·재설정을 지원하지 않습니다.</p></section></AppShell>;
}
