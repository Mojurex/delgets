import { describe, expect, it } from 'vitest';
import type { ClassInfo, DutyCheck, PointEvent } from '../data/types';
import {
  clampActivity,
  dailySeries,
  dutyCheckToEvents,
  eventsInMonth,
  latestEvents,
  rank,
  rankChanges,
  summarize,
} from './points';

const check = (o: Partial<DutyCheck> = {}): DutyCheck => ({
  id: 'c1',
  classId: '7-1',
  day: '2026-11-12',
  absentExcused: 0,
  absentUnexcused: 0,
  truancies: 0,
  uniformViolations: 0,
  hygiene: 2,
  shoesViolations: 0,
  ...o,
});

let seq = 0;
const ev = (classId: string, points: number, o: Partial<PointEvent> = {}): PointEvent => ({
  id: `e${++seq}`,
  classId,
  category: 'activity',
  points,
  reason: 'test',
  date: '2026-11-12T10:00:00+08:00',
  source: 'teacher_form',
  ...o,
});

const classes: ClassInfo[] = [
  { id: 'a', studentCount: 30 },
  { id: 'b', studentCount: 20 },
  { id: 'c', studentCount: 40 },
];
const order = ['a', 'b', 'c'];
const nov = { year: 2026, month: 11 };

describe('dutyCheckToEvents', () => {
  it('бүгд зөв өдөр: +5 +3 +2 +2 +2', () => {
    const events = dutyCheckToEvents(check());
    expect(events.map((e) => [e.category, e.points])).toEqual([
      ['attendance', 5],
      ['truancy', 3],
      ['uniform', 2],
      ['hygiene', 2],
      ['shoes', 2],
    ]);
    expect(events[0]?.date).toBe('2026-11-12T08:30:00+08:00');
    expect(events[0]?.id).toBe('c1:attendance');
    expect(events.every((e) => e.source === 'duty_teacher')).toBe(true);
  });

  it('өвчтэй сурагч оноо хасуулахгүй', () => {
    const [att] = dutyCheckToEvents(check({ absentExcused: 3 }));
    expect(att?.points).toBe(5);
    expect(att?.reason).toBe('Бүгд ирсэн, 3 сурагч чөлөөтэй');
  });

  it('шалтгаангүй ирээгүй сурагч бүрд −1', () => {
    const [att] = dutyCheckToEvents(check({ absentUnexcused: 3, absentExcused: 1 }));
    expect(att?.points).toBe(-3);
    expect(att?.reason).toBe('3 сурагч шалтгаангүй ирсэнгүй');
  });

  it('таслалт бүрд −2, зөрчил бүрд −1', () => {
    const events = dutyCheckToEvents(check({ truancies: 2, uniformViolations: 1, shoesViolations: 4, hygiene: -3 }));
    const by = Object.fromEntries(events.map((e) => [e.category, e]));
    expect(by.truancy?.points).toBe(-4);
    expect(by.truancy?.reason).toBe('2 таслалт');
    expect(by.uniform?.points).toBe(-1);
    expect(by.shoes?.points).toBe(-4);
    expect(by.shoes?.reason).toBe('4 сурагч гутал сольсонгүй');
    expect(by.hygiene?.points).toBe(-3);
  });

  it('ариун цэвэр 0 бол бичлэг үүсгэхгүй, хязгаараас хэтэрснийг багтаана', () => {
    expect(dutyCheckToEvents(check({ hygiene: 0 })).some((e) => e.category === 'hygiene')).toBe(false);
    expect(dutyCheckToEvents(check({ hygiene: 9 })).find((e) => e.category === 'hygiene')?.points).toBe(3);
  });

  it('бүртгэсэн цаг байвал түүнийг ашиглана', () => {
    expect(dutyCheckToEvents(check({ recordedAt: '2026-11-12T08:42:11+08:00' }))[0]?.date).toBe('2026-11-12T08:42:11+08:00');
  });

  it('clampActivity', () => {
    expect(clampActivity(25)).toBe(10);
    expect(clampActivity(-3.4)).toBe(-3);
  });
});

describe('summarize', () => {
  it('авсан, хасуулсан, шалгуур бүрийн нийлбэр', () => {
    const events = [
      ev('a', 5, { category: 'attendance' }),
      ev('a', -2, { category: 'shoes' }),
      ev('a', -1, { category: 'shoes' }),
      ev('a', 4),
    ];
    const [a] = summarize(events, ['a'], classes);
    expect(a).toMatchObject({ total: 6, plus: 9, minus: -3, studentCount: 30 });
    expect(a?.categories.shoes).toEqual({ category: 'shoes', plus: 0, minus: -3, net: -3, count: 2 });
    expect(a?.categories.activity.net).toBe(4);
  });

  it('бичлэггүй анги ч жагсаалтад 0 оноотой орно', () => {
    const s = summarize([], order, classes);
    expect(s.map((x) => x.total)).toEqual([0, 0, 0]);
  });

  it('normalizeBySize унтраалттай үед score = total', () => {
    const [a] = summarize([ev('a', 10)], ['a'], classes);
    expect(a?.score).toBe(10);
  });
});

describe('rank', () => {
  it('оноогоор эрэмбэлнэ', () => {
    const r = rank(summarize([ev('a', 5), ev('b', 9), ev('c', 7)], order, classes), order);
    expect(r.map((x) => [x.classId, x.rank])).toEqual([
      ['b', 1],
      ['c', 2],
      ['a', 3],
    ]);
  });

  it('тэнцвэл хасуулсан оноо бага нь эхэнд', () => {
    const events = [ev('a', 10), ev('a', -4), ev('b', 8), ev('b', -2)];
    expect(rank(summarize(events, order, classes), order)[0]?.classId).toBe('b');
  });

  it('хасуулсан ч тэнцвэл ирцийн оноо өндөр нь', () => {
    const events = [
      ev('a', 6, { category: 'activity' }),
      ev('b', 6, { category: 'attendance' }),
    ];
    expect(rank(summarize(events, order, classes), order)[0]?.classId).toBe('b');
  });

  it('бүгд тэнцвэл config-ийн дараалал', () => {
    expect(rank(summarize([], ['c', 'a'], classes), ['c', 'a']).map((x) => x.classId)).toEqual(['c', 'a']);
  });
});

describe('eventsInMonth', () => {
  it('зөвхөн тухайн сар, until хүртэл', () => {
    const events = [
      ev('a', 1, { date: '2026-10-31T23:00:00+08:00' }),
      ev('a', 2, { date: '2026-11-01T08:00:00+08:00' }),
      ev('a', 3, { date: '2026-11-20T08:00:00+08:00' }),
    ];
    expect(eventsInMonth(events, nov, '2026-11-13').map((e) => e.points)).toEqual([2]);
    expect(eventsInMonth(events, nov).map((e) => e.points)).toEqual([2, 3]);
  });
});

describe('rankChanges', () => {
  it('7 хоногийн өмнөх байртай харьцуулна', () => {
    const events = [
      ev('a', 10, { date: '2026-11-03T08:00:00+08:00' }),
      ev('b', 5, { date: '2026-11-03T08:00:00+08:00' }),
      ev('b', 20, { date: '2026-11-10T08:00:00+08:00' }),
    ];
    const ch = rankChanges(events, order, classes, nov, '2026-11-13');
    expect(ch.get('b')).toBe(1);
    expect(ch.get('a')).toBe(-1);
    expect(ch.get('c')).toBe(0);
  });

  it('сарын эхний 7 хоногт null', () => {
    const ch = rankChanges([], order, classes, nov, '2026-11-05');
    expect(ch.get('a')).toBeNull();
  });
});

describe('dailySeries', () => {
  it('хуримтлагдсан оноо, хасагдсан өдрийн тэмдэг', () => {
    const events = [
      ev('a', 5, { date: '2026-11-02T08:00:00+08:00' }),
      ev('a', -2, { date: '2026-11-03T08:00:00+08:00' }),
      ev('a', 3, { date: '2026-11-03T12:00:00+08:00' }),
    ];
    const s = dailySeries(events, nov, '2026-11-04');
    expect(s.map((p) => p.total)).toEqual([0, 5, 6, 6]);
    expect(s.map((p) => p.hasMinus)).toEqual([false, false, true, false]);
    expect(s[3]?.hasEvents).toBe(false);
  });
});

describe('latestEvents', () => {
  it('шинэ нь эхэнд', () => {
    const events = [
      ev('a', 1, { date: '2026-11-12T08:00:00+08:00' }),
      ev('a', 2, { date: '2026-11-12T09:00:00+08:00' }),
    ];
    expect(latestEvents(events, 5).map((e) => e.points)).toEqual([2, 1]);
  });
});
