import React from 'react';
import { Button, ButtonProps } from './button';
import { cn } from '@/lib/utils';

interface MobileOptimizedButtonProps extends ButtonProps {
  children: React.ReactNode;
  className?: string;
}

const MobileOptimizedButton = React.forwardRef<HTMLButtonElement, MobileOptimizedButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn(
          // Mobile-optimized styles
          'min-h-[44px] min-w-[44px]', // Touch-friendly size
          'text-base', // Readable font size
          'touch-manipulation', // Optimize for touch
          'active:scale-95', // Touch feedback
          'transition-transform duration-150', // Smooth animation
          // Responsive padding
          'px-4 py-3 sm:px-6 sm:py-3',
          className
        )}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

MobileOptimizedButton.displayName = 'MobileOptimizedButton';

export { MobileOptimizedButton };
