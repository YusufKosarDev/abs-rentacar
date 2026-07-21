# ABS Rent A Car & Transfer

[![CI](https://github.com/YusufKosarDev/abs-rentacar/actions/workflows/ci.yml/badge.svg)](https://github.com/YusufKosarDev/abs-rentacar/actions/workflows/ci.yml)

Production website for a car rental and airport transfer company operating in Alanya,
Konaklı and the Gazipaşa / Antalya airport corridor on the Turkish Mediterranean coast.

**Live:** <https://abs-rentacar.com> · **Türkçe:** [README.tr.md](README.tr.md)

![ABS Rent A Car homepage](docs/screenshot.jpg)

---

## Overview

A freelance project delivered end to end: design, implementation, multilingual content,
SEO, deployment and custom domain setup.

The business has no booking back office and no payment processor. Every reservation is
confirmed by a human over WhatsApp. That single fact drove the entire architecture: there
is no server, no database and no session state — the site is a statically generated,
multi-page application whose job is to present the fleet accurately, compute honest price
estimates in the browser, and hand a pre-filled message to WhatsApp.

Choosing static over a framework-backed stack was deliberate rather than incidental. The
content changes a handful of times per season, the traffic is seasonal and mobile-heavy on
variable mobile networks, and the operator is non-technical. A static build served from a
CDN edge is the cheapest thing to run, the fastest thing to load and the least likely thing
to break unattended.

---

## Engineering highlights

### Single-source site URL

The canonical origin appeared **58 times across 17 files** — canonical tags, `og:url`,
`hreflang` pairs, JSON-LD, `sitemap.xml`, `robots.txt` and three build scripts. Migrating
to a custom domain would have meant 58 correct edits with no safety net, and any miss
silently breaks SEO rather than the build.

It now lives in one place:

```js
// site.config.js
export const SITE_URL = 'https://abs-rentacar.com';
```

Markup and public text files carry a `__SITE_URL__` placeholder. A small Vite plugin
resolves it through `transformIndexHtml` during build *and* dev, rewrites the copies of
`robots.txt` / `sitemap.xml` that Vite passes through verbatim, and serves the substituted
version through dev-server middleware so local output matches production. The generator
and link-check scripts import the same constant.

The actual domain migration was a two-line diff.

### A build that fails loudly instead of shipping quietly

A placeholder that never gets substituted produces a page that renders perfectly and is
wrong only in its metadata — exactly the class of defect that no test catches and no one
notices for months.

The last step of the build walks `dist/` and exits non-zero if any unresolved
`__SITE_URL__` survives, naming the offending files. Verified with a deliberate negative
test, not assumed.

### Multilingual architecture

Eleven languages are offered. Four (**TR, EN, DE, RU**) are hand-translated through a
dictionary in `src/i18n/translations.js`; the remaining seven are handled by Google
Translate for long-tail visitors.

The four curated languages are not a client-side toggle. After the Vite build, a generator
walks the compiled Turkish pages and emits real static routes under `/en/`, `/de/` and
`/ru/` — translated copy, translated `<title>` and meta description, correct `<html lang>`
and `og:locale`, language-scoped internal links, and a `hreflang` cluster wiring all four
variants plus `x-default`.

This matters because crawlers index URLs, not localStorage. A JavaScript language switcher
produces one indexable page; static routes produce four, each ranking in its own market.

Per-page `canonical` and `og:url` are both localised — they must agree, or a shared
`/de/` link previews as the Turkish homepage.

### Static SEO pages per vehicle

Fourteen vehicles each get a pre-rendered page in Turkish and English (`/arac/<id>.html`,
`/en/arac/<id>.html`) with a spec table, the full tiered price list and `Product` JSON-LD.
These are generated at build time from `cars.json` by reusing the compiled page shell, so
the header, footer and hashed asset references never drift from the rest of the site.

The sitemap grows to **57 URLs** without anyone maintaining it by hand.

### Link and asset health scanning

`scripts/check-links.mjs` crawls the live site — every page, every internal link, every
vehicle image, every generated route — and exits non-zero on the first broken resource. It
runs weekly in CI.

An earlier version only matched one hostname pattern, which let a hot-linked third-party
image sit undetected on the transfer page. The scan now covers every off-origin absolute
URL, including the Wikimedia attribution links in the legal page: a dead attribution link
is a licence-compliance problem, not just a broken anchor.

Every vehicle photograph is self-hosted and attributed on `/legal.html`.

### Testing

| Layer | Tool | Coverage |
|---|---|---|
| Unit — 28 tests | Vitest | Tiered pricing maths, fleet filter combinations, CSV parsing |
| E2E — 16 tests | Playwright | Fleet rendering, filters, price calculator, static routes, `/en/` `/de/` `/ru/` output, language switching, WhatsApp deep links |
| Accessibility | axe-core | Zero critical violations on home, fleet and contact |

Pricing is the part worth testing hardest: a wrong daily rate is a customer dispute, not a
rendering glitch.

### Delivery and security

Deployed on Vercel from `main`. `vercel.json` sets a strict Content Security Policy plus
HSTS with preload, `X-Frame-Options: DENY`, `nosniff`, a restrictive `Permissions-Policy`
and a one-year immutable cache for images. Fonts are self-hosted through `@fontsource`
rather than fetched from a third-party CDN.

Contact and newsletter forms carry three layers of spam protection — a honeypot field, a
minimum time-to-submit check and a JavaScript challenge — before composing the WhatsApp
message.

---

## Tech stack

| Layer | Choice |
|---|---|
| Build | Vite 8.1.5 — multi-page, 12 HTML entry points |
| Frontend | Vanilla JavaScript, no framework |
| Carousel | Swiper 14.0.5 |
| Maps | Leaflet 1.9 (SRI-pinned) |
| Fonts | Epilogue + DM Sans, self-hosted via `@fontsource` |
| Testing | Vitest 4.1.10, Playwright 1.61.1, axe-core |
| Quality | ESLint 10.7.0, Prettier, Lighthouse CI |
| Hosting | Vercel — push to `main` deploys |
| Data | `src/data/cars.json`, optional Google Sheets CSV overlay |

No framework was used because nothing here needs one: there is no client-side routing, no
shared mutable state and no server rendering to reconcile. Adding React would have added a
runtime and a build surface to a site whose interactivity is a filter list, a date-range
calculator and a carousel.

---

## Project structure

```
├── index.html                    # Home
├── cars.html                     # Fleet + filters
├── car-details.html              # Vehicle detail (?id=)
├── transfer.html                 # Airport transfer services
├── about.html · contact.html     # Company, contact form + map
├── blog.html · legal.html        # Guides; KVKK, privacy, photo credits
├── 404.html
├── *-arac-kiralama.html          # SEO landing pages (Antalya, Gazipaşa, Konaklı)
│
├── site.config.js                # SITE_URL — single source of truth
├── vite.config.js                # Multi-page build + SITE_URL plugin
├── vercel.json                   # Security headers, cache policy
│
├── src/
│   ├── main.js                   # Site logic: i18n, rendering, booking flow
│   ├── sheets.js                 # Optional Google Sheets price overlay
│   ├── i18n/translations.js      # TR / EN / DE / RU dictionaries
│   ├── lib/                      # pricing.js, filters.js — unit-tested
│   ├── data/cars.json            # Fleet data, schema-validated at build
│   └── css/                      # style.css (design system) + animations.css
│
├── scripts/
│   ├── validate-cars.mjs         # Schema validation — runs first
│   ├── generate-en-pages.mjs     # Static /en/, /de/, /ru/ routes
│   ├── generate-car-pages.mjs    # Per-vehicle SEO pages + build guard
│   └── check-links.mjs           # Live link and asset health scan
│
├── tests/                        # Vitest unit + Playwright E2E
└── .githooks/                    # Versioned git hooks
```

`/en/`, `/de/`, `/ru/` and `/arac/` are not committed — they are build artefacts.

---

## Getting started

```bash
npm install          # also points core.hooksPath at .githooks
npm run dev          # dev server on localhost:5173
npm run build        # production build into dist/
npm run preview      # serve the build locally
```

Build chain: `validate-cars` → `vite build` → `generate-en-pages` → `generate-car-pages`.
Data validation runs first so a malformed `cars.json` fails before anything is generated.

### Quality checks

```bash
npm test             # 28 unit tests
npm run test:e2e     # 16 E2E + accessibility tests
npm run lint
npm run format
node scripts/check-links.mjs   # scan the live site
```

---

## Deployment

Pushes to `main` deploy automatically to Vercel. CI runs lint, unit tests, a full build,
Playwright E2E and a Lighthouse audit on every push and pull request.

To move the site to a different domain, change one line in `site.config.js` and push. Every
canonical tag, `og:url`, `hreflang`, JSON-LD URL, sitemap entry and `robots.txt` directive
follows, and the build guard fails if anything is left behind.

---

## Trade-offs

Decisions that were made knowingly and would change with different requirements:

- **No backend.** Reservations go through WhatsApp because that is how the business
  actually operates. If online payment were ever required, this becomes the wrong shape.
- **Prices in a JSON file.** Editing them means a commit. `src/sheets.js` can overlay
  prices and availability from a published Google Sheet so a non-technical operator can
  self-serve; it is implemented and documented but left inactive by default.
- **Google Translate for seven of eleven languages.** Curated translations for the four
  markets that matter commercially; machine translation for the tail. Honest coverage
  beats eleven mediocre dictionaries.
- **Vanilla JavaScript in one main module.** Fine at this size. Past roughly twice the
  current surface it would want splitting into modules with real boundaries.

---

Built and maintained by [YusufKosarDev](https://github.com/YusufKosarDev).
