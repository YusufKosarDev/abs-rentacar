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
