/**
 * npm 11'in kilide yazmayı atladığı opsiyonel wasm bağımlılıklarını
 * (@emnapi/*) registry metadata'sıyla kilide geri ekler.
 * Her bağımlılık değişikliğinden (npm install) sonra çalıştırın:
 *   npm run fix:lock
 * CI'daki npm ci bu girdiler olmadan başarısız olur.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const REQUIRED = [
  ['@emnapi/core', '1.11.2'],
  ['@emnapi/runtime', '1.11.2'],
];

const lockPath = new URL('../package-lock.json', import.meta.url);
const lock = JSON.parse(readFileSync(lockPath, 'utf8'));

let added = 0;
for (const [name, version] of REQUIRED) {
  const key = 'node_modules/' + name;
  if (lock.packages[key]) continue;

  const res = await fetch(`https://registry.npmjs.org/${name}/${version}`);
  if (!res.ok) {
    console.error(`registry hatası: ${name}@${version} -> ${res.status}`);
    process.exit(1);
  }
  const meta = await res.json();
  const entry = {
    version,
    resolved: meta.dist.tarball,
    integrity: meta.dist.integrity,
    optional: true,
  };
  if (meta.dependencies && Object.keys(meta.dependencies).length) {
    entry.dependencies = meta.dependencies;
  }
  lock.packages[key] = entry;
  added++;
  console.log(`eklendi: ${name}@${version}`);
}

if (added) {
  writeFileSync(lockPath, JSON.stringify(lock, null, 2) + '\n');
  console.log('package-lock.json güncellendi');
} else {
  console.log('kilit zaten tam ✓');
}
