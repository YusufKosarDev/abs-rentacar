/**
 * Google Sheets Dynamic Data Integration
 * 
 * Bu modül, araç fiyatlarını ve müsaitlik durumlarını
 * Google E-Tablosu üzerinden dinamik olarak güncellemenizi sağlar.
 * 
 * KURULUM:
 * 1. Google Sheets'te aşağıdaki sütunlarla bir tablo oluşturun:
 *    id | pricePerDay | 1_3 | 4_7 | 8_14 | 15_21 | 22_29 | 30_plus | available
 * 
 * 2. Tabloyu yayınlayın: Dosya > Paylaş > Web'de yayınla > Tüm doküman > CSV
 * 
 * 3. Aşağıdaki GOOGLE_SHEET_ID değerini Sheet ID'nizle değiştirin.
 *    Sheet URL'si: https://docs.google.com/spreadsheets/d/BURAYA_SHEET_ID/edit
 */

// ===== AYAR: Sheet ID'nizi buraya girin =====
const GOOGLE_SHEET_ID = '';
// =============================================

/**
 * Google Sheets'ten CSV verisini çeker ve JSON'a dönüştürür
 * @returns {Array|null} Parsed rows or null on failure
 */
async function fetchSheetData() {
  if (!GOOGLE_SHEET_ID) return null;

  const url = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:csv`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const csvText = await response.text();
    return parseCSV(csvText);
  } catch (error) {
    console.warn('[Google Sheets] Bağlantı kurulamadı, yerel veriler kullanılıyor:', error.message);
    return null;
  }
}

/**
 * CSV string'i JSON dizisine çevirir
 */
function parseCSV(csv) {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return null;

  // İlk satır header
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

  return lines.slice(1).map(line => {
    const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
    const row = {};
    headers.forEach((header, i) => {
      let val = (values[i] || '').replace(/"/g, '').trim();
      row[header] = val;
    });
    return row;
  });
}

/**
 * Google Sheets verisini yerel carsData ile birleştirir
 * Sadece fiyat ve müsaitlik alanlarını günceller
 */
function mergeSheetData(carsData, sheetRows) {
  if (!sheetRows || sheetRows.length === 0) return carsData;

  return carsData.map(car => {
    const sheetRow = sheetRows.find(r => r.id === car.id);
    if (!sheetRow) return car;

    const updatedCar = { ...car };

    // Fiyat güncelleme
    if (sheetRow.pricePerDay && !isNaN(sheetRow.pricePerDay)) {
      updatedCar.pricePerDay = parseInt(sheetRow.pricePerDay, 10);
    }

    // Kademeli fiyat güncelleme
    const priceKeys = ['1_3', '4_7', '8_14', '15_21', '22_29', '30_plus'];
    priceKeys.forEach(key => {
      if (sheetRow[key] && !isNaN(sheetRow[key])) {
        updatedCar.prices[key] = parseInt(sheetRow[key], 10);
      }
    });

    // Müsaitlik durumu (opsiyonel)
    if (sheetRow.available !== undefined && sheetRow.available !== '') {
      updatedCar.available = sheetRow.available.toLowerCase() !== 'false' 
                          && sheetRow.available.toLowerCase() !== 'hayır'
                          && sheetRow.available !== '0';
    }

    return updatedCar;
  });
}

/**
 * Tüm süreci yürütür: fetch → parse → merge
 * Hata olursa sessizce orijinal veriyi döndürür
 */
export async function loadDynamicCarData(carsData) {
  try {
    const sheetRows = await fetchSheetData();
    if (sheetRows) {
      const merged = mergeSheetData(carsData, sheetRows);
      // Müsait olmayanları filtrele (eğer available alanı varsa)
      const filtered = merged.filter(car => car.available !== false);
      console.info('[Google Sheets] ✅ Fiyatlar dinamik olarak güncellendi.');
      return filtered;
    }
  } catch (e) {
    console.warn('[Google Sheets] Birleştirme hatası, yerel veriler kullanılıyor:', e.message);
  }
  return carsData;
}

export { GOOGLE_SHEET_ID };
