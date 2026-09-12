import React from 'react';
import { View, StyleSheet } from 'react-native';
import { spacing } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';

interface Props {
  icon: IconName;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  color?: string;
}

export function EmptyState({ icon, title, body, actionLabel, onAction, color }: Props) {
  const { colors } = useTheme();
  const c = color ?? colors.primary;
  return (
    <View style={styles.wrap}>
      <View style={[styles.halo, { backgroundColor: c + '22' }]}>
        <View style={[styles.tile, { backgroundColor: c + '33' }]}>
          <Icon name={icon} size={34} color={c} />
        </View>
      </View>
      <Text variant="heading" center>{title}</Text>
      {body ? <Text muted center style={styles.body}>{body}</Text> : null}
      {actionLabel && onAction ? <View style={{ marginTop: spacing.lg }}><Button title={actionLabel} onPress={onAction} /></View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: spacing.xxl, paddingHorizontal: spacing.xl },
  halo: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  tile: { width: 68, height: 68, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  body: { marginTop: spacing.sm, maxWidth: 300 },
});
