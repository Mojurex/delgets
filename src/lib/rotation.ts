/**
 * Автомат эргэлтийн хуваарь. Pure.
 * Ерөнхий самбар → Шалгуурын тойм → Ажиглалт → 3 ангийн дэлгэрэнгүй → дахин.
 * Эргэлт бүрт дараагийн 3 анги гарч, бүх анги ээлжлэн харагдана.
 */
import { CLASSES_PER_CYCLE, DURATION } from '../config/display';

export type View =
  | { kind: 'overview' }
  | { kind: 'criteria' }
  | { kind: 'insights' }
  | { kind: 'class'; classId: string };

export interface Step {
  view: View;
  durationMs: number;
}

export function buildCycle(classIds: readonly string[], cycle: number): Step[] {
  const steps: Step[] = [
    { view: { kind: 'overview' }, durationMs: DURATION.overview },
    { view: { kind: 'criteria' }, durationMs: DURATION.criteria },
    { view: { kind: 'insights' }, durationMs: DURATION.insights },
  ];
  if (classIds.length > 0) {
    const start = (cycle * CLASSES_PER_CYCLE) % classIds.length;
    for (let i = 0; i < Math.min(CLASSES_PER_CYCLE, classIds.length); i++) {
      const classId = classIds[(start + i) % classIds.length]!;
      steps.push({ view: { kind: 'class', classId }, durationMs: DURATION.classDetail });
    }
  }
  return steps;
}

export function viewKey(view: View): string {
  return view.kind === 'class' ? `class:${view.classId}` : view.kind;
}
