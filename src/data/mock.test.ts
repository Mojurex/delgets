import { describe, expect, it } from 'vitest';
import { ALL_CLASSES } from '../config/classes';
import { buildInsights } from '../insights';
import { buildDisplayModel } from '../lib/model';
import { eventDay } from '../lib/points';
import { generateLiveEvent, generateMockDataset } from './mock';

describe('generateMockDataset', () => {
  const asOf = '2026-11-13';
  const data = generateMockDataset(asOf);
  const model = buildDisplayModel(data, asOf);

  it('config-ийн бүх ангид өгөгдөл үүсгэнэ', () => {
    expect(data.classes.map((c) => c.id).sort()).toEqual([...ALL_CLASSES].sort());
    const withEvents = new Set(data.events.map((e) => e.classId));
    expect([...withEvents].sort()).toEqual([...ALL_CLASSES].sort());
  });

  it('ижил огноонд ижил өгөгдөл (seed)', () => {
    expect(generateMockDataset(asOf)).toEqual(data);
  });

  it('өдөрт анги бүрд 3–8 бичлэг', () => {
    const counts = new Map<string, number>();
    for (const e of data.events) {
      const k = `${e.classId}|${eventDay(e)}`;
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    for (const c of counts.values()) {
      expect(c).toBeGreaterThanOrEqual(3);
      expect(c).toBeLessThanOrEqual(8);
    }
  });

  it('+ ба − холимог, асуулга хуудас бүр харуулах зүйлтэй', () => {
    expect(data.events.some((e) => e.points > 0)).toBe(true);
    expect(data.events.some((e) => e.points < 0)).toBe(true);
    expect(model.school).toHaveLength(ALL_CLASSES.length);
    expect(model.feed.length).toBeGreaterThan(0);
    expect(model.categories.every((c) => c.top.length === 3)).toBe(true);
    expect(buildInsights(model, 4).length).toBeGreaterThanOrEqual(3);
  });

  it('оноо ялгаатай тархсан', () => {
    const totals = model.school.map((c) => c.total);
    expect(Math.max(...totals) - Math.min(...totals)).toBeGreaterThan(40);
  });
});

describe('generateLiveEvent', () => {
  it('config-ийн ангид, одоогийн цагтай бичлэг', () => {
    const e = generateLiveEvent(ALL_CLASSES, new Date('2026-11-13T01:00:00Z'), 1);
    expect(ALL_CLASSES).toContain(e.classId);
    expect(e.date).toBe('2026-11-13T09:00:00+08:00');
    expect(e.points).not.toBe(0);
  });
});
