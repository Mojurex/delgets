import { TIME_ZONE } from '../config/display';

/** Улаанбаатарын цагаар тухайн мөчийн огноо "YYYY-MM-DD" */
export function ubDate(at: Date): string {
  // en-CA locale нь YYYY-MM-DD хэлбэр өгдөг
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(at);
}

/** Улаанбаатарын цагаар "08:42" */
export function ubClock(at: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(at);
}

/** Улаанбаатарын цагаар цаг, минут */
export function ubHourMinute(at: Date): { hour: number; minute: number } {
  const [h, m] = ubClock(at).split(':').map(Number);
  return { hour: h ?? 0, minute: m ?? 0 };
}

export interface YearMonth {
  year: number;
  /** 1–12 */
  month: number;
}

export function parseDate(date: string): { year: number; month: number; day: number } {
  const [y, m, d] = date.split('-').map(Number);
  return { year: y ?? 0, month: m ?? 0, day: d ?? 0 };
}

export function yearMonthOf(date: string): YearMonth {
  const { year, month } = parseDate(date);
  return { year, month };
}

export function monthKey(ym: YearMonth): string {
  return `${ym.year}-${String(ym.month).padStart(2, '0')}`;
}

export function isInMonth(date: string, ym: YearMonth): boolean {
  return date.startsWith(monthKey(ym) + '-');
}

export function previousMonth(ym: YearMonth): YearMonth {
  return ym.month === 1 ? { year: ym.year - 1, month: 12 } : { year: ym.year, month: ym.month - 1 };
}

export function daysInMonth(ym: YearMonth): number {
  // UTC ашиглан цагийн бүсээс хамааралгүй тооцно
  return new Date(Date.UTC(ym.year, ym.month, 0)).getUTCDate();
}

export function firstDayOf(ym: YearMonth): string {
  return `${monthKey(ym)}-01`;
}

export function lastDayOf(ym: YearMonth): string {
  return `${monthKey(ym)}-${String(daysInMonth(ym)).padStart(2, '0')}`;
}

/** "YYYY-MM-DD" огноон дээр n хоног нэмэх (сөрөг байж болно) */
export function addDays(date: string, n: number): string {
  const { year, month, day } = parseDate(date);
  const t = new Date(Date.UTC(year, month - 1, day + n));
  return t.toISOString().slice(0, 10);
}

/** Сарын сүүлийн өдөр хүртэл үлдсэн өдөр (өнөөдрийг тооцохгүй) */
export function daysUntilMonthEnd(date: string): number {
  const ym = yearMonthOf(date);
  return daysInMonth(ym) - parseDate(date).day;
}

/** 0 = Ням, 6 = Бямба */
export function weekdayOf(date: string): number {
  const { year, month, day } = parseDate(date);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function monthLabel(ym: YearMonth): string {
  return `${ym.month}-р сар`;
}

/** Улаанбаатарын цагаар ISO 8601 (2026-11-12T08:42:00+08:00). УБ-д зуны цаг байхгүй. */
export function ubIso(at: Date): string {
  const shifted = new Date(at.getTime() + 8 * 3_600_000);
  return shifted.toISOString().replace(/\.\d{3}Z$/, '+08:00');
}

/** ISO огноо-цагаас Улаанбаатарын өдөр "YYYY-MM-DD" */
export function dayOfIso(iso: string): string {
  const t = new Date(iso);
  return Number.isNaN(t.getTime()) ? iso.slice(0, 10) : ubDate(t);
}

/** "Дөнгөж сая", "3 минутын өмнө", "2 цагийн өмнө", "11/12" */
export function relativeTime(iso: string, now: Date): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const diffMin = Math.floor((now.getTime() - t) / 60_000);
  if (diffMin < 1) return 'Дөнгөж сая';
  if (diffMin < 60) return `${diffMin} минутын өмнө`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} цагийн өмнө`;
  const { month, day } = parseDate(dayOfIso(iso));
  return `${month}/${day}`;
}

/** "11/12" */
export function shortDate(day: string): string {
  const { month, day: d } = parseDate(day);
  return `${month}/${d}`;
}

/** Хоёр өдрийн зөрүү (b − a), хоногоор */
export function diffDays(a: string, b: string): number {
  const pa = parseDate(a);
  const pb = parseDate(b);
  return Math.round(
    (Date.UTC(pb.year, pb.month - 1, pb.day) - Date.UTC(pa.year, pa.month - 1, pa.day)) / 86_400_000,
  );
}
