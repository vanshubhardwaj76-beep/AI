import React, { useState } from 'react';
import { View, LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Path, Line } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';

interface Props {
  values: (number | null)[];
  min: number;
  max: number;
  color: string;
  height?: number;
}

/** Minimal smooth line chart; nulls create gaps. */
export function LineChart({ values, min, max, color, height = 120 }: Props) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const pad = 10;
  const n = values.length;
  const x = (i: number) => pad + (i / Math.max(1, n - 1)) * (width - pad * 2);
  const y = (v: number) => height - pad - ((v - min) / (max - min)) * (height - pad * 2);

  let d = '';
  let pen = false;
  values.forEach((v, i) => {
    if (v === null) {
      pen = false;
      return;
    }
    d += `${pen ? 'L' : 'M'}${x(i)} ${y(v)} `;
    pen = true;
  });

  return (
    <View onLayout={onLayout} style={{ height, width: '100%' }}>
      {width > 0 && (
        <Svg width={width} height={height}>
          {[0, 0.5, 1].map((t) => (
            <Line key={t} x1={pad} x2={width - pad} y1={pad + t * (height - pad * 2)} y2={pad + t * (height - pad * 2)} stroke={colors.border} strokeWidth={1} />
          ))}
          <Path d={d} stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          {values.map((v, i) => (v === null ? null : <Circle key={i} cx={x(i)} cy={y(v)} r={4} fill={color} />))}
        </Svg>
      )}
    </View>
  );
}
