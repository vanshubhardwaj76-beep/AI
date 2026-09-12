import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MemoryBackend } from '@/database/memoryBackend';

test('memory backend CRUD, kv, export/import', async () => {
  const db = new MemoryBackend();
  await db.init();
  const goals = db.collection<{ id: string; name: string }>('goals');
  await goals.put({ id: 'a', name: 'A' });
  await goals.putMany([{ id: 'b', name: 'B' }, { id: 'c', name: 'C' }]);
  assert.equal((await goals.all()).length, 3);
  assert.deepEqual(await goals.get('b'), { id: 'b', name: 'B' });
  await goals.remove('b');
  assert.equal(await goals.get('b'), null);
  await db.kv.set('pet', { name: 'Pip' });
  assert.deepEqual(await db.kv.get('pet'), { name: 'Pip' });

  const snap = await db.exportAll();
  assert.equal(snap.collections.goals.length, 2);
  const db2 = new MemoryBackend();
  await db2.init();
  await db2.importAll(snap);
  assert.equal((await db2.collection('goals').all()).length, 2);
  assert.deepEqual(await db2.kv.get('pet'), { name: 'Pip' });
  await db2.wipe();
  assert.equal((await db2.collection('goals').all()).length, 0);
});

test('persistence driver receives writes', async () => {
  const writes: string[] = [];
  const db = new MemoryBackend({
    load: async () => ({ collections: { goals: [{ id: 'x' }] }, kv: { k: 1 } }),
    saveCollection: async (n) => { writes.push('col:' + n); },
    saveKv: async () => { writes.push('kv'); },
    clear: async () => { writes.push('clear'); },
  });
  await db.init();
  assert.equal((await db.collection('goals').all()).length, 1);
  assert.equal(await db.kv.get('k'), 1);
  await db.collection('goals').put({ id: 'y' });
  await db.kv.set('k', 2);
  assert.deepEqual(writes, ['col:goals', 'kv']);
});
