/**
 * Онооны тооцоо. Бүгд pure function.
 */
import { CATEGORIES, POINT_RULES, RANK_CHANGE_DAYS, normalizeBySize, type Category } from '../config/points';
import type { ClassInfo, DutyCheck, PointEvent } from '../data/types';
import { addDays, dayOfIso, daysInMonth, isInMonth, monthKey, parseDate, type YearMonth } from './time';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** "2 сурагч" гэх мэт энгийн тоо-нэрийн хослол */
const n = (count: number, noun: string) => `${count} ${noun}`;

/**
 * Жижүүр багшийн нэг тэмдэглэлийг онооны үйл явдлууд болгоно.
 * Тэг оноотой зүйл (ариун цэвэр 0) бичлэг үүсгэхгүй.
 */
export function dutyCheckToEvents(check: DutyCheck): PointEvent[] {
  const date = check.recordedAt ?? `${check.day}T08:30:00+08:00`;
  const base = { classId: check.classId, date, source: 'duty_teacher' as const, givenBy: check.givenBy };
  const out: PointEvent[] = [];
  const push = (category: Category, points: number, reason: string) => {
    if (points === 0) return;
    out.push({ ...base, id: `${check.id}:${category}`, category, points, reason });
  };

  const r = POINT_RULES;
  const unexcused = Math.max(0, check.absentUnexcused);
  if (unexcused === 0) {
    push('attendance', r.attendance.full, check.absentExcused > 0 ? `Бүгд ирсэн, ${n(check.absentExcused, 'сурагч чөлөөтэй')}` : 'Бүгд ирсэн');
  } else {
    push('attendance', r.attendance.perUnexcused * unexcused, `${n(unexcused, 'сурагч шалтгаангүй ирсэнгүй')}`);
  }

  const truancies = Math.max(0, check.truancies);
  if (truancies === 0) push('truancy', r.truancy.none, 'Таслалтгүй өдөр');
  else push('truancy', r.truancy.perTruancy * truancies, n(truancies, 'таслалт'));

  const uniform = Math.max(0, check.uniformViolations);
  if (uniform === 0) push('uniform', r.uniform.allOk, 'Бүгд дүрэмт хувцастай');
  else push('uniform', r.uniform.perViolation * uniform, n(uniform, 'сурагч дүрэмт хувцасгүй'));

  const hygiene = clamp(Math.round(check.hygiene), r.hygiene.min, r.hygiene.max);
  push('hygiene', hygiene, hygiene > 0 ? 'Анги цэвэрхэн' : 'Анги цэвэрхэн биш');

  const shoes = Math.max(0, check.shoesViolations);
  if (shoes === 0) push('shoes', r.shoes.allOk, 'Бүгд гутал сольсон');
  else push('shoes', r.shoes.perViolation * shoes, n(shoes, 'сурагч гутал сольсонгүй'));

  return out;
}

/** Багшийн өгсөн оноог хязгаарт багтаана */
export function clampActivity(points: number): number {
  return clamp(Math.round(points), POINT_RULES.activity.min, POINT_RULES.activity.max);
}

// ---------------------------------------------------------------- нийлбэр

export interface CategorySummary {
  category: Category;
  plus: number;
  /** Сөрөг тоо эсвэл 0 */
  minus: number;
  net: number;
  count: number;
}

export interface ClassSummary {
  classId: string;
  studentCount: number;
  /** Онооны бодит нийлбэр */
  total: number;
  /** Ранк тооцох оноо: normalizeBySize бол хэвийнчилсэн, үгүй бол total */
  score: number;
  plus: number;
  minus: number;
  categories: Record<Category, CategorySummary>;
  events: PointEvent[];
}

export interface RankedClass extends ClassSummary {
  rank: number;
}

function emptyCategories(): Record<Category, CategorySummary> {
  const out = {} as Record<Category, CategorySummary>;
  for (const c of CATEGORIES) out[c.id] = { category: c.id, plus: 0, minus: 0, net: 0, count: 0 };
  return out;
}

export function eventDay(e: PointEvent): string {
  return dayOfIso(e.date);
}

/** Тухайн сарын, `until` өдрийг хамруулсан бичлэгүүд (until байхгүй бол бүх сар) */
export function eventsInMonth(events: readonly PointEvent[], ym: YearMonth, until?: string): PointEvent[] {
  return events.filter((e) => {
    const d = eventDay(e);
    return isInMonth(d, ym) && (until === undefined || d <= until);
  });
}

/**
 * Ангиудын сарын нийлбэр. Config-ийн бүх анги орно: бичлэггүй анги 0 оноотой.
 * `events` нь аль хэдийн шүүгдсэн байх ёстой (eventsInMonth).
 */
export function summarize(
  events: readonly PointEvent[],
  classIds: readonly string[],
  classes: readonly ClassInfo[],
): ClassSummary[] {
  const byClass = new Map<string, PointEvent[]>();
  for (const id of classIds) byClass.set(id, []);
  for (const e of events) byClass.get(e.classId)?.push(e);

  const sizes = new Map(classes.map((c) => [c.id, c.studentCount]));
  const known = [...sizes.values()].filter((s) => s > 0);
  const meanSize = known.length > 0 ? known.reduce((a, b) => a + b, 0) / known.length : 0;

  return classIds.map((classId) => {
    const list = byClass.get(classId) ?? [];
    const categories = emptyCategories();
    let plus = 0;
    let minus = 0;
    for (const e of list) {
      const c = categories[e.category];
      c.count++;
      c.net += e.points;
      if (e.points > 0) {
        c.plus += e.points;
        plus += e.points;
      } else {
        c.minus += e.points;
        minus += e.points;
      }
    }
    const total = plus + minus;
    const studentCount = sizes.get(classId) ?? 0;
    const score =
      normalizeBySize && studentCount > 0 && meanSize > 0 ? (total * meanSize) / studentCount : total;
    return { classId, studentCount, total, score, plus, minus, categories, events: list };
  });
}

/** Хөвөгч таслалын алдааг үл тооно */
const round1 = (v: number) => Math.round(v * 10) / 10;

/**
 * Эрэмбийн дүрэм: оноо өндөр нь → хасуулсан оноо бага нь → ирцийн оноо өндөр нь
 * → config-ийн дараалал.
 */
export function compareClasses(a: ClassSummary, b: ClassSummary, order: readonly string[]): number {
  return (
    round1(b.score) - round1(a.score) ||
    b.minus - a.minus ||
    b.categories.attendance.net - a.categories.attendance.net ||
    order.indexOf(a.classId) - order.indexOf(b.classId)
  );
}

export function rank(summaries: readonly ClassSummary[], order: readonly string[]): RankedClass[] {
  return [...summaries].sort((a, b) => compareClasses(a, b, order)).map((s, i) => ({ ...s, rank: i + 1 }));
}

/**
 * Байрны өөрчлөлт: эерэг = ахисан. 7 хоногийн өмнөх өдөр өмнөх сард байвал
 * (сар дөнгөж эхэлсэн) null.
 */
export function rankChanges(
  allEvents: readonly PointEvent[],
  classIds: readonly string[],
  classes: readonly ClassInfo[],
  ym: YearMonth,
  asOf: string,
): Map<string, number | null> {
  const weekAgo = addDays(asOf, -RANK_CHANGE_DAYS);
  const out = new Map<string, number | null>();
  if (!isInMonth(weekAgo, ym)) {
    for (const id of classIds) out.set(id, null);
    return out;
  }
  const now = rank(summarize(eventsInMonth(allEvents, ym, asOf), classIds, classes), classIds);
  const before = rank(summarize(eventsInMonth(allEvents, ym, weekAgo), classIds, classes), classIds);
  const prevRank = new Map(before.map((b) => [b.classId, b.rank]));
  for (const c of now) out.set(c.classId, (prevRank.get(c.classId) ?? c.rank) - c.rank);
  return out;
}

// ---------------------------------------------------------------- сарын явц

export interface SeriesPoint {
  /** Сарын хэд дэх өдөр, 1-ээс */
  day: number;
  /** Тухайн өдрийн эцсийн хуримтлагдсан оноо */
  total: number;
  /** Энэ өдөр оноо хасагдсан эсэх */
  hasMinus: boolean;
  /** Энэ өдөр ямар нэг бичлэг байсан эсэх */
  hasEvents: boolean;
}

/** Нэг ангийн сарын өдөр тутмын хуримтлагдсан оноо, 1-ээс asOf өдөр хүртэл */
export function dailySeries(classEvents: readonly PointEvent[], ym: YearMonth, asOf: string): SeriesPoint[] {
  const lastDay = isInMonth(asOf, ym) ? parseDate(asOf).day : daysInMonth(ym);
  const byDay = new Map<number, PointEvent[]>();
  for (const e of classEvents) {
    const d = eventDay(e);
    if (!isInMonth(d, ym)) continue;
    const day = parseDate(d).day;
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(e);
  }
  const out: SeriesPoint[] = [];
  let total = 0;
  for (let day = 1; day <= lastDay; day++) {
    const list = byDay.get(day) ?? [];
    total += list.reduce((a, e) => a + e.points, 0);
    out.push({ day, total, hasMinus: list.some((e) => e.points < 0), hasEvents: list.length > 0 });
  }
  return out;
}

/** Хамгийн сүүлийн бичлэгүүд, шинэ нь эхэнд */
export function latestEvents(events: readonly PointEvent[], limit: number): PointEvent[] {
  return [...events].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)).slice(0, limit);
}

/** Сарын түлхүүр "2026-11" */
export function monthOf(ym: YearMonth): string {
  return monthKey(ym);
}
