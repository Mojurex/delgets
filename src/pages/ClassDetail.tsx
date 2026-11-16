import { useState } from 'react';
import { Delta } from '../components/Delta';
import { LineChart } from '../components/LineChart';
import { Score } from '../components/Score';
import { CATEGORIES, type Category } from '../config/points';
import type { PointEvent } from '../data/types';
import { signed, signOf, zeroClass } from '../lib/format';
import type { DisplayModel } from '../lib/model';
import { dailySeries, eventDay, latestEvents } from '../lib/points';
import { daysInMonth, shortDate } from '../lib/time';
import s from './ClassDetail.module.css';

const LABEL = new Map(CATEGORIES.map((c) => [c.id, c.label]));
const RECENT = 6;
const EVENTS_PER_COLUMN = 10;

/** Нэг ангийн дэлгэрэнгүй: шалгуурын задаргаа, сарын явц, сүүлийн оноонууд */
export function ClassDetail({ model, classId }: { model: DisplayModel; classId: string }) {
  const standing = model.byClass.get(classId);
  const [selected, setSelected] = useState<Category | null>(null);

  if (!standing) {
    return <p className={s.empty}>Энэ анги жагсаалтад байхгүй байна.</p>;
  }
  const { summary, group, groupRank, change } = standing;
  const hasPoints = summary.events.length > 0;
  const series = dailySeries(summary.events, model.month, model.asOf);
  const scale = Math.max(1, ...CATEGORIES.map((c) => Math.max(summary.categories[c.id].plus, -summary.categories[c.id].minus)));

  return (
    <section className={s.page}>
      <header className={s.head}>
        <div className={s.who}>
          <h2 className={s.name}>{classId}</h2>
          <p className={s.standing}>
            {group.title} дундаа {groupRank}-р байр <Delta change={change} />
          </p>
        </div>
        <div className={s.totals}>
          <p className={s.total}>
            <Score value={summary.score} />
            <span className={s.totalUnit}> оноо</span>
          </p>
          <p className={s.plusMinus}>
            <span className={zeroClass(summary.plus, s.plus, s.zero)}>+{summary.plus}</span>
            <span className={zeroClass(summary.minus, s.minus, s.zero)}>−{Math.abs(summary.minus)}</span>
          </p>
        </div>
      </header>

      {!hasPoints ? (
        <p className={s.empty}>Энэ сард одоогоор оноо бүртгэгдээгүй байна.</p>
      ) : selected ? (
        <CategoryEvents
          category={selected}
          events={summary.events.filter((e) => e.category === selected)}
          onClose={() => setSelected(null)}
        />
      ) : (
        <>
          <div className={s.body}>
            <div className={s.breakdown}>
              <h3 className={s.subTitle}>Шалгуур бүрээр. Шалгуурыг дарвал бүх оноо нь гарна</h3>
              <ol className={s.bars}>
                {CATEGORIES.map((c) => {
                  const v = summary.categories[c.id];
                  return (
                    <li key={c.id} className={s.barRow}>
                      <button type="button" className={s.barButton} onClick={() => setSelected(c.id)}>
                        <span className={s.barLabel}>{c.label}</span>
                        <span className={s.minusValue}>{v.minus !== 0 ? `−${Math.abs(v.minus)}` : ''}</span>
                        <span className={s.barTrack}>
                          <span className={s.minusBar} style={{ width: `${(-v.minus / scale) * 100}%` }} />
                          <span className={s.plusBar} style={{ width: `${(v.plus / scale) * 100}%` }} />
                        </span>
                        <span className={s.plusValue}>{v.plus !== 0 ? `+${v.plus}` : ''}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>

            <div className={s.progress}>
              <h3 className={s.subTitle}>Сарын явц</h3>
              <LineChart series={series} daysInMonth={daysInMonth(model.month)} width={560} height={372} />
            </div>
          </div>

          <div className={s.recent}>
            <h3 className={s.subTitle}>Сүүлийн оноонууд</h3>
            <ol className={s.events}>
              {latestEvents(summary.events, RECENT).map((e) => (
                <EventRow key={e.id} event={e} />
              ))}
            </ol>
          </div>
        </>
      )}
    </section>
  );
}

function EventRow({ event: e }: { event: PointEvent }) {
  return (
    <li className={s.event}>
      <span className={s.eventDate}>{shortDate(eventDay(e))}</span>
      <span className={s.eventCategory}>{LABEL.get(e.category)}</span>
      <span className={`${s.eventPoints} ${s[signOf(e.points)]}`}>{signed(e.points)}</span>
      <span className={s.eventReason}>{e.reason}</span>
    </li>
  );
}

/** Нэг шалгуурын бүх бичлэг, хоёр баганад */
function CategoryEvents({ category, events, onClose }: { category: Category; events: PointEvent[]; onClose: () => void }) {
  const sorted = latestEvents(events, Infinity);
  const plus = events.filter((e) => e.points > 0).reduce((a, e) => a + e.points, 0);
  const minus = events.filter((e) => e.points < 0).reduce((a, e) => a + e.points, 0);
  const shown = sorted.slice(0, EVENTS_PER_COLUMN * 2);
  const columns = [shown.slice(0, EVENTS_PER_COLUMN), shown.slice(EVENTS_PER_COLUMN)];

  return (
    <div className={s.categoryView}>
      <div className={s.categoryHead}>
        <h3 className={s.categoryTitle}>
          {LABEL.get(category)}
          <span className={s.categorySum}>
            <span className={zeroClass(plus, s.plus, s.zero)}>+{plus}</span>
            <span className={zeroClass(minus, s.minus, s.zero)}>−{Math.abs(minus)}</span>
          </span>
        </h3>
        <button type="button" className={s.close} onClick={onClose}>
          Задаргаа руу буцах
        </button>
      </div>
      {sorted.length === 0 ? (
        <p className={s.empty}>Энэ шалгуураар оноо бүртгэгдээгүй байна.</p>
      ) : (
        <div className={s.columns}>
          {columns.map((col, i) => (
            <ol key={i} className={s.events}>
              {col.map((e) => (
                <EventRow key={e.id} event={e} />
              ))}
            </ol>
          ))}
        </div>
      )}
      {sorted.length > shown.length && (
        <p className={s.hint}>Нийт {sorted.length} бичлэгээс сүүлийн {shown.length}-ийг харуулж байна.</p>
      )}
    </div>
  );
}
