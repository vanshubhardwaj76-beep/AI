import { Platform } from 'react-native';
import { getSupabase, isBackendConfigured } from './supabase';
import { useProfileStore } from '@/store/profileStore';
import { isValidEmail, passwordError } from '@/utils/validation';

export interface AuthResult {
  ok: boolean;
  message?: string;
}

/**
 * Authentication service. When Supabase is configured this talks to it;
 * otherwise it falls back to a clearly-labelled local mode so the app remains
 * fully usable offline. Profile state is always kept in the local store.
 */
export const authService = {
  isConfigured: isBackendConfigured,

  async signUpWithEmail(email: string, password: string): Promise<AuthResult> {
    if (!isValidEmail(email)) return { ok: false, message: 'Please enter a valid email' };
    const pwErr = passwordError(password);
    if (pwErr) return { ok: false, message: pwErr };
    const sb = getSupabase();
    if (!sb) return localSignIn(email);
    const { data, error } = await sb.auth.signUp({ email, password });
    if (error) return { ok: false, message: error.message };
    await useProfileStore.getState().update({
      authProvider: 'email',
      email,
      remoteUserId: data.user?.id ?? null,
    });
    return { ok: true, message: data.session ? undefined : 'Check your inbox to confirm your email.' };
  },

  async signInWithEmail(email: string, password: string): Promise<AuthResult> {
    if (!isValidEmail(email)) return { ok: false, message: 'Please enter a valid email' };
    if (!password) return { ok: false, message: 'Password is required' };
    const sb = getSupabase();
    if (!sb) return localSignIn(email);
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, message: error.message };
    await useProfileStore.getState().update({ authProvider: 'email', email, remoteUserId: data.user.id });
    return { ok: true };
  },

  async signInWithGoogle(): Promise<AuthResult> {
    const sb = getSupabase();
    if (!sb) return { ok: false, message: 'Google sign-in needs a configured backend. Add EXPO_PUBLIC_SUPABASE_URL / ANON_KEY.' };
    const WebBrowser = await import('expo-web-browser');
    const Linking = await import('expo-linking');
    const redirectTo = Linking.createURL('/auth/callback');
    const { data, error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: Platform.OS !== 'web' },
    });
    if (error) return { ok: false, message: error.message };
    if (Platform.OS === 'web') return { ok: true };
    const res = await WebBrowser.openAuthSessionAsync(data.url!, redirectTo);
    if (res.type !== 'success') return { ok: false, message: 'Sign-in was cancelled' };
    const url = new URL(res.url);
    const params = new URLSearchParams(url.hash.replace('#', '') || url.search);
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (!access_token || !refresh_token) return { ok: false, message: 'Missing tokens from provider' };
    const { data: session, error: sErr } = await sb.auth.setSession({ access_token, refresh_token });
    if (sErr) return { ok: false, message: sErr.message };
    await useProfileStore.getState().update({
      authProvider: 'google',
      email: session.user?.email ?? null,
      remoteUserId: session.user?.id ?? null,
    });
    return { ok: true };
  },

  async signOut(): Promise<void> {
    const sb = getSupabase();
    if (sb) await sb.auth.signOut().catch(() => {});
    await useProfileStore.getState().update({ authProvider: 'guest', email: null, remoteUserId: null });
  },

  async deleteRemoteAccount(): Promise<void> {
    const sb = getSupabase();
    const uid = useProfileStore.getState().profile?.remoteUserId;
    if (sb && uid) {
      // Deleting auth users requires a service key; we delete synced data and sign out.
      try { await sb.from('user_backups').delete().eq('user_id', uid); } catch {}
      await sb.auth.signOut().catch(() => {});
    }
  },
};

async function localSignIn(email: string): Promise<AuthResult> {
  await useProfileStore.getState().update({ authProvider: 'email', email, remoteUserId: null });
  return { ok: true, message: 'Saved locally. Connect a backend to sync across devices.' };
}
