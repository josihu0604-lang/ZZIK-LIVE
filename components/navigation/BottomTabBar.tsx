// components/navigation/BottomTabBar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Map, QrCode, Wallet, Gift } from 'lucide-react';

export default function BottomTabBar() {
  const pathname = usePathname();
  const active = (href: string) => (pathname?.startsWith(href) ? 'page' : undefined);

  const Item = ({ href, Icon, label }:{href:string; Icon:any; label:string}) => (
    <Link href={href} aria-current={active(href)}
      className="text-body"
      style={{
        display:'grid', justifyItems:'center', gap:4, padding:'10px',
        color: active(href) ? 'var(--text)' : 'var(--text-muted)'
      }}>
      <Icon size={24} strokeWidth={1.75} aria-hidden />
      <span>{label}</span>
    </Link>
  );

  return (
    <nav aria-label="하단 내비게이션"
         style={{position:'sticky', bottom:0, background:'#fff',
                 display:'grid', gridTemplateColumns:'repeat(4,1fr)', borderTop:`1px solid var(--border)`}}>
      <Item href="/pass"   Icon={Map}    label="탐색" />
      <Item href="/offers" Icon={Gift}   label="오퍼" />
      <Item href="/scan"   Icon={QrCode} label="스캔" />
      <Item href="/wallet" Icon={Wallet} label="지갑" />
    </nav>
  );
}