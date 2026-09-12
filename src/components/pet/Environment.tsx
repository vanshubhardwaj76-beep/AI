import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Polygon, RadialGradient, Rect, Stop } from 'react-native-svg';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

/**
 * Illustrated 2D environments. Each scene is built from three depth layers
 * (sky/far, mid, foreground) so the mid + foreground can drift for parallax,
 * plus a slow ambient particle layer. Coordinate space is 200x200.
 */
export type EnvironmentId = 'env_bedroom' | 'env_forest' | 'env_beach' | 'env_cafe' | 'env_cabin' | 'env_garden' | 'env_village' | 'env_space' | string;

interface Props {
  id: EnvironmentId;
  size: number;
  radius?: number;
  animated?: boolean;
  children?: React.ReactNode;
}

export function Environment({ id, size, radius = 36, animated = true, children }: Props) {
  const drift = useSharedValue(0);
  const rise = useSharedValue(0);
  useEffect(() => {
    if (!animated) return;
    drift.value = withRepeat(withSequence(withTiming(1, { duration: 6000, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 6000, easing: Easing.inOut(Easing.sin) })), -1);
    rise.value = withRepeat(withTiming(1, { duration: 9000, easing: Easing.linear }), -1);
  }, [animated, drift, rise]);
  const far = useAnimatedStyle(() => ({ transform: [{ translateX: (drift.value - 0.5) * size * 0.015 }] }));
  const mid = useAnimatedStyle(() => ({ transform: [{ translateX: (drift.value - 0.5) * size * 0.035 }] }));
  const near = useAnimatedStyle(() => ({ transform: [{ translateX: (drift.value - 0.5) * -size * 0.05 }] }));
  const particles = useAnimatedStyle(() => ({ transform: [{ translateY: -rise.value * size * 0.5 }], opacity: 1 - Math.abs(rise.value - 0.5) * 1.2 }));

  const scene = SCENES[id] ?? SCENES.env_bedroom;
  const L = (node: React.ReactNode, style: any, key: string) => (
    <Animated.View key={key} style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <Svg width={size} height={size} viewBox="0 0 200 200">{node}</Svg>
    </Animated.View>
  );

  return (
    <View style={{ width: size, height: size, borderRadius: radius, overflow: 'hidden' }}>
      <Svg width={size} height={size} viewBox="0 0 200 200" style={StyleSheet.absoluteFill}>
        {scene.sky}
      </Svg>
      {L(scene.far, far, 'far')}
      {L(scene.mid, mid, 'mid')}
      {scene.particles ? L(scene.particles, particles, 'p') : null}
      <View style={styles.pet} pointerEvents="box-none">{children}</View>
      {L(scene.near, near, 'near')}
    </View>
  );
}

const styles = StyleSheet.create({ pet: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'flex-end' } });

interface Scene { sky: React.ReactNode; far: React.ReactNode; mid: React.ReactNode; near: React.ReactNode; particles?: React.ReactNode }

const grad = (id: string, from: string, to: string) => (
  <Defs>
    <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <Stop offset="0" stopColor={from} />
      <Stop offset="1" stopColor={to} />
    </LinearGradient>
  </Defs>
);

const cloud = (x: number, y: number, s: number, c = '#FFFFFF') => (
  <G key={`${x}-${y}`} opacity={0.9}>
    <Ellipse cx={x} cy={y} rx={14 * s} ry={7 * s} fill={c} />
    <Ellipse cx={x - 8 * s} cy={y + 2 * s} rx={8 * s} ry={5 * s} fill={c} />
    <Ellipse cx={x + 9 * s} cy={y + 1 * s} rx={9 * s} ry={6 * s} fill={c} />
  </G>
);

const tree = (x: number, y: number, s: number, c1: string, c2: string) => (
  <G key={`${x}-${y}`}>
    <Rect x={x - 2 * s} y={y - 14 * s} width={4 * s} height={16 * s} fill="#7A5236" />
    <Polygon points={`${x},${y - 40 * s} ${x - 16 * s},${y - 12 * s} ${x + 16 * s},${y - 12 * s}`} fill={c1} />
    <Polygon points={`${x},${y - 30 * s} ${x - 13 * s},${y - 6 * s} ${x + 13 * s},${y - 6 * s}`} fill={c2} />
    <Polygon points={`${x},${y - 40 * s} ${x - 7 * s},${y - 24 * s} ${x},${y - 22 * s}`} fill="#FFFFFF" opacity={0.18} />
  </G>
);

const flower = (x: number, y: number, c: string) => (
  <G key={`${x}-${y}`}>
    <Rect x={x - 0.5} y={y - 5} width={1} height={5} fill="#4FA98B" />
    <Circle cx={x} cy={y - 6} r={2.2} fill={c} />
    <Circle cx={x} cy={y - 6} r={0.9} fill="#FFF6EC" />
  </G>
);

const star = (x: number, y: number, r: number, c = '#FFFFFF') => <Circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill={c} />;

const SCENES: Record<string, Scene> = {
  env_bedroom: {
    sky: (<G>{grad('bed', '#FFE9D6', '#FBD9BF')}<Rect width={200} height={200} fill="url(#bed)" /><Rect x={0} y={132} width={200} height={68} fill="#E6B98F" /><Rect x={0} y={132} width={200} height={3} fill="#C9946B" />
      {Array.from({ length: 7 }).map((_, i) => <Rect key={i} x={0} y={140 + i * 9} width={200} height={1} fill="#D9A97F" />)}</G>),
    far: (<G><Rect x={28} y={26} width={62} height={56} rx={6} fill="#FFF8F0" /><Rect x={33} y={31} width={52} height={46} rx={4} fill="#BFE0F5" /><Rect x={58} y={31} width={2} height={46} fill="#FFF8F0" /><Rect x={33} y={53} width={52} height={2} fill="#FFF8F0" />
      {cloud(48, 44, 0.5, '#FFFFFF')}<Rect x={22} y={22} width={74} height={5} rx={2} fill="#D97B3F" /><Path d="M24 27 v40 q0 6 -6 6 h-2 v-46z" fill="#F5A3B5" opacity={0.85} /><Path d="M94 27 v40 q0 6 6 6 h2 v-46z" fill="#F5A3B5" opacity={0.85} />
      <Rect x={118} y={44} width={54} height={40} rx={4} fill="#F4C9A3" /><Rect x={122} y={48} width={46} height={32} rx={3} fill="#FFF8F0" /><Circle cx={145} cy={62} r={10} fill="#8FD3B6" /><Circle cx={141} cy={60} r={4} fill="#BFE9D6" /></G>),
    mid: (<G><Rect x={116} y={98} width={64} height={38} rx={5} fill="#B8A9E8" /><Rect x={116} y={92} width={64} height={12} rx={6} fill="#D6CCF7" /><Rect x={120} y={104} width={56} height={4} rx={2} fill="#8E7CD1" opacity={0.5} /><Rect x={126} y={86} width={20} height={12} rx={5} fill="#FFF6EC" /><Rect x={150} y={86} width={20} height={12} rx={5} fill="#F5A3B5" />
      <Rect x={12} y={104} width={26} height={32} rx={4} fill="#D97B3F" /><Rect x={16} y={108} width={18} height={10} rx={2} fill="#F4A261" /><Rect x={16} y={121} width={18} height={10} rx={2} fill="#F4A261" /><Circle cx={25} cy={113} r={1.5} fill="#4A2C22" /><Circle cx={25} cy={126} r={1.5} fill="#4A2C22" />
      <Rect x={20} y={90} width={10} height={14} rx={2} fill="#8FD3B6" /><Rect x={18} y={88} width={14} height={3} rx={1} fill="#4FA98B" /></G>),
    near: (<G><Ellipse cx={100} cy={176} rx={78} ry={14} fill="#F5A3B5" opacity={0.55} /><Ellipse cx={100} cy={176} rx={62} ry={9} fill="#FFD0DA" opacity={0.6} /></G>),
    particles: (<G>{star(40, 150, 1.5, '#FFF6EC')}{star(160, 170, 1.2, '#FFF6EC')}{star(120, 190, 1, '#FFF6EC')}{star(70, 185, 1.4, '#FFF6EC')}</G>),
  },
  env_forest: {
    sky: (<G>{grad('fs', '#CFEBDB', '#EAF6EE')}<Rect width={200} height={200} fill="url(#fs)" /><Circle cx={160} cy={40} r={16} fill="#FFF3B0" opacity={0.9} /><Circle cx={160} cy={40} r={26} fill="#FFF3B0" opacity={0.25} /></G>),
    far: (<G opacity={0.55}>{tree(20, 120, 1.1, '#9ED3B8', '#8AC6A8')}{tree(60, 118, 0.9, '#9ED3B8', '#8AC6A8')}{tree(105, 122, 1.0, '#9ED3B8', '#8AC6A8')}{tree(150, 118, 1.2, '#9ED3B8', '#8AC6A8')}{tree(190, 120, 0.9, '#9ED3B8', '#8AC6A8')}<Ellipse cx={100} cy={130} rx={130} ry={16} fill="#8AC6A8" /></G>),
    mid: (<G>{tree(8, 150, 1.4, '#4FA98B', '#3E8C72')}{tree(195, 148, 1.3, '#4FA98B', '#3E8C72')}{tree(48, 142, 0.8, '#5FB89A', '#4FA98B')}{tree(160, 144, 0.9, '#5FB89A', '#4FA98B')}<Ellipse cx={100} cy={166} rx={140} ry={30} fill="#6DBF9C" /><Ellipse cx={100} cy={172} rx={120} ry={20} fill="#7FCBA6" />
      {[30, 55, 145, 172].map((x, i) => flower(x, 168 + (i % 2) * 4, ['#F5A3B5', '#F9DC7A', '#B8A9E8', '#F5A3B5'][i]))}<Ellipse cx={120} cy={178} rx={7} ry={3.5} fill="#8E7CD1" /><Rect x={118} y={178} width={4} height={5} fill="#FFF6EC" /><Circle cx={118} cy={177} r={1} fill="#FFF6EC" /></G>),
    near: (<G><Path d="M0 200 v-22 q10 -10 22 0 q8 -8 18 0 v22z" fill="#3E8C72" /><Path d="M200 200 v-18 q-10 -12 -24 -2 q-8 -8 -16 0 v20z" fill="#3E8C72" /><Path d="M-4 196 q6 -10 14 -2 M8 200 q8 -12 16 -4" stroke="#4FA98B" strokeWidth={2} fill="none" /></G>),
    particles: (<G>{star(40, 130, 1.4, '#FFF3B0')}{star(150, 160, 1.2, '#FFF3B0')}{star(90, 180, 1, '#FFF3B0')}{star(120, 140, 1.5, '#FFFFFF')}{star(65, 195, 1.2, '#FFF3B0')}</G>),
  },
  env_beach: {
    sky: (<G>{grad('bs', '#BFE4F7', '#E9F6FD')}<Rect width={200} height={200} fill="url(#bs)" /><Circle cx={46} cy={40} r={14} fill="#FFE08A" /><Circle cx={46} cy={40} r={22} fill="#FFE08A" opacity={0.25} /></G>),
    far: (<G>{cloud(130, 36, 0.8)}{cloud(175, 60, 0.6)}{cloud(90, 62, 0.5, '#F7FBFF')}<Rect x={0} y={104} width={200} height={40} fill="#6FB6E0" /><Path d="M0 104 q20 -4 40 0 t40 0 t40 0 t40 0 t40 0 v10 h-200z" fill="#8EC5E8" /></G>),
    mid: (<G><Path d="M0 130 q25 -8 50 0 t50 0 t50 0 t50 0 v20 h-200z" fill="#A9D8F2" /><Path d="M0 140 q25 -6 50 0 t50 0 t50 0 t50 0 v6 h-200z" fill="#FFFFFF" opacity={0.7} /><Path d="M0 146 q30 -8 60 0 t60 0 t60 0 v60 h-200z" fill="#F7E1B5" /><Path d="M0 152 q30 -6 60 0 t60 0 t60 0 v3 h-200z" fill="#FFFFFF" opacity={0.5} /></G>),
    near: (<G><Ellipse cx={100} cy={188} rx={130} ry={22} fill="#EFD3A4" /><Path d="M28 176 q4 -8 10 -2 q3 -6 8 0 z" fill="#F5A3B5" /><Path d="M150 182 a5 4 0 1 1 6 3 q-4 0 -6 -3z" fill="#FFF6EC" /><Circle cx={172} cy={178} r={2} fill="#F5A3B5" /><Rect x={40} y={166} width={2} height={14} fill="#D97B3F" /><Ellipse cx={41} cy={158} rx={14} ry={7} fill="#E76F51" /><Path d="M27 158 h28 l-14 -7z" fill="#FFF6EC" opacity={0.6} /></G>),
    particles: (<G>{star(60, 150, 1.2)}{star(140, 170, 1.4)}{star(100, 130, 1)}{star(30, 190, 1.2)}</G>),
  },
  env_cafe: {
    sky: (<G>{grad('cs', '#F7E4D0', '#EBCDB0')}<Rect width={200} height={200} fill="url(#cs)" /><Rect x={0} y={120} width={200} height={80} fill="#B98461" />{Array.from({ length: 6 }).map((_, i) => <Rect key={i} x={0} y={128 + i * 12} width={200} height={1} fill="#A9724F" />)}</G>),
    far: (<G><Rect x={18} y={28} width={54} height={60} rx={6} fill="#FFF8F0" /><Rect x={22} y={32} width={46} height={52} rx={4} fill="#CFE3F2" /><Rect x={44} y={32} width={2} height={52} fill="#FFF8F0" /><Rect x={128} y={28} width={54} height={60} rx={6} fill="#FFF8F0" /><Rect x={132} y={32} width={46} height={52} rx={4} fill="#CFE3F2" /><Rect x={154} y={32} width={2} height={52} fill="#FFF8F0" />
      <Rect x={86} y={30} width={28} height={40} rx={3} fill="#4A2C22" /><Rect x={90} y={34} width={20} height={4} rx={1} fill="#F4C24B" /><Rect x={90} y={42} width={16} height={2} fill="#FFF6EC" /><Rect x={90} y={48} width={18} height={2} fill="#FFF6EC" /><Rect x={90} y={54} width={12} height={2} fill="#FFF6EC" /></G>),
    mid: (<G><Rect x={60} y={98} width={80} height={10} rx={4} fill="#8B5A3C" /><Rect x={64} y={108} width={6} height={30} fill="#6E4630" /><Rect x={130} y={108} width={6} height={30} fill="#6E4630" /><Rect x={96} y={86} width={14} height={12} rx={3} fill="#FFF6EC" /><Path d="M110 89 q6 0 6 4 q0 4 -6 4" stroke="#FFF6EC" strokeWidth={2} fill="none" /><Path d="M100 82 q2 -4 0 -8 M105 82 q2 -4 0 -8" stroke="#CDB8A6" strokeWidth={1.5} fill="none" opacity={0.7} />
      <Rect x={72} y={90} width={16} height={8} rx={2} fill="#F4A261" /><Circle cx={80} cy={90} r={4} fill="#E76F51" /><Rect x={10} y={100} width={30} height={40} rx={4} fill="#8FD3B6" /><Rect x={14} y={104} width={22} height={14} fill="#4FA98B" /><Rect x={14} y={122} width={22} height={14} fill="#4FA98B" /></G>),
    near: (<G><Ellipse cx={100} cy={186} rx={90} ry={14} fill="#E76F51" opacity={0.35} /><Ellipse cx={100} cy={186} rx={70} ry={9} fill="#F49478" opacity={0.4} /></G>),
    particles: (<G>{star(100, 150, 1.4, '#FFF6EC')}{star(60, 170, 1.2, '#FFF6EC')}{star(140, 180, 1, '#FFF6EC')}</G>),
  },
  env_cabin: {
    sky: (<G>{grad('ms', '#DDD5F3', '#F1ECFA')}<Rect width={200} height={200} fill="url(#ms)" />{star(30, 24, 1.3)}{star(70, 14, 1)}{star(150, 30, 1.4)}{star(180, 12, 1)}{star(110, 22, 0.8)}</G>),
    far: (<G><Polygon points="-10,120 40,44 90,120" fill="#B8A9E8" /><Polygon points="40,44 30,60 50,60" fill="#FFFFFF" /><Polygon points="70,120 120,30 170,120" fill="#9A88D6" /><Polygon points="120,30 108,50 132,50" fill="#FFFFFF" /><Polygon points="140,120 185,60 230,120" fill="#B8A9E8" /><Polygon points="185,60 176,72 194,72" fill="#FFFFFF" /></G>),
    mid: (<G><Ellipse cx={100} cy={132} rx={140} ry={26} fill="#E9E3F7" />{tree(20, 130, 1.1, '#6B5AAE', '#5A4A99')}{tree(180, 128, 1.2, '#6B5AAE', '#5A4A99')}<Rect x={68} y={82} width={64} height={44} rx={3} fill="#8B5A3C" /><Polygon points="60,84 100,54 140,84" fill="#6E4630" /><Rect x={106} y={58} width={8} height={16} fill="#6E4630" />
      <Rect x={76} y={94} width={16} height={16} rx={2} fill="#FFE08A" /><Rect x={83} y={94} width={2} height={16} fill="#8B5A3C" /><Rect x={76} y={101} width={16} height={2} fill="#8B5A3C" /><Rect x={108} y={98} width={14} height={28} rx={2} fill="#4A2C22" /><Circle cx={118} cy={112} r={1.5} fill="#F4C24B" /></G>),
    near: (<G><Ellipse cx={100} cy={186} rx={130} ry={22} fill="#F4EFFA" /><Ellipse cx={40} cy={176} rx={16} ry={5} fill="#FFFFFF" /><Ellipse cx={160} cy={180} rx={20} ry={6} fill="#FFFFFF" /></G>),
    particles: (<G>{star(40, 140, 1.5)}{star(120, 160, 1.3)}{star(170, 150, 1.2)}{star(80, 190, 1.4)}{star(20, 180, 1)}</G>),
  },
  env_garden: {
    sky: (<G>{grad('gs', '#2E2A57', '#5A4E9A')}<Rect width={200} height={200} fill="url(#gs)" />{star(20, 20, 1.2)}{star(60, 40, 0.8)}{star(120, 18, 1.4)}{star(170, 44, 1)}{star(90, 60, 0.7)}{star(150, 70, 0.9)}<Circle cx={150} cy={44} r={20} fill="#FFF3B0" /><Circle cx={143} cy={38} r={16} fill="#5A4E9A" opacity={0.15} /></G>),
    far: (<G opacity={0.7}><Ellipse cx={30} cy={120} rx={30} ry={18} fill="#4B3F86" /><Ellipse cx={170} cy={116} rx={36} ry={20} fill="#4B3F86" /><Ellipse cx={100} cy={126} rx={40} ry={16} fill="#3F3473" /></G>),
    mid: (<G><Ellipse cx={100} cy={168} rx={140} ry={30} fill="#4FA98B" /><Ellipse cx={100} cy={174} rx={120} ry={20} fill="#5FB89A" />{[24, 44, 150, 176].map((x, i) => flower(x, 166 + (i % 2) * 5, ['#F5A3B5', '#B8A9E8', '#F9DC7A', '#F5A3B5'][i]))}
      <Rect x={9} y={140} width={2} height={26} fill="#3E8C72" /><Circle cx={10} cy={138} r={5} fill="#F9DC7A" /><Circle cx={10} cy={138} r={9} fill="#F9DC7A" opacity={0.25} /><Rect x={186} y={144} width={2} height={22} fill="#3E8C72" /><Circle cx={187} cy={142} r={4.5} fill="#B8A9E8" /><Circle cx={187} cy={142} r={8} fill="#B8A9E8" opacity={0.25} /></G>),
    near: (<G><Path d="M0 200 v-20 q12 -12 26 0 q10 -8 20 0 v20z" fill="#3E8C72" /><Path d="M200 200 v-16 q-12 -12 -26 0 q-8 -6 -18 0 v16z" fill="#3E8C72" /></G>),
    particles: (<G>{star(50, 150, 1.6, '#F9DC7A')}{star(140, 160, 1.4, '#F9DC7A')}{star(100, 180, 1.2, '#FFF3B0')}{star(30, 190, 1.5, '#F9DC7A')}{star(170, 190, 1.1, '#FFF3B0')}</G>),
  },
  env_village: {
    sky: (<G>{grad('vs', '#2B3A6B', '#5F6FA8')}<Rect width={200} height={200} fill="url(#vs)" />{star(30, 20, 1.2)}{star(80, 30, 0.8)}{star(130, 16, 1.2)}{star(170, 40, 1)}</G>),
    far: (<G><Polygon points="-10,110 40,60 90,110" fill="#8C9BC9" /><Polygon points="70,110 130,50 190,110" fill="#7A8ABD" /><Polygon points="150,110 200,70 250,110" fill="#8C9BC9" /><Polygon points="40,60 32,72 48,72" fill="#FFFFFF" /><Polygon points="130,50 120,66 140,66" fill="#FFFFFF" /></G>),
    mid: (<G><Rect x={0} y={118} width={200} height={40} fill="#E9EEFA" /><Rect x={16} y={90} width={44} height={40} rx={2} fill="#B47656" /><Polygon points="10,92 38,66 66,92" fill="#F4F7FF" /><Rect x={30} y={106} width={14} height={14} rx={1} fill="#FFE08A" /><Rect x={140} y={86} width={48} height={44} rx={2} fill="#9C6446" /><Polygon points="134,88 164,60 194,88" fill="#F4F7FF" /><Rect x={150} y={100} width={10} height={10} fill="#FFE08A" /><Rect x={168} y={100} width={10} height={10} fill="#FFE08A" /><Rect x={176} y={62} width={7} height={14} fill="#6E4630" />
      <Rect x={94} y={104} width={2} height={30} fill="#4A2C22" /><Rect x={89} y={94} width={12} height={12} rx={2} fill="#F4C24B" /><Rect x={92} y={97} width={6} height={6} fill="#FFF3B0" /><Circle cx={95} cy={100} r={9} fill="#FFE08A" opacity={0.25} /><Rect x={108} y={108} width={2} height={26} fill="#4A2C22" /><Rect x={103} y={98} width={12} height={12} rx={2} fill="#F4C24B" /><Rect x={106} y={101} width={6} height={6} fill="#FFF3B0" /><Circle cx={109} cy={104} r={9} fill="#FFE08A" opacity={0.25} /></G>),
    near: (<G><Ellipse cx={100} cy={188} rx={130} ry={24} fill="#F4F7FF" /><Path d="M60 200 q40 -30 80 0" fill="#D9DEEE" /><Ellipse cx={36} cy={172} rx={12} ry={4} fill="#FFFFFF" /><Ellipse cx={166} cy={176} rx={14} ry={5} fill="#FFFFFF" /></G>),
    particles: (<G>{star(40, 140, 1.4)}{star(100, 150, 1.2)}{star(160, 140, 1.6)}{star(70, 190, 1.3)}{star(130, 185, 1.1)}</G>),
  },
  env_space: {
    sky: (<G>{grad('ss', '#141733', '#2A2F5C')}<Rect width={200} height={200} fill="url(#ss)" />{star(20, 20, 1)}{star(50, 60, 0.7)}{star(90, 30, 1.2)}{star(140, 50, 0.8)}{star(170, 20, 1.1)}{star(120, 80, 0.6)}{star(30, 90, 0.9)}<Circle cx={150} cy={70} r={22} fill="#6FB6E0" /><Path d="M132 64 q18 -10 36 0 q-6 14 -18 16 q-14 -2 -18 -16z" fill="#8FD3B6" opacity={0.8} /><Ellipse cx={144} cy={62} rx={6} ry={3} fill="#FFFFFF" opacity={0.6} /></G>),
    far: (<G><Rect x={0} y={0} width={200} height={200} fill="none" /><Rect x={0} y={100} width={200} height={100} fill="#3B3F6E" /><Rect x={0} y={100} width={200} height={4} fill="#5B60A0" /><Path d="M0 100 a100 40 0 0 1 200 0z" fill="#2A2F5C" /><Path d="M14 100 a86 30 0 0 1 172 0" stroke="#8EC5E8" strokeWidth={3} fill="none" /></G>),
    mid: (<G>{Array.from({ length: 5 }).map((_, i) => <Rect key={i} x={0} y={116 + i * 14} width={200} height={1} fill="#4D5288" />)}<Rect x={16} y={112} width={36} height={30} rx={4} fill="#4D5288" /><Rect x={20} y={116} width={28} height={10} rx={2} fill="#8FD3B6" /><Rect x={20} y={130} width={6} height={6} rx={1} fill="#E76F51" /><Rect x={30} y={130} width={6} height={6} rx={1} fill="#F4C24B" /><Rect x={40} y={130} width={6} height={6} rx={1} fill="#8EC5E8" /><Rect x={150} y={108} width={36} height={34} rx={4} fill="#4D5288" /><Circle cx={168} cy={125} r={11} fill="#8EC5E8" /><Circle cx={168} cy={125} r={6} fill="#2A2F5C" /><Circle cx={168} cy={125} r={2} fill="#8FD3B6" /></G>),
    near: (<G><Rect x={0} y={166} width={200} height={34} fill="#2A2F5C" /><Rect x={0} y={166} width={200} height={2} fill="#8EC5E8" opacity={0.6} />{[20, 60, 100, 140, 180].map((x) => <Rect key={x} x={x - 8} y={172} width={16} height={2} rx={1} fill="#5B60A0" />)}</G>),
    particles: (<G>{star(60, 140, 1.5, '#F9DC7A')}{star(130, 150, 1.2)}{star(40, 190, 1.3, '#8FD3B6')}{star(160, 185, 1.4)}</G>),
  },
};

export const ENVIRONMENT_IDS = Object.keys(SCENES);
