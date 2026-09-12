import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Card, Button, ProgressBar, Chip, Input, Sheet, useToast } from '@/components/ui';
import { PetAvatar } from '@/components/pet/PetAvatar';
import { usePetStore } from '@/store/petStore';
import { useInventoryStore } from '@/store/inventoryStore';
import { useProfileStore } from '@/store/profileStore';
import { useAdventureStore } from '@/store/adventureStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme';
import { ITEMS } from '@/data/items';
import { speciesInfo } from '@/data/pets';
import { AccessorySlot, Item } from '@/types';
import { levelFromXp, levelTitle, MAX_ENERGY } from '@/utils/leveling';
import { MOOD_LABEL } from '@/utils/petMood';
import { required } from '@/utils/validation';

const SLOTS: { id: AccessorySlot | 'environment'; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'hat', label: 'Hats', icon: 'ribbon-outline' },
  { id: 'glasses', label: 'Glasses', icon: 'glasses-outline' },
  { id: 'scarf', label: 'Scarves', icon: 'shirt-outline' },
  { id: 'jacket', label: 'Jackets', icon: 'shirt' },
  { id: 'backpack', label: 'Bags', icon: 'bag-outline' },
  { id: 'toy', label: 'Toys', icon: 'football-outline' },
  { id: 'companion', label: 'Buddies', icon: 'heart-outline' },
  { id: 'environment', label: 'Rooms', icon: 'home-outline' },
];

export default function PetScreen() {
  const router = useRouter();
  const toast = useToast();
  const { colors } = useTheme();
  const pet = usePetStore((s) => s.pet);
  const equip = usePetStore((s) => s.equip);
  const setEnvironment = usePetStore((s) => s.setEnvironment);
  const rename = usePetStore((s) => s.rename);
  const owned = useInventoryStore((s) => s.owned);
  const has = useInventoryStore((s) => s.has);
  const buy = useInventoryStore((s) => s.buy);
  const coins = useProfileStore((s) => s.profile?.coins ?? 0);
  const activeRun = useAdventureStore((s) => s.active());
  const [slot, setSlot] = useState<(typeof SLOTS)[number]['id']>('hat');
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState('');
  const [nameErr, setNameErr] = useState<string | null>(null);

  const lvl = useMemo(() => levelFromXp(pet?.xp ?? 0), [pet?.xp]);
  const items = useMemo(
    () => ITEMS.filter((i) => (slot === 'environment' ? i.kind === 'environment' : i.kind === 'accessory' && i.slot === slot)),
    [slot],
  );
  const collectibles = useMemo(() => ITEMS.filter((i) => i.kind === 'collectible'), []);
  if (!pet) return null;
  const info = speciesInfo(pet.species);

  const onItem = async (item: Item) => {
    const ownedIt = has(item.id);
    if (ownedIt) {
      if (item.kind === 'environment') {
        await setEnvironment(item.id);
      } else if (item.slot) {
        const isOn = pet.equipped[item.slot] === item.id;
        await equip(item.slot, isOn ? null : item.id);
      }
      return;
    }
    const res = await buy(item);
    if (res.ok) {
      toast(`Unlocked ${item.name}! 🎁`, 'success');
      if (item.kind === 'environment') await setEnvironment(item.id);
      else if (item.slot) await equip(item.slot, item.id);
    } else toast(res.reason ?? 'Not available', 'error');
  };

  return (
    <Screen>
      <View style={styles.top}>
        <View style={{ flex: 1 }}>
          <Pressable onPress={() => { setNewName(pet.name); setRenaming(true); }} accessibilityRole="button" accessibilityLabel="Rename pet" style={styles.nameRow}>
            <Text variant="display">{pet.name}</Text>
            <Ionicons name="pencil" size={18} color={colors.textMuted} />
          </Pressable>
          <Text muted>{info.name} · {levelTitle(pet.level)} · {MOOD_LABEL[pet.mood]}</Text>
        </View>
        <View style={[styles.coins, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text variant="bodyBold">🪙 {coins}</Text>
        </View>
      </View>

      <View style={styles.center}>
        <PetAvatar pet={pet} size={260} />
      </View>

      <Card>
        <Row label={`Level ${lvl.level}`} right={`${lvl.current}/${lvl.needed} XP`} value={lvl.progress} color="#B8A9E8" />
        <Row label="⚡ Energy" right={`${pet.energy}/${MAX_ENERGY}`} value={pet.energy / MAX_ENERGY} color={colors.accent} />
        <Row label="💛 Friendship" right={`${pet.friendship}%`} value={pet.friendship / 100} color="#F5A3B5" last />
      </Card>

      <Button
        title={activeRun ? 'Check on adventure' : 'Go on an adventure'}
        icon="compass"
        fullWidth
        size="lg"
        onPress={() => router.push('/adventure')}
        style={{ marginTop: spacing.md }}
      />

      <Text variant="label" muted style={styles.section}>Wardrobe & rooms</Text>
      <View style={styles.slotRow}>
        {SLOTS.map((s) => (
          <Chip key={s.id} label={s.label} icon={s.icon} selected={slot === s.id} onPress={() => setSlot(s.id)} />
        ))}
      </View>
      <View style={styles.grid}>
        {items.map((item) => {
          const ownedIt = has(item.id);
          const equipped = item.kind === 'environment' ? pet.environmentId === item.id : item.slot ? pet.equipped[item.slot] === item.id : false;
          const locked = pet.level < item.unlockLevel;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`${item.name}${equipped ? ', equipped' : ownedIt ? ', owned' : ''}`}
              onPress={() => onItem(item)}
              style={[styles.item, { backgroundColor: equipped ? item.color + '55' : colors.card, borderColor: equipped ? item.color : colors.border, opacity: locked && !ownedIt ? 0.6 : 1 }]}
            >
              <Text style={{ fontSize: 30 }}>{item.emoji}</Text>
              <Text variant="caption" style={{ fontWeight: '700', marginTop: 4 }} center numberOfLines={1}>{item.name}</Text>
              <Text variant="caption" muted center>
                {ownedIt ? (equipped ? 'Equipped' : 'Tap to wear') : locked ? `Lv ${item.unlockLevel}` : item.price > 0 ? `🪙 ${item.price}` : 'Adventure'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text variant="label" muted style={styles.section}>Collectibles · {collectibles.filter((c) => has(c.id)).length}/{collectibles.length}</Text>
      <View style={styles.grid}>
        {collectibles.map((c) => {
          const got = has(c.id);
          return (
            <View key={c.id} style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border, opacity: got ? 1 : 0.45 }]}>
              <Text style={{ fontSize: 30 }}>{got ? c.emoji : '❔'}</Text>
              <Text variant="caption" style={{ fontWeight: '700', marginTop: 4 }} center numberOfLines={1}>{got ? c.name : '???'}</Text>
              <Text variant="caption" muted center numberOfLines={1}>{got ? c.description : 'Find on adventures'}</Text>
            </View>
          );
        })}
      </View>
      <Text variant="caption" muted center style={{ marginTop: spacing.md }}>{owned.length} items collected</Text>

      <Sheet visible={renaming} onClose={() => setRenaming(false)} title="Rename your companion">
        <Input value={newName} onChangeText={setNewName} maxLength={20} error={nameErr} autoFocus placeholder={info.defaultName} />
        <Button title="Save" fullWidth onPress={async () => {
          const err = required(newName, 'Name', 20);
          setNameErr(err);
          if (err) return;
          await rename(newName);
          setRenaming(false);
          toast('Name updated', 'success');
        }} />
      </Sheet>
    </Screen>
  );
}

function Row({ label, right, value, color, last }: { label: string; right: string; value: number; color: string; last?: boolean }) {
  return (
    <View style={{ marginBottom: last ? 0 : spacing.md }}>
      <View style={styles.rowBetween}>
        <Text variant="bodyBold">{label}</Text>
        <Text muted>{right}</Text>
      </View>
      <ProgressBar value={value} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  coins: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1 },
  center: { alignItems: 'center', marginVertical: spacing.md },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  section: { marginTop: spacing.xl, marginBottom: spacing.sm },
  slotRow: { flexDirection: 'row', flexWrap: 'wrap' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  item: { width: '31%', flexGrow: 1, padding: spacing.md, borderRadius: radius.md, borderWidth: 1.5, alignItems: 'center', minWidth: 96 },
});
