import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Header, Text, Card, Button, Input, useToast } from '@/components/ui';
import { authService } from '@/services/auth';
import { syncService } from '@/services/sync';
import { useProfileStore } from '@/store/profileStore';
import { isValidEmail, passwordError } from '@/utils/validation';
import { spacing } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

export default function AuthScreen() {
  const router = useRouter();
  const toast = useToast();
  const { colors } = useTheme();
  const profile = useProfileStore((s) => s.profile);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [busy, setBusy] = useState<string | null>(null);
  const configured = authService.isConfigured();

  const submit = async () => {
    const e: typeof errors = {};
    if (!isValidEmail(email)) e.email = 'Enter a valid email';
    const pw = passwordError(password);
    if (pw && mode === 'signup') e.password = pw;
    if (!password) e.password = 'Password is required';
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy('email');
    const r = mode === 'signup' ? await authService.signUpWithEmail(email, password) : await authService.signInWithEmail(email, password);
    setBusy(null);
    if (!r.ok) return toast(r.message ?? 'Something went wrong', 'error');
    toast(r.message ?? 'Signed in', 'success');
    if (configured) {
      const pulled = await syncService.pull();
      if (!pulled.ok) await syncService.push();
    }
    router.back();
  };

  if (profile && profile.authProvider !== 'guest') {
    return (
      <Screen>
        <Header title="Account" back />
        <Card>
          <Text variant="heading">{profile.email ?? 'Signed in'}</Text>
          <Text muted style={{ marginTop: 4 }}>via {profile.authProvider}{configured ? '' : ' · local only (no backend configured)'}</Text>
          {configured && (
            <View style={styles.row}>
              <Button title="Back up now" size="sm" variant="secondary" loading={busy === 'push'} onPress={async () => { setBusy('push'); const r = await syncService.push(); setBusy(null); toast(r.message, r.ok ? 'success' : 'error'); }} />
              <Button title="Restore" size="sm" variant="secondary" loading={busy === 'pull'} onPress={async () => { setBusy('pull'); const r = await syncService.pull(); setBusy(null); toast(r.message, r.ok ? 'success' : 'error'); }} />
            </View>
          )}
          <Button title="Sign out" variant="ghost" onPress={async () => { await authService.signOut(); toast('Signed out'); }} style={{ marginTop: spacing.md }} />
        </Card>
        <Text variant="caption" muted style={{ marginTop: spacing.md }}>Signing out keeps your data on this device.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title={mode === 'signin' ? 'Welcome back' : 'Create account'} back subtitle="Sync your companion across devices" />
      {!configured && (
        <Card tint={colors.primarySoft} style={{ marginBottom: spacing.md }}>
          <Text variant="bodyBold">Running in local mode</Text>
          <Text variant="caption" muted style={{ marginTop: 2 }}>No backend is configured, so accounts are saved on this device only. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to enable real sign-in and cloud sync.</Text>
        </Card>
      )}
      <Card>
        <Input label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" autoComplete="email" error={errors.email} />
        <Input label="Password" value={password} onChangeText={setPassword} placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'} secureTextEntry autoComplete={mode === 'signup' ? 'new-password' : 'password'} error={errors.password} />
        <Button title={mode === 'signin' ? 'Sign in' : 'Create account'} size="lg" fullWidth loading={busy === 'email'} onPress={submit} />
        <Button title={mode === 'signin' ? 'New here? Create an account' : 'Already have an account? Sign in'} variant="ghost" fullWidth onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')} style={{ marginTop: spacing.sm }} />
      </Card>
      <View style={styles.divider}>
        <View style={[styles.line, { backgroundColor: colors.border }]} />
        <Text variant="caption" muted>or</Text>
        <View style={[styles.line, { backgroundColor: colors.border }]} />
      </View>
      <Button title="Continue with Google" icon="google" variant="secondary" fullWidth size="lg" loading={busy === 'google'} onPress={async () => { setBusy('google'); const r = await authService.signInWithGoogle(); setBusy(null); if (!r.ok) return toast(r.message ?? 'Sign-in failed', 'error'); toast('Signed in with Google', 'success'); router.back(); }} />
      <Button title="Continue as guest" variant="ghost" fullWidth onPress={() => router.back()} style={{ marginTop: spacing.sm }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.lg },
  line: { flex: 1, height: 1 },
});
