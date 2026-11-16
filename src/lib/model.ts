/**
 * Өгөгдлөөс дэлгэцэнд хэрэгтэй бүх зүйлийг нэг удаа тооцно. Pure function.
 */
import { GROUPS, type GroupConfig } from '../config/classes';
import { FEED_SIZE } from '../config/display';
import { CATEGORIES, type Category } from '../config/points';
import type { Dataset, PointEvent } from '../data/types';
import {
  eventsInMonth,
  latestEvents,
  rank,
  rankChanges,
  summarize,
  type ClassSummary,
  type RankedClass,
} from './points';
import { daysUntilMonthEnd, previousMonth, yearMonthOf, type YearMonth } from './time';

export interface GroupStanding {
  group: GroupConfig;
  /** Бүлэг доторх эрэмбэ */
  classes: RankedClass[];
}

export interface CategoryOverview {
  category: Category;
  label: string;
  /** Сургуулийн нийт */
  plus: number;
  minus: number;
  /** Өнгөрсөн сарын нийт */
  prevPlus: number;
  prevMinus: number;
  /** Энэ сард тухайн шалгуураас хамгийн их цэвэр оноо авсан 3 анги */
  top: { classId: string; net: number }[];
}

export interface ClassStanding {
  summary: RankedClass;
  group: GroupConfig;
  /** Бүлэг доторх байр */
  groupRank: number;
  /** Бүлэг доторх байрны 7 хоногийн өөрчлөлт */
  change: number | null;
}

export interface DisplayModel {
  asOf: string;
  month: YearMonth;
  daysLeft: number;
  /** Сургуулийн нийт эрэмбэ */
  school: RankedClass[];
  groups: GroupStanding[];
  /** Ангийн нэрээр хайх */
  byClass: Map<string, ClassStanding>;
  categories: CategoryOverview[];
  /** Өмнөх сарын эцсийн эрэмбэ (бүлэг бүрт) */
  prevMonthGroups: GroupStanding[];
  /** Шууд урсгал: хамгийн сүүлийн бичлэгүүд */
  feed: PointEvent[];
  /** Энэ сарын бүх бичлэг */
  monthEvents: PointEvent[];
  /** Өмнөх сарын бүх бичлэг */
  prevMonthEvents: PointEvent[];
}

function groupStandings(events: readonly PointEvent[], data: Dataset, groups: readonly GroupConfig[]): GroupStanding[] {
  return groups.map((group) => ({
    group,
    classes: rank(summarize(events, group.classes, data.classes), group.classes),
  }));
}

function categoryOverview(month: readonly ClassSummary[], prev: readonly ClassSummary[], order: readonly string[]): CategoryOverview[] {
  return CATEGORIES.map((c) => {
    const sum = (list: readonly ClassSummary[], key: 'plus' | 'minus') =>
      list.reduce((a, s) => a + s.categories[c.id][key], 0);
    const top = [...month]
      .filter((s) => s.categories[c.id].count > 0)
      .sort(
        (a, b) =>
          b.categories[c.id].net - a.categories[c.id].net ||
          b.categories[c.id].minus - a.categories[c.id].minus ||
          order.indexOf(a.classId) - order.indexOf(b.classId),
      )
      .slice(0, 3)
      .map((s) => ({ classId: s.classId, net: s.categories[c.id].net }));
    return {
      category: c.id,
      label: c.label,
      plus: sum(month, 'plus'),
      minus: sum(month, 'minus'),
      prevPlus: sum(prev, 'plus'),
      prevMinus: sum(prev, 'minus'),
      top,
    };
  });
}

export function buildDisplayModel(data: Dataset, asOf: string, groups: readonly GroupConfig[] = GROUPS): DisplayModel {
  const month = yearMonthOf(asOf);
  const order = groups.flatMap((g) => g.classes);
  const monthEvents = eventsInMonth(data.events, month, asOf);
  const prevMonthEvents = eventsInMonth(data.events, previousMonth(month));

  const schoolSummaries = summarize(monthEvents, order, data.classes);
  const school = rank(schoolSummaries, order);
  const groupViews = groupStandings(monthEvents, data, groups);

  const byClass = new Map<string, ClassStanding>();
  for (const g of groupViews) {
    const changes = rankChanges(data.events, g.group.classes, data.classes, month, asOf);
    for (const c of g.classes) {
      const summary = school.find((s) => s.classId === c.classId) ?? c;
      byClass.set(c.classId, { summary, group: g.group, groupRank: c.rank, change: changes.get(c.classId) ?? null });
    }
  }

  return {
    asOf,
    month,
    daysLeft: daysUntilMonthEnd(asOf),
    school,
    groups: groupViews,
    byClass,
    categories: categoryOverview(schoolSummaries, summarize(prevMonthEvents, order, data.classes), order),
    prevMonthGroups: groupStandings(prevMonthEvents, data, groups),
    feed: latestEvents(data.events, FEED_SIZE),
    monthEvents,
    prevMonthEvents,
  };
}
