# ABS Rent A Car & Transfer

Alanya, Konaklı ve Gazipaşa/Antalya havalimanı bölgelerinde araç kiralama ve VIP transfer hizmeti sunan **ABS Rent A Car**'ın web sitesi.

**🌐 Canlı Site:** [abs-rentacar.vercel.app](https://abs-rentacar.vercel.app)

## Özellikler

- 🚗 **Araç filosu** — kategori sekmeleri (Sedan / SUV / Crossover), isim ve şanzıman filtreleri, Swiper tabanlı vitrin slider'ı
- 📄 **Araç detay sayfası** — teknik özellikler, kademeli fiyat tablosu (1-3 / 4-7 / 8-14 / 15-21 / 22-29 / 30+ gün), fotoğraf galerisi
- 💬 **WhatsApp rezervasyon** — seçilen araç, tarih ve lokasyonla hazır mesaj oluşturup WhatsApp'a yönlendirir; ön ödeme yok
- 🧮 **Dinamik fiyat hesaplayıcı** — tarih aralığına göre kademeli günlük fiyat ve tahmini toplamı anlık gösterir
- 🌍 **Çoklu dil** — TR/EN elle çeviri sözlüğü + 9 ek dil (DE, RU, FR, ES, IT, PT, NL, AR, ZH) için Google Translate entegrasyonu
- ✈️ **Transfer sayfası** — Gazipaşa (GZP) ve Antalya (AYT) havalimanı VIP transfer tarifeleri
- 📬 **İletişim formu** — 3 katmanlı spam koruması (honeypot, süre kontrolü, JS doğrulama) + Leaflet harita. Form verisi hazır bir mesaja dönüştürülüp WhatsApp'a aktarılır; sunucu tarafı yoktur. Bir e-posta servisi (Formspree vb.) bağlanmak istenirse formun `action` alanı doldurulur, kod o durumda AJAX gönderimine geçer
- 📊 **Google Sheets entegrasyonu (opsiyonel)** — fiyat ve müsaitlik bilgilerini yayınlanmış bir e-tablodan dinamik günceller
- 🍪 Çerez onay bandı, SSS akordeonu, YouTube tanıtım videosu modalı, akıllı tarih doğrulama

## Tasarım

Açık tema üzerine kurulu modern görsel kimlik:

- **Renkler:** `#FF3600` turuncu aksan · `#040401` koyu · `#FFF8F6` sıcak kırık beyaz · `#616161` gövde metni
- **Tipografi:** [Epilogue](https://fonts.google.com/specimen/Epilogue) (başlıklar) + [DM Sans](https://fonts.google.com/specimen/DM+Sans) (gövde)
- Pill (hap) formlu butonlar, yumuşak gölgeli beyaz kartlar, koyu footer/CTA blokları

## Teknoloji

| Katman | Araç |
|---|---|
| Build | [Vite 8](https://vitejs.dev) — çok sayfalı yapı (12 giriş noktası) |
| Frontend | Vanilla JS (framework yok), Swiper 14, Leaflet 1.9 |
| Barındırma | [Vercel](https://vercel.com) — `main` dalına push ile otomatik deploy |
| Veri | `src/data/cars.json` + opsiyonel Google Sheets CSV |
| Kalite | Vitest (birim), Playwright + axe-core (E2E/erişilebilirlik), ESLint, Lighthouse CI |

## Geliştirme

```bash
npm install        # bağımlılıkları kur
npm run dev        # geliştirme sunucusu (localhost:5173)
npm run build      # production build (dist/)
npm run preview    # build'i yerelde önizle

npm test           # birim testler (Vitest)
npm run test:e2e   # E2E + erişilebilirlik testleri (Playwright)
npm run lint       # ESLint
```

## Site Adresi (SITE_URL)

Kanonik site adresi **yalnızca `site.config.js`** içinde tanımlıdır. HTML dosyaları,
`robots.txt` ve `sitemap.xml` bu adresi doğrudan yazmaz; `__SITE_URL__` yer tutucusunu
kullanır ve `vite.config.js` içindeki eklenti bunu build (ve dev) sırasında değiştirir.
Üretim scriptleri de aynı dosyadan import eder.

Özel domain bağlandığında değiştirilecek tek yer:

```js
// site.config.js
export const SITE_URL = 'https://yeni-domain.com';   // sondaki / olmadan
```

Build'in son adımı `dist` içinde çözülmemiş `__SITE_URL__` kalıp kalmadığını denetler;
kalırsa build başarısız olur.

## Proje Yapısı

```
├── index.html                          # Ana sayfa
├── cars.html                           # Araç listesi + filtreler
├── car-details.html                    # Araç detayı (?id= parametresiyle)
├── transfer.html                       # Havalimanı transfer hizmetleri
├── about.html                          # Hakkımızda
├── contact.html                        # İletişim formu + harita
├── blog.html                           # Blog / rehber yazıları
├── legal.html                          # KVKK, gizlilik, foto kaynakları
├── 404.html                            # Bulunamadı sayfası
├── *-arac-kiralama.html                # SEO landing (Antalya, Gazipaşa, Konaklı)
├── site.config.js                      # SITE_URL — kanonik adres, tek kaynak
├── src/
│   ├── main.js                         # Tüm site mantığı (i18n, render, rezervasyon)
│   ├── sheets.js                       # Google Sheets dinamik veri modülü
│   ├── i18n/translations.js            # TR/EN/DE/RU sözlükleri
│   ├── lib/                            # pricing.js, filters.js (birim testli)
│   ├── data/cars.json                  # Araç verileri (TR/EN)
│   └── css/                            # style.css (tasarım sistemi) + animations.css
├── scripts/
│   ├── generate-en-pages.mjs           # /en/, /de/, /ru/ statik dil route'ları
│   ├── generate-car-pages.mjs          # /arac/<id>.html statik SEO sayfaları
│   ├── validate-cars.mjs               # cars.json şema doğrulaması
│   └── check-links.mjs                 # canlı site link/kaynak taraması
├── tests/                              # Vitest birim + Playwright E2E
├── vercel.json                         # Güvenlik başlıkları (CSP, HSTS vb.)
└── vite.config.js                      # Çok sayfalı build + SITE_URL eklentisi
```

Build zinciri: `validate-cars` → `vite build` → `generate-en-pages` → `generate-car-pages`.
`/en/`, `/de/`, `/ru/` ve `/arac/` altındaki sayfalar depoda tutulmaz, build sırasında üretilir.
