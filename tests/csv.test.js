import { describe, it, expect } from 'vitest';
import { parseCSV } from '../src/sheets.js';

describe('parseCSV', () => {
  it('başlık satırını alan adlarına çevirir', () => {
    const rows = parseCSV('id,pricePerDay\nrenault-taliant,35');
    expect(rows).toEqual([{ id: 'renault-taliant', pricePerDay: '35' }]);
  });

  it('tırnaklı değerleri temizler', () => {
    const rows = parseCSV('"id","pricePerDay"\n"dacia-duster","42"');
    expect(rows[0].id).toBe('dacia-duster');
    expect(rows[0].pricePerDay).toBe('42');
  });

  it('birden çok satırı işler', () => {
    const rows = parseCSV('id,available\na,TRUE\nb,FALSE\nc,TRUE');
    expect(rows).toHaveLength(3);
    expect(rows[1].available).toBe('FALSE');
  });

  it('yalnızca başlık varsa null döner', () => {
    expect(parseCSV('id,pricePerDay')).toBeNull();
  });
});
