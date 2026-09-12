import React, { useState } from 'react';
import { Alert, Linking, Platform, StyleSheet, Switch, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Header, Text, Card, Button, Chip, Input, useToast } from '@/components/ui';
import { useSettingsStore } from '@/store/settingsStore';
import { useProfileStore } from '@/store/profileStore';
import { usePetStore } from '@/store/petStore';
import { resetAllData } from '@/store/bootstrap';
import { notificationService } from '@/services/notifications';
import { exportService } from '@/services/export';
import { authService } from '@/services/auth';
import { syncService } from '@/services/sync';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme';
import { ThemePreference } from '@/types';
import { isValidTime, required } from '@/utils/validation';

export default function SettingsScreen() {
  const router = useRouter();
  const toast = useToast();
  const { colors } = useTheme();
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const profile = useProfileStore((s) => s.profile);
  const updateProfile = useProfileStore((s) => s.update);
  const pet = usePetStore((s) => s.pet);
  const rename = usePetStore((s) => s.rename);
  const [name, setName] = useState(profile?.displayName ?? '');
  const [petName, setPetName] = useState(pet?.name ?? '');
  const [time, setTime] = useState(settings.dailyReminderTime);
  const [busy, setBusy] = useState<string | null>(null);

  const toggleNotifications = async (v: boolean) => {
    if (v) {
      if (Platform.OS === 'web') return toast('Notifications need the mobile app', 'error');
      const ok = await notificationService.requestPermission();
      if (!ok) return toast('Permission not granted', 'error');
    }
    await update({ notificationsEnabled: v });
  };

  const confirm = (title: string, body: string, onOk: () => void) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`${title}\n\n${body}`)) onOk();
    } else {
      Alert.alert(title, body, [{ text: 'Cancel', style: 'cancel' }, { text: 'Continue', style: 'destructive', onPress: onOk }]);
    }
  };

  const deleteAccount = () =>
    confirm('Delete account & data?', 'This removes your pet, goals, journal and everything else from this device (and cloud, if synced). This cannot be undone.', async () => {
      setBusy('delete');
      await authService.deleteRemoteAccount();
      await resetAllData();
      setBusy(null);
      router.replace('/onboarding');
    });

  return (
    <Screen>
      <Header title="Settings" back />

      <Section title="Account">
        <Input label="Your name" value={name} onChangeText={setName} maxLength={30} onBlur={() => !required(name, 'Name', 30) && updateProfile({ displayName: name.trim() })} />
        <Text variant="caption" muted>Signed in as: {profile?.authProvider === 'guest' ? 'Guest' : `${profile?.email} (${profile?.authProvider})`}</Text>
        <View style={styles.btnRow}>
          <Button title={profile?.authProvider === 'guest' ? 'Sign in' : 'Manage'} size="sm" variant="secondary" onPress={() => router.push('/auth')} />
          {profile?.authProvider !== 'guest' && (
            <>
              <Button title="Back up" size="sm" variant="secondary" loading={busy === 'push'} onPress={async () => { setBusy('push'); const r = await syncService.push(); setBusy(null); toast(r.message, r.ok ? 'success' : 'error'); }} />
              <Button title="Restore" size="sm" variant="secondary" loading={busy === 'pull'} onPress={async () => { setBusy('pull'); const r = await syncService.pull(); setBusy(null); toast(r.message, r.ok ? 'success' : 'error'); }} />
            </>
          )}
        </View>
      </Section>

      <Section title="Pet">
        <Input label="Pet name" value={petName} onChangeText={setPetName} maxLength={20} onBlur={() => !required(petName, 'Name', 20) && rename(petName)} />
        <Button title="Customise appearance" size="sm" variant="secondary" onPress={() => router.push('/(tabs)/pet')} />
      </Section>

      <Section title="Notifications">
        <Row label="Enable notifications" hint={Platform.OS === 'web' ? 'Available in the mobile app' : 'Gentle local reminders'} value={settings.notificationsEnabled} onChange={toggleNotifications} />
        <Row label="Daily goal reminder" value={settings.goalRemindersEnabled} onChange={(v) => update({ goalRemindersEnabled: v })} disabled={!settings.notificationsEnabled} />
        <Input label="Daily reminder time (24h)" value={time} onChangeText={setTime} maxLength={5} placeholder="09:00" error={time && !isValidTime(time) ? 'Use HH:mm' : null} onBlur={() => isValidTime(time) && update({ dailyReminderTime: time })} />
        <Row label="Adventure reminders" hint="“Your companion has an adventure waiting!”" value={settings.adventureRemindersEnabled} onChange={(v) => update({ adventureRemindersEnabled: v })} disabled={!settings.notificationsEnabled} />
        <Row label="Break reminders" hint="A mid-afternoon nudge to breathe" value={settings.breakRemindersEnabled} onChange={(v) => update({ breakRemindersEnabled: v })} disabled={!settings.notificationsEnabled} />
      </Section>

      <Section title="Appearance">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {(['system', 'light', 'dark'] as ThemePreference[]).map((t) => (
            <Chip key={t} label={t === 'system' ? 'Match system' : t === 'light' ? 'Light' : 'Dark'} icon={t === 'system' ? 'refresh' : t === 'light' ? 'sun' : 'moon'} selected={settings.theme === t} onPress={() => update({ theme: t })} />
          ))}
        </View>
      </Section>

      <Section title="Sound & haptics">
        <Row label="Sound effects" value={settings.soundEnabled} onChange={(v) => update({ soundEnabled: v })} />
        <Row label="Haptic feedback" hint={Platform.OS === 'web' ? 'Mobile only' : undefined} value={settings.hapticsEnabled} onChange={(v) => update({ hapticsEnabled: v })} />
      </Section>

      <Section title="Privacy">
        <Row label="Share anonymous usage stats" hint="Off by default. Nothing leaves your device without this." value={settings.analyticsOptIn} onChange={(v) => update({ analyticsOptIn: v })} />
        <Text variant="caption" muted>Your journal and mood entries are stored only on this device unless you sign in and choose to back up.</Text>
      </Section>

      <Section title="Data">
        <View style={styles.btnRow}>
          <Button title="Export data (JSON)" size="sm" variant="secondary" loading={busy === 'export'} onPress={async () => { setBusy('export'); try { const r = await exportService.exportJson(); toast(r.message, 'success'); } catch (e) { toast('Export failed', 'error'); } setBusy(null); }} />
          <Button title="Reset all data" size="sm" variant="ghost" onPress={() => confirm('Reset all data?', 'Start fresh with a new companion. This cannot be undone.', async () => { await resetAllData(); router.replace('/onboarding'); })} />
        </View>
        <Button title="Delete account" size="sm" variant="danger" loading={busy === 'delete'} onPress={deleteAccount} style={{ marginTop: spacing.sm }} />
      </Section>

      <Section title="About">
        <Text variant="bodyBold">Pipkin v1.0.0</Text>
        <Text muted style={{ marginTop: 4 }}>A cozy companion for gentle self-care. All artwork, characters, and words are original.</Text>
        <Text variant="caption" muted style={{ marginTop: spacing.sm }}>Pipkin is not a medical tool. If you're struggling, please reach out to someone you trust or a local support line.</Text>
        <Button title="Open source licenses" size="sm" variant="ghost" onPress={() => Linking.openURL('https://github.com/expo/expo/blob/main/LICENSE')} style={{ marginTop: spacing.sm }} />
      </Section>
      <View style={{ height: spacing.xl }} />
      <Text variant="caption" muted center>Storage: {Platform.OS === 'web' ? 'browser (IndexedDB/localStorage)' : 'SQLite on device'} · Theme: {colors === undefined ? '' : settings.theme}</Text>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card style={{ marginBottom: spacing.md }}>
      <Text variant="label" muted style={{ marginBottom: spacing.md }}>{title}</Text>
      {children}
    </Card>
  );
}

function Row({ label, hint, value, onChange, disabled }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, disabled && { opacity: 0.5 }]}>
      <View style={{ flex: 1 }}>
        <Text variant="bodyBold">{label}</Text>
        {hint ? <Text variant="caption" muted>{hint}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onChange} disabled={disabled} trackColor={{ true: colors.primary }} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  btnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
});
