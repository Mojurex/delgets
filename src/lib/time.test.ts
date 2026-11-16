import { describe, expect, it } from 'vitest';
import {
  dayOfIso,
  diffDays,
  relativeTime,
  ubIso,
  addDays,
  daysInMonth,
  daysUntilMonthEnd,
  isInMonth,
  previousMonth,
  ubClock,
  ubDate,
  weekdayOf,
} from './time';

describe('Улаанбаатарын цаг', () => {
  it('UTC 17:30 нь УБ-д маргааш 01:30', () => {
    const t = new Date('2026-11-12T17:30:00Z');
    expect(ubDate(t)).toBe('2026-11-13');
    expect(ubClock(t)).toBe('01:30');
  });
});

describe('сарын тооцоо', () => {
  it('11-р сарын 13-нд барианд 17 өдөр', () => {
    expect(daysUntilMonthEnd('2026-11-13')).toBe(17);
  });
  it('сарын сүүлийн өдөр 0', () => {
    expect(daysUntilMonthEnd('2026-11-30')).toBe(0);
  });
  it('өндөр жилийн 2-р сар', () => {
    expect(daysInMonth({ year: 2028, month: 2 })).toBe(29);
  });
  it('1-р сарын өмнөх сар нь өмнөх жилийн 12-р сар', () => {
    expect(previousMonth({ year: 2027, month: 1 })).toEqual({ year: 2026, month: 12 });
  });
  it('addDays сар дамжина', () => {
    expect(addDays('2026-11-03', -7)).toBe('2026-10-27');
  });
  it('isInMonth', () => {
    expect(isInMonth('2026-11-01', { year: 2026, month: 11 })).toBe(true);
    expect(isInMonth('2026-10-31', { year: 2026, month: 11 })).toBe(false);
  });
  it('weekdayOf: 2026-11-13 бол Баасан', () => {
    expect(weekdayOf('2026-11-13')).toBe(5);
  });
});

describe('ISO ба харьцангуй цаг', () => {
  it('ubIso нь +08:00 бүстэй', () => {
    expect(ubIso(new Date('2026-11-12T00:42:00Z'))).toBe('2026-11-12T08:42:00+08:00');
  });
  it('dayOfIso УБ-ийн өдрийг өгнө', () => {
    expect(dayOfIso('2026-11-12T17:30:00Z')).toBe('2026-11-13');
    expect(dayOfIso('2026-11-12T08:42:00+08:00')).toBe('2026-11-12');
  });
  it('relativeTime', () => {
    const now = new Date('2026-11-13T09:00:00+08:00');
    expect(relativeTime('2026-11-13T08:59:40+08:00', now)).toBe('Дөнгөж сая');
    expect(relativeTime('2026-11-13T08:57:00+08:00', now)).toBe('3 минутын өмнө');
    expect(relativeTime('2026-11-13T06:30:00+08:00', now)).toBe('2 цагийн өмнө');
    expect(relativeTime('2026-11-11T06:30:00+08:00', now)).toBe('11/11');
  });
  it('diffDays', () => {
    expect(diffDays('2026-11-06', '2026-11-13')).toBe(7);
    expect(diffDays('2026-10-30', '2026-11-02')).toBe(3);
  });
});
