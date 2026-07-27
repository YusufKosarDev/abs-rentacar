import { describe, it, expect } from 'vitest';
import { buildCarsUrl, mergeBookingParams, pickupLabel } from '../src/lib/booking-params.js';

describe('buildCarsUrl', () => {
  it('parametresiz cars.html döndürür', () => {
    expect(buildCarsUrl('', '', '')).toBe('/cars.html');
  });

  it('pickup ve tarihi query olarak ekler', () => {
    expect(buildCarsUrl('Konakli', '2027-08-01', '')).toBe(
      '/cars.html?pickup=Konakli&pickup_date=2027-08-01'
    );
  });

  it('yalnızca tarih verilirse onu ekler', () => {
    expect(buildCarsUrl('', '2027-08-01', '')).toBe('/cars.html?pickup_date=2027-08-01');
  });

  it('statik dil rotasında /en/ önekini kullanır', () => {
    expect(buildCarsUrl('Alanya', '', 'en')).toBe('/en/cars.html?pickup=Alanya');
  });
});

describe('mergeBookingParams', () => {
  it('mevcut sorguyu (?id=) korur ve parametre ekler', () => {
    expect(mergeBookingParams('arac/renault-taliant.html', { pickup_date: '2027-08-01' })).toBe(
      'arac/renault-taliant.html?pickup_date=2027-08-01'
    );
  });

  it('var olan id parametresini korur', () => {
    const out = mergeBookingParams('/car-details.html?id=dacia-duster', {
      pickup: 'Konakli',
      pickup_date: '2027-08-01',
    });
    expect(out).toContain('id=dacia-duster');
    expect(out).toContain('pickup=Konakli');
    expect(out).toContain('pickup_date=2027-08-01');
  });

  it('idempotenttir (iki kez uygulama değeri çoğaltmaz)', () => {
    const once = mergeBookingParams('arac/x.html', { pickup_date: '2027-08-01' });
    const twice = mergeBookingParams(once, { pickup_date: '2027-08-01' });
    expect(twice).toBe(once);
  });

  it('boş değerleri eklemez', () => {
    expect(mergeBookingParams('arac/x.html', { pickup: '' })).toBe('arac/x.html');
  });
});

describe('pickupLabel', () => {
  it('kısa değeri hesaplayıcı seçeneğine çevirir', () => {
    expect(pickupLabel('Gazipasa')).toBe('Gazipaşa Havalimanı (GZP)');
    expect(pickupLabel('Alanya')).toBe('Alanya Merkez');
  });

  it('bilinmeyen değer için boş döndürür', () => {
    expect(pickupLabel('Bilinmeyen')).toBe('');
  });
});
