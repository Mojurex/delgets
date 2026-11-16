/** Дэлгэцийн ерөнхий тохиргоо */

export const SCHOOL_TITLE = 'Амжилт Кибер сургуулийн ранк';

/** Автомат эргэлтийн хугацаа (мс) */
export const DURATION = {
  overview: 20_000,
  criteria: 14_000,
  insights: 14_000,
  classDetail: 10_000,
} as const;

/** Эргэлт бүрт хэдэн ангийн дэлгэрэнгүйг харуулах */
export const CLASSES_PER_CYCLE = 3;

/** Хүн хүрэхгүй бол хэдэн мс-ийн дараа автомат эргэлт рүү буцах */
export const IDLE_MS = 60_000;

/** Дэлгэц солигдох cross-fade (мс) */
export const CROSSFADE_MS = 400;

/** Тоо шинэчлэгдэх үеийн count-up (мс) */
export const COUNT_UP_MS = 600;

/** Шууд урсгалд харуулах бичлэгийн тоо */
export const FEED_SIZE = 7;

/** Ажиглалтын хуудсанд нэг удаад гарах өгүүлбэрийн тоо */
export const INSIGHTS_PER_PAGE = 4;

/** Demo горимд шинэ оноо нэмэгдэх давтамж (мс) */
export const DEMO_EVENT_INTERVAL_MS = 20_000;

/** Шөнийн автомат reload хийх цаг (Улаанбаатар) */
export const RELOAD_AT = { hour: 3, minute: 0 } as const;

/** Burn-in хамгаалалт: тогтмол элементүүдийг шилжүүлэх давтамж (мс) ба хэмжээ (px) */
export const BURN_IN_INTERVAL_MS = 5 * 60_000;
export const BURN_IN_MAX_PX = 2;

export const TIME_ZONE = 'Asia/Ulaanbaatar';
