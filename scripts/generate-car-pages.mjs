/**
 * Araç başına statik SEO sayfası üretir: dist/arac/<id>.html
 * vite build SONRASI çalışır; header/footer ve asset etiketlerini
 * derlenmiş dist/cars.html'den devralır, sitemap'i günceller.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = 'https://abs-rentacar.vercel.app';
const DIST = fileURLToPath(new URL('../dist/', import.meta.url));

const cars = JSON.parse(readFileSync(new URL('../src/data/cars.json', import.meta.url), 'utf8'));
const shell = readFileSync(join(DIST, 'cars.html'), 'utf8');

/* Derlenmiş sayfadan asset etiketlerini ve header/footer'ı devral */
const assetLinks = [...shell.matchAll(/<link rel="stylesheet"[^>]*href="\/assets\/[^"]+"[^>]*>/g)]
  .map((m) => m[0])
  .join('\n  ');
const scriptTag = (shell.match(/<script type="module"[^>]*src="\/assets\/[^"]+"[^>]*><\/script>/) || [''])[0];

function absolutize(html) {
  // Kök sayfa linklerini /arac/ altından da çalışır hale getir
  return html
    .replace(/href="index\.html"/g, 'href="/"')
    .replace(
      /href="((?:cars|car-details|transfer|about|contact|blog|legal|gazipasa-havalimani-arac-kiralama|antalya-havalimani-arac-kiralama|konakli-arac-kiralama)\.html[^"]*)"/g,
      'href="/$1"'
    )
    .replace(' class="active"', '');
}

const header = absolutize((shell.match(/<header class="header">[\s\S]*?<\/header>/) || [''])[0]);
const footer = absolutize((shell.match(/<footer class="footer">[\s\S]*?<\/footer>/) || [''])[0]);

if (!header || !footer || !assetLinks || !scriptTag) {
  console.error('dist/cars.html içinden şablon parçaları çıkarılamadı');
  process.exit(1);
}

const specRow = (label, value) =>
  `<div class="table-row"><span class="label">${label}</span><span class="value">${value}</span></div>`;

const TIER_LABELS = [
  ['1_3', '1 - 3 Gün'],
  ['4_7', '4 - 7 Gün'],
  ['8_14', '8 - 14 Gün'],
  ['15_21', '15 - 21 Gün'],
  ['22_29', '22 - 29 Gün'],
  ['30_plus', '30+ Gün'],
];

function carPage(car) {
  const url = `${SITE}/arac/${car.id}.html`;
  const title = `${car.name} Kiralama | Alanya | ABS Rent A Car`;
  const desc = `${car.name} Alanya'da günlük €${car.pricePerDay}'dan kiralık. ${car.description}`.slice(0, 158);
  const waText = encodeURIComponent(
    `Merhaba, ABS Rent A Car. ${car.name} aracını kiralamak istiyorum. Müsaitlik ve fiyat bilgisi alabilir miyim?`
  );

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${car.name} Kiralama`,
    image: SITE + car.image,
    description: car.description,
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
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${desc}">
  ${assetLinks}
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="canonical" href="${url}">
  <meta property="og:site_name" content="ABS Rent A Car &amp; Transfer">
  <meta property="og:type" content="product">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
  <meta property="og:image" content="${SITE}${car.image}">
  <meta property="og:locale" content="tr_TR">
  <meta name="twitter:card" content="summary_large_image">
  <script defer src="/_vercel/insights/script.js"></script>
  <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
  </script>
</head>
<body>

  ${header}

  <section class="page-banner" style="background-image: linear-gradient(to bottom, rgba(4, 4, 1, 0.85) 0%, rgba(4, 4, 1, 0.65) 100%), url('${car.image}');">
    <div class="container">
      <h1 style="font-size: clamp(2rem, 4vw, 3rem); color: #ffffff;">${car.name} Kiralama</h1>
      <p style="margin-top: 10px; letter-spacing: 1px;">${car.category} Sınıf · Günlük €${car.pricePerDay}'dan başlayan fiyatlarla</p>
    </div>
  </section>

  <section class="section-padding">
    <div class="container details-layout">
      <div class="details-gallery">
        <div class="main-image-container" style="height: auto;">
          <img src="${car.image}" alt="${car.name} kiralık araç" style="width: 100%; height: 400px; object-fit: contain; padding: 20px;">
        </div>
        <div class="details-content">
          <p style="font-size: 1.1rem; margin: 25px 0;">${car.description}</p>

          <div class="price-table">
            <h2 class="price-table-title" style="font-size: 1.2rem;">Teknik Özellikler</h2>
            ${specRow('Şanzıman', car.transmission)}
            ${specRow('Yakıt Türü', car.fuel)}
            ${specRow('Kapı Sayısı', car.doors)}
            ${specRow('Koltuk Sayısı', car.passengers)}
            ${specRow('Klima', car.ac ? 'Mevcut' : 'Mevcut Değil')}
            ${specRow('Bagaj', car.luggage)}
          </div>

          <div class="price-table">
            <h2 class="price-table-title" style="font-size: 1.2rem;">Fiyat Tablosu (Günlük)</h2>
            ${TIER_LABELS.map(([k, label]) => specRow(label, '€' + car.prices[k])).join('\n            ')}
          </div>
        </div>
      </div>

      <div>
        <div class="booking-panel">
          <div class="price-tag-large">
            <span class="amount">€${car.pricePerDay}</span>
            <span class="price-unit">/ günlük başlayan</span>
          </div>
          <p style="margin-bottom: 25px;">Tüm fiyatlara muafiyetli kasko, sınırsız kilometre ve 7/24 yol yardımı dahildir. Ön ödeme gerekmez.</p>
          <a href="https://api.whatsapp.com/send?phone=905323318418&amp;text=${waText}" target="_blank" rel="noopener" class="btn btn-whatsapp" style="width: 100%; margin-bottom: 12px;">WhatsApp ile Rezervasyon</a>
          <a href="/car-details.html?id=${car.id}" class="btn btn-secondary" style="width: 100%;">Tarih Seç &amp; Fiyat Hesapla</a>
        </div>
      </div>
    </div>
  </section>

  ${footer}

  ${scriptTag}
</body>
</html>
`;
}

mkdirSync(join(DIST, 'arac'), { recursive: true });
for (const car of cars) {
  writeFileSync(join(DIST, 'arac', `${car.id}.html`), carPage(car));
}
console.log(`arac/ altında ${cars.length} statik araç sayfası üretildi`);

/* Sitemap'e araç sayfalarını ekle */
const sitemapPath = join(DIST, 'sitemap.xml');
let sitemap = readFileSync(sitemapPath, 'utf8');
if (!sitemap.includes('/arac/')) {
  const entries = cars
    .map(
      (c) =>
        `  <url><loc>${SITE}/arac/${c.id}.html</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`
    )
    .join('\n');
  sitemap = sitemap.replace('</urlset>', entries + '\n</urlset>');
  writeFileSync(sitemapPath, sitemap);
  console.log('sitemap.xml araç sayfalarıyla güncellendi');
}
