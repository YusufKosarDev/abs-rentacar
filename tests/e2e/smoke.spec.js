import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/** Çerez bandını kapat (diğer etkileşimleri engellemesin) */
async function dismissCookies(page) {
  const accept = page.locator('#cookie-accept');
  if (await accept.isVisible({ timeout: 3000 }).catch(() => false)) {
    await accept.click();
  }
}

test.describe('Ana sayfa', () => {
  test('filo slider araç kartlarını render eder', async ({ page }) => {
    await page.goto('/');
    await dismissCookies(page);
    const cards = page.locator('#home-fleet-grid .car-card');
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThanOrEqual(14);
  });

  test('kategori sekmesi filtreler (Cabrio → 2 araç)', async ({ page }) => {
    await page.goto('/');
    await dismissCookies(page);
    await page.locator('[data-tab="cabrio"]').click();
    await expect(page.locator('#home-fleet-grid .car-card')).toHaveCount(2);
  });

  test('WhatsApp float butonu doğru numaraya gider', async ({ page }) => {
    await page.goto('/');
    const float = page.locator('.whatsapp-float');
    await expect(float).toHaveAttribute('href', /wa\.me\/905323318418/);
  });
});

test.describe('Araçlar sayfası', () => {
  test('filtreler birlikte çalışır (Ticari + Manuel)', async ({ page }) => {
    await page.goto('/cars.html');
    await dismissCookies(page);
    await expect(page.locator('#all-cars-grid .car-card').first()).toBeVisible();
    await page.locator('#filter-type').selectOption('ticari');
    await page.locator('#filter-transmission').selectOption('Manuel');
    await expect(page.locator('#all-cars-grid .car-card')).toHaveCount(3);
  });

  test('isim araması sonucu daraltır', async ({ page }) => {
    await page.goto('/cars.html');
    await dismissCookies(page);
    await page.locator('#search-car-name').fill('duster');
    await expect(page.locator('#all-cars-grid .car-card')).toHaveCount(1);
    await expect(page.locator('#all-cars-grid')).toContainText('Dacia Duster');
  });
});

test.describe('Araç detay sayfası', () => {
  test('fiyat hesaplayıcı kademeli toplam üretir', async ({ page }) => {
    await page.goto('/car-details.html?id=dacia-duster');
    await dismissCookies(page);
    await expect(page.locator('#details-booking-form')).toBeVisible();

    // 10 günlük kiralama: 8-14 kademesi (€42) × 10 = €420
    await page.locator('#dt-pickup-date').fill('2027-08-01');
    await page.locator('#dt-return-date').fill('2027-08-11');
    await expect(page.locator('.price-calc-amount')).toHaveText('€420');
  });

  test('geçersiz araç kimliğinde dostane mesaj gösterir', async ({ page }) => {
    await page.goto('/car-details.html?id=olmayan-arac');
    await expect(page.locator('#car-details-container')).toContainText(/bulunamadı|not found/i);
  });
});

test.describe('Statik araç sayfaları (SEO)', () => {
  test('arac/dacia-duster.html tam içerikle sunulur', async ({ page }) => {
    await page.goto('/arac/dacia-duster.html');
    await expect(page.locator('h1')).toContainText('Dacia Duster');
    await expect(page.locator('.price-table').first()).toContainText('Şanzıman');
    await expect(page.locator('.btn-whatsapp')).toHaveAttribute('href', /905323318418/);
    // Product JSON-LD mevcut ve geçerli
    const ld = await page.locator('script[type="application/ld+json"]').textContent();
    const parsed = JSON.parse(ld);
    expect(parsed['@type']).toBe('Product');
    expect(parsed.offers.price).toBe(42);
  });

  test('araç kartı statik sayfaya bağlanır', async ({ page }) => {
    await page.goto('/cars.html');
    const firstLink = page.locator('#all-cars-grid .car-btn-circle').first();
    await expect(firstLink).toHaveAttribute('href', /arac\/.+\.html/);
  });
});

test.describe('İngilizce statik route (/en/)', () => {
  test('ana sayfa İngilizce içerikle sunulur', async ({ page }) => {
    await page.goto('/en/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('h1')).toContainText('Safe and Comfortable Ride in Alanya');
    await expect(page.locator('[data-tab="cabrio"]')).toContainText('Convertible');
  });

  test('EN araç sayfası İngilizce üretilir ve TR eşine hreflang verir', async ({ page }) => {
    await page.goto('/en/arac/dacia-duster.html');
    await expect(page.locator('h1')).toContainText('Dacia Duster Rental');
    await expect(page.locator('link[hreflang="tr"]')).toHaveAttribute('href', /\/arac\/dacia-duster\.html/);
  });

  test('Almanca ve Rusça rotalar kendi dillerinde sunulur', async ({ page }) => {
    await page.goto('/de/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
    await expect(page.locator('h1')).toContainText('Sicher und komfortabel');

    await page.goto('/ru/cars.html');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
    await expect(page.locator('.page-banner h2')).toContainText('Аренда авто');
  });

  test('dil seçici EN rotasından TR köküne döndürür', async ({ page }) => {
    await page.goto('/en/cars.html');
    await page.locator('#lang-select').selectOption('tr');
    await page.waitForURL((url) => url.pathname === '/cars.html');
    expect(new URL(page.url()).pathname).toBe('/cars.html');
  });
});

test.describe('Erişilebilirlik (axe — critical)', () => {
  for (const path of ['/', '/cars.html', '/contact.html']) {
    test(`${path} kritik ihlal içermez`, async ({ page }) => {
      await page.goto(path);
      await dismissCookies(page);
      const results = await new AxeBuilder({ page }).analyze();
      const critical = results.violations.filter((v) => v.impact === 'critical');
      expect(
        critical.map((v) => `${v.id}: ${v.nodes.length} öğe`),
        JSON.stringify(critical, null, 2).slice(0, 2000)
      ).toEqual([]);
    });
  }
});
