/**
 * Онооны дүрэм. Дүрмийг өөрчлөхдөө зөвхөн энэ файлыг засна.
 *
 * Жижүүр багшийн систем оноог шууд биш, тэмдэглэл хэлбэрээр ("2 сурагч гутал
 * сольсонгүй") хадгалдаг тул энд байгаа дүрмээр оноо болгоно.
 * Өвчтэй, чөлөөтэй сурагч оноо хасуулахгүй.
 */

export type Category = 'attendance' | 'truancy' | 'uniform' | 'hygiene' | 'shoes' | 'activity';

export interface CategoryConfig {
  id: Category;
  /** Дэлгэц дээрх нэр */
  label: string;
  /** Нарийн баганад хэрэглэх богино нэр */
  short: string;
}

/** Дэлгэц дээрх дараалал бүх газарт энэ */
export const CATEGORIES: readonly CategoryConfig[] = [
  { id: 'attendance', label: 'Ирц', short: 'Ирц' },
  { id: 'truancy', label: 'Таслалт', short: 'Таслалт' },
  { id: 'uniform', label: 'Дүрэмт хувцас', short: 'Хувцас' },
  { id: 'hygiene', label: 'Ариун цэвэр', short: 'Цэвэр' },
  { id: 'shoes', label: 'Гутал', short: 'Гутал' },
  { id: 'activity', label: 'Идэвх', short: 'Идэвх' },
];

export const POINT_RULES = {
  /** Шалтгаангүй ирээгүй сурагч байхгүй бол +5, шалтгаангүй ирээгүй сурагч бүрд −1 */
  attendance: { full: 5, perUnexcused: -1 },
  /** Таслалтгүй өдөр +3, таслалт бүрд −2 */
  truancy: { none: 3, perTruancy: -2 },
  /** Бүгд зөв бол +2, зөрчил бүрд −1 */
  uniform: { allOk: 2, perViolation: -1 },
  /** Жижүүр багшийн үнэлгээг шууд авна, энэ хязгаарт багтаана */
  hygiene: { min: -3, max: 3 },
  /** Бүгд сольсон бол +2, сольсонгүй сурагч бүрд −1 */
  shoes: { allOk: 2, perViolation: -1 },
  /** Багшийн өгсөн оноог шууд авна, энэ хязгаарт багтаана */
  activity: { min: -10, max: 10 },
} as const;

/**
 * Ангиудын сурагчийн тоо өөр тул true болговол нийт оноог ангийн сурагчийн
 * тоонд харьцуулж, сургуулийн дундаж ангийн хэмжээнд шилжүүлнэ:
 *   оноо × (дундаж сурагчийн тоо / ангийн сурагчийн тоо)
 */
export const normalizeBySize = false;

/** Байрны өөрчлөлтийг хэдэн хоногийн өмнөхтэй харьцуулах */
export const RANK_CHANGE_DAYS = 7;
