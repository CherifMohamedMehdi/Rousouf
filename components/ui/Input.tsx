/**
 * Text input primitive. Ships with the brand focus ring and a sensible
 * default height so it pairs with <Button> without visual fuss.
 */
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        'h-11 w-full rounded-lg border border-border bg-white px-3 text-base text-foreground placeholder:text-muted-foreground',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold',
        className,
      )}
      {...rest}
    />
  );
});

export default Input;
