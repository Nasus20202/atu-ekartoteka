'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

import { resetAuthExit, useAuthExiting } from '@/components/layout/auth-exit';
import {
  buildSkyline,
  SKYLINE_HEIGHT,
  SKYLINE_LAYERS,
  SKYLINE_WIDTH,
  windowsPath,
} from '@/components/layout/skyline-layout';
import { cn } from '@/lib/utils';

const FADE_MASK =
  'linear-gradient(to top, black 0%, black 35%, transparent 100%)';

const LAYERS = [
  { buildings: buildSkyline(SKYLINE_LAYERS.back), opacity: 0.05 },
  { buildings: buildSkyline(SKYLINE_LAYERS.front), opacity: 0.08 },
].map((layer) => ({ ...layer, windows: windowsPath(layer.buildings) }));

/**
 * A barely visible skyline of skeleton-like blocks along the bottom of the auth
 * pages. It lowers itself out of view when the user signs in.
 */
export function AuthSkyline() {
  const exiting = useAuthExiting();

  const pathname = usePathname();

  // Moving to another auth page after signing in (e.g. the forced password
  // change) raises the skyline again
  useEffect(() => {
    resetAuthExit();
  }, [pathname]);

  useEffect(() => resetAuthExit, []);

  return (
    <div
      aria-hidden="true"
      data-testid="auth-skyline"
      data-exiting={exiting}
      className={cn(
        'pointer-events-none absolute inset-x-0 bottom-0 h-[34vh] sm:h-[48vh]',
        'transition-transform duration-1000 ease-[cubic-bezier(0.3,0,0.5,1)] motion-reduce:transition-none',
        exiting && 'translate-y-full'
      )}
      style={{ maskImage: FADE_MASK, WebkitMaskImage: FADE_MASK }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${SKYLINE_WIDTH} ${SKYLINE_HEIGHT}`}
        preserveAspectRatio="xMidYMax slice"
      >
        {LAYERS.map(({ buildings, opacity, windows }, index) => (
          <g key={index}>
            {buildings.map((building) => (
              <g key={building.x}>
                <rect
                  x={building.x}
                  y={building.y}
                  width={building.width}
                  height={building.height + 10}
                  rx={10}
                  fill="hsl(var(--background))"
                />
                <rect
                  x={building.x}
                  y={building.y}
                  width={building.width}
                  height={building.height + 10}
                  rx={10}
                  fill="hsl(var(--primary))"
                  fillOpacity={opacity}
                />
              </g>
            ))}
            <path
              d={windows}
              fill="hsl(var(--primary))"
              fillOpacity={opacity}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}
