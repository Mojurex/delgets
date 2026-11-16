/**
 * Өгөгдлийн хандалт бүхэлдээ энд. Firestore-ийн бүтэц өөрчлөгдвөл зөвхөн энэ
 * файлыг засна. Firestore-оос ЗӨВХӨН УНШИНА (onSnapshot), юу ч бичихгүй.
 *
 * Хүлээж буй бүтэц (жижүүр багшийн системийн кодыг хараагүй тул санал болгосон
 * бүтэц; бодит бүтэц өөр бол доорх `toDutyCheck`, `toTeacherEvent`-ийг засна):
 *
 *   classes/{id}        { name: "7-1", studentCount: 31 }
 *   dutyChecks/{id}     { date: "2026-11-12", classId, absentExcused, absentUnexcused,
 *                         truancies, uniformViolations, hygiene, shoesViolations,
 *                         givenBy, createdAt: Timestamp }
 *                       → points.ts-ийн дүрмээр оноо болгоно
 *   teacherPoints/{id}  { date: "2026-11-12", classId, points, reason, givenBy,
 *                         createdAt: Timestamp }
 *                       → "Идэвх" шалгуурын оноо
 *
 * classId нь classes-ийн document id эсвэл ангийн нэр ("7.1", "7а") байж болно:
 * хоёуланг нь config-ийн "7-1" хэлбэрт хувиргана.
 */
import { initializeApp, type FirebaseOptions } from 'firebase/app';
import {
  collection,
  initializeFirestore,
  onSnapshot,
  persistentLocalCache,
  persistentSingleTabManager,
  query,
  Timestamp,
  where,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore';
import { ALL_CLASSES } from '../config/classes';
import { DEMO_EVENT_INTERVAL_MS } from '../config/display';
import { normalizeClassName } from '../lib/className';
import { clampActivity, dutyCheckToEvents } from '../lib/points';
import { firstDayOf, previousMonth, ubIso, yearMonthOf } from '../lib/time';
import { generateLiveEvent, generateMockDataset } from './mock';
import type { ClassInfo, ConnectionState, Dataset, DutyCheck, PointEvent } from './types';

export interface DataSource {
  /** `asOf` өдрийн өгөгдөлд бүртгүүлнэ. Буцаасан функц нь бүртгэлийг цуцална. */
  subscribe(
    asOf: string,
    onData: (data: Dataset) => void,
    onConnection: (state: ConnectionState) => void,
  ): () => void;
}

const EMPTY: Dataset = { classes: [], events: [] };

// ---------------------------------------------------------------- тохиргоо

function firebaseOptions(): FirebaseOptions | null {
  const env = import.meta.env;
  const options: FirebaseOptions = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  };
  return options.apiKey && options.projectId ? options : null;
}

export function isDemoRequested(search: string = window.location.search): boolean {
  return new URLSearchParams(search).get('demo') === '1';
}

// ---------------------------------------------------------------- хувиргалт

function num(v: unknown, fallback = 0): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

function isoOf(v: unknown, fallbackDay: string, fallbackTime: string): string {
  if (v instanceof Timestamp) return ubIso(v.toDate());
  if (typeof v === 'string' && !Number.isNaN(new Date(v).getTime())) return v;
  return `${fallbackDay}T${fallbackTime}+08:00`;
}

export type ClassNames = ReadonlyMap<string, string>;

function resolveClass(raw: string, classNames: ClassNames): string | null {
  return normalizeClassName(classNames.get(raw) ?? raw, ALL_CLASSES);
}

export function toClassInfo(docId: string, d: DocumentData): ClassInfo | null {
  const id = normalizeClassName(str(d.name) || docId, ALL_CLASSES);
  return id ? { id, studentCount: num(d.studentCount) } : null;
}

export function toDutyCheck(docId: string, d: DocumentData, classNames: ClassNames): DutyCheck | null {
  const classId = resolveClass(str(d.classId) || str(d.className), classNames);
  const day = str(d.date);
  if (!classId || !DAY_RE.test(day)) return null;
  return {
    id: docId,
    classId,
    day,
    recordedAt: isoOf(d.createdAt, day, '08:30:00'),
    absentExcused: num(d.absentExcused),
    absentUnexcused: num(d.absentUnexcused),
    truancies: num(d.truancies),
    uniformViolations: num(d.uniformViolations),
    hygiene: num(d.hygiene),
    shoesViolations: num(d.shoesViolations),
    givenBy: str(d.givenBy) || undefined,
  };
}

export function toTeacherEvent(docId: string, d: DocumentData, classNames: ClassNames): PointEvent | null {
  const classId = resolveClass(str(d.classId) || str(d.className), classNames);
  const day = str(d.date);
  const points = d.points === undefined || d.points === null ? NaN : Number(d.points);
  if (!classId || !DAY_RE.test(day) || !Number.isFinite(points) || points === 0) return null;
  return {
    id: docId,
    classId,
    category: 'activity',
    points: clampActivity(points),
    reason: str(d.reason) || 'Багшийн оноо',
    date: isoOf(d.createdAt, day, '12:00:00'),
    source: 'teacher_form',
    givenBy: str(d.givenBy) || undefined,
  };
}

// ---------------------------------------------------------------- сүүлд шинэчлэгдсэн цаг

const LAST_SYNC_KEY = 'amjilt-rank:lastSyncedAt';

function readLastSync(): number | null {
  try {
    const v = Number(window.localStorage.getItem(LAST_SYNC_KEY));
    return Number.isFinite(v) && v > 0 ? v : null;
  } catch {
    return null;
  }
}

function writeLastSync(t: number): void {
  try {
    window.localStorage.setItem(LAST_SYNC_KEY, String(t));
  } catch {
    /* хадгалж чадахгүй бол зүгээр */
  }
}

// ---------------------------------------------------------------- Firestore

let db: Firestore | null = null;

function firestore(options: FirebaseOptions): Firestore {
  if (!db) {
    const app = initializeApp(options);
    // IndexedDB cache: интернет тасарсан ч сүүлийн өгөгдлөөр харуулна
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentSingleTabManager(undefined) }),
    });
  }
  return db;
}

function firestoreSource(options: FirebaseOptions): DataSource {
  return {
    subscribe(asOf, onData, onConnection) {
      const store = firestore(options);
      const since = firstDayOf(previousMonth(yearMonthOf(asOf)));

      let classNames: Map<string, string> = new Map();
      let classes: ClassInfo[] = [];
      let rawChecks: [string, DocumentData][] = [];
      let rawTeacher: [string, DocumentData][] = [];

      const fromCache = new Map<string, boolean>();
      let lastSyncedAt = readLastSync();

      const emit = () => {
        const events: PointEvent[] = [];
        for (const [id, d] of rawChecks) {
          const check = toDutyCheck(id, d, classNames);
          if (check) events.push(...dutyCheckToEvents(check));
        }
        for (const [id, d] of rawTeacher) {
          const e = toTeacherEvent(id, d, classNames);
          if (e) events.push(e);
        }
        onData({ classes, events });
      };

      const reportConnection = (key: string, cached: boolean) => {
        fromCache.set(key, cached);
        const online = navigator.onLine && [...fromCache.values()].every((c) => !c);
        if (online) {
          lastSyncedAt = Date.now();
          writeLastSync(lastSyncedAt);
        }
        onConnection({ online, lastSyncedAt });
      };

      // Алдаа гарвал дэлгэц дээр гаргахгүй: сүүлийн өгөгдлөөр үргэлжлүүлнэ
      const onError = (key: string) => () => reportConnection(key, true);
      const opts = { includeMetadataChanges: true } as const;

      const unsubs = [
        onSnapshot(
          collection(store, 'classes'),
          opts,
          (snap) => {
            classNames = new Map(snap.docs.map((d) => [d.id, str(d.data().name)]));
            classes = snap.docs.map((d) => toClassInfo(d.id, d.data())).filter((c): c is ClassInfo => c !== null);
            reportConnection('classes', snap.metadata.fromCache);
            emit();
          },
          onError('classes'),
        ),
        onSnapshot(
          query(collection(store, 'dutyChecks'), where('date', '>=', since)),
          opts,
          (snap) => {
            rawChecks = snap.docs.map((d) => [d.id, d.data()]);
            reportConnection('dutyChecks', snap.metadata.fromCache);
            emit();
          },
          onError('dutyChecks'),
        ),
        onSnapshot(
          query(collection(store, 'teacherPoints'), where('date', '>=', since)),
          opts,
          (snap) => {
            rawTeacher = snap.docs.map((d) => [d.id, d.data()]);
            reportConnection('teacherPoints', snap.metadata.fromCache);
            emit();
          },
          onError('teacherPoints'),
        ),
      ];

      const onNetwork = () =>
        onConnection({ online: navigator.onLine && [...fromCache.values()].every((c) => !c), lastSyncedAt });
      window.addEventListener('online', onNetwork);
      window.addEventListener('offline', onNetwork);

      return () => {
        unsubs.forEach((u) => u());
        window.removeEventListener('online', onNetwork);
        window.removeEventListener('offline', onNetwork);
      };
    },
  };
}

// ---------------------------------------------------------------- demo / хоосон

/** Mock өгөгдөл + 20 секунд тутамд шинэ бичлэг (шууд урсгалыг турших) */
const demoSource: DataSource = {
  subscribe(asOf, onData, onConnection) {
    // Өнөөдрийн ирээдүйн цагтай бичлэгийг хасна: урсгал бодит харагдана
    const nowIso = ubIso(new Date());
    const initial = generateMockDataset(asOf);
    let data: Dataset = { ...initial, events: initial.events.filter((e) => e.date <= nowIso) };
    let seq = 0;
    onData(data);
    onConnection({ online: true, lastSyncedAt: Date.now() });
    let lastSyncedAt = Date.now();
    const id = window.setInterval(() => {
      if (!navigator.onLine) return;
      const event = generateLiveEvent(ALL_CLASSES, new Date(), ++seq);
      data = { ...data, events: [...data.events, event] };
      lastSyncedAt = Date.now();
      onData(data);
    }, DEMO_EVENT_INTERVAL_MS);
    const onNetwork = () => onConnection({ online: navigator.onLine, lastSyncedAt });
    window.addEventListener('online', onNetwork);
    window.addEventListener('offline', onNetwork);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('online', onNetwork);
      window.removeEventListener('offline', onNetwork);
    };
  },
};

const emptySource: DataSource = {
  subscribe(_asOf, onData, onConnection) {
    onData(EMPTY);
    onConnection({ online: true, lastSyncedAt: null });
    return () => {};
  },
};

/**
 * Өгөгдлийн эх сурвалжийг сонгоно:
 *  - `?demo=1` → mock өгөгдөл
 *  - Firebase config байвал → Firestore
 *  - config байхгүй: хөгжүүлэлтийн үед mock, production-д хоосон (зохиомол
 *    оноог олны өмнө хэзээ ч гаргахгүйн тулд)
 */
export function createDataSource(): DataSource {
  if (isDemoRequested()) return demoSource;
  const options = firebaseOptions();
  if (options) return firestoreSource(options);
  return import.meta.env.DEV ? demoSource : emptySource;
}
