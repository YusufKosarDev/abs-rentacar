import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Çerez bandını kapat (diğer etkileşimleri engellemesin).
 *
 * Bandın DOM'dan tamamen ayrılmasını bekliyoruz: kapanış animasyonu sürerken
 * ölçüm yapılırsa renkler yarı saydam hâlde okunuyor ve erişilebilirlik
 * denetimi gerçekte var olmayan kontrast ihlalleri raporluyordu.
 */
async function dismissCookies(page) {
  const banner = page.locator('#cookie-banner');
  const accept = page.locator('#cookie-accept');
  if (await accept.isVisible({ timeout: 3000 }).catch(() => false)) {
    await accept.click();
    await banner.waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});
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

/*
 * Eşik bilinçli olarak "serious" seviyesini de kapsıyor.
 * Yalnızca "critical" denetlendiğinde kontrast, başlık sırası ve erişilebilir
 * ad eksikleri testten kaçıyordu; bunlar Lighthouse denetiminde düşüyor ama
 * E2E yeşil kalıyordu. Kör noktayı kapatmak için kapsam genişletildi.
 */
const BLOCKING_IMPACTS = ['critical', 'serious'];

test.describe('Erişilebilirlik (axe — critical + serious)', () => {
  for (const path of ['/', '/cars.html', '/contact.html']) {
    test(`${path} kritik/ciddi ihlal içermez`, async ({ page }) => {
      await page.goto(path);
      await dismissCookies(page);
      const results = await new AxeBuilder({ page }).analyze();
      const blocking = results.violations.filter((v) => BLOCKING_IMPACTS.includes(v.impact));
      expect(
        blocking.map((v) => `${v.id} [${v.impact}]: ${v.nodes.length} öğe`),
        JSON.stringify(blocking, null, 2).slice(0, 3000)
      ).toEqual([]);
    });
  }
});

/*
 * Dar ekranda yatay taşma koruması.
 *
 * Başlıktaki rezervasyon butonu ve hero'daki sorgulama kartı bir dönem
 * viewport dışına taşıyordu. Taşan kısım .hero ve başlıktaki overflow:hidden
 * ile kırpıldığı için sayfa yatay olarak KAYMIYORDU; scrollWidth değeri
 * innerWidth'e eşit kalıyor ve hem E2E hem Lighthouse temiz görünüyordu.
 * Görsel ise bozuktu: buton ve form kartı yarıdan kesiliyordu.
 *
 * Bu yüzden scrollWidth karşılaştırması yeterli değil; kritik blokların
 * gerçek kutu sınırları (getBoundingClientRect) viewport'la karşılaştırılıyor.
 *
 * Kapsam bilinçli olarak isim listesiyle sınırlı. Tüm DOM'u tarayan genel bir
 * kontrol; kayan yazı şeridi, slider slaytları, honeypot alanı ve harita
 * karoları gibi KASITLI olarak taşan öğeler yüzünden sürekli yanlış alarm
 * verir. Buradaki seçiciler "her zaman ekrana sığmalı" diye tanımlanmış
 * bloklar.
 */
const OVERFLOW_WIDTHS = [320, 360, 390, 412, 768];

const OVERFLOW_PAGES = [
  {
    path: '/',
    selectors: ['.nav-container', '.nav-actions', '.hero-content', '.booking-widget', '.services-grid', '.footer-grid'],
  },
  {
    path: '/cars.html',
    selectors: ['.nav-container', '.nav-actions', '.page-banner .container', '.filter-sidebar', '.cars-grid', '.footer-grid'],
  },
  {
    path: '/transfer.html',
    selectors: ['.nav-container', '.nav-actions', '.page-banner .container', '.transfer-grid', '.footer-grid'],
  },
  {
    path: '/contact.html',
    selectors: ['.nav-container', '.nav-actions', '.page-banner .container', '.contact-layout', '.footer-grid'],
  },
  {
    path: '/en/',
    selectors: ['.nav-container', '.nav-actions', '.hero-content', '.booking-widget', '.footer-grid'],
  },
  {
    path: '/arac/dacia-duster.html',
    selectors: ['.nav-container', '.nav-actions', '.details-layout', '.booking-panel', '.footer-grid'],
  },
];

/** Verilen genişlikte, seçicilerin viewport dışına taşıp taşmadığını döndürür. */
async function findOverflow(page, selectors) {
  return page.evaluate((sels) => {
    // Kaydırma çubuğunu dışarıda bırakır; innerWidth'ten daha güvenilir.
    const vw = document.documentElement.clientWidth;
    const problems = [];

    for (const sel of sels) {
      const nodes = document.querySelectorAll(sel);
      if (!nodes.length) {
        problems.push(`${sel}: sayfada bulunamadı (seçici eskimiş olabilir)`);
        continue;
      }
      nodes.forEach((el, i) => {
        const cs = getComputedStyle(el);
        // Gizlenmiş olması sorun değil: dar ekranda gizlemek geçerli bir çözüm.
        if (cs.display === 'none' || cs.visibility === 'hidden') return;
        const b = el.getBoundingClientRect();
        if (b.width < 2 || b.height < 2) return;
        const right = Math.round(b.right - vw);
        const left = Math.round(b.left);
        if (right > 1) problems.push(`${sel}[${i}] sağdan ${right}px taşıyor`);
        if (left < -1) problems.push(`${sel}[${i}] soldan ${-left}px taşıyor`);
      });
    }
    return problems;
  }, selectors);
}

test.describe('Dar ekranda yatay taşma', () => {
  for (const { path, selectors } of OVERFLOW_PAGES) {
    test(`${path} kritik blokları ekrana sığdırır`, async ({ page }) => {
      const failures = [];

      // Giriş animasyonlarını son karelerine sabitle: yerleşimi ölçüyoruz,
      // geçiş karesini değil. .animate-fade-in-* öğeleri translateX(-30px)'ten
      // başlar; animasyon sürerken ölçüm birkaç piksellik sahte "taşma"
      // raporlar. Stil goto SONRASI enjekte edilmeli (init script DOM hazır
      // olmadan çalışıp sessizce düşüyor).
      const freezeAnimations = `*, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
      }`;

      for (const width of OVERFLOW_WIDTHS) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(path);
        await page.addStyleTag({ content: freezeAnimations });
        await dismissCookies(page);
        // Yerleşimin oturması için bir kare bekle
        await page.waitForTimeout(300);

        for (const problem of await findOverflow(page, selectors)) {
          failures.push(`${width}px → ${problem}`);
        }

        // Tamamlayıcı kontrol: sayfa yatay olarak kaydırılabilir olmamalı
        const scrolledX = await page.evaluate(() => {
          window.scrollTo(99999, 0);
          const x = Math.round(window.scrollX);
          window.scrollTo(0, 0);
          return x;
        });
        if (scrolledX > 0) failures.push(`${width}px → sayfa yatay olarak ${scrolledX}px kayıyor`);
      }

      expect(failures, failures.join('\n')).toEqual([]);
    });
  }
});
