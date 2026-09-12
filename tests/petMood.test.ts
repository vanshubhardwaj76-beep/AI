import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computePetMood, petLine } from '@/utils/petMood';

const base = { energy: 50, completedToday: 0, totalToday: 3, hoursSinceSeen: 1, hour: 14, recentlyCompleted: false, recentlyLeveled: false };

test('mood priorities', () => {
  assert.equal(computePetMood({ ...base, recentlyLeveled: true }), 'proud');
  assert.equal(computePetMood({ ...base, recentlyCompleted: true }), 'excited');
  assert.equal(computePetMood({ ...base, hour: 23 }), 'sleepy');
  assert.equal(computePetMood({ ...base, energy: 5 }), 'tired');
  assert.equal(computePetMood({ ...base, completedToday: 3 }), 'proud');
  assert.equal(computePetMood({ ...base, hoursSinceSeen: 48 }), 'curious');
  assert.equal(computePetMood({ ...base, completedToday: 1 }), 'happy');
});

test('pet never guilt-trips', () => {
  const moods = ['happy', 'excited', 'sleepy', 'curious', 'proud', 'calm', 'tired'] as const;
  for (const m of moods) for (let i = 0; i < 3; i++) {
    const line = petLine(m, i).toLowerCase();
    assert.ok(!/abandon|forgot me|where were you/.test(line), line);
  }
});
