import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Pressable, Switch } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import type { Goal, GoalCategory, GoalDifficulty, GoalFrequency } from '@/types';
import { useTheme } from '@/theme/ThemeProvider';
import { categoryColors, goalColorOptions, goalIconOptions, radius, spacing } from '@/theme';
import { Button, Chip, Input, Text } from '@/components/ui';
import { CATEGORY_INFO } from '@/data/goalTemplates';
import { WEEKDAY_SHORT } from '@/utils/date';
import { isValidTime, required } from '@/utils/validation';
import type { GoalInput } from '@/store/goalStore';

interface Props {
  initial?: Goal | null;
  onSubmit: (input: GoalInput) => Promise<void> | void;
  onDelete?: () => void;
  submitLabel?: string;
}

export function GoalForm({ initial, onSubmit, onDelete, submitLabel = 'Save goal' }: Props) {
  const { colors } = useTheme();
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [category, setCategory] = useState<GoalCategory>(initial?.category ?? 'custom');
  const [frequency, setFrequency] = useState<GoalFrequency>(initial?.frequency ?? 'daily');
  const [days, setDays] = useState<number[]>(initial?.days ?? [1, 2, 3, 4, 5]);
  const [difficulty, setDifficulty] = useState<GoalDifficulty>(initial?.difficulty ?? 'easy');
  const [icon, setIcon] = useState(initial?.icon ?? 'custom');
  const [color, setColor] = useState(initial?.color ?? goalColorOptions[0]);
  const [reminderOn, setReminderOn] = useState(Boolean(initial?.reminderTime));
  const [reminderTime, setReminderTime] = useState(initial?.reminderTime ?? '09:00');
  const [errors, setErrors] = useState<{ name?: string; days?: string; time?: string }>({});
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const e: typeof errors = {};
    const nameErr = required(name, 'Goal name', 50);
    if (nameErr) e.name = nameErr;
    if (frequency === 'custom' && days.length === 0) e.days = 'Pick at least one day';
    if (reminderOn && !isValidTime(reminderTime)) e.time = 'Use 24h format like 08:30';
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        category,
        frequency,
        days: frequency === 'custom' ? days.sort() : [0, 1, 2, 3, 4, 5, 6],
        reminderTime: reminderOn ? reminderTime : null,
        difficulty,
        icon,
        color,
        paused: initial?.paused ?? false,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View>
      <Input label="Name" value={name} onChangeText={setName} placeholder="e.g. Drink a glass of water" error={errors.name} maxLength={50} autoFocus={!initial} />
      <Input label="Description (optional)" value={description} onChangeText={setDescription} placeholder="A tiny note to future you" maxLength={120} />

      <Text variant="label" muted style={styles.label}>Category</Text>
      <View style={styles.wrapRow}>
        {CATEGORY_INFO.map((c) => (
          <Chip
            key={c.id}
            label={c.label}
            icon={c.icon}
            selected={category === c.id}
            color={categoryColors[c.id]}
            onPress={() => {
              setCategory(c.id);
              if (!initial) setColor(categoryColors[c.id]);
            }}
          />
        ))}
      </View>

      <Text variant="label" muted style={styles.label}>Frequency</Text>
      <View style={styles.wrapRow}>
        {(['daily', 'weekly', 'custom'] as GoalFrequency[]).map((f) => (
          <Chip key={f} label={f === 'daily' ? 'Every day' : f === 'weekly' ? 'Once a week' : 'Specific days'} selected={frequency === f} onPress={() => setFrequency(f)} />
        ))}
      </View>
      {frequency === 'custom' && (
        <View>
          <View style={styles.daysRow}>
            {WEEKDAY_SHORT.map((d, i) => {
              const on = days.includes(i);
              return (
                <Pressable
                  key={i}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  onPress={() => setDays(on ? days.filter((x) => x !== i) : [...days, i])}
                  style={[styles.day, { backgroundColor: on ? color : colors.card, borderColor: on ? color : colors.border }]}
                >
                  <Text variant="bodyBold" style={{ color: on ? '#2A1D12' : colors.text }}>{d}</Text>
                </Pressable>
              );
            })}
          </View>
          {errors.days && <Text variant="caption" color={colors.danger}>{errors.days}</Text>}
        </View>
      )}

      <Text variant="label" muted style={styles.label}>Difficulty</Text>
      <View style={styles.wrapRow}>
        {(['easy', 'medium', 'hard'] as GoalDifficulty[]).map((d) => (
          <Chip key={d} label={d === 'easy' ? 'Easy · 10 XP' : d === 'medium' ? 'Medium · 15 XP' : 'Hard · 25 XP'} selected={difficulty === d} onPress={() => setDifficulty(d)} />
        ))}
      </View>

      <Text variant="label" muted style={styles.label}>Icon</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
        {goalIconOptions.map((ic) => (
          <Pressable
            key={ic}
            accessibilityRole="button"
            accessibilityLabel={`Icon ${ic}`}
            onPress={() => setIcon(ic)}
            style={[styles.iconOpt, { backgroundColor: icon === ic ? color : colors.card, borderColor: icon === ic ? color : colors.border }]}
          >
            <Icon name={ic} size={22} color={icon === ic ? '#2A1D12' : colors.text} />
          </Pressable>
        ))}
      </ScrollView>

      <Text variant="label" muted style={styles.label}>Color</Text>
      <View style={styles.wrapRow}>
        {goalColorOptions.map((c) => (
          <Pressable
            key={c}
            accessibilityRole="button"
            accessibilityLabel={`Color ${c}`}
            onPress={() => setColor(c)}
            style={[styles.swatch, { backgroundColor: c, borderColor: color === c ? colors.text : 'transparent' }]}
          />
        ))}
      </View>

      <View style={[styles.reminderRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={{ flex: 1 }}>
          <Text variant="bodyBold">Reminder</Text>
          <Text variant="caption" muted>Get a gentle nudge at a set time</Text>
        </View>
        <Switch value={reminderOn} onValueChange={setReminderOn} trackColor={{ true: colors.primary }} />
      </View>
      {reminderOn && (
        <Input label="Reminder time (24h)" value={reminderTime} onChangeText={setReminderTime} placeholder="09:00" error={errors.time} keyboardType="numbers-and-punctuation" maxLength={5} />
      )}

      <Button title={submitLabel} onPress={submit} loading={saving} fullWidth size="lg" style={{ marginTop: spacing.sm }} />
      {onDelete && (
        <Button title="Delete goal" variant="ghost" onPress={onDelete} fullWidth style={{ marginTop: spacing.md }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: spacing.sm, marginLeft: spacing.xs },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  day: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  iconOpt: { width: 46, height: 46, borderRadius: radius.md, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  swatch: { width: 34, height: 34, borderRadius: 17, borderWidth: 3, marginRight: spacing.sm, marginBottom: spacing.sm },
  reminderRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: radius.md, borderWidth: 1, marginBottom: spacing.lg, marginTop: spacing.sm },
});
