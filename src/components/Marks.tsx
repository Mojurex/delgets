import { CATEGORIES, type Category } from '../config/points';
import { signOf } from '../lib/format';
import type { CategorySummary } from '../lib/points';
import s from './Marks.module.css';

const GLYPH = { plus: '+', minus: '−', zero: '0' } as const;

/**
 * 6 шалгуурын тэмдэг, тогтмол дарааллаар. Тэмдэг бүр тухайн шалгуурын цэвэр
 * онооны тэмдэг (+, −, 0) бөгөөд өнгө нь зөвхөн нэмэлт дохио: өнгө ялгадаггүй
 * хүн ч уншиж чадна.
 */
export function Marks({ categories }: { categories: Record<Category, CategorySummary> }) {
  return (
    <span className={s.marks} aria-hidden="true">
      {CATEGORIES.map((c) => {
        const sign = categories[c.id].count === 0 ? 'zero' : signOf(categories[c.id].net);
        return (
          <span key={c.id} className={`${s.mark} ${s[sign]}`}>
            {GLYPH[sign]}
          </span>
        );
      })}
    </span>
  );
}
