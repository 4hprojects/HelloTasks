# QR Creator

The Phase 1 QR Creator is a public, browser-only feature at `/qr`, with guidance at `/qr/help`.

## Architecture

- `routes/qrRoutes.js` and `controllers/qrController.js` render the two public pages.
- `views/qr/` contains the creator and help views.
- `public/qr/js/qr-payload-builder.js` is a UMD module used by both the browser and Node tests. It validates and builds all supported payload formats.
- `public/qr/js/qr-creator.js` owns client state, live rendering, logo validation, reliability checks, and downloads.
- `public/qr/vendor/qr-code-styling.js` is the locally served browser build of the pinned npm dependency. Production does not rely on a CDN.
- `public/qr/manifest.webmanifest`, `public/qr-sw.js`, and `public/qr/js/qr-pwa.js` make the QR Creator installable and keep the public creator/help shell available offline.

No QR content or logo is submitted, persisted, logged, or placed in browser storage. The only server requests are the normal page and static asset requests.

## Supported types

Website, text, email, phone, SMS, Wi-Fi, vCard contact, geographic location, and calendar event.

## Development

Install dependencies and run tests:

```sh
npm install
npm test
npm run test:browser
```

Run the existing app normally and visit `http://localhost:3000/qr`. The application still requires its existing environment variables and MongoDB connection at startup; the QR module itself performs no database operations.

When upgrading `qr-code-styling`, copy its browser distribution from `node_modules/qr-code-styling/lib/qr-code-styling.js` to `public/qr/vendor/qr-code-styling.js`, then manually verify PNG and SVG downloads.

## Manual release checks

- Scan every payload type using Android and iOS devices.
- Test default and custom colors, with and without a logo.
- Scan both PNG and SVG exports at intended print size.
- Check layout widths of 320, 375, 425, 768, 1024, and 1440 pixels.

## Acceptance status

Automated verification completed on 2026-07-14:

- Criteria 1–23 and 25–41: passed through Node route/unit tests, Chromium workflow tests, static checks, or direct architecture inspection.
- Criterion 24, downloaded QR codes scan successfully: PNG and SVG exports are automatically decoded back to their original payload with `jsQR`; physical-device and printed scanning remain manual release checks.
- Responsive layouts pass without horizontal overflow at 320, 375, 425, 768, 1024, and 1440 pixels.
- The QR module has no form submission, upload endpoint, database write, browser storage, analytics call, or payload logging path.

The feature must not be described as fully device-verified until the following are completed and recorded:

- Scan representative URL, Wi-Fi, vCard, and calendar exports with Android and iPhone cameras.
- Scan PNG and SVG files at the intended print size.
- Repeat the scan check with custom colors and with a center logo.

## PWA behavior

- The installed app opens at `/qr` in standalone display mode and uses dedicated 192px and 512px icons plus an Apple touch icon.
- The service worker precaches only the public QR shell and static assets. It never caches authenticated application pages, generated payloads, form values, or uploaded logos.
- Offline mode supports creating, previewing, and downloading static QR codes because generation remains browser-only.
- Increment `CACHE_NAME` in `public/qr-sw.js` whenever cached production assets change so existing installations receive the new shell during activation.
