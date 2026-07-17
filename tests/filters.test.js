import { describe, it, expect } from 'vitest';
import { filterCars } from '../src/lib/filters.js';

const cars = [
  { name: 'Renault Taliant', type: 'Sedan', transmission: 'Manuel' },
  { name: 'Dacia Duster', type: 'SUV', transmission: 'Manuel' },
  { name: 'Hyundai i20', type: 'Hatchback', transmission: 'Otomatik' },
  { name: 'BMW 4 Serisi Cabrio', type: 'Cabrio', transmission: 'Otomatik' },
  { name: 'Fiat Doblo', type: 'Ticari', transmission: 'Manuel' },
];

describe('filterCars', () => {
  it('filtre verilmezse tüm araçları döndürür', () => {
    expect(filterCars(cars)).toHaveLength(5);
  });

  it('isimde büyük/küçük harf duyarsız arar', () => {
    expect(filterCars(cars, { search: 'dacia' })).toHaveLength(1);
    expect(filterCars(cars, { search: 'DACIA' })[0].name).toBe('Dacia Duster');
  });

  it('tip filtresi büyük/küçük harf duyarsız eşleşir (sekme değerleri küçük harf)', () => {
    expect(filterCars(cars, { type: 'ticari' })).toHaveLength(1);
    expect(filterCars(cars, { type: 'cabrio' })[0].name).toContain('BMW');
  });

  it('şanzıman filtresi çalışır', () => {
    expect(filterCars(cars, { transmission: 'Otomatik' })).toHaveLength(2);
  });

  it('filtreler birlikte uygulanır', () => {
    const result = filterCars(cars, { search: 'fiat', type: 'ticari', transmission: 'Manuel' });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Fiat Doblo');
  });

  it('eşleşme yoksa boş dizi döner', () => {
    expect(filterCars(cars, { search: 'tesla' })).toHaveLength(0);
  });
});
