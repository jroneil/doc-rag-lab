import * as React from 'react';

import { cn } from '@/lib/utils';

export const Switch = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <label className={cn('relative inline-flex cursor-pointer items-center', className)}>
      <input ref={ref} type="checkbox" className="peer sr-only" {...props} />
      <span className="h-5 w-9 rounded-full bg-slate-200 transition peer-checked:bg-slate-900 peer-focus-visible:ring-2 peer-focus-visible:ring-slate-900 peer-focus-visible:ring-offset-2" />
      <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition peer-checked:translate-x-4" />
    </label>
  ),
);

Switch.displayName = 'Switch';
