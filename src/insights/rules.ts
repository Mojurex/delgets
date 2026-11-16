/**
 * Ажиглалтын дүрмүүд. Детерминист: ижил өгөгдөлд ижил өгүүлбэр.
 * Дүрэм бүр нэг Insight эсвэл null буцаана. Шинэ дүрэм нэмэхдээ RULES-д бүртгэнэ.
 */
import { CATEGORIES } from '../config/points';
import type { PointEvent } from '../data/types';
import type { DisplayModel } from '../lib/model';
import { eventDay } from '../lib/points';
import { addDays, diffDays, parseDate } from '../lib/time';

export interface Insight {
  id: string;
  text: string;
  /** Их нь түрүүлж гарна */
  priority: number;
}

export type Rule = (model: DisplayModel) => Insight | null;

const signed = (n: number) => (n < 0 ? `−${Math.abs(n)}` : `+${n}`);

/** Энэ 7 хоногт нэг ч оноо хасуулаагүй, хамгийн өндөр байртай анги */
export const noDeductionsThisWeek: Rule = (m) => {
  const from = addDays(m.asOf, -6);
  const clean = m.school.filter((c) => {
    const week = c.events.filter((e) => eventDay(e) >= from);
    return week.length >= 3 && week.every((e) => e.points > 0);
  });
  const best = clean[0];
  if (!best) return null;
  return {
    id: 'no-deductions',
    priority: 70,
    text: `${best.classId} анги энэ долоо хоногт нэг ч оноо хасуулаагүй.`,
  };
};

/** Хамгийн их байр ахисан анги */
export const biggestRise: Rule = (m) => {
  let best: { classId: string; change: number } | null = null;
  for (const [classId, s] of m.byClass) {
    if (s.change !== null && s.change > 0 && (!best || s.change > best.change)) best = { classId, change: s.change };
  }
  if (!best || best.change < 2) return null;
  return {
    id: 'biggest-rise',
    priority: 80,
    text: `${best.classId} анги өнгөрсөн долоо хоногоос ${best.change} байр ахилаа.`,
  };
};

/** Энэ сард хамгийн их хасагдсан шалгуур, өнгөрсөн сартай харьцуулсан */
export const mostDeductedCategory: Rule = (m) => {
  const worst = [...m.categories].sort((a, b) => a.minus - b.minus)[0];
  if (!worst || worst.minus === 0) return null;
  const prev = worst.prevMinus === 0 ? '' : ` Өнгөрсөн сард ${signed(worst.prevMinus)} байсан.`;
  return {
    id: 'most-deducted',
    priority: 60,
    text: `Энэ сард хамгийн их хасагдсан шалгуур нь ${worst.label} (${signed(worst.minus)}).${prev}`,
  };
};

/** Хамгийн олон хичээлийн өдөр дараалан ирц бүрэн анги */
export const attendanceStreak: Rule = (m) => {
  let best: { classId: string; days: number } | null = null;
  for (const c of m.school) {
    const days = fullAttendanceStreak(c.events);
    if (days >= 5 && (!best || days > best.days)) best = { classId: c.classId, days };
  }
  if (!best) return null;
  return {
    id: 'attendance-streak',
    priority: 65,
    text: `${best.classId} анги ${best.days} өдөр дараалан ирц бүрэн байна.`,
  };
};

/** Сүүлийн ирцийн бичлэгээс эхлэн хойшоо тоолно: бүгд эерэг байх ёстой */
export function fullAttendanceStreak(events: readonly PointEvent[]): number {
  const byDay = new Map<string, boolean>();
  for (const e of events) {
    if (e.category !== 'attendance') continue;
    const d = eventDay(e);
    byDay.set(d, (byDay.get(d) ?? true) && e.points > 0);
  }
  const days = [...byDay.keys()].sort().reverse();
  let streak = 0;
  for (const d of days) {
    if (!byDay.get(d)) break;
    streak++;
  }
  return streak;
}

/** 1 ба 2-р байрын зөрүү: ойрхон бол тэмцээн, хол бол давуу байдал */
export const leaderGap: Rule = (m) => {
  const [first, second] = m.school;
  if (!first || !second || first.total === 0) return null;
  const gap = Math.round(first.score - second.score);
  if (gap <= 5) {
    return {
      id: 'leader-gap',
      priority: 75,
      text: `${first.classId} ба ${second.classId} ангийн хооронд ердөө ${gap} оноо байна.`,
    };
  }
  return {
    id: 'leader-gap',
    priority: 50,
    text: `${first.classId} анги 2-р байрын ${second.classId} ангиас ${gap} оноогоор түрүүлж байна.`,
  };
};

/** Өнгөрсөн сарын аварга одоо хаана явааг сарын эхний 10 хоногт хэлнэ */
export const previousChampion: Rule = (m) => {
  if (parseDate(m.asOf).day > 10) return null;
  const champ = m.prevMonthGroups.flatMap((g) => g.classes).sort((a, b) => b.score - a.score)[0];
  if (!champ || champ.total === 0) return null;
  const now = m.byClass.get(champ.classId);
  if (!now) return null;
  return {
    id: 'prev-champion',
    priority: 55,
    text: `Өнгөрсөн сарын аварга ${champ.classId} анги одоо ${now.group.title.toLowerCase()} дундаа ${now.groupRank}-р байранд явж байна.`,
  };
};

/** Энэ сард хамгийн их оноо авсан өдөр */
export const bestDay: Rule = (m) => {
  const byDay = new Map<string, number>();
  for (const e of m.monthEvents) byDay.set(eventDay(e), (byDay.get(eventDay(e)) ?? 0) + e.points);
  const [day, total] = [...byDay.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0] ?? [];
  if (!day || total === undefined || total <= 0 || diffDays(day, m.asOf) < 1) return null;
  return {
    id: 'best-day',
    priority: 40,
    text: `Сургууль даяар хамгийн их оноо авсан өдөр ${parseDate(day).month}-р сарын ${parseDate(day).day}: нийт ${signed(total)}.`,
  };
};

/** Шалгуурын тойм: бүх ангийн нийт авсан, хасуулсан оноо */
export const monthBalance: Rule = (m) => {
  const plus = m.categories.reduce((a, c) => a + c.plus, 0);
  const minus = m.categories.reduce((a, c) => a + c.minus, 0);
  if (plus === 0) return null;
  const cat = CATEGORIES.length;
  return {
    id: 'month-balance',
    priority: 30,
    text: `Энэ сард ${cat} шалгуураас нийт ${signed(plus)} оноо авч, ${signed(minus)} оноо хасуулжээ.`,
  };
};

export const RULES: readonly Rule[] = [
  biggestRise,
  leaderGap,
  noDeductionsThisWeek,
  attendanceStreak,
  mostDeductedCategory,
  previousChampion,
  bestDay,
  monthBalance,
];
