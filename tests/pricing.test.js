import { describe, it, expect } from 'vitest';
import { getDailyRate, calcRentalDays, calcTotal } from '../src/lib/pricing.js';

const prices = { '1_3': 40, '4_7': 38, '8_14': 36, '15_21': 34, '22_29': 32, '30_plus': 30 };

describe('getDailyRate — kademe sınırları', () => {
  it.each([
    [1, 40],
    [3, 40],
    [4, 38],
    [7, 38],
    [8, 36],
    [14, 36],
    [15, 34],
    [21, 34],
    [22, 32],
    [29, 32],
    [30, 30],
    [90, 30],
  ])('%i gün → günlük €%i', (days, expected) => {
    expect(getDailyRate(prices, days)).toBe(expected);
  });
});

describe('calcRentalDays', () => {
  it('ardışık günler 1 gün sayılır', () => {
    expect(calcRentalDays('2026-08-01', '2026-08-02')).toBe(1);
  });

  it('bir haftalık aralık 7 gün sayılır', () => {
    expect(calcRentalDays('2026-08-01', '2026-08-08')).toBe(7);
  });

  it('ay sınırını doğru geçer', () => {
    expect(calcRentalDays('2026-07-30', '2026-08-02')).toBe(3);
  });

  it('aynı gün 0 döner (geçersiz aralık)', () => {
    expect(calcRentalDays('2026-08-01', '2026-08-01')).toBe(0);
  });
});

describe('calcTotal', () => {
  it('kademe tarifesiyle toplamı hesaplar', () => {
    expect(calcTotal(prices, 10)).toEqual({ dailyRate: 36, total: 360 });
  });

  it('uzun dönem indirimi toplamda görünür', () => {
    expect(calcTotal(prices, 30).total).toBe(900);
  });
});
