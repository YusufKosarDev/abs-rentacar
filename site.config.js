/**
 * Sitenin kanonik kök adresi — TEK KAYNAK.
 *
 * HTML dosyaları, robots.txt ve sitemap.xml bu değeri doğrudan yazmaz;
 * `__SITE_URL__` yer tutucusunu kullanır ve vite.config.js içindeki
 * siteUrl() eklentisi bunu build/dev sırasında burada tanımlı değerle
 * değiştirir. Üretim scriptleri de bu dosyadan import eder.
 *
 * Özel domain bağlandığında DEĞİŞTİRİLECEK TEK YER burasıdır.
 * Sondaki eğik çizgi (/) olmamalı.
 */
export const SITE_URL = 'https://abs-rentacar.vercel.app';

/** HTML/metin dosyalarında değiştirilen yer tutucu. */
export const SITE_URL_TOKEN = '__SITE_URL__';
