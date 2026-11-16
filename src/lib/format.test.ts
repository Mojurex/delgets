import { describe, expect, it } from 'vitest';
import { plain, signed, signOf, zeroClass } from './format';

describe('format', () => {
  it('signed', () => {
    expect(signed(5)).toBe('+5');
    expect(signed(-2)).toBe('−2');
    expect(signed(0)).toBe('0');
    expect(signed(0.4)).toBe('0');
  });
  it('plain', () => {
    expect(plain(1284)).toBe('1 284');
    expect(plain(-12)).toBe('−12');
  });
  it('signOf', () => {
    expect(signOf(3)).toBe('plus');
    expect(signOf(-3)).toBe('minus');
    expect(signOf(0)).toBe('zero');
  });
});

describe('zeroClass', () => {
  it('0 бол бүдэг класс', () => {
    expect(zeroClass(0, 'plus', 'zero')).toBe('zero');
    expect(zeroClass(5, 'plus', 'zero')).toBe('plus');
  });
});
