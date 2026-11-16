import { CATEGORIES } from '../config/points';
import type { PointEvent } from '../data/types';
import { signed, signOf } from '../lib/format';
import { relativeTime } from '../lib/time';
import s from './LiveFeed.module.css';

const LABEL = new Map(CATEGORIES.map((c) => [c.id, c.label]));

/** Баруун талын нарийн хэсэг: сүүлийн оноонууд, шинэ нь дээр */
export function LiveFeed({ events, now }: { events: readonly PointEvent[]; now: Date }) {
  return (
    <section className={s.feed}>
      <h2 className={s.title}>Шинэ оноо</h2>
      {events.length === 0 ? (
        <p className={s.empty}>Энэ сард одоогоор оноо бүртгэгдээгүй байна.</p>
      ) : (
        <ol className={s.list}>
          {events.map((e) => (
            <li key={e.id} className={s.item}>
              <span className={s.classId}>{e.classId}</span>
              <span className={`${s.points} ${s[signOf(e.points)]}`}>{signed(e.points)}</span>
              <span className={s.category}>{LABEL.get(e.category) ?? e.category}</span>
              <span className={s.when}>{relativeTime(e.date, now)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
