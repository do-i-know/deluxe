'use client';

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

/**
 * Aceternity Spotlight: Ultra-smooth, hardware-accelerated light beam
 * Replaces heavy 3787px SVG Gaussian blur filters with pure GPU-composited radial lighting
 */
export const Spotlight: React.FC<{
  className?: string;
  fill?: string;
}> = ({ className, fill = '#f59e0b' }) => {
  return (
    <div
      className={cn(
        'animate-spotlight pointer-events-none absolute z-[1] w-[650px] h-[650px] sm:w-[950px] sm:h-[950px] opacity-0 select-none will-change-transform',
        className
      )}
      style={{
        transform: 'translate3d(0, 0, 0)',
        contain: 'paint layout',
      }}
    >
      {/* Primary Focused Light Beam */}
      <div
        className="w-full h-full rounded-full"
        style={{
          background: `radial-gradient(ellipse 70% 55% at 50% 30%, ${fill}38 0%, ${fill}18 35%, ${fill}06 60%, transparent 80%)`,
          filter: 'blur(35px)',
          transform: 'rotate(-25deg) translateZ(0)',
        }}
      />
    </div>
  );
};

/**
 * Aceternity Lamp Header: Illuminates the hero area with a warm golden ambiance
 */
export const LampEffect: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <div
      className={cn(
        'relative flex min-h-[260px] flex-col items-center justify-center overflow-hidden w-full rounded-2xl z-0',
        className
      )}
    >
      <div className="relative flex w-full flex-1 scale-y-125 items-center justify-center isolate z-0">
        <div
          style={{
            backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
          }}
          className="absolute inset-auto right-1/2 h-56 overflow-visible w-[30rem] bg-gradient-conic from-amber-500/35 via-transparent to-transparent text-white [--conic-position:from_70deg_at_center_top]"
        >
          <div className="absolute w-[100%] left-0 bg-[#120806] h-40 bottom-0 z-20 [mask-image:linear-gradient(to_top,white,transparent)]" />
          <div className="absolute w-40 h-[100%] left-0 bg-[#120806] bottom-0 z-20 [mask-image:linear-gradient(to_right,white,transparent)]" />
        </div>
        <div
          style={{
            backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
          }}
          className="absolute inset-auto left-1/2 h-56 w-[30rem] bg-gradient-conic from-transparent via-transparent to-amber-500/35 text-white [--conic-position:from_290deg_at_center_top]"
        >
          <div className="absolute w-40 h-[100%] right-0 bg-[#120806] bottom-0 z-20 [mask-image:linear-gradient(to_left,white,transparent)]" />
          <div className="absolute w-[100%] right-0 bg-[#120806] h-40 bottom-0 z-20 [mask-image:linear-gradient(to_top,white,transparent)]" />
        </div>
        <div className="absolute top-1/2 h-48 w-full translate-y-12 scale-x-150 bg-[#120806] blur-2xl"></div>
        <div className="absolute top-1/2 z-50 h-48 w-full bg-transparent opacity-10 backdrop-blur-md"></div>
        <div className="absolute inset-auto z-50 h-36 w-[28rem] -translate-y-1/2 rounded-full bg-amber-500/30 opacity-50 blur-3xl"></div>
        <div className="absolute inset-auto z-30 h-36 w-64 -translate-y-[6rem] rounded-full bg-amber-400/40 blur-2xl"></div>
        <div className="absolute inset-auto z-50 h-0.5 w-[30rem] -translate-y-[7rem] bg-amber-400/80"></div>
      </div>

      <div className="relative z-50 flex -translate-y-20 flex-col items-center px-5">
        {children}
      </div>
    </div>
  );
};

/**
 * Aceternity Shimmer Button: Luxury button with glowing sweep
 */
export const ShimmerButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    shimmerColor?: string;
    background?: string;
    borderRadius?: string;
  }
> = ({
  children,
  className,
  shimmerColor = '#fbbf24',
  background = 'rgba(28, 12, 8, 0.9)',
  borderRadius = '9999px',
  ...props
}) => {
  return (
    <button
      style={
        {
          '--shimmer-color': shimmerColor,
          '--background': background,
          borderRadius,
        } as React.CSSProperties
      }
      className={cn(
        'group relative inline-flex items-center justify-center overflow-hidden border border-amber-500/30 px-5 py-2.5 font-semibold text-white shadow-lg transition-all duration-300 hover:border-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.35)] active:scale-95 cursor-pointer',
        className
      )}
      {...props}
    >
      <span className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-amber-400/20 to-transparent" />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
};

/**
 * Aceternity Background Beams: Floating cosmic ambient dust for retro lounge atmosphere
 * Layer-isolated and optimized with CSS containment to prevent scroll repaints
 */
export const AmbientBeams: React.FC<{ accentColor?: string }> = ({ accentColor }) => {
  const baseColor = accentColor || 'rgba(217, 119, 6, 0.25)';
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-25 select-none transition-colors duration-1000"
      style={{
        contain: 'strict',
        transform: 'translate3d(0, 0, 0)',
      }}
    >
      <div
        className="absolute -top-32 -left-32 h-96 w-96 rounded-full transition-all duration-1000"
        style={{
          background: `radial-gradient(circle, ${baseColor} 0%, transparent 70%)`,
          filter: 'blur(45px)',
          transform: 'translateZ(0)',
        }}
      />
      <div
        className="absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full transition-all duration-1000"
        style={{
          background: `radial-gradient(circle, ${baseColor} 0%, transparent 70%)`,
          filter: 'blur(50px)',
          transform: 'translateZ(0)',
        }}
      />
      <div
        className="absolute -bottom-32 left-1/3 h-96 w-96 rounded-full transition-all duration-1000"
        style={{
          background: `radial-gradient(circle, ${baseColor} 0%, transparent 70%)`,
          filter: 'blur(45px)',
          transform: 'translateZ(0)',
        }}
      />
    </div>
  );
};

