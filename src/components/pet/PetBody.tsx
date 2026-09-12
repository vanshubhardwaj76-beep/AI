import React from 'react';
import { Circle, Ellipse, G, Path, Rect, Line } from 'react-native-svg';
import type { PetMood, PetSpecies } from '@/types';
import { speciesInfo } from '@/data/pets';

/**
 * All pets share a 200x200 coordinate system with the body centred at
 * (100, 120). Each species is drawn from primitive shapes so it scales crisply
 * and stays fully original.
 */

interface FaceProps {
  mood: PetMood;
  blink: boolean;
  cx: number;
  cy: number;
  eyeGap: number;
  accent: string;
  eyeColor?: string;
}

export function Face({ mood, blink, cx, cy, eyeGap, accent, eyeColor = '#2E2320' }: FaceProps) {
  const lx = cx - eyeGap;
  const rx = cx + eyeGap;
  const closed = blink || mood === 'sleepy';
  const happyEyes = mood === 'happy' || mood === 'proud';
  const wide = mood === 'excited' || mood === 'curious';

  const eye = (x: number) => {
    if (closed) return <Path d={`M${x - 7} ${cy} q7 5 14 0`} stroke={eyeColor} strokeWidth={3} fill="none" strokeLinecap="round" />;
    if (happyEyes) return <Path d={`M${x - 7} ${cy + 2} q7 -9 14 0`} stroke={eyeColor} strokeWidth={3.5} fill="none" strokeLinecap="round" />;
    if (mood === 'tired') return <Path d={`M${x - 7} ${cy - 1} q7 4 14 0`} stroke={eyeColor} strokeWidth={3.5} fill="none" strokeLinecap="round" />;
    const r = wide ? 7 : 5.5;
    return (
      <G>
        <Circle cx={x} cy={cy} r={r} fill={eyeColor} />
        <Circle cx={x - r * 0.35} cy={cy - r * 0.4} r={r * 0.33} fill="#fff" />
      </G>
    );
  };

  const mouth = () => {
    const my = cy + 16;
    if (mood === 'excited') return <Ellipse cx={cx} cy={my} rx={5} ry={6} fill="#2E2320" />;
    if (mood === 'curious') return <Circle cx={cx} cy={my} r={3} fill="#2E2320" />;
    if (mood === 'tired') return <Line x1={cx - 5} y1={my} x2={cx + 5} y2={my} stroke="#2E2320" strokeWidth={2.5} strokeLinecap="round" />;
    if (mood === 'sleepy') return <Ellipse cx={cx} cy={my} rx={3} ry={4} fill="#2E2320" />;
    return <Path d={`M${cx - 7} ${my - 2} q7 8 14 0`} stroke="#2E2320" strokeWidth={2.5} fill="none" strokeLinecap="round" />;
  };

  return (
    <G>
      {eye(lx)}
      {eye(rx)}
      {mouth()}
      {/* cheeks */}
      <Circle cx={lx - 8} cy={cy + 12} r={5} fill={accent} opacity={0.35} />
      <Circle cx={rx + 8} cy={cy + 12} r={5} fill={accent} opacity={0.35} />
      {mood === 'proud' && (
        <G>
          <Path d="M 40 60 l 3 -7 l 3 7 l -6 -4 h 7 z" fill="#F9DC7A" opacity={0.9} />
          <Path d="M 155 55 l 3 -7 l 3 7 l -6 -4 h 7 z" fill="#F9DC7A" opacity={0.9} />
        </G>
      )}
      {mood === 'sleepy' && (
        <G>
          <Path d="M150 50 h10 l-10 10 h10" stroke="#8EC5E8" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M163 36 h7 l-7 7 h7" stroke="#8EC5E8" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </G>
      )}
    </G>
  );
}

interface BodyProps {
  species: PetSpecies;
  mood: PetMood;
  blink: boolean;
  wingAngle?: number;
}

export function PetBody({ species, mood, blink, wingAngle = 0 }: BodyProps) {
  const s = speciesInfo(species);
  switch (species) {
    case 'bird':
      return (
        <G>
          {/* tail */}
          <Path d="M55 135 l-25 15 l22 2 z" fill={s.accentColor} />
          {/* body */}
          <Ellipse cx={100} cy={125} rx={58} ry={55} fill={s.bodyColor} />
          <Ellipse cx={100} cy={140} rx={38} ry={33} fill={s.bellyColor} />
          {/* wing */}
          <G transform={`rotate(${wingAngle} 140 125)`}>
            <Ellipse cx={148} cy={128} rx={16} ry={26} fill={s.accentColor} />
          </G>
          <Ellipse cx={52} cy={128} rx={14} ry={24} fill={s.accentColor} />
          {/* tuft */}
          <Path d="M92 72 q8 -18 16 0" stroke={s.accentColor} strokeWidth={5} fill="none" strokeLinecap="round" />
          <Path d="M100 70 q10 -16 20 -4" stroke={s.accentColor} strokeWidth={5} fill="none" strokeLinecap="round" />
          {/* beak */}
          <Path d="M92 112 l16 0 l-8 12 z" fill="#F4B860" />
          <Face mood={mood} blink={blink} cx={100} cy={100} eyeGap={17} accent={s.accentColor} />
          {/* feet */}
          <Path d="M85 178 l-6 8 m6 -8 l0 9 m0 -9 l6 8" stroke="#F4B860" strokeWidth={3} strokeLinecap="round" />
          <Path d="M115 178 l-6 8 m6 -8 l0 9 m0 -9 l6 8" stroke="#F4B860" strokeWidth={3} strokeLinecap="round" />
        </G>
      );
    case 'cat':
      return (
        <G>
          {/* tail */}
          <Path d="M150 150 q30 -10 25 -40" stroke={s.bodyColor} strokeWidth={12} fill="none" strokeLinecap="round" />
          {/* ears */}
          <Path d="M55 80 l8 -32 l26 22 z" fill={s.bodyColor} />
          <Path d="M145 80 l-8 -32 l-26 22 z" fill={s.bodyColor} />
          <Path d="M62 78 l5 -20 l16 14 z" fill={s.bellyColor} opacity={0.8} />
          <Path d="M138 78 l-5 -20 l-16 14 z" fill={s.bellyColor} opacity={0.8} />
          {/* body */}
          <Ellipse cx={100} cy={125} rx={58} ry={55} fill={s.bodyColor} />
          <Ellipse cx={100} cy={150} rx={34} ry={26} fill={s.bellyColor} />
          {/* paws */}
          <Ellipse cx={75} cy={172} rx={14} ry={9} fill={s.bodyColor} />
          <Ellipse cx={125} cy={172} rx={14} ry={9} fill={s.bodyColor} />
          {/* whiskers */}
          <Line x1={55} y1={118} x2={30} y2={114} stroke="#2E2320" strokeWidth={1.5} opacity={0.5} />
          <Line x1={55} y1={124} x2={30} y2={128} stroke="#2E2320" strokeWidth={1.5} opacity={0.5} />
          <Line x1={145} y1={118} x2={170} y2={114} stroke="#2E2320" strokeWidth={1.5} opacity={0.5} />
          <Line x1={145} y1={124} x2={170} y2={128} stroke="#2E2320" strokeWidth={1.5} opacity={0.5} />
          {/* nose */}
          <Path d="M95 116 h10 l-5 6 z" fill={s.accentColor} />
          <Face mood={mood} blink={blink} cx={100} cy={102} eyeGap={18} accent={s.accentColor} />
        </G>
      );
    case 'fox':
      return (
        <G>
          {/* tail */}
          <Path d="M148 150 q40 5 35 -35 q-15 20 -25 20 z" fill={s.bodyColor} />
          <Path d="M175 122 q10 -8 8 -7 q-4 10 -12 14 z" fill={s.bellyColor} />
          {/* ears */}
          <Path d="M52 85 l4 -40 l32 26 z" fill={s.bodyColor} />
          <Path d="M148 85 l-4 -40 l-32 26 z" fill={s.bodyColor} />
          <Path d="M60 82 l3 -26 l20 17 z" fill="#2E2320" opacity={0.7} />
          <Path d="M140 82 l-3 -26 l-20 17 z" fill="#2E2320" opacity={0.7} />
          {/* body */}
          <Ellipse cx={100} cy={125} rx={58} ry={55} fill={s.bodyColor} />
          {/* muzzle */}
          <Path d="M60 110 q40 60 80 0 q-40 25 -80 0 z" fill={s.bellyColor} />
          <Ellipse cx={100} cy={132} rx={30} ry={22} fill={s.bellyColor} />
          <Ellipse cx={100} cy={160} rx={30} ry={18} fill={s.bellyColor} />
          {/* nose */}
          <Ellipse cx={100} cy={122} rx={5} ry={4} fill="#2E2320" />
          <Face mood={mood} blink={blink} cx={100} cy={100} eyeGap={19} accent={s.accentColor} />
          {/* paws */}
          <Ellipse cx={75} cy={174} rx={13} ry={8} fill="#2E2320" opacity={0.6} />
          <Ellipse cx={125} cy={174} rx={13} ry={8} fill="#2E2320" opacity={0.6} />
        </G>
      );
    case 'bunny':
      return (
        <G>
          {/* ears */}
          <Ellipse cx={78} cy={50} rx={12} ry={34} fill={s.bodyColor} transform={`rotate(${-8} 78 50)`} />
          <Ellipse cx={122} cy={50} rx={12} ry={34} fill={s.bodyColor} transform={`rotate(${8} 122 50)`} />
          <Ellipse cx={78} cy={52} rx={6} ry={24} fill={s.bellyColor} transform={`rotate(${-8} 78 52)`} />
          <Ellipse cx={122} cy={52} rx={6} ry={24} fill={s.bellyColor} transform={`rotate(${8} 122 52)`} />
          {/* tail */}
          <Circle cx={150} cy={160} r={12} fill={s.bellyColor} />
          {/* body */}
          <Ellipse cx={100} cy={128} rx={56} ry={52} fill={s.bodyColor} />
          <Ellipse cx={100} cy={150} rx={32} ry={24} fill={s.bellyColor} />
          {/* nose */}
          <Path d="M95 116 h10 l-5 6 z" fill={s.accentColor} />
          <Path d="M100 122 v6 m-6 0 q6 5 12 0" stroke={s.accentColor} strokeWidth={2} fill="none" strokeLinecap="round" />
          <Face mood={mood} blink={blink} cx={100} cy={102} eyeGap={17} accent={s.accentColor} />
          {/* feet */}
          <Ellipse cx={78} cy={176} rx={16} ry={8} fill={s.bodyColor} />
          <Ellipse cx={122} cy={176} rx={16} ry={8} fill={s.bodyColor} />
        </G>
      );
    case 'penguin':
      return (
        <G>
          {/* flippers */}
          <G transform={`rotate(${-wingAngle} 50 125)`}>
            <Ellipse cx={46} cy={130} rx={12} ry={30} fill={s.bodyColor} transform={`rotate(${15} 46 130)`} />
          </G>
          <G transform={`rotate(${wingAngle} 150 125)`}>
            <Ellipse cx={154} cy={130} rx={12} ry={30} fill={s.bodyColor} transform={`rotate(${-15} 154 130)`} />
          </G>
          {/* body */}
          <Ellipse cx={100} cy={120} rx={55} ry={62} fill={s.bodyColor} />
          <Ellipse cx={100} cy={132} rx={38} ry={44} fill={s.bellyColor} />
          {/* face patch */}
          <Ellipse cx={82} cy={98} rx={16} ry={18} fill={s.bellyColor} />
          <Ellipse cx={118} cy={98} rx={16} ry={18} fill={s.bellyColor} />
          {/* beak */}
          <Path d="M90 112 l20 0 l-10 10 z" fill={s.accentColor} />
          <Face mood={mood} blink={blink} cx={100} cy={98} eyeGap={17} accent="#F5A3B5" />
          {/* feet */}
          <Ellipse cx={82} cy={180} rx={16} ry={7} fill={s.accentColor} />
          <Ellipse cx={118} cy={180} rx={16} ry={7} fill={s.accentColor} />
        </G>
      );
  }
}

/** Small decorative sparkle for celebrations */
export function Sparkle({ x, y, size = 6, color = '#F9DC7A' }: { x: number; y: number; size?: number; color?: string }) {
  return <Path d={`M${x} ${y - size} L${x + size * 0.3} ${y - size * 0.3} L${x + size} ${y} L${x + size * 0.3} ${y + size * 0.3} L${x} ${y + size} L${x - size * 0.3} ${y + size * 0.3} L${x - size} ${y} L${x - size * 0.3} ${y - size * 0.3} Z`} fill={color} />;
}

export function EnvironmentBackdrop({ id }: { id: string }) {
  switch (id) {
    case 'env_forest':
      return (
        <G>
          <Rect x={0} y={0} width={200} height={200} rx={40} fill="#DDF1E4" />
          <Ellipse cx={30} cy={90} rx={28} ry={45} fill="#8FD3B6" opacity={0.7} />
          <Ellipse cx={170} cy={80} rx={30} ry={50} fill="#6DBF9C" opacity={0.6} />
          <Ellipse cx={100} cy={200} rx={130} ry={30} fill="#7FCBA6" opacity={0.6} />
        </G>
      );
    case 'env_beach':
      return (
        <G>
          <Rect x={0} y={0} width={200} height={200} rx={40} fill="#DDF0FB" />
          <Circle cx={160} cy={40} r={22} fill="#F9DC7A" />
          <Path d="M0 150 q50 -20 100 0 t100 0 v50 h-200 z" fill="#8EC5E8" opacity={0.6} />
          <Ellipse cx={100} cy={200} rx={130} ry={28} fill="#F7E1B5" />
        </G>
      );
    case 'env_cafe':
      return (
        <G>
          <Rect x={0} y={0} width={200} height={200} rx={40} fill="#F7E4D0" />
          <Rect x={20} y={40} width={50} height={60} rx={8} fill="#FFF6EC" />
          <Rect x={130} y={40} width={50} height={60} rx={8} fill="#FFF6EC" />
          <Ellipse cx={100} cy={200} rx={130} ry={28} fill="#D9B48F" />
        </G>
      );
    case 'env_cabin':
      return (
        <G>
          <Rect x={0} y={0} width={200} height={200} rx={40} fill="#E6E0F5" />
          <Path d="M0 130 l60 -70 l60 70 z" fill="#B8A9E8" opacity={0.6} />
          <Path d="M80 130 l60 -90 l60 90 z" fill="#9A88D6" opacity={0.6} />
          <Ellipse cx={100} cy={200} rx={130} ry={28} fill="#F4EFFA" />
        </G>
      );
    default:
      return (
        <G>
          <Rect x={0} y={0} width={200} height={200} rx={40} fill="#FBE9D7" />
          <Rect x={30} y={30} width={60} height={50} rx={10} fill="#FFF6EC" />
          <Rect x={40} y={38} width={40} height={34} rx={6} fill="#C8E5F5" />
          <Ellipse cx={100} cy={200} rx={130} ry={28} fill="#F4C9A3" opacity={0.7} />
        </G>
      );
  }
}
