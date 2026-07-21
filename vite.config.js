import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { SITE_URL, SITE_URL_TOKEN } from './site.config.js';

/**
 * `__SITE_URL__` yer tutucusunu site.config.js'teki kanonik adresle değiştirir.
 *
 * HTML giriş noktaları transformIndexHtml ile (hem dev hem build) işlenir.
 * public/ altındaki robots.txt ve sitemap.xml Vite tarafından olduğu gibi
 * kopyalandığı için build sonunda ayrıca yazılır; dev sunucusunda ise
 * middleware üzerinden anında değiştirilir.
 */
function siteUrl() {
  const replace = (text) => text.replaceAll(SITE_URL_TOKEN, SITE_URL);
  const publicTextFiles = ['robots.txt', 'sitemap.xml'];

  return {
    name: 'abs-site-url',
    transformIndexHtml: {
      order: 'pre',
      handler: replace,
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const name = publicTextFiles.find((f) => req.url === `/${f}`);
        if (!name) return next();
        const file = resolve(__dirname, 'public', name);
        if (!existsSync(file)) return next();
        res.setHeader('Content-Type', name.endsWith('.xml') ? 'application/xml' : 'text/plain');
        res.end(replace(readFileSync(file, 'utf8')));
      });
    },
    closeBundle() {
      for (const name of publicTextFiles) {
        const file = resolve(__dirname, 'dist', name);
        if (!existsSync(file)) continue;
        writeFileSync(file, replace(readFileSync(file, 'utf8')));
      }
    },
  };
}

export default defineConfig({
  plugins: [siteUrl()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        cars: resolve(__dirname, 'cars.html'),
        details: resolve(__dirname, 'car-details.html'),
        contact: resolve(__dirname, 'contact.html'),
        transfer: resolve(__dirname, 'transfer.html'),
        about: resolve(__dirname, 'about.html'),
        blog: resolve(__dirname, 'blog.html'),
        legal: resolve(__dirname, 'legal.html'),
        notfound: resolve(__dirname, '404.html'),
        locGazipasa: resolve(__dirname, 'gazipasa-havalimani-arac-kiralama.html'),
        locAntalya: resolve(__dirname, 'antalya-havalimani-arac-kiralama.html'),
        locKonakli: resolve(__dirname, 'konakli-arac-kiralama.html'),
      },
    },
  },
});
