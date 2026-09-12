import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MemoryBackend } from '@/database/memoryBackend';
import { setDatabase } from '@/database';
import { bootstrapStores } from '@/store/bootstrap';
import { useGoalStore } from '@/store/goalStore';
import { usePetStore } from '@/store/petStore';
import { useProfileStore } from '@/store/profileStore';
import { useJournalStore } from '@/store/journalStore';
import { useMoodStore } from '@/store/moodStore';
import { useAdventureStore } from '@/store/adventureStore';
import { useInventoryStore } from '@/store/inventoryStore';

const db = new MemoryBackend();
await db.init();
setDatabase(db);
await bootstrapStores();

test('core loop: create pet → complete goal → xp/energy/coins → undo', async () => {
  await usePetStore.getState().create('fox', 'Ember');
  const coins0 = useProfileStore.getState().profile!.coins;
  const goal = await useGoalStore.getState().add({
    name: 'Stretch', description: '', category: 'exercise', frequency: 'daily', days: [0,1,2,3,4,5,6],
    reminderTime: null, difficulty: 'medium', icon: 'body', color: '#fff',
  });
  const res = await useGoalStore.getState().complete(goal.id);
  assert.ok(res);
  const pet = usePetStore.getState().pet!;
  assert.equal(pet.xp, 15);
  assert.equal(pet.energy, 45);
  assert.equal(useProfileStore.getState().profile!.coins, coins0 + 5);
  assert.equal(useGoalStore.getState().isCompleted(goal.id), true);
  assert.equal(useGoalStore.getState().streakFor(goal.id), 1);
  assert.equal(usePetStore.getState().reaction?.kind, 'goal');
  // double completion is a no-op
  assert.equal(await useGoalStore.getState().complete(goal.id), null);
  // undo
  await useGoalStore.getState().undo(goal.id);
  assert.equal(usePetStore.getState().pet!.xp, 0);
  assert.equal(useGoalStore.getState().isCompleted(goal.id), false);
  // persisted
  assert.equal((await db.collection('goals').all()).length, 1);
  assert.equal((await db.collection('completions').all()).length, 0);
});

test('level up triggers levelup reaction', async () => {
  const g = await useGoalStore.getState().add({
    name: 'Big', description: '', category: 'custom', frequency: 'daily', days: [0,1,2,3,4,5,6],
    reminderTime: null, difficulty: 'hard', icon: 'x', color: '#fff',
  });
  await usePetStore.getState().gainXp(50);
  const r = await useGoalStore.getState().complete(g.id);
  assert.equal(r?.leveledUp, true);
  assert.equal(usePetStore.getState().pet!.level, 2);
  assert.equal(usePetStore.getState().reaction?.kind, 'levelup');
});

test('pause/edit/delete goal', async () => {
  const s = useGoalStore.getState();
  const g = s.goals[0];
  await s.togglePause(g.id);
  assert.equal(useGoalStore.getState().goals[0].paused, true);
  assert.ok(!useGoalStore.getState().todaysGoals().some((x) => x.id === g.id));
  await s.update(g.id, { name: 'Renamed' });
  assert.equal((await db.collection<any>('goals').get(g.id)).name, 'Renamed');
  await s.remove(g.id);
  assert.equal(await db.collection('goals').get(g.id), null);
});

test('journal + mood persist and reward once per day', async () => {
  const xp0 = usePetStore.getState().pet!.xp;
  await useJournalStore.getState().add({ kind: 'free', title: '', body: 'hello' });
  await useJournalStore.getState().add({ kind: 'free', title: '', body: 'again' });
  assert.equal(usePetStore.getState().pet!.xp, xp0 + 8);
  assert.equal(useJournalStore.getState().search('AGAIN').length, 1);
  const e = useJournalStore.getState().entries[0];
  await useJournalStore.getState().update(e.id, { body: 'edited' });
  assert.equal((await db.collection<any>('journal').get(e.id)).body, 'edited');
  await useJournalStore.getState().remove(e.id);
  assert.equal(useJournalStore.getState().entries.length, 1);

  await useMoodStore.getState().checkIn(4, 'ok');
  await useMoodStore.getState().checkIn(2, 'changed my mind');
  assert.equal(useMoodStore.getState().entries.length, 1);
  assert.equal(useMoodStore.getState().todays()?.value, 2);
});

test('adventure requires energy, claims rewards after time', async () => {
  const pet = usePetStore.getState();
  await pet.save({ energy: 10 });
  let r = await useAdventureStore.getState().start('forest');
  assert.equal(r.ok, false);
  await pet.save({ energy: 60 });
  r = await useAdventureStore.getState().start('forest');
  assert.equal(r.ok, true);
  assert.equal(usePetStore.getState().pet!.energy, 35);
  const run = useAdventureStore.getState().active()!;
  assert.equal(await useAdventureStore.getState().claim(run.id), null); // not finished
  // fast-forward
  const finished = { ...run, endsAt: new Date(Date.now() - 1000).toISOString() };
  useAdventureStore.setState({ runs: [finished] });
  const result = await useAdventureStore.getState().claim(run.id);
  assert.ok(result && result.xp >= 20 && result.story.includes('Ember'));
  assert.equal(useAdventureStore.getState().active(), undefined);
});

test('shop respects coins and level', async () => {
  const inv = useInventoryStore.getState();
  await useProfileStore.getState().update({ coins: 10 });
  const beanie = { id: 'hat_beanie', kind: 'accessory' as const, slot: 'hat' as const, name: 'B', description: '', price: 40, unlockLevel: 1, rarity: 'common' as const, emoji: '', color: '' };
  assert.equal((await inv.buy(beanie)).ok, false);
  await useProfileStore.getState().update({ coins: 100 });
  assert.equal((await inv.buy(beanie)).ok, true);
  assert.equal(useProfileStore.getState().profile!.coins, 60);
  assert.equal(useInventoryStore.getState().has('hat_beanie'), true);
  await usePetStore.getState().equip('hat', 'hat_beanie');
  assert.equal(usePetStore.getState().pet!.equipped.hat, 'hat_beanie');
});
