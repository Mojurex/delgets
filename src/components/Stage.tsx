import { useEffect, useState, type PointerEventHandler, type ReactNode } from 'react';
import s from './Stage.module.css';

const W = 1920;
const H = 1080;

function fit(): number {
  return Math.min(window.innerWidth / W, window.innerHeight / H);
}

interface Props {
  /** Burn-in хамгаалалтын 1–2px шилжилт */
  offset: { x: number; y: number };
  onPointerDown: PointerEventHandler<HTMLDivElement>;
  children: ReactNode;
}

/** 1920×1080 зураг төслийг ямар ч дэлгэцэнд (4K, Android самбар) багтааж масштаблана. */
export function Stage({ offset, onPointerDown, children }: Props) {
  const [scale, setScale] = useState(fit);

  useEffect(() => {
    const onResize = () => setScale(fit());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className={s.viewport} onPointerDown={onPointerDown}>
      <div
        className={s.stage}
        style={{ transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}
