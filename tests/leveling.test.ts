import { test } from 'node:test';
import assert from 'node:assert/strict';
import { levelFromXp, xpForLevel, rewardsFor, levelTitle } from '@/utils/leveling';

test('level 1 needs 60 xp and curve increases', () => {
  assert.equal(xpForLevel(1), 60);
  assert.ok(xpForLevel(2) > xpForLevel(1));
  assert.ok(xpForLevel(10) > xpForLevel(5));
});

test('levelFromXp accumulates correctly', () => {
  assert.equal(levelFromXp(0).level, 1);
  assert.equal(levelFromXp(59).level, 1);
  assert.equal(levelFromXp(60).level, 2);
  assert.equal(levelFromXp(60).current, 0);
  const l = levelFromXp(60 + xpForLevel(2) + 5);
  assert.equal(l.level, 3);
  assert.equal(l.current, 5);
  assert.ok(l.progress > 0 && l.progress < 1);
});

test('rewards scale with difficulty and cap streak bonus', () => {
  assert.equal(rewardsFor('easy', 0).xp, 10);
  assert.equal(rewardsFor('hard', 0).xp, 25);
  assert.equal(rewardsFor('easy', 30).xp, 15); // +5 max bonus
  assert.equal(levelTitle(1), 'Sprout');
  assert.equal(levelTitle(25), 'Legend');
});
