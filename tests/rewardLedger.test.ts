import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MemoryBackend } from '@/database/memoryBackend';
import { setDatabase } from '@/database';
import { bootstrapStores } from '@/store/bootstrap';
import { useGoalStore } from '@/store/goalStore';
import { usePetStore } from '@/store/petStore';
import { useProfileStore } from '@/store/profileStore';
import { useRewardStore } from '@/store/rewardStore';
import { useAdventureStore, phaseOf } from '@/store/adventureStore';
import { useInventoryStore } from '@/store/inventoryStore';
import type { RewardTransaction } from '@/types';
import { todayKey, daysAgoKey } from '@/utils/date';

const db = new MemoryBackend();
await db.init();
setDatabase(db);
await bootstrapStores();
await usePetStore.getState().create('fox', 'Ember');

const snap = () => {
  const p = usePetStore.getState().pet!;
  return { xp: p.xp, energy: p.energy, friendship: p.friendship, level: p.level, coins: useProfileStore.getState().profile!.coins };
};
const mkGoal = (name: string, difficulty: 'easy' | 'medium' | 'hard' = 'medium') =>
  useGoalStore.getState().add({
    name, description: '', category: 'exercise', frequency: 'daily', days: [0, 1, 2, 3, 4, 5, 6],
    reminderTime: null, difficulty, icon: 'body', color: '#fff',
  });
const activeTx = () => useRewardStore.getState().transactions.filter((t) => !t.reversedAt);

test('complete → undo restores xp/energy/coins/friendship exactly', async () => {
  const g = await mkGoal('A');
  const before = snap();
  await useGoalStore.getState().complete(g.id);
  const after = snap();
  assert.equal(after.xp, before.xp + 15);
  assert.equal(after.coins, before.coins + 5);
  assert.equal(after.friendship, before.friendship + 1);
  const c = useGoalStore.getState().completions.find((x) => x.goalId === g.id)!;
  assert.ok(c.transactionId, 'completion links to a transaction');
  const tx = useRewardStore.getState().transactions.find((t) => t.id === c.transactionId)!;
  assert.deepEqual({ xp: tx.xp, coins: tx.coins, goalId: tx.goalId, source: tx.source }, { xp: 15, coins: 5, goalId: g.id, source: 'goal' });
  await useGoalStore.getState().undo(g.id);
  assert.deepEqual(snap(), before);
  assert.equal(activeTx().length, 0);
  // complete → undo → complete works and creates a fresh transaction
  await useGoalStore.getState().complete(g.id);
  assert.deepEqual(snap(), after);
  assert.equal(activeTx().length, 1);
  await useGoalStore.getState().undo(g.id);
  assert.deepEqual(snap(), before);
});

test('two goals, undo one: only that goal reversed, no duplicate transactions', async () => {
  const a = await mkGoal('B1');
  const b = await mkGoal('B2', 'hard');
  const base = snap();
  await useGoalStore.getState().complete(a.id);
  const afterA = snap();
  await useGoalStore.getState().complete(b.id);
  const afterBoth = snap();
  assert.equal(await useGoalStore.getState().complete(b.id), null); // duplicate is a no-op
  assert.equal(activeTx().length, 2);
  assert.deepEqual(snap(), afterBoth);
  await useGoalStore.getState().undo(a.id);
  const now = snap();
  assert.equal(now.xp, afterBoth.xp - (afterA.xp - base.xp));
  assert.equal(now.coins, afterBoth.coins - (afterA.coins - base.coins));
  assert.equal(activeTx().length, 1);
  assert.equal(activeTx()[0].goalId, b.id);
  await useGoalStore.getState().undo(b.id);
  assert.deepEqual(snap(), base);
});

test('undo after "restart" (reload from storage) still reverses exactly', async () => {
  const g = await mkGoal('C');
  const before = snap();
  await useGoalStore.getState().complete(g.id);
  // simulate app restart: clear in-memory state and reload from the same backend
  useRewardStore.setState({ transactions: [] });
  useGoalStore.setState({ completions: [] });
  await useRewardStore.getState().load();
  await useGoalStore.getState().load();
  assert.equal(useGoalStore.getState().isCompleted(g.id), true);
  await useGoalStore.getState().undo(g.id);
  assert.deepEqual(snap(), before);
});

test('undo on one day never touches another day or streak bonuses of other completions', async () => {
  const g = await mkGoal('D');
  const base = snap();
  const d1 = daysAgoKey(2), d2 = daysAgoKey(1), d3 = todayKey();
  await useGoalStore.getState().complete(g.id, d1);
  await useGoalStore.getState().complete(g.id, d2);
  await useGoalStore.getState().complete(g.id, d3); // streak 3 → bonus +1 xp
  const txs = activeTx().filter((t) => t.goalId === g.id);
  assert.equal(txs.length, 3);
  assert.equal(txs[2].streakBonus, 1);
  const total = snap();
  await useGoalStore.getState().undo(g.id, d2);
  assert.equal(snap().xp, total.xp - txs[1].xp);
  assert.equal(useGoalStore.getState().isCompleted(g.id, d1), true);
  assert.equal(useGoalStore.getState().isCompleted(g.id, d3), true);
  await useGoalStore.getState().undo(g.id, d1);
  await useGoalStore.getState().undo(g.id, d3);
  assert.deepEqual(snap(), base);
});

test('reverse is idempotent and clamped grants reverse only what was applied', async () => {
  await usePetStore.getState().save({ energy: 95 });
  const before = snap();
  const { tx } = await useRewardStore.getState().grant({ source: 'activity', refId: 'act_test', xp: 5, energy: 20 });
  assert.equal(tx.energy, 5, 'ledger records the clamped amount');
  assert.equal(snap().energy, 100);
  assert.equal(await useRewardStore.getState().reverse(tx.id), true);
  assert.equal(await useRewardStore.getState().reverse(tx.id), false);
  assert.deepEqual(snap(), before);
  // same refId again does not grant twice
  await useRewardStore.getState().grant({ source: 'activity', refId: 'act_dup', xp: 5 });
  const dup = await useRewardStore.getState().grant({ source: 'activity', refId: 'act_dup', xp: 5 });
  assert.equal(dup.duplicate, true);
  assert.equal(snap().xp, before.xp + 5);
});

test('adventure state machine from timestamps; rewards granted exactly once and survive reload', async () => {
  const adv = useAdventureStore.getState();
  await usePetStore.getState().save({ energy: 100 });
  const r = await adv.start('forest', { durationMs: 6 * 3600_000 });
  assert.equal(r.ok, true);
  const run = r.run!;
  const dur = new Date(run.endsAt).getTime() - new Date(run.startedAt).getTime();
  assert.equal(dur, 6 * 3600_000);
  assert.equal(phaseOf(run, Date.now()), 'on_adventure');
  assert.equal((await adv.start('beach')).ok, false);

  // simulate app closed until after endsAt
  const later = new Date(run.endsAt).getTime() + 60_000;
  const before = snap();
  const done = (await adv.sync(later))!;
  assert.ok(done.completedAt && done.restStartedAt && done.restEndsAt);
  const restMs = new Date(done.restEndsAt!).getTime() - new Date(done.restStartedAt!).getTime();
  assert.ok(restMs >= 2 * 3600_000 && restMs <= 4 * 3600_000, 'rest is 2–4h');
  assert.ok(done.result!.discoveries.length >= 2);
  assert.ok(done.result!.discoveries.some((d) => d.kind === 'coins'));
  assert.equal(snap().xp, before.xp + done.result!.xp);
  assert.equal(snap().coins, before.coins + done.result!.coins);
  for (const id of done.result!.itemIds) assert.equal(useInventoryStore.getState().has(id), true);
  assert.equal(phaseOf(done, later), 'returned');

  // second sync / reload → no duplicate rewards
  const afterOnce = snap();
  assert.equal(await adv.sync(later), null);
  useAdventureStore.setState({ runs: [] });
  await adv.load();
  assert.deepEqual(snap(), afterOnce);
  assert.equal(useRewardStore.getState().transactions.filter((t) => t.refId === run.id).length, 1);
  const persisted = (await db.collection<RewardTransaction>('reward_transactions').all()).filter((t) => t.refId === run.id);
  assert.equal(persisted.length, 1);

  // welcome-home watched → resting; cannot start; after rest → idle
  await adv.markSeen(run.id);
  const cur = useAdventureStore.getState().current()!;
  assert.equal(phaseOf(cur, later + 1000), 'resting');
  assert.equal((await adv.start('beach')).reason, 'Still resting from the last trip');
  assert.equal(phaseOf(cur, new Date(cur.restEndsAt!).getTime() + 1), 'idle');
});

test('reload keeps a completed-but-unseen run in RETURNED (not skipped to resting)', async () => {
  const adv = useAdventureStore.getState();
  await adv.reset();
  await usePetStore.getState().save({ energy: 100 });
  const { run } = await adv.start('forest', { durationMs: 1000 });
  await adv.sync(Date.now() + 2000);
  useAdventureStore.setState({ runs: [] });
  await adv.load();
  const cur = useAdventureStore.getState().runs.find((r) => r.id === run!.id)!;
  assert.equal(cur.seenAt, null);
  assert.equal(phaseOf(cur, Date.now() + 3000), 'returned');
  // legacy record (claimed only) is treated as fully finished
  const db2 = await (await import('@/database')).getDatabase();
  await db2.collection('adventures').put({ id: 'legacy', locationId: 'forest', startedAt: '2026-01-01T00:00:00.000Z', endsAt: '2026-01-01T01:00:00.000Z', claimed: true, result: null } as never);
  await adv.load();
  assert.equal(phaseOf(useAdventureStore.getState().runs.find((r) => r.id === 'legacy'), Date.now()), 'idle');
});
