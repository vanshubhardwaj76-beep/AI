import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { RewardPopup } from '@/components/home/RewardPopup';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { useAppBootstrap } from '@/hooks/useAppBootstrap';
import { usePetMoodSync } from '@/hooks/usePetMood';
import { useNotificationSync } from '@/hooks/useNotificationSync';
import { useProfileStore } from '@/store/profileStore';
import { usePetStore } from '@/store/petStore';
import { lightColors } from '@/theme';
import { useFonts, Nunito_500Medium, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { Icon } from '@/components/ui/Icon';

export const unstable_settings = { initialRouteName: '(tabs)' };

function Gate({ children }: { children: React.ReactNode }) {
  const { ready, error } = useAppBootstrap();
  const { colors } = useTheme();
  const router = useRouter();
  const segments = useSegments();
  const onboarded = useProfileStore((s) => s.profile?.onboardingComplete);
  const hasPet = usePetStore((s) => Boolean(s.pet));

  usePetMoodSync();
  useNotificationSync();

  useEffect(() => {
    if (!ready) return;
    const inOnboarding = segments[0] === 'onboarding';
    const needsOnboarding = !onboarded || !hasPet;
    if (needsOnboarding && !inOnboarding) router.replace('/onboarding');
    else if (!needsOnboarding && inOnboarding) router.replace('/(tabs)');
  }, [ready, onboarded, hasPet, segments, router]);

  // mark "last seen" once per launch
  useEffect(() => {
    if (ready && hasPet) usePetStore.getState().touch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Icon name="cloud" size={44} color={colors.primary} />
        <Text variant="heading" center style={{ marginTop: 12 }}>Something went wrong</Text>
        <Text muted center style={{ marginVertical: 12 }}>{error}</Text>
        <Button title="Try again" onPress={() => router.replace('/')} />
      </View>
    );
  }
  if (!ready) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text muted style={{ marginTop: 12 }}>Waking up your companion…</Text>
      </View>
    );
  }
  return <>{children}</>;
}

function Navigator() {
  const { colors, isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Gate>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
          <Stack.Screen name="goal/new" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="goal/[id]" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="journal/new" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="journal/[id]" />
          <Stack.Screen name="mood" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        </Stack>
        <RewardPopup />
      </Gate>
    </>
  );
}

export default function RootLayout() {
  // Fonts load in the background; text falls back to the system font until
  // Nunito is ready so the app never blocks on a font download.
  const [fontsReady] = useFonts({ Nunito_500Medium, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold });
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: lightColors.background }}>
      <SafeAreaProvider>
        <ThemeProvider fontsReady={fontsReady}>
          <ToastProvider>
            <Navigator />
          </ToastProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
});
