/**
 * İngilizce statik route üretimi: dist/en/<sayfa>.html
 * Derlenmiş TR sayfalarına EN sözlüğünü uygular, meta/başlık/canonical'ı
 * çevirir, iç linkleri /en/ altına yönlendirir ve her iki dile hreflang
 * çiftleri ekler. vite build SONRASI, araç sayfası üretiminden ÖNCE çalışır.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { translations } from '../src/i18n/translations.js';

const SITE = 'https://abs-rentacar.vercel.app';
const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const EN = translations.en;

const PAGES = {
  'index.html': {
    title: 'ABS Rent A Car & Transfer | Alanya Car Rental',
    desc: '24/7 car rental and airport transfer service in Alanya, Konakli and Gazipasa Airport regions at the best prices.',
  },
  'cars.html': {
    title: 'Rental Car Fleet | ABS Rent A Car',
    desc: 'ABS Rent A Car full fleet: economy, SUV, commercial and convertible rental cars with transparent daily prices.',
  },
  'car-details.html': {
    title: 'Car Rental Details | ABS Rent A Car',
    desc: 'Technical specifications, tiered daily prices and instant WhatsApp booking for our rental cars in Alanya.',
  },
  'transfer.html': {
    title: 'Airport Transfer Services | ABS Rent A Car',
    desc: 'VIP airport transfers between Gazipasa (GZP), Antalya (AYT) and Alanya/Konakli with professional drivers.',
  },
  'about.html': {
    title: 'About Us | ABS Rent A Car',
    desc: 'Serving Alanya since 2011: trusted car rental and transfer company with a fleet of 50+ maintained vehicles.',
  },
  'contact.html': {
    title: 'Contact Us | ABS Rent A Car',
    desc: 'ABS Rent A Car Konakli office: phone, WhatsApp, email, address, working hours and location map.',
  },
};

const enUrl = (page) => SITE + '/en/' + (page === 'index.html' ? '' : page);
const trUrl = (page) => SITE + '/' + (page === 'index.html' ? '' : page);

function hreflangBlock(page) {
  return [
    `  <link rel="alternate" hreflang="tr" href="${trUrl(page)}">`,
    `  <link rel="alternate" hreflang="en" href="${enUrl(page)}">`,
    `  <link rel="alternate" hreflang="x-default" href="${trUrl(page)}">`,
  ].join('\n');
}

/** data-i18n etiketli elemanların içeriğini/placeholder'ını EN ile değiştir */
function applyDictionary(html) {
  let missing = 0;

  // input/textarea: placeholder değişimi
  html = html.replace(/<(input|textarea)\b([^>]*)data-i18n="([^"]+)"([^>]*)>/g, (m, tag, pre, key, post) => {
    const val = EN[key];
    if (!val) {
      missing++;
      return m;
    }
    const full = `<${tag}${pre}data-i18n="${key}"${post}>`;
    return full.replace(/placeholder="[^"]*"/, `placeholder="${val}"`);
  });

  // çift etiketli elemanlar (aynı etiketin iç içe geçmediği yaprak düğümler)
  html = html.replace(
    /<(h1|h2|h3|h4|p|span|a|button|label|option|div|li|ul)\b([^>]*data-i18n="([^"]+)"[^>]*)>([\s\S]*?)<\/\1>/g,
    (m, tag, attrs, key) => {
      const val = EN[key];
      if (!val) {
        missing++;
        return m;
      }
      return `<${tag}${attrs}>${val}</${tag}>`;
    }
  );

  return { html, missing };
}

mkdirSync(join(DIST, 'en'), { recursive: true });
let totalMissing = 0;

for (const [page, meta] of Object.entries(PAGES)) {
  let html = readFileSync(join(DIST, page), 'utf8');

  /* 1) TR sayfasına hreflang ekle (dist içinde) */
  if (!html.includes('hreflang')) {
    html = html.replace('</head>', hreflangBlock(page) + '\n</head>');
    writeFileSync(join(DIST, page), html);
  }

  /* 2) EN varyantını üret */
  let en = html.replace('<html lang="tr">', '<html lang="en">');

  const dict = applyDictionary(en);
  en = dict.html;
  totalMissing += dict.missing;

  // başlık + meta
  en = en
    .replace(/<title>[^<]*<\/title>/, `<title>${meta.title}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${meta.desc}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${meta.title}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${meta.desc}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${meta.title}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${meta.desc}$2`)
    .replace('content="tr_TR"', 'content="en_US"')
    .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${enUrl(page)}">`);

  // EN kapsamındaki sayfalara giden iç linkleri /en/ altına çevir
  en = en
    .replace(/href="index\.html"/g, 'href="/en/"')
    .replace(/href="(cars|car-details|transfer|about|contact)\.html([^"]*)"/g, 'href="/en/$1.html$2"');
  // EN kapsamı dışındaki sayfalar kök TR sürümüne mutlak gitsin
  en = en.replace(
    /href="((?:blog|legal|gazipasa-havalimani-arac-kiralama|antalya-havalimani-arac-kiralama|konakli-arac-kiralama)\.html[^"]*)"/g,
    'href="/$1"'
  );

  writeFileSync(join(DIST, 'en', page), en);
  console.log(`en/${page} üretildi`);
}

if (totalMissing) console.warn(`uyarı: ${totalMissing} data-i18n anahtarı sözlükte bulunamadı`);

/* Sitemap'e EN sayfalarını ekle */
const sitemapPath = join(DIST, 'sitemap.xml');
let sitemap = readFileSync(sitemapPath, 'utf8');
if (!sitemap.includes('/en/')) {
  const entries = Object.keys(PAGES)
    .map((p) => `  <url><loc>${enUrl(p)}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`)
    .join('\n');
  sitemap = sitemap.replace('</urlset>', entries + '\n</urlset>');
  writeFileSync(sitemapPath, sitemap);
  console.log('sitemap.xml EN sayfalarıyla güncellendi');
}
