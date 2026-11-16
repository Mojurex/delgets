/** Тоог тэмдэгтэй нь бичнэ: +5, −2 (жинхэнэ хасах тэмдэг), 0 */
export function signed(n: number): string {
  const v = Math.round(n);
  if (v > 0) return `+${v}`;
  if (v < 0) return `−${Math.abs(v)}`;
  return '0';
}

/** Тэмдэггүй, мянгатын зайтай: 1 284 */
export function plain(n: number): string {
  const v = Math.round(Math.abs(n));
  const s = String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return n < 0 ? `−${s}` : s;
}

export type Sign = 'plus' | 'minus' | 'zero';

export function signOf(n: number): Sign {
  return n > 0 ? 'plus' : n < 0 ? 'minus' : 'zero';
}

/** 0 бол бүдэг өнгө */
export function zeroClass(value: number, cls: string | undefined, zero: string | undefined): string {
  return (value === 0 ? zero : cls) ?? '';
}
