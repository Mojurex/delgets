import s from './Delta.module.css';

/** 7 хоногийн байрны өөрчлөлт: ▲3, ▼1. Өөрчлөлтгүй бол –, мэдэгдэхгүй бол хоосон */
export function Delta({ change }: { change: number | null }) {
  if (change === null) return <span className={s.delta} />;
  if (change === 0) return <span className={`${s.delta} ${s.same}`}>–</span>;
  const up = change > 0;
  return (
    <span className={`${s.delta} ${up ? s.up : s.down}`}>
      {up ? '▲' : '▼'}
      {Math.abs(change)}
    </span>
  );
}
