/**
 * Kademeli fiyatlandırma mantığı (saf fonksiyonlar — birim testli)
 */

/** Gün sayısına göre geçerli günlük tarifeyi döndürür */
export function getDailyRate(prices, days) {
  if (days >= 30) return prices['30_plus'];
  if (days >= 22) return prices['22_29'];
  if (days >= 15) return prices['15_21'];
  if (days >= 8) return prices['8_14'];
  if (days >= 4) return prices['4_7'];
  return prices['1_3'];
}

/** İki tarih (YYYY-MM-DD) arasındaki kiralama gün sayısı */
export function calcRentalDays(pickupDate, returnDate) {
  return Math.ceil((new Date(returnDate) - new Date(pickupDate)) / (1000 * 60 * 60 * 24));
}

/** Gün sayısı için günlük tarife + toplam tutar */
export function calcTotal(prices, days) {
  const dailyRate = getDailyRate(prices, days);
  return { dailyRate, total: dailyRate * days };
}
