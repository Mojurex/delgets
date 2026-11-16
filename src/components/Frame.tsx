import type { ReactNode } from 'react';
import { SCHOOL_TITLE } from '../config/display';
import type { ConnectionState, PointEvent } from '../data/types';
import { ubClock } from '../lib/time';
import s from './Frame.module.css';
import { LiveFeed } from './LiveFeed';

interface Props {
  now: Date;
  monthLabel: string;
  connection: ConnectionState;
  feed: readonly PointEvent[];
  /** Байвал дээд мөрийн зүүн талд буцах товч гарна, үгүй бол лого ба нэр */
  onBack: (() => void) | null;
  children: ReactNode;
}

/**
 * Бүх дэлгэцэд байх хүрээ: дээд мөр, гол хэсэг, баруун талын шууд урсгал.
 * Буцах товч үргэлж нэг газраа (дээд мөрийн зүүн зах).
 */
export function Frame({ now, monthLabel, connection, feed, onBack, children }: Props) {
  return (
    <div className={s.frame}>
      <div className={s.main}>
        <header className={s.header}>
          {onBack ? (
            <button type="button" className={s.back} onClick={onBack}>
              Бүх анги рүү буцах
            </button>
          ) : (
            <div className={s.brand}>
              <img className={s.logo} src="/logo-real.svg" alt="" />
              <h1 className={s.title}>{SCHOOL_TITLE}</h1>
            </div>
          )}
          {!connection.online && (
            <span className={s.offline}>
              {connection.lastSyncedAt
                ? `Сүлжээ тасарсан, сүүлд ${ubClock(new Date(connection.lastSyncedAt))}-д шинэчлэгдсэн`
                : 'Сүлжээ тасарсан'}
            </span>
          )}
          <span className={s.month}>{monthLabel}</span>
          <time className={s.clock}>{ubClock(now)}</time>
        </header>
        <main className={s.content}>{children}</main>
      </div>
      <aside className={s.rail}>
        <LiveFeed events={feed} now={now} />
      </aside>
    </div>
  );
}
