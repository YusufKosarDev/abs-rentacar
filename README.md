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
- 📬 **İletişim formu** — Formspree entegrasyonu + 3 katmanlı spam koruması (honeypot, süre kontrolü, JS doğrulama), Leaflet harita
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
| Build | [Vite 5](https://vitejs.dev) — çok sayfalı yapı (6 giriş noktası) |
| Frontend | Vanilla JS (framework yok), Swiper 11, Leaflet 1.9 |
| Barındırma | [Vercel](https://vercel.com) — `main` dalına push ile otomatik deploy |
| Veri | `src/data/cars.json` + opsiyonel Google Sheets CSV |

## Geliştirme

```bash
npm install        # bağımlılıkları kur
npm run dev        # geliştirme sunucusu (localhost:5173)
npm run build      # production build (dist/)
npm run preview    # build'i yerelde önizle
```

## Proje Yapısı

```
├── index.html            # Ana sayfa
├── cars.html             # Araç listesi + filtreler
├── car-details.html      # Araç detayı (?id= parametresiyle)
├── transfer.html         # Havalimanı transfer hizmetleri
├── about.html            # Hakkımızda
├── contact.html          # İletişim formu + harita
├── src/
│   ├── main.js           # Tüm site mantığı (i18n, render, rezervasyon)
│   ├── sheets.js         # Google Sheets dinamik veri modülü
│   ├── data/cars.json    # Araç verileri (TR/EN)
│   └── css/              # style.css (tasarım sistemi) + animations.css
├── vercel.json           # Güvenlik başlıkları (CSP, HSTS vb.)
└── vite.config.js        # Çok sayfalı build ayarı
```
