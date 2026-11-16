/**
 * Demo горимын (`?demo=1`) бодитой mock өгөгдөл.
 * Жижүүр багшийн тэмдэглэл болон багшийн оноог үүсгээд points.ts-ийн дүрмээр
 * оноо болгоно: өдөрт анги бүрд 4–8 бичлэг, + ба − холимог.
 * Seed-тэй тул reload хийсэн ч ижил өгөгдөл гарна. Ангийн нэрийг config-оос уншина.
 */
import { GROUPS, type GroupConfig } from '../config/classes';
import { CATEGORIES, type Category } from '../config/points';
import { clampActivity, dutyCheckToEvents } from '../lib/points';
import { addDays, firstDayOf, previousMonth, ubIso, weekdayOf, yearMonthOf } from '../lib/time';
import type { ClassInfo, Dataset, DutyCheck, PointEvent } from './types';

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 */
function rng(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TEACHERS = ['Б. Оюунчимэг', 'Д. Батбаяр', 'С. Нарантуяа', 'Г. Мөнхбат', 'Ц. Энхжаргал'];

const ACTIVITY_REASONS: readonly [string, number][] = [
  ['Олимпиадад амжилттай оролцсон', 5],
  ['Ангийн цэвэрлэгээнд бүгд оролцсон', 3],
  ['Хичээлд идэвхтэй оролцсон', 2],
  ['Номын сангийн арга хэмжээнд оролцсон', 3],
  ['Спортын тэмцээнд оролцсон', 4],
  ['Ахмадуудад туслав', 3],
  ['Хичээлийн хэрэглэл дутуу', -2],
  ['Завсарлагаанаар хоцорсон', -1],
  ['Утас хэрэглэсэн', -2],
  ['Сурагчдын зөвлөлийн ажилд идэвхтэй', 2],
];

interface Personality {
  size: number;
  /** 0 = сул, 1 = маш сайн */
  quality: number;
  /** Сарын турш чанар хэрхэн өөрчлөгдөх */
  trend: number;
}

function personalities(group: GroupConfig, monthSeed: string): Map<string, Personality> {
  const r = rng(hash(group.id + monthSeed));
  const qualities = group.classes.map((_, i) => (i + 0.5) / group.classes.length);
  for (let i = qualities.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [qualities[i], qualities[j]] = [qualities[j]!, qualities[i]!];
  }
  const riser = Math.floor(r() * group.classes.length);
  const out = new Map<string, Personality>();
  group.classes.forEach((name, i) => {
    out.set(name, {
      size: 22 + Math.floor(r() * 13),
      quality: (qualities[i] ?? 0.5) * 0.85 + 0.1,
      trend: i === riser ? 0.7 : (r() - 0.5) * 0.3,
    });
  });
  return out;
}

function schoolDays(from: string, to: string): string[] {
  const out: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const w = weekdayOf(d);
    if (w !== 0 && w !== 6) out.push(d);
  }
  return out;
}

/** Хувь p-тэй үйл явдлын тоо (0, 1, 2…) */
function count(r: () => number, p: number, max: number): number {
  let c = 0;
  while (c < max && r() < p) c++;
  return c;
}

const pad = (v: number) => String(v).padStart(2, '0');
const at = (day: string, hour: number, minute: number) => `${day}T${pad(hour)}:${pad(minute)}:00+08:00`;

function generateMonth(groups: readonly GroupConfig[], monthStart: string, until: string, events: PointEvent[]): void {
  const days = schoolDays(monthStart, until);
  for (const group of groups) {
    const people = personalities(group, monthStart);
    for (const classId of group.classes) {
      const p = people.get(classId)!;
      const r = rng(hash(classId + monthStart));
      days.forEach((day, di) => {
        const progress = Math.min(1, di / 20);
        const q = Math.min(1, Math.max(0, p.quality + p.trend * (progress - 0.4) + (r() - 0.5) * 0.2));
        const bad = 1 - q;
        const check: DutyCheck = {
          id: `mock-${classId}-${day}`,
          classId,
          day,
          recordedAt: at(day, 8, 10 + Math.floor(r() * 35)),
          absentExcused: count(r, 0.25, 3),
          absentUnexcused: count(r, bad * 0.5, 4),
          truancies: count(r, bad * 0.35, 3),
          uniformViolations: count(r, bad * 0.45, 4),
          hygiene: Math.round((q - 0.5) * 6 + (r() - 0.5) * 2),
          shoesViolations: count(r, bad * 0.55, 5),
          givenBy: TEACHERS[Math.floor(r() * TEACHERS.length)],
        };
        events.push(...dutyCheckToEvents(check));

        // Багшийн оноо: өдөрт 0–3
        const n = count(r, 0.55, 3);
        for (let i = 0; i < n; i++) {
          const good = r() < 0.35 + q * 0.5;
          const pool = ACTIVITY_REASONS.filter(([, pts]) => (good ? pts > 0 : pts < 0));
          const [reason, pts] = pool[Math.floor(r() * pool.length)]!;
          events.push({
            id: `mock-${classId}-${day}-a${i}`,
            classId,
            category: 'activity',
            points: clampActivity(pts),
            reason,
            date: at(day, 9 + Math.floor(r() * 7), Math.floor(r() * 60)),
            source: 'teacher_form',
            givenBy: TEACHERS[Math.floor(r() * TEACHERS.length)],
          });
        }
      });
    }
  }
}

export function generateMockDataset(asOf: string, groups: readonly GroupConfig[] = GROUPS): Dataset {
  const ym = yearMonthOf(asOf);
  const prev = previousMonth(ym);
  const events: PointEvent[] = [];
  generateMonth(groups, firstDayOf(prev), addDays(firstDayOf(ym), -1), events);
  generateMonth(groups, firstDayOf(ym), asOf, events);

  const classes: ClassInfo[] = groups.flatMap((g) => {
    const people = personalities(g, firstDayOf(ym));
    return g.classes.map((id) => ({ id, studentCount: people.get(id)?.size ?? 30 }));
  });
  return { classes, events };
}

const LIVE_REASONS: Record<Category, readonly [string, number][]> = {
  attendance: [['Бүгд ирсэн', 5], ['1 сурагч шалтгаангүй ирсэнгүй', -1]],
  truancy: [['Таслалтгүй өдөр', 3], ['1 таслалт', -2]],
  uniform: [['Бүгд дүрэмт хувцастай', 2], ['2 сурагч дүрэмт хувцасгүй', -2]],
  hygiene: [['Анги цэвэрхэн', 3], ['Анги цэвэрхэн биш', -2]],
  shoes: [['Бүгд гутал сольсон', 2], ['3 сурагч гутал сольсонгүй', -3]],
  activity: ACTIVITY_REASONS,
};

/** Шууд урсгалыг турших зориулалттай шинэ бичлэг */
export function generateLiveEvent(classIds: readonly string[], now: Date, seq: number): PointEvent {
  const r = rng(hash(`live-${now.getTime()}-${seq}`));
  const classId = classIds[Math.floor(r() * classIds.length)] ?? '';
  const category = CATEGORIES[Math.floor(r() * CATEGORIES.length)]!.id;
  const pool = LIVE_REASONS[category];
  const [reason, points] = pool[Math.floor(r() * pool.length)]!;
  return {
    id: `live-${seq}`,
    classId,
    category,
    points,
    reason,
    date: ubIso(now),
    source: category === 'activity' ? 'teacher_form' : 'duty_teacher',
    givenBy: TEACHERS[Math.floor(r() * TEACHERS.length)],
  };
}
