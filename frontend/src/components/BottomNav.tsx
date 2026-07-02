import Link from 'next/link';

type NavKey = 'deck' | 'review' | 'mypage';

interface BottomNavProps {
  active: NavKey;
}

const items: Array<{ key: NavKey; label: string; href: string }> = [
  { key: 'deck', label: '덱', href: '/' },
  { key: 'review', label: '복습', href: '/' },
  { key: 'mypage', label: '마이', href: '/' },
];

export function BottomNav({ active }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="주요 메뉴">
      {items.map((item) => (
        <Link
          aria-current={active === item.key ? 'page' : undefined}
          className={`bottom-nav__item${active === item.key ? ' bottom-nav__item--active' : ''}`}
          href={item.href}
          key={item.key}
        >
          <span className="bottom-nav__icon" aria-hidden="true" />
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
