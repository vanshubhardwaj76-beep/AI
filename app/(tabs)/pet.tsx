import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text, Card, Button, ProgressBar, Chip, Input, Sheet, useToast, Icon, IconTile } from '@/components/ui';
import type { IconName } from '@/components/ui';
import { PetAvatar } from '@/components/pet/PetAvatar';
import { Environment } from '@/components/pet/Environment';
import { PixelSprite } from '@/engine/PixelSprite';
import { accessoryPreview } from '@/engine/accessories';
import { usePetStore } from '@/store/petStore';
import { useInventoryStore } from '@/store/inventoryStore';
import { useProfileStore } from '@/store/profileStore';
import { useAdventureStore } from '@/store/adventureStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing, shadows } from '@/theme';
import { ITEMS } from '@/data/items';
import { speciesInfo } from '@/data/pets';
import { AccessorySlot, Item } from '@/types';
import { levelFromXp, levelTitle, MAX_ENERGY } from '@/utils/leveling';
import { MOOD_LABEL, MOOD_ICON } from '@/utils/petMood';
import { required } from '@/utils/validation';

const SLOTS: { id: AccessorySlot | 'environment'; label: string; icon: IconName }[] = [
  { id: 'hat', label: 'Hats', icon: 'hat' },
  { id: 'glasses', label: 'Glasses', icon: 'glasses' },
  { id: 'scarf', label: 'Scarves', icon: 'scarf' },
  { id: 'jacket', label: 'Jackets', icon: 'jacket' },
  { id: 'backpack', label: 'Bags', icon: 'backpack' },
  { id: 'toy', label: 'Toys', icon: 'toy' },
  { id: 'companion', label: 'Buddies', icon: 'companion' },
  { id: 'environment', label: 'Places', icon: 'environment' },
];

export default function PetScreen() {
  const router = useRouter();
  const toast = useToast();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const pet = usePetStore((s) => s.pet);
  const equip = usePetStore((s) => s.equip);
  const setEnvironment = usePetStore((s) => s.setEnvironment);
  const rename = usePetStore((s) => s.rename);
  const owned = useInventoryStore((s) => s.owned);
  const has = useInventoryStore((s) => s.has);
  const buy = useInventoryStore((s) => s.buy);
  const coins = useProfileStore((s) => s.profile?.coins ?? 0);
  useAdventureStore((s) => s.tick);
  const phase = useAdventureStore((s) => s.phase());
  const activeRun = phase !== 'idle';
  const away = phase === 'on_adventure' || phase === 'returned';
  const [slot, setSlot] = useState<(typeof SLOTS)[number]['id']>('hat');
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState('');
  const [nameErr, setNameErr] = useState<string | null>(null);

  const lvl = useMemo(() => levelFromXp(pet?.xp ?? 0), [pet?.xp]);
  const items = useMemo(() => ITEMS.filter((i) => (slot === 'environment' ? i.kind === 'environment' : i.kind === 'accessory' && i.slot === slot)), [slot]);
  const collectibles = useMemo(() => ITEMS.filter((i) => i.kind === 'collectible'), []);
  if (!pet) return null;
  const info = speciesInfo(pet.species);
  const stageSize = Math.max(240, Math.min(width - spacing.lg * 2, 420));

  const onItem = async (item: Item) => {
    const ownedIt = has(item.id);
    if (ownedIt) {
      if (item.kind === 'environment') await setEnvironment(item.id);
      else if (item.slot) {
        const isOn = pet.equipped[item.slot] === item.id;
        await equip(item.slot, isOn ? null : item.id);
      }
      return;
    }
    const res = await buy(item);
    if (res.ok) {
      toast(`Unlocked ${item.name}!`, 'success');
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
            <Icon name="edit" size={18} color={colors.textMuted} />
          </Pressable>
          <Text variant="caption" muted>{info.name} · {levelTitle(pet.level)}</Text>
        </View>
        <View style={[styles.coins, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Icon name="coins" size={16} color="#D69C2A" strokeWidth={2.4} />
          <Text variant="bodyBold" style={{ marginLeft: 6 }}>{coins}</Text>
        </View>
      </View>

      <View style={[styles.stage, shadows.card, { width: stageSize, alignSelf: 'center' }]}>
        {/* Wardrobe preview: while away this is a mannequin-style preview, not the pet at home */}
        <PetAvatar pet={pet} size={stageSize} state={away ? 'WALKING' : phase === 'resting' ? 'SLEEPING' : undefined} interactive={!activeRun} />
        <View style={[styles.moodTag, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Icon name={away ? 'compass' : phase === 'resting' ? 'moon' : MOOD_ICON[pet.mood]} size={14} color={colors.primary} />
          <Text variant="caption" style={{ marginLeft: 5, fontFamily: 'Nunito_700Bold' }}>{away ? 'Away (preview)' : phase === 'resting' ? 'Resting' : MOOD_LABEL[pet.mood]}</Text>
        </View>
      </View>

      <Card style={{ marginTop: spacing.md }}>
        <Row icon="xp" label={`Level ${lvl.level}`} right={`${lvl.current}/${lvl.needed} XP`} value={lvl.progress} color="#B8A9E8" />
        <Row icon="energy" label="Energy" right={`${pet.energy}/${MAX_ENERGY}`} value={pet.energy / MAX_ENERGY} color="#6DBF9C" />
        <Row icon="friendship" label="Friendship" right={`${pet.friendship}%`} value={pet.friendship / 100} color="#F5A3B5" last />
      </Card>

      <Button title={away ? 'Check on adventure' : phase === 'resting' ? 'Resting after adventure' : 'Go on an adventure'} icon="compass" fullWidth size="lg" onPress={() => router.push('/adventure')} style={{ marginTop: spacing.md }} />

      <Text variant="heading" style={styles.section}>Wardrobe & places</Text>
      <View style={styles.slotRow}>
        {SLOTS.map((s) => <Chip key={s.id} label={s.label} icon={s.icon} selected={slot === s.id} onPress={() => setSlot(s.id)} />)}
      </View>
      <View style={styles.grid}>
        {items.map((item) => {
          const ownedIt = has(item.id);
          const equipped = item.kind === 'environment' ? pet.environmentId === item.id : item.slot ? pet.equipped[item.slot] === item.id : false;
          const locked = pet.level < item.unlockLevel;
          const preview = item.kind === 'accessory' ? accessoryPreview(item.id) : null;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`${item.name}${equipped ? ', equipped' : ownedIt ? ', owned' : ''}`}
              onPress={() => onItem(item)}
              style={({ pressed }) => [styles.item, shadows.soft, { backgroundColor: colors.card, borderColor: equipped ? item.color : colors.border, borderWidth: equipped ? 2 : 1, opacity: locked && !ownedIt ? 0.6 : 1, transform: [{ scale: pressed ? 0.96 : 1 }] }]}
            >
              <View style={[styles.thumb, { backgroundColor: item.color + '33' }]}>
                {item.kind === 'environment' ? (
                  <Environment id={item.id} size={64} radius={14} animated={false} />
                ) : preview ? (
                  <PixelSprite sprite={preview} size={64} />
                ) : (
                  <Icon name={item.icon} size={28} color={item.color} />
                )}
                {equipped && (
                  <View style={styles.equippedDot}>
                    <Icon name="check" size={12} color="#FFFFFF" strokeWidth={3.5} />
                  </View>
                )}
                {locked && !ownedIt && (
                  <View style={styles.lock}>
                    <Icon name="lock" size={12} color="#FFFFFF" />
                  </View>
                )}
              </View>
              <Text variant="caption" style={{ fontFamily: 'Nunito_700Bold', marginTop: 6 }} center numberOfLines={1}>{item.name}</Text>
              <View style={styles.priceRow}>
                {ownedIt ? (
                  <Text variant="caption" muted>{equipped ? 'Equipped' : item.kind === 'environment' ? 'Tap to visit' : 'Tap to wear'}</Text>
                ) : locked ? (
                  <Text variant="caption" muted>Unlocks at level {item.unlockLevel}</Text>
                ) : item.price > 0 ? (
                  <>
                    <Icon name="coins" size={12} color="#D69C2A" strokeWidth={2.6} />
                    <Text variant="caption" muted style={{ marginLeft: 3 }}>{item.price}</Text>
                  </>
                ) : (
                  <Text variant="caption" muted>Adventure reward</Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      <Text variant="heading" style={styles.section}>Collectibles <Text muted>· {collectibles.filter((c) => has(c.id)).length}/{collectibles.length}</Text></Text>
      <View style={styles.grid}>
        {collectibles.map((c) => {
          const got = has(c.id);
          return (
            <View key={c.id} style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border, opacity: got ? 1 : 0.5 }]}>
              <IconTile name={got ? c.icon : 'search'} color={got ? c.color : colors.textMuted} size={56} />
              <Text variant="caption" style={{ fontFamily: 'Nunito_700Bold', marginTop: 6 }} center numberOfLines={1}>{got ? c.name : 'Undiscovered'}</Text>
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

function Row({ icon, label, right, value, color, last }: { icon: IconName; label: string; right: string; value: number; color: string; last?: boolean }) {
  return (
    <View style={{ marginBottom: last ? 0 : spacing.md }}>
      <View style={styles.rowBetween}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Icon name={icon} size={15} color={color} strokeWidth={2.6} />
          <Text variant="bodyBold" style={{ marginLeft: 6 }}>{label}</Text>
        </View>
        <Text variant="caption" muted>{right}</Text>
      </View>
      <ProgressBar value={value} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  coins: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 42, borderRadius: radius.pill, borderWidth: 1 },
  stage: { borderRadius: 36 },
  moodTag: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  section: { marginTop: spacing.xl, marginBottom: spacing.sm },
  slotRow: { flexDirection: 'row', flexWrap: 'wrap' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  item: { width: '31%', flexGrow: 1, padding: spacing.sm, paddingBottom: spacing.md, borderRadius: radius.md, borderWidth: 1, alignItems: 'center', minWidth: 104 },
  thumb: { width: 72, height: 72, borderRadius: 18, alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  equippedDot: { position: 'absolute', right: -4, top: -4, width: 20, height: 20, borderRadius: 10, backgroundColor: '#4FA98B', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  lock: { position: 'absolute', right: -4, top: -4, width: 20, height: 20, borderRadius: 10, backgroundColor: '#7A6A5F', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
});
