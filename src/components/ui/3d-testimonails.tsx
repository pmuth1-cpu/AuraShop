import React, { ComponentPropsWithoutRef } from 'react';

interface MarqueeProps extends ComponentPropsWithoutRef<'div'> {
  className?: string;
  reverse?: boolean;
  pauseOnHover?: boolean;
  children: React.ReactNode;
  vertical?: boolean;
  repeat?: number;
  ariaLabel?: string;
  ariaLive?: 'off' | 'polite' | 'assertive';
  ariaRole?: string;
}

export function Marquee({
  className,
  reverse = false,
  pauseOnHover = false,
  children,
  vertical = false,
  repeat = 4,
  ariaLabel,
  ariaLive = 'off',
  ariaRole = 'marquee',
  ...props
}: MarqueeProps) {
  return (
    <div
      {...props}
      data-slot="marquee"
      className={['group flex overflow-hidden p-2 [--duration:40s] [--gap:1rem] gap-(--gap)',
        vertical ? 'flex-col' : 'flex-row',
        className,
      ].filter(Boolean).join(' ')}
      aria-label={ariaLabel}
      aria-live={ariaLive}
      role={ariaRole}
      tabIndex={0}
    >
      {Array.from({ length: repeat }, (_, i) => (
        <div
          key={i}
          className={[
            'flex shrink-0 justify-around',
            vertical ? 'flex-col gap-(--gap) animate-marquee-vertical' : 'flex-row gap-(--gap) animate-marquee',
            pauseOnHover && 'group-hover:paused',
            reverse && 'direction-[reverse]',
          ].filter(Boolean).join(' ')}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
