import { useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BURN_IN_INTERVAL_MS, BURN_IN_MAX_PX, COUNT_UP_MS, IDLE_MS, RELOAD_AT } from '../config/display';
import { createDataSource } from '../data/adapter';
import type { ConnectionState, Dataset } from '../data/types';

/** Тогтмол давтамжтай шинэчлэгдэх одоогийн цаг */
export function useNow(intervalMs: number): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

const EMPTY: Dataset = { classes: [], events: [] };

/** Өгөгдөлд бүртгүүлнэ. Өдөр солигдоход дахин бүртгүүлнэ. */
export function useDataset(asOf: string): { data: Dataset; connection: ConnectionState; ready: boolean } {
  const source = useMemo(() => createDataSource(), []);
  const [data, setData] = useState<Dataset>(EMPTY);
  const [ready, setReady] = useState(false);
  const [connection, setConnection] = useState<ConnectionState>({ online: true, lastSyncedAt: null });

  useEffect(
    () =>
      source.subscribe(
        asOf,
        (d) => {
          setData(d);
          setReady(true);
        },
        setConnection,
      ),
    [source, asOf],
  );

  return { data, connection, ready };
}

/** УБ цагийн бүс UTC+8 (зуны цаг байхгүй) */
const UB_OFFSET_MS = 8 * 3_600_000;

/** Дараагийн 03:00 (Улаанбаатар) хүртэлх мөч, ms */
export function nextReloadAt(nowMs: number): number {
  const ub = new Date(nowMs + UB_OFFSET_MS);
  let target =
    Date.UTC(ub.getUTCFullYear(), ub.getUTCMonth(), ub.getUTCDate(), RELOAD_AT.hour, RELOAD_AT.minute) - UB_OFFSET_MS;
  if (target <= nowMs) target += 24 * 3_600_000;
  return target;
}

/** Шөнө 03:00-д хуудсыг дахин ачаална */
export function useNightlyReload(): void {
  useEffect(() => {
    const target = nextReloadAt(Date.now());
    // Унтаж сэрсэн төхөөрөмж дээр setTimeout хоцордог тул тогтмол шалгана
    const id = window.setInterval(() => {
      if (Date.now() >= target) window.location.reload();
    }, 30_000);
    return () => window.clearInterval(id);
  }, []);
}

/** Burn-in хамгаалалт: 5 минут тутам бүх зургийг 1–2px шилжүүлнэ */
const BURN_IN_PATH: readonly [number, number][] = [
  [0, 0], [1, 0], [2, 1], [1, 2], [0, 1], [-1, 2], [-2, 1], [-1, 0],
  [-2, -1], [-1, -2], [0, -1], [1, -2], [2, -1],
];

export function useBurnInOffset(): { x: number; y: number } {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setStep((s) => (s + 1) % BURN_IN_PATH.length), BURN_IN_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);
  const [x, y] = BURN_IN_PATH[step] ?? [0, 0];
  const k = BURN_IN_MAX_PX / 2;
  return { x: x * k, y: y * k };
}

/** Фонт ачаалагдтал хүлээнэ (хамгийн ихдээ 3 секунд): үсэг үсрэхгүйн тулд */
export function useFontsReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        setReady(true);
      }
    };
    const timer = window.setTimeout(finish, 3000);
    document.fonts.ready.then(finish, finish);
    return () => window.clearTimeout(timer);
  }, []);
  return ready;
}

/**
 * Тоо шинэчлэгдэх үед 600ms-ийн count-up. Анх гарч ирэхдээ шууд эцсийн утгыг
 * харуулна. prefers-reduced-motion идэвхтэй бол шууд солигдоно.
 */
export function useCountUp(target: number, ms: number = COUNT_UP_MS): number {
  const reduce = useReducedMotion();
  const [value, setValue] = useState(target);
  const shown = useRef(target);

  useEffect(() => {
    const from = shown.current;
    if (from === target) return;
    if (reduce) {
      shown.current = target;
      setValue(target);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = Math.round(from + (target - from) * eased);
      shown.current = v;
      setValue(v);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms, reduce]);

  return value;
}

/**
 * Хүн дэлгэцэд хүрсэн эсэх. `touch()`-ийг дуудахад идэвхтэй болж, IDLE_MS
 * хүрэхгүй бол автомат эргэлт рүү буцна.
 */
export function useIdle(timeoutMs: number = IDLE_MS): { interactive: boolean; touch: () => void } {
  const [interactive, setInteractive] = useState(false);
  const timer = useRef(0);

  const touch = useCallback(() => {
    setInteractive(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setInteractive(false), timeoutMs);
  }, [timeoutMs]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return { interactive, touch };
}
