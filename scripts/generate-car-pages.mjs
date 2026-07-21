/**
 * Araç başına statik SEO sayfaları: dist/arac/<id>.html (TR) ve
 * dist/en/arac/<id>.html (EN). generate-en-pages.mjs SONRASI çalışır
 * (EN shell'i dist/en/cars.html'den devralır). Sitemap'i günceller.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE_URL, SITE_URL_TOKEN } from '../site.config.js';

const SITE = SITE_URL;
const DIST = fileURLToPath(new URL('../dist/', import.meta.url));

const cars = JSON.parse(readFileSync(new URL('../src/data/cars.json', import.meta.url), 'utf8'));

const L10N = {
  tr: {
    shellFile: 'cars.html',
    outDir: 'arac',
    htmlLang: 'tr',
    ogLocale: 'tr_TR',
    title: (c) => `${c.name} Kiralama | Alanya | ABS Rent A Car`,
    h1: (c) => `${c.name} Kiralama`,
    tagline: (c) => `${c.category} Sınıf · Günlük €${c.pricePerDay}'dan başlayan fiyatlarla`,
    desc: (c) => `${c.name} Alanya'da günlük €${c.pricePerDay}'dan kiralık. ${c.description}`.slice(0, 158),
    body: (c) => c.description,
    specsTitle: 'Teknik Özellikler',
    priceTitle: 'Fiyat Tablosu (Günlük)',
    specs: (c) => [
      ['Şanzıman', c.transmission],
      ['Yakıt Türü', c.fuel],
      ['Kapı Sayısı', c.doors],
      ['Koltuk Sayısı', c.passengers],
      ['Klima', c.ac ? 'Mevcut' : 'Mevcut Değil'],
      ['Bagaj', c.luggage],
    ],
    tiers: [
      ['1_3', '1 - 3 Gün'],
      ['4_7', '4 - 7 Gün'],
      ['8_14', '8 - 14 Gün'],
      ['15_21', '15 - 21 Gün'],
      ['22_29', '22 - 29 Gün'],
      ['30_plus', '30+ Gün'],
    ],
    included: 'Tüm fiyatlara muafiyetli kasko, sınırsız kilometre ve 7/24 yol yardımı dahildir. Ön ödeme gerekmez.',
    priceUnit: '/ günlük başlayan',
    waBtn: 'WhatsApp ile Rezervasyon',
    calcBtn: 'Tarih Seç &amp; Fiyat Hesapla',
    calcHref: (c) => `/car-details.html?id=${c.id}`,
    waMsg: (c) =>
      `Merhaba, ABS Rent A Car. ${c.name} aracını kiralamak istiyorum. Müsaitlik ve fiyat bilgisi alabilir miyim?`,
    imgAlt: (c) => `${c.name} kiralık araç`,
  },
  en: {
    shellFile: join('en', 'cars.html'),
    outDir: join('en', 'arac'),
    htmlLang: 'en',
    ogLocale: 'en_US',
    title: (c) => `${c.name} Rental | Alanya | ABS Rent A Car`,
    h1: (c) => `${c.name} Rental`,
    tagline: (c) => `${c.categoryEng} Class · From €${c.pricePerDay} per day`,
    desc: (c) => `Rent a ${c.name} in Alanya from €${c.pricePerDay}/day. ${c.descriptionEng}`.slice(0, 158),
    body: (c) => c.descriptionEng,
    specsTitle: 'Technical Specifications',
    priceTitle: 'Price List (Daily)',
    specs: (c) => [
      ['Transmission', c.transmissionEng],
      ['Fuel Type', c.fuelEng],
      ['Doors', c.doors],
      ['Passengers', c.passengers],
      ['Air Conditioning', c.ac ? 'Available' : 'Not Available'],
      ['Luggage', c.luggageEng],
    ],
    tiers: [
      ['1_3', '1 - 3 Days'],
      ['4_7', '4 - 7 Days'],
      ['8_14', '8 - 14 Days'],
      ['15_21', '15 - 21 Days'],
      ['22_29', '22 - 29 Days'],
      ['30_plus', '30+ Days'],
    ],
    included:
      'All prices include collision damage waiver, unlimited mileage and 24/7 roadside assistance. No prepayment required.',
    priceUnit: '/ daily starting',
    waBtn: 'Book via WhatsApp',
    calcBtn: 'Pick Dates &amp; Calculate Price',
    calcHref: (c) => `/en/car-details.html?id=${c.id}`,
    waMsg: (c) =>
      `Hello, ABS Rent A Car. I would like to rent the ${c.name}. Could you share availability and price details?`,
    imgAlt: (c) => `${c.name} rental car`,
  },
};

const pageUrl = (lang, c) => `${SITE}/${lang === 'en' ? 'en/arac' : 'arac'}/${c.id}.html`;

function buildShell(file) {
  const html = readFileSync(join(DIST, file), 'utf8');
  const abs = (s) =>
    s
      .replace(/href="index\.html"/g, 'href="/"')
      .replace(
        /href="((?:cars|car-details|transfer|about|contact|blog|legal|gazipasa-havalimani-arac-kiralama|antalya-havalimani-arac-kiralama|konakli-arac-kiralama)\.html[^"]*)"/g,
        'href="/$1"'
      )
      .replace(' class="active"', '');
  const shell = {
    assets: [...html.matchAll(/<link rel="stylesheet"[^>]*href="\/assets\/[^"]+"[^>]*>/g)]
      .map((m) => m[0])
      .join('\n  '),
    script: (html.match(/<script type="module"[^>]*src="\/assets\/[^"]+"[^>]*><\/script>/) || [''])[0],
    header: abs((html.match(/<header class="header">[\s\S]*?<\/header>/) || [''])[0]),
    footer: abs((html.match(/<footer class="footer">[\s\S]*?<\/footer>/) || [''])[0]),
  };
  if (!shell.assets || !shell.script || !shell.header || !shell.footer) {
    console.error(`şablon parçaları çıkarılamadı: ${file}`);
    process.exit(1);
  }
  return shell;
}

const specRow = (label, value) =>
  `<div class="table-row"><span class="label">${label}</span><span class="value">${value}</span></div>`;

function carPage(car, lang, shell) {
  const L = L10N[lang];
  const url = pageUrl(lang, car);
  const title = L.title(car);
  const desc = L.desc(car);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: title.split(' | ')[0],
    image: SITE + car.image,
    description: L.body(car),
    brand: { '@type': 'Brand', name: car.name.split(' ')[0] },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'EUR',
      price: car.pricePerDay,
      availability: 'https://schema.org/InStock',
    },
  };

  return `<!DOCTYPE html>
<html lang="${L.htmlLang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${desc}">
  ${shell.assets}
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="canonical" href="${url}">
  <link rel="alternate" hreflang="tr" href="${pageUrl('tr', car)}">
  <link rel="alternate" hreflang="en" href="${pageUrl('en', car)}">
  <link rel="alternate" hreflang="x-default" href="${pageUrl('tr', car)}">
  <meta property="og:site_name" content="ABS Rent A Car &amp; Transfer">
  <meta property="og:type" content="product">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
  <meta property="og:image" content="${SITE}${car.image}">
  <meta property="og:locale" content="${L.ogLocale}">
  <meta name="twitter:card" content="summary_large_image">
  <script defer src="/_vercel/insights/script.js"></script>
  <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
  </script>
</head>
<body>

  ${shell.header}

  <section class="page-banner" style="background-image: linear-gradient(to bottom, rgba(4, 4, 1, 0.85) 0%, rgba(4, 4, 1, 0.65) 100%), url('${car.image}');">
    <div class="container">
      <h1 style="font-size: clamp(2rem, 4vw, 3rem); color: #ffffff;">${L.h1(car)}</h1>
      <p style="margin-top: 10px; letter-spacing: 1px;">${L.tagline(car)}</p>
    </div>
  </section>

  <section class="section-padding">
    <div class="container details-layout">
      <div class="details-gallery">
        <div class="main-image-container" style="height: auto;">
          <img src="${car.image}" alt="${L.imgAlt(car)}" style="width: 100%; height: 400px; object-fit: contain; padding: 20px;">
        </div>
        <div class="details-content">
          <p style="font-size: 1.1rem; margin: 25px 0;">${L.body(car)}</p>

          <div class="price-table">
            <h2 class="price-table-title" style="font-size: 1.2rem;">${L.specsTitle}</h2>
            ${L.specs(car)
              .map(([k, v]) => specRow(k, v))
              .join('\n            ')}
          </div>

          <div class="price-table">
            <h2 class="price-table-title" style="font-size: 1.2rem;">${L.priceTitle}</h2>
            ${L.tiers.map(([k, label]) => specRow(label, '€' + car.prices[k])).join('\n            ')}
          </div>
        </div>
      </div>

      <div>
        <div class="booking-panel">
          <div class="price-tag-large">
            <span class="amount">€${car.pricePerDay}</span>
            <span class="price-unit">${L.priceUnit}</span>
          </div>
          <p style="margin-bottom: 25px;">${L.included}</p>
          <a href="https://api.whatsapp.com/send?phone=905323318418&amp;text=${encodeURIComponent(L.waMsg(car))}" target="_blank" rel="noopener" class="btn btn-whatsapp" style="width: 100%; margin-bottom: 12px;">${L.waBtn}</a>
          <a href="${L.calcHref(car)}" class="btn btn-secondary" style="width: 100%;">${L.calcBtn}</a>
        </div>
      </div>
    </div>
  </section>

  ${shell.footer}

  ${shell.script}
</body>
</html>
`;
}

for (const lang of ['tr', 'en']) {
  const shell = buildShell(L10N[lang].shellFile);
  const outDir = join(DIST, L10N[lang].outDir);
  mkdirSync(outDir, { recursive: true });
  for (const car of cars) {
    writeFileSync(join(outDir, `${car.id}.html`), carPage(car, lang, shell));
  }
  console.log(`${L10N[lang].outDir}/ altında ${cars.length} sayfa üretildi`);
}

/* Sitemap'e araç sayfalarını ekle */
const sitemapPath = join(DIST, 'sitemap.xml');
let sitemap = readFileSync(sitemapPath, 'utf8');
if (!sitemap.includes('/arac/')) {
  const entries = cars
    .flatMap((c) => [
      `  <url><loc>${pageUrl('tr', c)}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`,
      `  <url><loc>${pageUrl('en', c)}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`,
    ])
    .join('\n');
  sitemap = sitemap.replace('</urlset>', entries + '\n</urlset>');
  writeFileSync(sitemapPath, sitemap);
  console.log('sitemap.xml araç sayfalarıyla güncellendi');
}

/*
 * Son kontrol: build zincirinin sonunda dist içinde çözülmemiş __SITE_URL__
 * kalmamalı. Kalırsa canonical/og:url sessizce bozulur ve hiçbir test bunu
 * yakalamaz — bu yüzden build'i burada durduruyoruz.
 */
function scanForToken(dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...scanForToken(full));
    } else if (/\.(html|xml|txt|json)$/.test(entry.name)) {
      if (readFileSync(full, 'utf8').includes(SITE_URL_TOKEN)) found.push(full);
    }
  }
  return found;
}

const unresolved = scanForToken(DIST);
if (unresolved.length) {
  console.error(
    `HATA: ${unresolved.length} dosyada çözülmemiş ${SITE_URL_TOKEN} kaldı:\n` +
      unresolved.map((f) => '  ' + f.replace(DIST, '')).join('\n')
  );
  process.exit(1);
}
console.log(`site adresi çözüldü: ${SITE_URL}`);
