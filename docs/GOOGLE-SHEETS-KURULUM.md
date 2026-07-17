# Google Sheets ile Fiyat/Müsaitlik Yönetimi — Kurulum

Site, araç fiyatlarını ve müsaitlik durumunu bir Google E-Tablosundan otomatik çekebilir.
Kurulum bir kez yapılır; sonrasında fiyat güncellemek için kod bilmeye gerek yoktur.

## Kurulum (yaklaşık 2 dakika)

1. [sheets.google.com](https://sheets.google.com) adresinde **boş bir e-tablo** oluşturun.
2. **Dosya → İçe aktar → Yükle** ile bu klasördeki `fiyat-sablonu.csv` dosyasını seçin
   ("Mevcut sayfayı değiştir" seçeneğiyle).
3. Sağ üstten **Paylaş → Genel erişim → Bağlantıya sahip olan herkes → Görüntüleyen** yapın.
4. Tarayıcıdaki adres çubuğundan **Sheet ID**'yi kopyalayın:
   `https://docs.google.com/spreadsheets/d/BURASI_SHEET_ID/edit`
5. ID'yi `src/sheets.js` içindeki `GOOGLE_SHEET_ID` alanına yapıştırın.

## Sütunların anlamı

| Sütun | Açıklama |
|---|---|
| `id` | Araç kimliği — `src/data/cars.json` ile eşleşmeli, değiştirmeyin |
| `pricePerDay` | Kartlarda görünen "başlangıç" günlük fiyatı (€) |
| `1_3` … `30_plus` | Gün aralığına göre kademeli günlük fiyatlar (€) |
| `available` | `TRUE` = sitede görünür, `FALSE` = araç gizlenir |

## Kullanım

- Hücreyi değiştirin, kaydetmeye gerek yok — Sheets otomatik kaydeder.
- Site her sayfa yüklemesinde güncel veriyi çeker (birkaç dakikalık Google önbelleği olabilir).
- Tablo silinir veya erişilemez olursa site otomatik olarak `cars.json`'daki yerel fiyatlara döner; site asla bozulmaz.
