import { describe, expect, it } from 'vitest';
import type { GroupConfig } from '../config/classes';
import type { Dataset, PointEvent } from '../data/types';
import { buildDisplayModel } from '../lib/model';
import { buildInsights } from './index';
import {
  attendanceStreak,
  biggestRise,
  fullAttendanceStreak,
  leaderGap,
  mostDeductedCategory,
  noDeductionsThisWeek,
} from './rules';

const group: GroupConfig = {
  id: 'baga',
  title: 'Бага ангиуд',
  classes: ['1-1', '1-2', '1-3'],
};

let seq = 0;
const ev = (classId: string, day: string, points: number, category: PointEvent['category'] = 'activity'): PointEvent => ({
  id: `e${++seq}`,
  classId,
  category,
  points,
  reason: 't',
  date: `${day}T09:00:00+08:00`,
  source: 'teacher_form',
});

const data = (events: PointEvent[]): Dataset => ({
  classes: group.classes.map((id) => ({ id, studentCount: 30 })),
  events,
});

const asOf = '2026-11-13';
const days = ['2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13'];

describe('noDeductionsThisWeek', () => {
  it('долоо хоногт хасагдаагүй ангийг нэрлэнэ', () => {
    const m = buildDisplayModel(data([...days.map((d) => ev('1-2', d, 3)), ev('1-1', '2026-11-12', -2), ev('1-1', '2026-11-11', 9)]), asOf, [group]);
    expect(noDeductionsThisWeek(m)?.text).toBe('1-2 анги энэ долоо хоногт нэг ч оноо хасуулаагүй.');
  });
  it('бичлэг цөөн бол null', () => {
    const m = buildDisplayModel(data([ev('1-2', '2026-11-12', 3)]), asOf, [group]);
    expect(noDeductionsThisWeek(m)).toBeNull();
  });
});

describe('biggestRise', () => {
  it('2-оос дээш байр ахисан анги', () => {
    const events = [
      ev('1-1', '2026-11-03', 10),
      ev('1-2', '2026-11-03', 8),
      ev('1-3', '2026-11-03', 2),
      ev('1-3', '2026-11-12', 30),
    ];
    const m = buildDisplayModel(data(events), asOf, [group]);
    expect(biggestRise(m)?.text).toBe('1-3 анги өнгөрсөн долоо хоногоос 2 байр ахилаа.');
  });
});

describe('mostDeductedCategory', () => {
  it('өнгөрсөн сартай харьцуулна', () => {
    const events = [
      ev('1-1', '2026-11-05', -4, 'shoes'),
      ev('1-2', '2026-11-05', -2, 'uniform'),
      ev('1-1', '2026-10-05', -9, 'shoes'),
    ];
    const m = buildDisplayModel(data(events), asOf, [group]);
    expect(mostDeductedCategory(m)?.text).toBe('Энэ сард хамгийн их хасагдсан шалгуур нь Гутал (−4). Өнгөрсөн сард −9 байсан.');
  });
});

describe('attendanceStreak', () => {
  it('дараалсан бүрэн ирцийн өдрийг тоолно', () => {
    const events = [
      ...days.map((d) => ev('1-1', d, 5, 'attendance')),
      ev('1-1', '2026-11-06', -1, 'attendance'),
      ev('1-1', '2026-11-05', 5, 'attendance'),
    ];
    expect(fullAttendanceStreak(events)).toBe(5);
    const m = buildDisplayModel(data(events), asOf, [group]);
    expect(attendanceStreak(m)?.text).toBe('1-1 анги 5 өдөр дараалан ирц бүрэн байна.');
  });
});

describe('leaderGap', () => {
  it('ойрхон бол тэмцээн', () => {
    const m = buildDisplayModel(data([ev('1-1', '2026-11-12', 20), ev('1-2', '2026-11-12', 17)]), asOf, [group]);
    expect(leaderGap(m)?.text).toBe('1-1 ба 1-2 ангийн хооронд ердөө 3 оноо байна.');
  });
  it('хол бол давуу байдал', () => {
    const m = buildDisplayModel(data([ev('1-1', '2026-11-12', 40), ev('1-2', '2026-11-12', 17)]), asOf, [group]);
    expect(leaderGap(m)?.text).toBe('1-1 анги 2-р байрын 1-2 ангиас 23 оноогоор түрүүлж байна.');
  });
});

describe('buildInsights', () => {
  it('чухлаар нь эрэмбэлж, хязгаарлана', () => {
    const m = buildDisplayModel(data([ev('1-1', '2026-11-12', 40), ev('1-2', '2026-11-12', 17)]), asOf, [group]);
    const list = buildInsights(m, 2);
    expect(list).toHaveLength(2);
    expect(list[0]!.priority).toBeGreaterThanOrEqual(list[1]!.priority);
  });
  it('өгөгдөлгүй үед хоосон', () => {
    expect(buildInsights(buildDisplayModel(data([]), asOf, [group]), 4)).toEqual([]);
  });
});
