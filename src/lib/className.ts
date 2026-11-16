/**
 * Firestore-д янз бүрийн хэлбэрээр бичигдсэн ангийн нэрийг ("1.1", "1а", "1 А",
 * "1/1", "7-2") config-ийн "анги-бүлэг" хэлбэр рүү хувиргана.
 * Config-д байхгүй анги бол null буцаана.
 */

const CYRILLIC_GROUP_LETTERS = 'абвгдеёжзийклмноөпрстуүфхцчшщэюя';
const LATIN_GROUP_LETTERS = 'abcdefghijklmnopqrstuvwxyz';

function letterToGroupNumber(letter: string): number | null {
  const l = letter.toLowerCase();
  const c = CYRILLIC_GROUP_LETTERS.indexOf(l);
  if (c >= 0) return c + 1;
  const lat = LATIN_GROUP_LETTERS.indexOf(l);
  if (lat >= 0) return lat + 1;
  return null;
}

export function toCanonicalClassName(raw: string): string | null {
  const s = raw.trim().replace(/\s+/g, ' ');
  // "7-2", "7.2", "7/2", "7 2", "7_2", "7–2"
  const numeric = /^(\d{1,2})\s*[-./_–— ]\s*(\d{1,2})$/.exec(s);
  if (numeric) return `${Number(numeric[1])}-${Number(numeric[2])}`;
  // "7а", "7 А", "7-б"
  const lettered = /^(\d{1,2})\s*[-.]?\s*(\p{L})$/u.exec(s);
  if (lettered) {
    const n = letterToGroupNumber(lettered[2] ?? '');
    if (n !== null) return `${Number(lettered[1])}-${n}`;
  }
  return null;
}

export function normalizeClassName(raw: string, known: readonly string[]): string | null {
  const canonical = toCanonicalClassName(raw);
  if (canonical === null) return null;
  return known.includes(canonical) ? canonical : null;
}
