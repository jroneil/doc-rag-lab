import type { InputHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export function Switch({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={cn('relative inline-flex items-center', className)}>
      <input type="checkbox" className="peer sr-only" {...props} />
      <span className="h-5 w-9 rounded-full bg-slate-200 transition peer-checked:bg-slate-900" />
      <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-4" />
    </label>
  );
}
