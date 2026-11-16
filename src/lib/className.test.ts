import { describe, expect, it } from 'vitest';
import { ALL_CLASSES } from '../config/classes';
import { normalizeClassName, toCanonicalClassName } from './className';

describe('toCanonicalClassName', () => {
  it.each([
    ['7-2', '7-2'],
    ['7.2', '7-2'],
    ['7/2', '7-2'],
    ['7 2', '7-2'],
    [' 12-03 ', '12-3'],
    ['1а', '1-1'],
    ['1А', '1-1'],
    ['1б', '1-2'],
    ['1 в', '1-3'],
    ['11-б', '11-2'],
    ['5b', '5-2'],
  ])('"%s" → "%s"', (raw, expected) => {
    expect(toCanonicalClassName(raw)).toBe(expected);
  });

  it('танигдахгүй хэлбэр бол null', () => {
    expect(toCanonicalClassName('багш нар')).toBeNull();
    expect(toCanonicalClassName('')).toBeNull();
  });
});

describe('normalizeClassName', () => {
  it('config-д байхгүй анги бол null', () => {
    expect(normalizeClassName('10-2', ALL_CLASSES)).toBeNull();
    expect(normalizeClassName('10.1', ALL_CLASSES)).toBe('10-1');
  });
});
