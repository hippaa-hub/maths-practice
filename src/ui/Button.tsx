import type { ButtonHTMLAttributes, ReactNode } from 'react';

export function Button({ tone = 'green', block, big, small, children, className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: 'green' | 'blue' | 'orange' | 'ghost';
  block?: boolean;
  big?: boolean;
  small?: boolean;
  children: ReactNode;
}) {
  const cls = ['btn', tone === 'green' ? '' : tone, block ? 'block' : '', big ? 'big' : '', small ? 'small' : '', className].filter(Boolean).join(' ');
  return (
    <button type="button" className={cls} {...rest}>
      {children}
    </button>
  );
}
