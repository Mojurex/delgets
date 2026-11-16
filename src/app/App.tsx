import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ALL_CLASSES } from '../config/classes';
import { CROSSFADE_MS, INSIGHTS_PER_PAGE } from '../config/display';
import { Frame } from '../components/Frame';
import { Stage } from '../components/Stage';
import type { Dataset } from '../data/types';
import { buildInsights } from '../insights';
import { buildDisplayModel, type DisplayModel } from '../lib/model';
import { buildCycle, viewKey, type View } from '../lib/rotation';
import { monthLabel, ubDate } from '../lib/time';
import { ClassDetail } from '../pages/ClassDetail';
import { Criteria } from '../pages/Criteria';
import { Insights } from '../pages/Insights';
import { Overview, type Flash } from '../pages/Overview';
import { useBurnInOffset, useDataset, useFontsReady, useIdle, useNightlyReload, useNow } from './hooks';
import s from './App.module.css';

/**
 * Туршилтын параметрүүд:
 *   ?demo=1            mock өгөгдөл
 *   ?view=overview|criteria|insights|class:7-1   тухайн дэлгэцийг зогсоож харуулна
 *   ?date=YYYY-MM-DD   өнөөдрийг солино (зөвхөн demo)
 */
function readParams() {
  const p = new URLSearchParams(window.location.search);
  const date = p.get('date');
  const view = p.get('view');
  let pinned: View | null = null;
  if (view === 'overview' || view === 'criteria' || view === 'insights') pinned = { kind: view };
  else if (view?.startsWith('class:')) pinned = { kind: 'class', classId: view.slice(6) };
  return {
    pinned,
    dateOverride: p.get('demo') === '1' && date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null,
  };
}

/** Шинэ бичлэг орж ирэхэд тухайн ангийн мөрийг тодруулах */
function useFlash(data: Dataset, ready: boolean): Flash | null {
  const seen = useRef<Set<string> | null>(null);
  const [flash, setFlash] = useState<Flash | null>(null);
  useEffect(() => {
    if (!ready) return;
    if (seen.current === null) {
      seen.current = new Set(data.events.map((e) => e.id));
      return;
    }
    const fresh = data.events.filter((e) => !seen.current!.has(e.id));
    for (const e of fresh) seen.current.add(e.id);
    const last = fresh.at(-1);
    if (last) setFlash((f) => ({ classId: last.classId, token: (f?.token ?? 0) + 1 }));
  }, [data, ready]);
  return flash;
}

export function App() {
  const params = useMemo(readParams, []);
  const now = useNow(10_000);
  const asOf = params.dateOverride ?? ubDate(now);
  const { data, connection, ready } = useDataset(asOf);
  const fontsReady = useFontsReady();
  const offset = useBurnInOffset();
  const reduceMotion = useReducedMotion();
  useNightlyReload();

  const model = useMemo(() => buildDisplayModel(data, asOf), [data, asOf]);
  const insights = useMemo(() => buildInsights(model, INSIGHTS_PER_PAGE), [model]);
  const flash = useFlash(data, ready);

  // ---------------------------------------------------------- эргэлт ба хүрэлт
  const { interactive, touch } = useIdle();
  const [manual, setManual] = useState<View | null>(null);
  const [cycle, setCycle] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const steps = useMemo(() => buildCycle(ALL_CLASSES, cycle), [cycle]);
  const step = steps[stepIndex] ?? steps[0]!;

  const view: View = params.pinned ?? (interactive && manual ? manual : step.view);

  useEffect(() => {
    if (params.pinned || interactive) return;
    const id = window.setTimeout(() => {
      if (stepIndex + 1 < steps.length) setStepIndex(stepIndex + 1);
      else {
        setStepIndex(0);
        setCycle((c) => c + 1);
      }
    }, step.durationMs);
    return () => window.clearTimeout(id);
  }, [params.pinned, interactive, step, stepIndex, steps.length]);

  // Хүн хүрэхээ болиход гар сонголтыг мартана
  useEffect(() => {
    if (!interactive) setManual(null);
  }, [interactive]);

  const onTouch = useCallback(() => {
    // Хоосон газар хүрсэн ч одоогийн дэлгэцийг барина
    setManual((m) => m ?? view);
    touch();
  }, [touch, view]);

  const openClass = useCallback(
    (classId: string) => {
      setManual({ kind: 'class', classId });
      touch();
    },
    [touch],
  );

  const goOverview = useCallback(() => {
    setManual({ kind: 'overview' });
    touch();
  }, [touch]);

  const show = ready && fontsReady;

  return (
    <Stage offset={offset} onPointerDown={onTouch}>
      <Frame
        now={now}
        monthLabel={monthLabel(model.month)}
        connection={connection}
        feed={model.feed}
        onBack={view.kind === 'overview' ? null : goOverview}
      >
        <AnimatePresence initial={false}>
          {show && (
            <motion.div
              key={viewKey(view)}
              className={s.page}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : CROSSFADE_MS / 1000, ease: 'linear' }}
            >
              {renderView(view, model, insights, flash, openClass)}
            </motion.div>
          )}
        </AnimatePresence>
      </Frame>
    </Stage>
  );
}

function renderView(
  view: View,
  model: DisplayModel,
  insights: ReturnType<typeof buildInsights>,
  flash: Flash | null,
  openClass: (classId: string) => void,
) {
  switch (view.kind) {
    case 'overview':
      return <Overview model={model} flash={flash} onSelect={openClass} />;
    case 'criteria':
      return <Criteria model={model} />;
    case 'insights':
      return <Insights insights={insights} />;
    case 'class':
      return <ClassDetail model={model} classId={view.classId} />;
  }
}
