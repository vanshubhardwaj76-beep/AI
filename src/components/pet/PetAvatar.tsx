import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { G } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import type { Pet, PetMood, PetSpecies } from '@/types';
import { PetBody, EnvironmentBackdrop, Sparkle } from './PetBody';
import { Accessories } from './Accessories';
import { usePetStore } from '@/store/petStore';
import { haptic } from '@/utils/haptics';

interface Props {
  pet?: Pet | null;
  species?: PetSpecies;
  mood?: PetMood;
  size?: number;
  showEnvironment?: boolean;
  interactive?: boolean;
  onPet?: () => void;
}

/**
 * The animated companion. Idle: gentle breathing bob + occasional blink.
 * Reactions (triggered through the pet store): happy wiggle, jump, wave.
 */
export function PetAvatar({ pet, species, mood, size = 240, showEnvironment = true, interactive = true, onPet }: Props) {
  const sp = pet?.species ?? species ?? 'bird';
  const md = pet?.mood ?? mood ?? 'happy';
  const trigger = usePetStore((s) => s.animTrigger);

  const bob = useSharedValue(0);
  const squash = useSharedValue(1);
  const tilt = useSharedValue(0);
  const jump = useSharedValue(0);
  const [blink, setBlink] = useState(false);
  const [wing, setWing] = useState(0);
  const [sparkles, setSparkles] = useState(false);

  // Idle breathing
  useEffect(() => {
    const speed = md === 'sleepy' || md === 'tired' ? 2400 : md === 'excited' ? 1200 : 1800;
    bob.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: speed, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: speed, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    );
    squash.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: speed, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: speed, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    );
    return () => {
      cancelAnimation(bob);
      cancelAnimation(squash);
    };
  }, [md, bob, squash]);

  // Blink loop
  useEffect(() => {
    let alive = true;
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      t = setTimeout(() => {
        if (!alive) return;
        setBlink(true);
        setTimeout(() => alive && setBlink(false), 140);
        loop();
      }, 2500 + Math.random() * 3000);
    };
    loop();
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, []);

  // Reactions
  useEffect(() => {
    if (!trigger) return;
    if (trigger.kind === 'happy' || trigger.kind === 'wave') {
      tilt.value = withSequence(
        withTiming(-8, { duration: 120 }),
        withTiming(8, { duration: 120 }),
        withTiming(-6, { duration: 110 }),
        withTiming(6, { duration: 110 }),
        withSpring(0),
      );
      setWing(-30);
      setTimeout(() => setWing(20), 150);
      setTimeout(() => setWing(-20), 300);
      setTimeout(() => setWing(0), 450);
      setSparkles(true);
      setTimeout(() => setSparkles(false), 1200);
    }
    if (trigger.kind === 'jump') {
      jump.value = withSequence(
        withTiming(-38, { duration: 220, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 260, easing: Easing.bounce }),
        withDelay(80, withTiming(-22, { duration: 180, easing: Easing.out(Easing.quad) })),
        withTiming(0, { duration: 220, easing: Easing.bounce }),
      );
      squash.value = withSequence(withTiming(0.9, { duration: 100 }), withTiming(1.08, { duration: 200 }), withSpring(1));
      setSparkles(true);
      setTimeout(() => setSparkles(false), 1600);
    }
  }, [trigger, tilt, jump, squash]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: bob.value + jump.value },
      { rotate: `${tilt.value}deg` },
      { scaleY: squash.value },
      { scaleX: 2 - squash.value },
    ],
  }));

  const handlePress = () => {
    if (!interactive) return;
    haptic.medium();
    usePetStore.getState().triggerAnim('happy');
    onPet?.();
  };

  return (
    <Pressable onPress={handlePress} accessibilityRole="imagebutton" accessibilityLabel={`${pet?.name ?? 'Your pet'}, ${md}`} disabled={!interactive}>
      <View style={[styles.wrap, { width: size, height: size }]}>
        {showEnvironment && (
          <Svg width={size} height={size} viewBox="0 0 200 200" style={StyleSheet.absoluteFill}>
            <EnvironmentBackdrop id={pet?.environmentId ?? 'env_bedroom'} />
          </Svg>
        )}
        <Animated.View style={[{ width: size, height: size }, style]}>
          <Svg width={size} height={size} viewBox="0 0 200 200">
            <G>
              <PetBody species={sp} mood={md} blink={blink} wingAngle={wing} />
              {pet && <Accessories pet={pet} />}
              {sparkles && (
                <G>
                  <Sparkle x={40} y={60} size={7} />
                  <Sparkle x={165} y={70} size={6} color="#F5A3B5" />
                  <Sparkle x={150} y={35} size={5} />
                  <Sparkle x={55} y={30} size={5} color="#8EC5E8" />
                </G>
              )}
            </G>
          </Svg>
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
});
