/**
 * Statik dil route üretimi: dist/en/, dist/de/, dist/ru/
 * Derlenmiş TR sayfalarına ilgili sözlüğü uygular, meta/başlık/canonical'ı
 * çevirir, iç linkleri dil öneki altına yönlendirir ve tüm dillere
 * hreflang çiftleri ekler. vite build SONRASI, araç sayfalarından ÖNCE çalışır.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { translations } from '../src/i18n/translations.js';

const SITE = 'https://abs-rentacar.vercel.app';
const DIST = fileURLToPath(new URL('../dist/', import.meta.url));

const PAGE_META = {
  'index.html': {
    en: ['ABS Rent A Car & Transfer | Alanya Car Rental', '24/7 car rental and airport transfer service in Alanya, Konakli and Gazipasa Airport regions at the best prices.'],
    de: ['ABS Rent A Car & Transfer | Autovermietung Alanya', 'Autovermietung und Flughafentransfer rund um die Uhr in Alanya, Konakli und am Flughafen Gazipasa zu Bestpreisen.'],
    ru: ['ABS Rent A Car & Transfer | Аренда авто в Алании', 'Круглосуточная аренда автомобилей и трансферы в Алании, Конаклы и аэропорту Газипаша по лучшим ценам.'],
  },
  'cars.html': {
    en: ['Rental Car Fleet | ABS Rent A Car', 'ABS Rent A Car full fleet: economy, SUV, commercial and convertible rental cars with transparent daily prices.'],
    de: ['Mietwagenflotte | ABS Rent A Car', 'Die komplette Flotte von ABS Rent A Car: Economy, SUV, Nutzfahrzeuge und Cabrios mit transparenten Tagespreisen.'],
    ru: ['Автопарк | ABS Rent A Car', 'Весь автопарк ABS Rent A Car: эконом, внедорожники, коммерческие авто и кабриолеты с прозрачными ценами.'],
  },
  'car-details.html': {
    en: ['Car Rental Details | ABS Rent A Car', 'Technical specifications, tiered daily prices and instant WhatsApp booking for our rental cars in Alanya.'],
    de: ['Mietwagen-Details | ABS Rent A Car', 'Technische Daten, gestaffelte Tagespreise und sofortige WhatsApp-Buchung für unsere Mietwagen in Alanya.'],
    ru: ['Детали аренды | ABS Rent A Car', 'Характеристики, гибкие суточные тарифы и мгновенное бронирование в WhatsApp для наших автомобилей в Алании.'],
  },
  'transfer.html': {
    en: ['Airport Transfer Services | ABS Rent A Car', 'VIP airport transfers between Gazipasa (GZP), Antalya (AYT) and Alanya/Konakli with professional drivers.'],
    de: ['Flughafentransfer | ABS Rent A Car', 'VIP-Flughafentransfers zwischen Gazipasa (GZP), Antalya (AYT) und Alanya/Konakli mit professionellen Fahrern.'],
    ru: ['Трансферы из аэропорта | ABS Rent A Car', 'VIP-трансферы между аэропортами Газипаша (GZP), Анталья (AYT) и Аланией/Конаклы с профессиональными водителями.'],
  },
  'about.html': {
    en: ['About Us | ABS Rent A Car', 'Serving Alanya since 2011: trusted car rental and transfer company with a fleet of 50+ maintained vehicles.'],
    de: ['Über uns | ABS Rent A Car', 'Seit 2011 in Alanya: zuverlässige Autovermietung und Transferfirma mit über 50 gepflegten Fahrzeugen.'],
    ru: ['О нас | ABS Rent A Car', 'Работаем в Алании с 2011 года: надёжная компания по аренде авто и трансферам с парком из 50+ автомобилей.'],
  },
  'contact.html': {
    en: ['Contact Us | ABS Rent A Car', 'ABS Rent A Car Konakli office: phone, WhatsApp, email, address, working hours and location map.'],
    de: ['Kontakt | ABS Rent A Car', 'ABS Rent A Car Büro Konakli: Telefon, WhatsApp, E-Mail, Adresse, Öffnungszeiten und Karte.'],
    ru: ['Контакты | ABS Rent A Car', 'Офис ABS Rent A Car в Конаклы: телефон, WhatsApp, email, адрес, часы работы и карта.'],
  },
};

const OG_LOCALE = { en: 'en_US', de: 'de_DE', ru: 'ru_RU' };
const LANGS = ['en', 'de', 'ru'];

const langUrl = (lang, page) => SITE + '/' + lang + '/' + (page === 'index.html' ? '' : page);
const trUrl = (page) => SITE + '/' + (page === 'index.html' ? '' : page);

function hreflangBlock(page) {
  const lines = [`  <link rel="alternate" hreflang="tr" href="${trUrl(page)}">`];
  for (const lang of LANGS) {
    lines.push(`  <link rel="alternate" hreflang="${lang}" href="${langUrl(lang, page)}">`);
  }
  lines.push(`  <link rel="alternate" hreflang="x-default" href="${trUrl(page)}">`);
  return lines.join('\n');
}

function applyDictionary(html, dict) {
  let missing = 0;

  html = html.replace(/<(input|textarea)\b([^>]*)data-i18n="([^"]+)"([^>]*)>/g, (m, tag, pre, key, post) => {
    const val = dict[key];
    if (!val) {
      missing++;
      return m;
    }
    const full = `<${tag}${pre}data-i18n="${key}"${post}>`;
    return full.replace(/placeholder="[^"]*"/, `placeholder="${val}"`);
  });

  html = html.replace(
    /<(h1|h2|h3|h4|p|span|a|button|label|option|div|li|ul)\b([^>]*data-i18n="([^"]+)"[^>]*)>([\s\S]*?)<\/\1>/g,
    (m, tag, attrs, key) => {
      const val = dict[key];
      if (!val) {
        missing++;
        return m;
      }
      return `<${tag}${attrs}>${val}</${tag}>`;
    }
  );

  return { html, missing };
}

for (const lang of LANGS) {
  mkdirSync(join(DIST, lang), { recursive: true });
}

let totalMissing = 0;

for (const page of Object.keys(PAGE_META)) {
  let trHtml = readFileSync(join(DIST, page), 'utf8');

  /* TR sayfasına hreflang bloğu ekle */
  if (!trHtml.includes('hreflang')) {
    trHtml = trHtml.replace('</head>', hreflangBlock(page) + '\n</head>');
    writeFileSync(join(DIST, page), trHtml);
  }

  for (const lang of LANGS) {
    const [title, desc] = PAGE_META[page][lang];
    let out = trHtml.replace('<html lang="tr">', `<html lang="${lang}">`);

    const dict = applyDictionary(out, translations[lang]);
    out = dict.html;
    totalMissing += dict.missing;

    out = out
      .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
      .replace(/(<meta name="description" content=")[^"]*(")/, `$1${desc}$2`)
      .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${title}$2`)
      .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${desc}$2`)
      .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${title}$2`)
      .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${desc}$2`)
      .replace('content="tr_TR"', `content="${OG_LOCALE[lang]}"`)
      .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${langUrl(lang, page)}">`);

    // Dil kapsamındaki sayfalara giden iç linkler aynı dilde kalsın
    out = out
      .replace(/href="index\.html"/g, `href="/${lang}/"`)
      .replace(/href="(cars|car-details|transfer|about|contact)\.html([^"]*)"/g, `href="/${lang}/$1.html$2"`);
    // Kapsam dışı sayfalar TR köküne mutlak gitsin
    out = out.replace(
      /href="((?:blog|legal|gazipasa-havalimani-arac-kiralama|antalya-havalimani-arac-kiralama|konakli-arac-kiralama)\.html[^"]*)"/g,
      'href="/$1"'
    );

    writeFileSync(join(DIST, lang, page), out);
  }
  console.log(`${page} -> en/de/ru üretildi`);
}

if (totalMissing) console.warn(`uyarı: ${totalMissing} data-i18n anahtarı sözlükte bulunamadı`);

/* Sitemap'e dil sayfalarını ekle */
const sitemapPath = join(DIST, 'sitemap.xml');
let sitemap = readFileSync(sitemapPath, 'utf8');
if (!sitemap.includes('/en/')) {
  const entries = Object.keys(PAGE_META)
    .flatMap((p) =>
      LANGS.map(
        (lang) =>
          `  <url><loc>${langUrl(lang, p)}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`
      )
    )
    .join('\n');
  sitemap = sitemap.replace('</urlset>', entries + '\n</urlset>');
  writeFileSync(sitemapPath, sitemap);
  console.log('sitemap.xml dil sayfalarıyla güncellendi');
}
