'use client';

import React from 'react';
import { ReactLenis } from 'lenis/react';

export const SmoothScrollProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ReactLenis
      root
      options={{
        lerp: 0.09,
        duration: 1.1,
        smoothWheel: true,
        wheelMultiplier: 1.0,
        touchMultiplier: 1.8,
        infinite: false,
      }}
    >
      {children}
    </ReactLenis>
  );
};
