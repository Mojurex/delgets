/**
 * Ангийн жагсаалт. Жил бүр зөвхөн энэ файлыг засна.
 * Кодын өөр хаана ч ангийн нэрийг шууд бичихгүй.
 *
 * Нэрийн хэлбэр: "анги-бүлэг" (жишээ нь "7-2").
 * Замууд энэ дарааллаар дэлгэц дээр гарна.
 */

export type GroupId = 'baga' | 'dund' | 'akhlakh';

export interface GroupConfig {
  id: GroupId;
  /** Дэлгэц дээрх гарчиг */
  title: string;
  classes: readonly string[];
}

export const GROUPS: readonly GroupConfig[] = [
  {
    id: 'baga',
    title: 'Бага ангиуд',
    classes: ['1-1', '1-2', '1-3', '2-1', '2-2', '2-3', '3-1', '3-2', '4-1', '4-2', '5-1', '5-2'],
  },
  {
    id: 'dund',
    title: 'Дунд ангиуд',
    classes: ['6-1', '6-2', '6-3', '7-1', '7-2', '8-1', '8-2', '9-1', '9-2'],
  },
  {
    id: 'akhlakh',
    title: 'Ахлах ангиуд',
    classes: ['10-1', '11-1', '11-2', '12-1', '12-2', '12-3'],
  },
];

export const ALL_CLASSES: readonly string[] = GROUPS.flatMap((g) => g.classes);

export function groupOf(className: string): GroupConfig | undefined {
  return GROUPS.find((g) => g.classes.includes(className));
}
