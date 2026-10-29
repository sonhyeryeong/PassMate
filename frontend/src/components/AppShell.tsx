'use client';
import { useState } from 'react';
import { logout } from '@/lib/userApi';
import { getErrorMessage } from '@/lib/apiClient';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { BottomNav } from '@/components/BottomNav';

type NavKey = 'dashboard' | 'folder' | 'review' | 'mypage';

interface AppShellProps {
  active: NavKey;
  children: ReactNode;
  eyebrow?: string;
  title: string;
  actions?: ReactNode;
}

const navItems: Array<{ key: NavKey; label: string; href: string }> = [
  { key: 'dashboard', label: '대시보드', href: '/' },
  { key: 'folder', label: '폴더', href: '/folder' },
  { key: 'review', label: '복습', href: '/review' },
  { key: 'mypage', label: '마이페이지', href: '/mypage' },
];

export function AppShell({ active, actions, children, eyebrow, title }: AppShellProps) {
  const [error,setError]=useState('');
  const [leaving,setLeaving]=useState(false);
  async function signOut() {
    setLeaving(true);
    try { await logout(); } catch(e) {setError(getErrorMessage(e,'로그아웃하지 못했습니다.'));setLeaving(false);}
  }
  return (
    <div className="app-layout">
      <aside className="sidebar" aria-label="주요 메뉴">
        <Link className="sidebar__brand" href="/">
          PassMate
        </Link>
        <nav className="sidebar__nav">
          {navItems.map((item) => (
            <Link
              aria-current={active === item.key ? 'page' : undefined}
              className={`sidebar__link${active === item.key ? ' sidebar__link--active' : ''}`}
              href={item.href}
              key={item.key}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="workspace">
        <header className="workspace-header">
          <div>
            {eyebrow && <p className="workspace-header__eyebrow">{eyebrow}</p>}
            <h1>{title}</h1>
          </div>
          <div className="workspace-header__actions">{actions}<button className="secondary-button" disabled={leaving} onClick={()=>void signOut()} type="button">로그아웃</button>{error&&<p role="alert">{error}</p>}</div>
        </header>
        <main className="workspace-main">{children}</main>
      </div>

      <BottomNav active={active === 'review' || active === 'mypage' ? active : 'deck'} />
    </div>
  );
}
