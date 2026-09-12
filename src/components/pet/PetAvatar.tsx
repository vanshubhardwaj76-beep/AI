import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';
import type { Pet, PetMood, PetSpecies } from '@/types';
import { PixelSprite } from '@/engine/PixelSprite';
import { getPetSheet, STATE_POSE, type PetAnimState, type Pose } from '@/engine/pets';
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
  /**
   * High-level animation state. Drives the sprite pose AND the container
   * motion (walk bounce, sleep breathing, happy wiggle…). Reused by every
   * screen instead of bespoke pet animations.
   */
  state?: PetAnimState;
  /** Travelling scene: environment layers scroll with parallax while the pet walks in place. */
  scrollEnvironment?: boolean;
  environmentId?: string;
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
export function PetAvatar({ pet, species, mood, size = 240, showEnvironment = true, interactive = true, onPet, pose: forcedPose, state, scrollEnvironment = false, environmentId }: Props) {
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

  const basePose: Pose = forcedPose ?? (state ? STATE_POSE[state] : MOOD_POSE[md]);
  const pose = override && override.until > Date.now() ? override.pose : basePose;
  const asleep = pose === 'sleepy' || pose === 'resting';

  // frame ticker (breathing / stride) – speed depends on pose
  useEffect(() => {
    const speed = asleep || pose === 'tired' ? 1300 : pose === 'walking' ? 120 : pose === 'excited' || pose === 'levelup' || pose === 'tap' ? 220 : 700;
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

  // container motion per state: breathing bob (idle/sleep), walk bounce, happy wiggle
  useEffect(() => {
    cancelAnimation(bob);
    // cleanup for looping states resets the transforms so one-shot reactions start clean
    const loopCleanup = () => { cancelAnimation(bob); cancelAnimation(tilt); cancelAnimation(squash); tilt.value = withTiming(0, { duration: 120 }); squash.value = withTiming(1, { duration: 120 }); };
    if (pose === 'walking') {
      // quick bounce synced to the stride + tiny sway of the whole body
      // one bounce per step (3 sprite frames @120ms = 360ms), sway once per full stride
      bob.value = withRepeat(withSequence(withTiming(-size * 0.035, { duration: 180, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 180, easing: Easing.in(Easing.quad) })), -1);
      tilt.value = withRepeat(withSequence(withTiming(-3.5, { duration: 360, easing: Easing.inOut(Easing.sin) }), withTiming(3.5, { duration: 360, easing: Easing.inOut(Easing.sin) })), -1);
      squash.value = withRepeat(withSequence(withTiming(1.04, { duration: 180, easing: Easing.inOut(Easing.sin) }), withTiming(0.97, { duration: 180, easing: Easing.inOut(Easing.sin) })), -1);
      return loopCleanup;
    }
    if (asleep) {
      // slow deep breathing: subtle vertical rise + gentle widen
      bob.value = withRepeat(withSequence(withTiming(-size * 0.006, { duration: 2200, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.sin) })), -1);
      squash.value = withRepeat(withSequence(withTiming(0.985, { duration: 2200, easing: Easing.inOut(Easing.sin) }), withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) })), -1);
      return loopCleanup;
    }
    if (pose === 'happy' && state === 'HAPPY') {
      tilt.value = withRepeat(withSequence(withTiming(-4, { duration: 260, easing: Easing.inOut(Easing.sin) }), withTiming(4, { duration: 260, easing: Easing.inOut(Easing.sin) })), -1);
      bob.value = withRepeat(withSequence(withTiming(-size * 0.012, { duration: 1200, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.quad) })), -1);
      return loopCleanup;
    }
    if (pose === 'excited' && state === 'EXCITED') {
      bob.value = withRepeat(withSequence(withTiming(-size * 0.05, { duration: 260, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 260, easing: Easing.bounce })), -1);
      return loopCleanup;
    }
    const dur = pose === 'tired' ? 2600 : pose === 'excited' ? 1200 : 1900;
    bob.value = withRepeat(withSequence(withTiming(-size * 0.012, { duration: dur, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: dur, easing: Easing.inOut(Easing.quad) })), -1);
    return () => cancelAnimation(bob);
  }, [pose, asleep, state, bob, tilt, squash, size]);

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
    if (!interactive || asleep || pose === 'walking') return;
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
    <Pressable onPress={handlePress} accessibilityRole="imagebutton" accessibilityLabel={`${pet?.name ?? 'Your pet'}, ${asleep ? 'sleeping' : pose === 'walking' ? 'walking' : md}`} disabled={!interactive}>
      <View style={[styles.wrap, { width: size, height: size }]}>
        {showEnvironment ? (
          <Environment id={environmentId ?? pet?.environmentId ?? 'env_bedroom'} size={size} scroll={scrollEnvironment}>
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
