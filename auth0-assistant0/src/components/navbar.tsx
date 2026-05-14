import { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export const ActiveLink = (props: { href: string; children: ReactNode }) => {
  const isActive = typeof window !== 'undefined' && window.location.pathname === props.href;
  return (
    <a
      href={props.href}
      className={cn(
        'px-4 py-2 rounded-[18px] whitespace-nowrap flex items-center gap-2 text-sm transition-all',
        isActive && 'bg-primary text-primary-foreground',
      )}
    >
      {props.children}
    </a>
  );
};
