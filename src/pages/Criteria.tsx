import { signed, signOf, zeroClass } from '../lib/format';
import type { DisplayModel } from '../lib/model';
import s from './Criteria.module.css';

/** 6 шалгуур тус бүрд: шилдэг 3 анги, сургуулийн нийт авсан ба хасуулсан оноо, өнгөрсөн сар */
export function Criteria({ model }: { model: DisplayModel }) {
  if (model.monthEvents.length === 0) {
    return <p className={s.empty}>Энэ сард одоогоор оноо бүртгэгдээгүй байна.</p>;
  }
  return (
    <section className={s.page}>
      <h2 className={s.title}>Шалгуур бүрээр, энэ сард</h2>
      <ol className={s.rows}>
        {model.categories.map((c) => (
          <li key={c.category} className={s.row}>
            <span className={s.label}>{c.label}</span>
            <ol className={s.top}>
              {c.top.map((t, i) => (
                <li key={t.classId} className={s.topItem}>
                  <span className={s.topRank}>{i + 1}</span>
                  <span className={s.topName}>{t.classId}</span>
                  <span className={`${s.topNet} ${s[signOf(t.net)]}`}>{signed(t.net)}</span>
                </li>
              ))}
            </ol>
            <span className={s.sums}>
              <span className={zeroClass(c.plus, s.plus, s.zero)}>+{c.plus}</span>
              <span className={zeroClass(c.minus, s.minus, s.zero)}>−{Math.abs(c.minus)}</span>
            </span>
            <span className={s.prev}>
              <span>Өнгөрсөн сард</span>
              <span>{c.prevPlus === 0 && c.prevMinus === 0 ? 'бүртгэлгүй' : `+${c.prevPlus} −${Math.abs(c.prevMinus)}`}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
