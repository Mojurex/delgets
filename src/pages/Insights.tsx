import type { Insight } from '../insights';
import s from './Insights.module.css';

/** Дүрэмд суурилсан 3–4 ажиглалт, том үсгээр */
export function Insights({ insights }: { insights: Insight[] }) {
  return (
    <section className={s.page}>
      <h2 className={s.title}>Ажиглалт</h2>
      {insights.length === 0 ? (
        <p className={s.empty}>Ажиглалт гаргахад энэ сарын оноо хүрэлцэхгүй байна.</p>
      ) : (
        <ol className={s.list}>
          {insights.map((i) => (
            <li key={i.id} className={s.item}>
              {i.text}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
