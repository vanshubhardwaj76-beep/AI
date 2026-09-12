import React from 'react';
import { Circle, Ellipse, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import type { Pet, PetSpecies } from '@/types';

/** Head top offsets per species so hats sit correctly. */
const HAT_Y: Record<PetSpecies, number> = { bird: 68, cat: 72, fox: 70, bunny: 78, penguin: 60 };
const EYE_Y: Record<PetSpecies, number> = { bird: 100, cat: 102, fox: 100, bunny: 102, penguin: 98 };
const NECK_Y: Record<PetSpecies, number> = { bird: 138, cat: 138, fox: 140, bunny: 140, penguin: 138 };

export function Accessories({ pet }: { pet: Pet }) {
  const s = pet.species;
  const e = pet.equipped;
  return (
    <G>
      {e.backpack && <Backpack id={e.backpack} />}
      {e.jacket && <Jacket id={e.jacket} y={NECK_Y[s]} />}
      {e.scarf && <Scarf id={e.scarf} y={NECK_Y[s]} />}
      {e.glasses && <Glasses id={e.glasses} y={EYE_Y[s]} />}
      {e.hat && <Hat id={e.hat} y={HAT_Y[s]} />}
      {e.toy && <Toy id={e.toy} />}
      {e.companion && <Companion id={e.companion} />}
    </G>
  );
}

function Hat({ id, y }: { id: string; y: number }) {
  switch (id) {
    case 'hat_beanie':
      return (
        <G>
          <Path d={`M62 ${y + 8} q38 -45 76 0 z`} fill="#E76F51" />
          <Rect x={60} y={y} width={80} height={12} rx={6} fill="#C85C34" />
          <Circle cx={100} cy={y - 28} r={8} fill="#FFF6EC" />
        </G>
      );
    case 'hat_flower':
      return (
        <G>
          <Path d={`M62 ${y + 4} q38 -14 76 0`} stroke="#8FD3B6" strokeWidth={5} fill="none" strokeLinecap="round" />
          {[70, 88, 106, 124].map((x, i) => (
            <G key={x}>
              <Circle cx={x} cy={y - 2 - (i % 2) * 4} r={6} fill={i % 2 ? '#F5A3B5' : '#F9DC7A'} />
              <Circle cx={x} cy={y - 2 - (i % 2) * 4} r={2.5} fill="#fff" />
            </G>
          ))}
        </G>
      );
    case 'hat_wizard':
      return (
        <G>
          <Path d={`M65 ${y + 6} L100 ${y - 55} L135 ${y + 6} z`} fill="#B8A9E8" />
          <Ellipse cx={100} cy={y + 6} rx={42} ry={8} fill="#8E7CD1" />
          <Path d={`M100 ${y - 30} l3 6 l6 1 l-4 4 l1 6 l-6 -3 l-6 3 l1 -6 l-4 -4 l6 -1 z`} fill="#F9DC7A" />
        </G>
      );
    case 'hat_crown':
      return (
        <G>
          <Path d={`M74 ${y + 4} v-20 l12 12 l14 -20 l14 20 l12 -12 v20 z`} fill="#F9DC7A" />
          <Circle cx={100} cy={y - 8} r={3} fill="#E76F51" />
        </G>
      );
    default:
      return null;
  }
}

function Glasses({ id, y }: { id: string; y: number }) {
  if (id === 'glasses_round')
    return (
      <G>
        <Circle cx={83} cy={y} r={12} stroke="#4A3B32" strokeWidth={2.5} fill="rgba(255,255,255,0.15)" />
        <Circle cx={117} cy={y} r={12} stroke="#4A3B32" strokeWidth={2.5} fill="rgba(255,255,255,0.15)" />
        <Line x1={95} y1={y} x2={105} y2={y} stroke="#4A3B32" strokeWidth={2.5} />
      </G>
    );
  if (id === 'glasses_sun')
    return (
      <G>
        <Rect x={70} y={y - 9} width={26} height={18} rx={7} fill="#2A2640" />
        <Rect x={104} y={y - 9} width={26} height={18} rx={7} fill="#2A2640" />
        <Line x1={96} y1={y - 3} x2={104} y2={y - 3} stroke="#2A2640" strokeWidth={3} />
        <Line x1={74} y1={y - 5} x2={84} y2={y - 5} stroke="#fff" strokeWidth={2} opacity={0.5} />
      </G>
    );
  if (id === 'glasses_heart')
    return (
      <G>
        <Path d={`M83 ${y + 8} l-10 -10 a6 6 0 0 1 10 -7 a6 6 0 0 1 10 7 z`} fill="#F5A3B5" opacity={0.9} />
        <Path d={`M117 ${y + 8} l-10 -10 a6 6 0 0 1 10 -7 a6 6 0 0 1 10 7 z`} fill="#F5A3B5" opacity={0.9} />
        <Line x1={93} y1={y} x2={107} y2={y} stroke="#F5A3B5" strokeWidth={2.5} />
      </G>
    );
  return null;
}

function Scarf({ id, y }: { id: string; y: number }) {
  const color = id === 'scarf_mint' ? '#8FD3B6' : id === 'scarf_bow' ? '#F5A3B5' : '#E76F51';
  if (id === 'scarf_bow')
    return (
      <G>
        <Path d={`M100 ${y} l-18 -10 v20 z`} fill={color} />
        <Path d={`M100 ${y} l18 -10 v20 z`} fill={color} />
        <Circle cx={100} cy={y} r={5} fill="#D97A91" />
      </G>
    );
  return (
    <G>
      <Path d={`M52 ${y} q48 22 96 0`} stroke={color} strokeWidth={14} fill="none" strokeLinecap="round" />
      <Path d={`M118 ${y + 6} l6 26`} stroke={color} strokeWidth={12} strokeLinecap="round" />
      <Line x1={121} y1={y + 24} x2={125} y2={y + 28} stroke="#fff" strokeWidth={2} opacity={0.5} />
    </G>
  );
}

function Jacket({ id, y }: { id: string; y: number }) {
  if (id === 'jacket_space')
    return (
      <G>
        <Path d={`M48 ${y - 6} q52 30 104 0 v40 q-52 22 -104 0 z`} fill="#E8EEF7" />
        <Circle cx={100} cy={y + 18} r={8} fill="#8EC5E8" />
        <Rect x={92} y={y + 30} width={16} height={4} rx={2} fill="#E76F51" />
      </G>
    );
  return (
    <G>
      <Path d={`M48 ${y - 6} q52 30 104 0 v40 q-52 22 -104 0 z`} fill="#F9DC7A" />
      <Line x1={100} y1={y + 8} x2={100} y2={y + 44} stroke="#E0A800" strokeWidth={2} />
      <Circle cx={100} cy={y + 16} r={2.5} fill="#E0A800" />
      <Circle cx={100} cy={y + 30} r={2.5} fill="#E0A800" />
    </G>
  );
}

function Backpack({ id }: { id: string }) {
  if (id === 'bag_shell')
    return (
      <G>
        <Path d="M40 120 a22 22 0 1 1 0 44 q-8 -22 0 -44 z" fill="#F5A3B5" />
        <Path d="M40 126 q10 16 0 32" stroke="#fff" strokeWidth={2} fill="none" opacity={0.6} />
      </G>
    );
  return (
    <G>
      <Rect x={22} y={112} width={30} height={46} rx={10} fill="#8FD3B6" />
      <Rect x={28} y={122} width={18} height={12} rx={4} fill="#4FA98B" />
    </G>
  );
}

function Toy({ id }: { id: string }) {
  if (id === 'toy_kite')
    return (
      <G>
        <Path d="M170 30 l14 18 l-14 18 l-14 -18 z" fill="#8EC5E8" />
        <Line x1={170} y1={66} x2={160} y2={110} stroke="#4A3B32" strokeWidth={1.5} />
        <Path d="M170 66 q-6 8 0 12 q6 8 0 14" stroke="#F5A3B5" strokeWidth={2} fill="none" />
      </G>
    );
  return (
    <G>
      <Circle cx={168} cy={172} r={12} fill="#E76F51" />
      <Path d="M158 166 q10 6 20 0" stroke="#fff" strokeWidth={2} fill="none" />
      <Path d="M158 178 q10 -6 20 0" stroke="#fff" strokeWidth={2} fill="none" />
    </G>
  );
}

function Companion({ id }: { id: string }) {
  if (id === 'comp_snail')
    return (
      <G>
        <Ellipse cx={34} cy={182} rx={16} ry={6} fill="#8FD3B6" />
        <Circle cx={38} cy={172} r={10} fill="#F9DC7A" />
        <Path d="M38 172 a5 5 0 1 1 5 5" stroke="#E0A800" strokeWidth={2} fill="none" />
        <Line x1={22} y1={178} x2={18} y2={170} stroke="#8FD3B6" strokeWidth={2} />
        <Circle cx={18} cy={169} r={1.5} fill="#2E2320" />
      </G>
    );
  if (id === 'comp_duck')
    return (
      <G>
        <Ellipse cx={168} cy={178} rx={14} ry={9} fill="#F9DC7A" />
        <Circle cx={178} cy={166} r={8} fill="#F9DC7A" />
        <Path d="M185 167 l7 2 l-7 2 z" fill="#F4A261" />
        <Circle cx={180} cy={164} r={1.5} fill="#2E2320" />
      </G>
    );
  if (id === 'comp_sprite')
    return (
      <G>
        <Circle cx={160} cy={60} r={9} fill="#B8A9E8" opacity={0.9} />
        <Circle cx={160} cy={60} r={14} fill="#B8A9E8" opacity={0.25} />
        <Circle cx={157} cy={58} r={1.5} fill="#fff" />
        <Circle cx={163} cy={58} r={1.5} fill="#fff" />
        <SvgText x={172} y={48} fontSize={10} fill="#F9DC7A">✦</SvgText>
      </G>
    );
  return null;
}
