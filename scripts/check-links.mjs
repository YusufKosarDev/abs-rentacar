/**
 * Canlı site sağlık taraması: sayfalar, iç linkler, yerel araç görselleri
 * ve dış kaynakların erişilebilirliğini kontrol eder.
 * Kırık kaynak bulunursa 1 koduyla çıkar (CI'da işi kırmızıya düşürür).
 */
import { readFileSync } from 'node:fs';
import { SITE_URL } from '../site.config.js';

const SITE = process.env.SITE_URL || SITE_URL;

const pages = [
  '/',
  '/cars.html',
  '/car-details.html',
  '/transfer.html',
  '/about.html',
  '/contact.html',
  '/blog.html',
  '/legal.html',
  '/gazipasa-havalimani-arac-kiralama.html',
  '/antalya-havalimani-arac-kiralama.html',
  '/konakli-arac-kiralama.html',
  '/favicon.svg',
  '/robots.txt',
  '/sitemap.xml',
  ...['en', 'de', 'ru'].flatMap((lang) => [
    `/${lang}/`,
    `/${lang}/cars.html`,
    `/${lang}/car-details.html`,
    `/${lang}/transfer.html`,
    `/${lang}/about.html`,
    `/${lang}/contact.html`,
  ]),
];

async function status(url, method = 'GET') {
  try {
    const res = await fetch(url, { method, redirect: 'manual' });
    return res.status;
  } catch (err) {
    return 'HATA: ' + err.message.slice(0, 60);
  }
}

const problems = [];
const internalLinks = new Set();
const externalAssets = new Set();

for (const page of pages) {
  const url = SITE + page;
  const res = await fetch(url).catch(() => null);
  if (!res || res.status !== 200) {
    problems.push(`SAYFA ${page} -> ${res ? res.status : 'ERİŞİLEMEDİ'}`);
    continue;
  }
  if (/\.(svg|txt|xml)$/.test(page)) continue;

  const html = await res.text();
  for (const m of html.matchAll(/href="([^"#]+)"/g)) {
    const href = m[1];
    if (/^(https?:|tel:|mailto:|\/src|\/assets)/.test(href)) continue;
    internalLinks.add(href.split('#')[0].split('?')[0]);
  }
  // Kendi domainimiz dışında kalan, dosya uzantısıyla biten tüm mutlak adresler:
  // gömülü kaynaklar (Leaflet CDN) ve legal.html'deki Wikimedia atıf bağlantıları.
  // Önceki dar desen (yalnızca images.* ana makinesi) hotlink edilen bir görselin
  // fark edilmeden kalmasına yol açıyordu; kapsam bilinçli olarak geniş tutuluyor.
  // Atıf bağlantılarının da taranması istenen bir yan etki: ölü bir atıf linki
  // CC lisans şartlarının ihlali anlamına gelir.
  for (const m of html.matchAll(/(?:src|href|content)="(https:\/\/[^"]+)"/g)) {
    const asset = m[1];
    if (asset.startsWith(SITE)) continue;
    if (!/\.(png|jpe?g|webp|avif|gif|svg|js|css)(\?|$)/i.test(asset)) continue;
    externalAssets.add(asset);
  }
}

internalLinks.delete('');
for (const link of internalLinks) {
  const url = link.startsWith('/') ? SITE + link : `${SITE}/${link}`;
  const code = await status(url);
  if (code !== 200) problems.push(`İÇ LİNK ${link} -> ${code}`);
}

// cars.json'daki tüm yerel araç görselleri ve statik araç sayfaları
const cars = JSON.parse(readFileSync(new URL('../src/data/cars.json', import.meta.url), 'utf8'));
for (const car of cars) {
  const imgCode = await status(SITE + car.image);
  if (imgCode !== 200) problems.push(`ARAÇ GÖRSELİ ${car.image} -> ${imgCode}`);
  const pageCode = await status(`${SITE}/arac/${car.id}.html`);
  if (pageCode !== 200) problems.push(`ARAÇ SAYFASI /arac/${car.id}.html -> ${pageCode}`);
  const enCode = await status(`${SITE}/en/arac/${car.id}.html`);
  if (enCode !== 200) problems.push(`EN ARAÇ SAYFASI /en/arac/${car.id}.html -> ${enCode}`);
}

for (const asset of externalAssets) {
  const code = await status(asset, 'HEAD');
  if (code !== 200) problems.push(`DIŞ ADRES ${asset.slice(0, 80)} -> ${code}`);
}

console.log(
  `Tarama: ${pages.length} sayfa, ${internalLinks.size} iç link, ${cars.length} araç görseli, ${externalAssets.size} dış adres`
);

if (problems.length) {
  console.error('KIRIK KAYNAKLAR:\n' + problems.join('\n'));
  process.exit(1);
}
console.log('Tüm kaynaklar sağlıklı ✓');
