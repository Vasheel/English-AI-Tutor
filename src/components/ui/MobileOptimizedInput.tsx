import React from 'react';
import { Input, InputProps } from './input';
import { cn } from '@/lib/utils';

interface MobileOptimizedInputProps extends InputProps {
  className?: string;
}

const MobileOptimizedInput = React.forwardRef<HTMLInputElement, MobileOptimizedInputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type={type}
        className={cn(
          // Mobile-optimized styles
          'min-h-[44px]', // Touch-friendly height
          'text-base', // Prevent zoom on iOS
          'px-4 py-3', // Adequate padding for touch
          'rounded-lg', // Better touch target
          'border-2', // More visible border
          'focus:ring-2 focus:ring-edu-purple', // Better focus indication
          className
        )}
        {...props}
      />
    );
  }
);

MobileOptimizedInput.displayName = 'MobileOptimizedInput';

export { MobileOptimizedInput };
