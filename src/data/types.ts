/**
 * Аппын дотоод өгөгдлийн хэлбэр. Firestore-ийн бүтэц өөрчлөгдөхөд зөвхөн
 * adapter.ts засагдана; эдгээр төрөл болон тооцоо өөрчлөгдөхгүй.
 */
import type { Category } from '../config/points';

export type EventSource = 'duty_teacher' | 'teacher_form' | 'turnstile';

/** Онооны үйл явдал. Бүх тооцоо үүн дээр суурилна. */
export interface PointEvent {
  id: string;
  /** Хэвийнчилсэн ангийн нэр, жишээ нь "7-1" */
  classId: string;
  category: Category;
  /** +5 эсвэл −2 */
  points: number;
  /** "Бүгд ирсэн", "2 сурагч гутал сольсонгүй" */
  reason: string;
  /** ISO 8601 огноо-цаг, Улаанбаатарын цагаар (2026-11-12T08:42:00+08:00) */
  date: string;
  source: EventSource;
  /** Багшийн нэр (байвал) */
  givenBy?: string;
}

/** Жижүүр багшийн нэг өдрийн нэг ангийн тэмдэглэл (оноо болгохоос өмнөх хэлбэр) */
export interface DutyCheck {
  id: string;
  classId: string;
  /** "YYYY-MM-DD" */
  day: string;
  /** Бүртгэсэн цаг, ISO. Байхгүй бол өглөөний цаг гэж үзнэ */
  recordedAt?: string;
  /** Өвчтэй, чөлөөтэй сурагч: оноо хасуулахгүй */
  absentExcused: number;
  /** Шалтгаангүй ирээгүй сурагч */
  absentUnexcused: number;
  /** Хичээл тасалсан тохиолдол */
  truancies: number;
  uniformViolations: number;
  /** −3 … +3 */
  hygiene: number;
  shoesViolations: number;
  givenBy?: string;
}

export interface ClassInfo {
  /** Хэвийнчилсэн нэр */
  id: string;
  studentCount: number;
}

export interface Dataset {
  classes: readonly ClassInfo[];
  events: readonly PointEvent[];
}

export interface ConnectionState {
  online: boolean;
  /** Сүүлд серверээс шинэчлэгдсэн цаг (ms), мэдэгдэхгүй бол null */
  lastSyncedAt: number | null;
}
