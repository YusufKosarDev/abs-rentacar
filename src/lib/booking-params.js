/**
 * Ana sayfa hızlı sorgulama formundan gelen alış bilgisini (lokasyon + tarih)
 * araç sayfaları ve fiyat hesaplayıcı arasında taşımak için saf yardımcılar.
 * DOM'a dokunmaz; birim testlerle doğrulanır.
 */

/**
 * Ana sayfa formundaki kısa lokasyon değeri (option value) -> car-details.html
 * hesaplayıcısındaki lokasyon seçeneği (option value). Eşleme dilden bağımsızdır
 * (car-details değerleri sabittir).
 */
export const PICKUP_LABELS = {
  Alanya: 'Alanya Merkez',
  Konakli: 'Konaklı Otelleri',
  Gazipasa: 'Gazipaşa Havalimanı (GZP)',
  Antalya: 'Antalya Havalimanı (AYT)',
};

/**
 * Araç listesi (cars.html) URL'sini alış bilgisiyle kurar.
 * @param {string} pickup kısa lokasyon değeri (ör. "Konakli")
 * @param {string} pickupDate ISO tarih (ör. "2027-08-01")
 * @param {string} routeLang statik dil rotası (ör. "en") ya da boş
 */
export function buildCarsUrl(pickup, pickupDate, routeLang) {
  const base = routeLang ? `/${routeLang}/cars.html` : '/cars.html';
  const params = new URLSearchParams();
  if (pickup) params.set('pickup', pickup);
  if (pickupDate) params.set('pickup_date', pickupDate);
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

/**
 * Bir bağlantının href'ine alış parametrelerini ekler/günceller; mevcut sorgu
 * (ör. ?id=...) ve göreli yol korunur. İdempotenttir (aynı değerleri set eder).
 */
export function mergeBookingParams(href, params) {
  const [path, existing] = href.split('?');
  const search = new URLSearchParams(existing || '');
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

/** Kısa lokasyon değerini hesaplayıcı seçeneği değerine çevirir; bilinmiyorsa ''. */
export function pickupLabel(code) {
  return PICKUP_LABELS[code] || '';
}
