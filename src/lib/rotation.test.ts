import { describe, expect, it } from 'vitest';
import { buildCycle, viewKey } from './rotation';

const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];

describe('buildCycle', () => {
  it('самбар → тойм → ажиглалт → 3 анги', () => {
    expect(buildCycle(ids, 0).map((s) => viewKey(s.view))).toEqual([
      'overview',
      'criteria',
      'insights',
      'class:a',
      'class:b',
      'class:c',
    ]);
  });

  it('дараагийн эргэлтэд дараагийн 3 анги, төгсгөлөөс эхэнд эргэнэ', () => {
    expect(buildCycle(ids, 1).slice(3).map((s) => viewKey(s.view))).toEqual(['class:d', 'class:e', 'class:f']);
    expect(buildCycle(ids, 2).slice(3).map((s) => viewKey(s.view))).toEqual(['class:g', 'class:a', 'class:b']);
  });

  it('хугацаа: 20с, 14с, 14с, 10с', () => {
    expect(buildCycle(ids, 0).map((s) => s.durationMs)).toEqual([20000, 14000, 14000, 10000, 10000, 10000]);
  });

  it('анги байхгүй бол 3 алхам', () => {
    expect(buildCycle([], 5)).toHaveLength(3);
  });
});
