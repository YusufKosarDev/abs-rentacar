import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
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
      },
    },
  },
});
