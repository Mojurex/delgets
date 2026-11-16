import type { SeriesPoint } from '../lib/points';
import s from './LineChart.module.css';

interface Props {
  series: readonly SeriesPoint[];
  /** Сарын нийт өдөр: x тэнхлэг бүтэн сарыг хамарна */
  daysInMonth: number;
  width: number;
  height: number;
}

const PAD = { left: 72, right: 24, top: 36, bottom: 44 };

/**
 * Сарын явц: өдөр тутмын хуримтлагдсан онооны шугам. Тор, хүрээгүй.
 * Оноо хасагдсан өдрүүд дээр шугамын доор жижиг − тэмдэг.
 */
export function LineChart({ series, daysInMonth, width, height }: Props) {
  const w = width - PAD.left - PAD.right;
  const h = height - PAD.top - PAD.bottom;
  const totals = series.map((p) => p.total);
  const max = Math.max(1, ...totals);
  const min = Math.min(0, ...totals);
  const x = (day: number) => PAD.left + ((day - 1) / Math.max(1, daysInMonth - 1)) * w;
  const y = (v: number) => PAD.top + h - ((v - min) / (max - min)) * h;

  const points = [{ day: 0.999, total: 0 }, ...series].map((p) => `${x(Math.max(1, p.day)).toFixed(1)},${y(p.total).toFixed(1)}`);
  const last = series.at(-1);
  const minusDays = series.filter((p) => p.hasMinus);

  return (
    <svg className={s.chart} viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">
      {/* 0-ийн шугам */}
      <line className={s.baseline} x1={PAD.left} x2={width - PAD.right} y1={y(0)} y2={y(0)} />
      <text className={s.axis} x={PAD.left - 16} y={y(0)} dy="0.35em" textAnchor="end">
        0
      </text>

      {last && last.total !== 0 && (
        <text className={s.axis} x={PAD.left - 16} y={y(last.total)} dy="0.35em" textAnchor="end">
          {last.total}
        </text>
      )}

      {/* Өдрийн тэмдэг: 1, одоогийн өдөр, сарын сүүлийн өдөр */}
      <text className={s.axis} x={x(1)} y={height - 10} textAnchor="middle">
        1
      </text>
      {last && last.day > 2 && last.day < daysInMonth - 1 && (
        <text className={s.axisStrong} x={x(last.day)} y={height - 10} textAnchor="middle">
          {last.day}
        </text>
      )}
      <text className={s.axis} x={x(daysInMonth)} y={height - 10} textAnchor="middle">
        {daysInMonth}
      </text>

      <polyline className={s.line} points={points.join(' ')} />

      {minusDays.map((p) => (
        <text key={p.day} className={s.minus} x={x(p.day)} y={y(p.total) + 34} textAnchor="middle">
          −
        </text>
      ))}

      {last && <circle className={s.dot} cx={x(last.day)} cy={y(last.total)} r="7" />}
    </svg>
  );
}
