import { Delta } from '../components/Delta';
import { zeroClass } from '../lib/format';
import { Marks } from '../components/Marks';
import { Score } from '../components/Score';
import type { DisplayModel } from '../lib/model';
import type { RankedClass } from '../lib/points';
import s from './Overview.module.css';

export interface Flash {
  classId: string;
  /** Өөрчлөгдөх бүрт тодролт дахин тоглоно */
  token: number;
}

interface Props {
  model: DisplayModel;
  flash: Flash | null;
  onSelect: (classId: string) => void;
}

/** 27 анги бүгд нэг дэлгэцэнд, 3 баганад. Дээр нь сургуулийн шилдэг 3. */
export function Overview({ model, flash, onSelect }: Props) {
  const top = model.school.slice(0, 3);
  const hasPoints = model.monthEvents.length > 0;

  return (
    <section className={s.page}>
      <div className={s.strip}>
        {hasPoints ? (
          <ol className={s.top3}>
            {top.map((c, i) => (
              <li key={c.classId} className={i === 0 ? `${s.topItem} ${s.first}` : s.topItem}>
                <span className={s.topRank}>{i + 1}</span>
                <span className={s.topName}>{c.classId}</span>
                <Score className={s.topScore} value={c.score} />
              </li>
            ))}
          </ol>
        ) : (
          <p className={s.empty}>Энэ сард одоогоор оноо бүртгэгдээгүй байна.</p>
        )}
        <div className={s.daysLeft}>
          <span className={s.daysLabel}>{model.daysLeft > 0 ? 'Сар дуусахад' : 'Сарын сүүлийн өдөр'}</span>
          {model.daysLeft > 0 && (
            <span className={s.daysValue}>
              {model.daysLeft}
              <span className={s.daysUnit}> өдөр</span>
            </span>
          )}
        </div>
      </div>

      <div className={s.columns}>
        {model.groups.map((g) => (
          <div key={g.group.id} className={s.column}>
            <h2 className={s.groupTitle}>{g.group.title}</h2>
            <ol className={s.rows}>
              {g.classes.map((c) => (
                <Row
                  key={c.classId}
                  item={c}
                  change={model.byClass.get(c.classId)?.change ?? null}
                  flashToken={flash?.classId === c.classId ? flash.token : null}
                  onSelect={onSelect}
                />
              ))}
            </ol>
          </div>
        ))}
      </div>

      <p className={s.legend}>
        Тэмдгүүд ирц, таслалт, дүрэмт хувцас, ариун цэвэр, гутал, идэвх гэсэн дарааллаар. Мөрийг дарвал дэлгэрэнгүй гарна.
      </p>
    </section>
  );
}

function Row({
  item,
  change,
  flashToken,
  onSelect,
}: {
  item: RankedClass;
  change: number | null;
  flashToken: number | null;
  onSelect: (classId: string) => void;
}) {
  return (
    <li className={s.row}>
      {flashToken !== null && <span key={flashToken} className={s.flash} aria-hidden="true" />}
      <button type="button" className={s.rowButton} onClick={() => onSelect(item.classId)}>
        <span className={s.rank}>{item.rank}</span>
        <span className={s.name}>{item.classId}</span>
        <Score className={s.total} value={item.score} />
        <Delta change={change} />
        <span className={s.sub}>
          <span className={zeroClass(item.plus, s.plus, s.zero)}>+{item.plus}</span>
          <span className={zeroClass(item.minus, s.minus, s.zero)}>−{Math.abs(item.minus)}</span>
          <Marks categories={item.categories} />
        </span>
      </button>
    </li>
  );
}
