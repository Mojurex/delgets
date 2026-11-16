import type { DisplayModel } from '../lib/model';
import { RULES, type Insight } from './rules';

/** Бүх дүрмийг ажиллуулж, чухлаар нь эрэмбэлээд эхний `limit`-ийг өгнө */
export function buildInsights(model: DisplayModel, limit: number): Insight[] {
  return RULES.map((rule) => rule(model))
    .filter((i): i is Insight => i !== null)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit);
}

export type { Insight } from './rules';
