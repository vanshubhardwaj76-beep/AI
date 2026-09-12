import React, { useMemo } from 'react';
import Svg, { G, Rect } from 'react-native-svg';
import { GRID, spriteSpans } from './sprite';
import type { Sprite } from './sprite';

interface Props {
  sprite: Sprite;
  size: number;
  /** Extra sprites drawn on top (already positioned in the same grid). */
  layers?: (Sprite | null | undefined)[];
  style?: any;
}

/**
 * Renders a 32x32 pixel sprite crisply at any size. Each run of pixels becomes a
 * single <Rect>, so a full character is ~150 nodes — cheap enough to animate.
 */
export function PixelSprite({ sprite, size, layers = [], style }: Props) {
  const all = useMemo(() => [sprite, ...layers.filter(Boolean)] as Sprite[], [sprite, layers]);
  const cell = size / GRID;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${GRID} ${GRID}`} style={style} {...({ shapeRendering: 'crispEdges' } as any)}>
      {all.map((s, li) => (
        <G key={li}>
          {spriteSpans(s).map((sp, i) => (
            <Rect key={i} x={sp.x} y={sp.y} width={sp.w} height={1} fill={sp.color} />
          ))}
        </G>
      ))}
    </Svg>
  );
}

export { GRID };
