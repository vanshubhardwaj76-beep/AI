import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';
import type { Pet, PetMood, PetSpecies } from '@/types';
import { PixelSprite } from '@/engine/PixelSprite';
import { getPetSheet, type Pose } from '@/engine/pets';
import { accessorySprite } from '@/engine/accessories';
import type { Sprite } from '@/engine/sprite';
import { usePetStore } from '@/store/petStore';
import { haptic } from '@/utils/haptics';
import { Environment } from './Environment';
import { Particles } from './Particles';

interface Props {
  pet?: Pet | null;
  species?: PetSpecies;
  mood?: PetMood;
  size?: number;
  showEnvironment?: boolean;
  interactive?: boolean;
  onPet?: () => void;
  /** Force a pose (e.g. previews). */
  pose?: Pose;
}

const MOOD_POSE: Record<PetMood, Pose> = { happy: 'idle', excited: 'excited', sleepy: 'sleepy', curious: 'curious', proud: 'proud', calm: 'calm', tired: 'tired' };

/**
 * The animated pixel companion.
 *  - idle: frame swap for breathing + random blink frame; container bob
 *  - tap: squash frame + hop
 *  - happy/wave: wiggle + happy frames + hearts
 *  - jump (goal complete): two hops with excited frames + sparkle particles
 *  - levelup: big hop, level-up frames, star burst
 *  - sleep: sleepy frames
 */
export function PetAvatar({ pet, species, mood, size = 240, showEnvironment = true, interactive = true, onPet, pose: forcedPose }: Props) {
  const sp = pet?.species ?? species ?? 'bird';
  const md = pet?.mood ?? mood ?? 'happy';
  const trigger = usePetStore((s) => s.animTrigger);
  const sheet = useMemo(() => getPetSheet(sp), [sp]);

  const [override, setOverride] = useState<{ pose: Pose; until: number } | null>(null);
  const [tick, setTick] = useState(0);
  const [blink, setBlink] = useState(false);
  const [burst, setBurst] = useState<{ kind: 'sparkle' | 'heart' | 'star'; at: number } | null>(null);

  const bob = useSharedValue(0);
  const tilt = useSharedValue(0);
  const jump = useSharedValue(0);
  const squash = useSharedValue(1);

  const basePose: Pose = forcedPose ?? MOOD_POSE[md];
  const pose = override && override.until > Date.now() ? override.pose : basePose;

  // frame ticker (breathing) – speed depends on pose
  useEffect(() => {
    const speed = pose === 'sleepy' || pose === 'tired' ? 1100 : pose === 'excited' || pose === 'levelup' || pose === 'tap' ? 220 : 700;
    const id = setInterval(() => setTick((t) => t + 1), speed);
    return () => clearInterval(id);
  }, [pose]);

  // blink loop
  useEffect(() => {
    let alive = true;
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      t = setTimeout(() => {
        if (!alive) return;
        setBlink(true);
        setTimeout(() => alive && setBlink(false), 120);
        loop();
      }, 2400 + Math.random() * 3200);
    };
    loop();
    return () => { alive = false; clearTimeout(t); };
  }, []);

  // container breathing bob
  useEffect(() => {
    const dur = md === 'sleepy' || md === 'tired' ? 2600 : md === 'excited' ? 1200 : 1900;
    bob.value = withRepeat(withSequence(withTiming(-size * 0.012, { duration: dur, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: dur, easing: Easing.inOut(Easing.quad) })), -1);
    return () => cancelAnimation(bob);
  }, [md, bob, size]);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const play = (p: Pose, ms: number) => setOverride({ pose: p, until: Date.now() + ms });

  // reactions from the store
  useEffect(() => {
    if (!trigger) return;
    if (trigger.kind === 'happy' || trigger.kind === 'wave') {
      play('happy', 1400);
      tilt.value = withSequence(withTiming(-7, { duration: 110 }), withTiming(7, { duration: 110 }), withTiming(-5, { duration: 100 }), withTiming(5, { duration: 100 }), withSpring(0));
      setBurst({ kind: 'heart', at: Date.now() });
    }
    if (trigger.kind === 'jump') {
      play('excited', 1800);
      jump.value = withSequence(
        withTiming(-size * 0.16, { duration: 220, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 260, easing: Easing.bounce }),
        withDelay(60, withTiming(-size * 0.1, { duration: 180, easing: Easing.out(Easing.quad) })),
        withTiming(0, { duration: 220, easing: Easing.bounce }),
      );
      squash.value = withSequence(withTiming(0.88, { duration: 90 }), withTiming(1.1, { duration: 200 }), withSpring(1));
      setBurst({ kind: 'sparkle', at: Date.now() });
    }
    if (trigger.kind === 'sleep') play('sleepy', 2500);
    if (trigger.kind === 'levelup') {
      play('levelup', 2600);
      jump.value = withSequence(withTiming(-size * 0.22, { duration: 300, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 380, easing: Easing.bounce }));
      squash.value = withSequence(withTiming(0.85, { duration: 100 }), withTiming(1.12, { duration: 260 }), withSpring(1));
      setBurst({ kind: 'star', at: Date.now() });
    }
  }, [trigger, tilt, jump, squash, size]);

  const handlePress = () => {
    if (!interactive) return;
    haptic.medium();
    play('tap', 700);
    squash.value = withSequence(withTiming(0.82, { duration: 80 }), withTiming(1.08, { duration: 160 }), withSpring(1, { damping: 8 }));
    jump.value = withSequence(withDelay(80, withTiming(-size * 0.08, { duration: 160, easing: Easing.out(Easing.quad) })), withTiming(0, { duration: 200, easing: Easing.bounce }));
    later(() => usePetStore.getState().triggerAnim('happy'), 650);
    onPet?.();
  };

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: bob.value + jump.value }, { rotate: `${tilt.value}deg` }, { scaleY: squash.value }, { scaleX: 2 - squash.value }],
  }));

  // frame selection
  const frames = sheet.frames[pose];
  let frame: Sprite = frames[tick % frames.length];
  if (blink && pose === 'idle') frame = sheet.frames.idle[2];

  const layers = useMemo(() => {
    if (!pet) return [];
    const e = pet.equipped;
    const order = [e.backpack, e.jacket, e.scarf, e.glasses, e.hat, e.toy, e.companion];
    return order.map((id) => (id ? accessorySprite(id, sheet.anchors) : null));
  }, [pet, pet?.equipped, sheet]);

  const petSize = showEnvironment ? size * 0.66 : size;
  const body = (
    <Animated.View style={[{ width: petSize, height: petSize }, style]}>
      <PixelSprite sprite={frame} size={petSize} layers={layers} />
    </Animated.View>
  );

  return (
    <Pressable onPress={handlePress} accessibilityRole="imagebutton" accessibilityLabel={`${pet?.name ?? 'Your pet'}, ${md}`} disabled={!interactive}>
      <View style={[styles.wrap, { width: size, height: size }]}>
        {showEnvironment ? (
          <Environment id={pet?.environmentId ?? 'env_bedroom'} size={size}>
            <View style={{ marginBottom: size * 0.08 }}>{body}</View>
          </Environment>
        ) : (
          body
        )}
        {burst && <Particles key={burst.at} kind={burst.kind} size={size} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({ wrap: { alignItems: 'center', justifyContent: 'center', overflow: 'visible' } });
