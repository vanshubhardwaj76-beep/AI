import React from 'react';
import { View, StyleSheet } from 'react-native';
import { spacing } from '@/theme';
import { Text } from './Text';
import { Button } from './Button';

interface Props {
  emoji: string;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ emoji, title, body, actionLabel, onAction }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text variant="heading" center>
        {title}
      </Text>
      {body ? (
        <Text muted center style={styles.body}>
          {body}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={{ marginTop: spacing.lg }}>
          <Button title={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: spacing.xxl, paddingHorizontal: spacing.xl },
  emoji: { fontSize: 48, marginBottom: spacing.md },
  body: { marginTop: spacing.sm },
});
