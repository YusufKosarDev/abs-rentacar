/**
 * cars.json şema doğrulaması — build öncesi ve CI'da çalışır.
 * Eksik alan, hatalı tip veya eksik fiyat kademesi bulursa 1 koduyla çıkar.
 */
import { readFileSync } from 'node:fs';

const cars = JSON.parse(readFileSync(new URL('../src/data/cars.json', import.meta.url), 'utf8'));

const STRING_FIELDS = [
  'id',
  'name',
  'category',
  'categoryEng',
  'type',
  'typeEng',
  'transmission',
  'transmissionEng',
  'fuel',
  'fuelEng',
  'luggage',
  'luggageEng',
  'image',
  'description',
  'descriptionEng',
];
const NUMBER_FIELDS = ['doors', 'passengers', 'pricePerDay'];
const PRICE_TIERS = ['1_3', '4_7', '8_14', '15_21', '22_29', '30_plus'];
const VALID_TYPES = ['Sedan', 'SUV', 'Crossover', 'Hatchback', 'Ticari', 'Cabrio'];
const VALID_TRANSMISSIONS = ['Manuel', 'Otomatik'];

const errors = [];
const seenIds = new Set();

if (!Array.isArray(cars) || cars.length === 0) {
  console.error('cars.json boş veya dizi değil');
  process.exit(1);
}

for (const car of cars) {
  const where = car.id || car.name || '(kimliksiz araç)';

  for (const field of STRING_FIELDS) {
    if (typeof car[field] !== 'string' || car[field].trim() === '') {
      errors.push(`${where}: "${field}" alanı eksik veya boş`);
    }
  }
  for (const field of NUMBER_FIELDS) {
    if (typeof car[field] !== 'number' || car[field] <= 0) {
      errors.push(`${where}: "${field}" pozitif sayı olmalı`);
    }
  }
  if (typeof car.ac !== 'boolean') {
    errors.push(`${where}: "ac" boolean olmalı`);
  }

  if (seenIds.has(car.id)) errors.push(`${where}: id tekrar ediyor`);
  seenIds.add(car.id);

  if (car.type && !VALID_TYPES.includes(car.type)) {
    errors.push(`${where}: type "${car.type}" geçersiz (sekmelerle eşleşmez)`);
  }
  if (car.transmission && !VALID_TRANSMISSIONS.includes(car.transmission)) {
    errors.push(`${where}: transmission "${car.transmission}" geçersiz (filtreyle eşleşmez)`);
  }

  if (!car.prices || typeof car.prices !== 'object') {
    errors.push(`${where}: "prices" nesnesi eksik`);
  } else {
    for (const tier of PRICE_TIERS) {
      if (typeof car.prices[tier] !== 'number' || car.prices[tier] <= 0) {
        errors.push(`${where}: fiyat kademesi "${tier}" eksik veya geçersiz`);
      }
    }
  }

  if (!Array.isArray(car.images) || car.images.length === 0) {
    errors.push(`${where}: "images" boş`);
  }
  if (car.image && !car.image.startsWith('/images/cars/')) {
    errors.push(`${where}: görsel yerel değil (${car.image})`);
  }
}

if (errors.length) {
  console.error(`cars.json doğrulaması BAŞARISIZ (${errors.length} hata):`);
  for (const e of errors) console.error(' - ' + e);
  process.exit(1);
}
console.log(`cars.json doğrulandı: ${cars.length} araç, hata yok ✓`);
