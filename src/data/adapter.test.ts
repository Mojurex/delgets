import { describe, expect, it } from 'vitest';
import { toClassInfo, toDutyCheck, toTeacherEvent } from './adapter';

const names = new Map([
  ['abc123', '7.1'],
  ['xyz', '1а'],
]);

describe('toClassInfo', () => {
  it('нэрийг хувиргана', () => {
    expect(toClassInfo('abc', { name: '7/1', studentCount: 31 })).toEqual({ id: '7-1', studentCount: 31 });
  });
  it('config-д байхгүй анги бол null', () => {
    expect(toClassInfo('abc', { name: '13-1' })).toBeNull();
  });
});

describe('toDutyCheck', () => {
  it('classes collection-оор ангийн нэрийг олж, талбаруудыг тоо болгоно', () => {
    const c = toDutyCheck(
      'd1',
      { date: '2026-11-12', classId: 'abc123', absentUnexcused: '2', truancies: 1, hygiene: -1, givenBy: 'Б. Оюунчимэг' },
      names,
    );
    expect(c).toEqual({
      id: 'd1',
      classId: '7-1',
      day: '2026-11-12',
      recordedAt: '2026-11-12T08:30:00+08:00',
      absentExcused: 0,
      absentUnexcused: 2,
      truancies: 1,
      uniformViolations: 0,
      hygiene: -1,
      shoesViolations: 0,
      givenBy: 'Б. Оюунчимэг',
    });
  });

  it('classId нь өөрөө ангийн нэр байж болно', () => {
    expect(toDutyCheck('d', { date: '2026-11-12', classId: '11б' }, names)?.classId).toBe('11-2');
  });

  it('буруу огноо эсвэл үл мэдэх анги бол null', () => {
    expect(toDutyCheck('d', { date: '12/11/2026', classId: 'abc123' }, names)).toBeNull();
    expect(toDutyCheck('d', { date: '2026-11-12', classId: '13-1' }, names)).toBeNull();
  });
});

describe('toTeacherEvent', () => {
  it('идэвхийн оноо', () => {
    expect(toTeacherEvent('t1', { date: '2026-11-12', classId: 'xyz', points: 3, reason: 'Олимпиад' }, names)).toEqual({
      id: 't1',
      classId: '1-1',
      category: 'activity',
      points: 3,
      reason: 'Олимпиад',
      date: '2026-11-12T12:00:00+08:00',
      source: 'teacher_form',
      givenBy: undefined,
    });
  });
  it('оноогүй эсвэл 0 оноотой бол null', () => {
    expect(toTeacherEvent('t', { date: '2026-11-12', classId: 'xyz' }, names)).toBeNull();
    expect(toTeacherEvent('t', { date: '2026-11-12', classId: 'xyz', points: 0 }, names)).toBeNull();
  });
});
