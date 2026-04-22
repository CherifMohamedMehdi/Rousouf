/**
 * Visually-hidden content that remains available to assistive tech.
 * Use this for icon-only controls where the label still needs to exist.
 */
import { cn } from '@/lib/utils';

export default function VisuallyHidden({
  children,
  as: Tag = 'span',
  className,
}: {
  children: React.ReactNode;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
}) {
  const Component = Tag as 'span';
  return (
    <Component
      className={cn(
        'absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0',
        className,
      )}
      style={{ clip: 'rect(0, 0, 0, 0)' }}
    >
      {children}
    </Component>
  );
}
