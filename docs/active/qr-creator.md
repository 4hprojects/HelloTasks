# QR Creator

The Phase 1 QR Creator is a public, browser-only feature at `/qr`, with guidance at `/qr/help`.

## Architecture

- `routes/qrRoutes.js` and `controllers/qrController.js` render the two public pages.
- `views/qr/` contains the creator and help views.
- `public/qr/js/qr-payload-builder.js` is a UMD module used by both the browser and Node tests. It validates and builds all supported payload formats.
- `public/qr/js/qr-creator.js` owns client state, live rendering, logo validation, reliability checks, and downloads.
- `public/qr/vendor/qr-code-styling.js` is the locally served browser build of the pinned npm dependency. Production does not rely on a CDN.

No QR content or logo is submitted, persisted, logged, or placed in browser storage. The only server requests are the normal page and static asset requests.

## Supported types

Website, text, email, phone, SMS, Wi-Fi, vCard contact, geographic location, and calendar event.

## Development

Install dependencies and run tests:

```sh
npm install
npm test
```

Run the existing app normally and visit `http://localhost:3000/qr`. The application still requires its existing environment variables and MongoDB connection at startup; the QR module itself performs no database operations.

When upgrading `qr-code-styling`, copy its browser distribution from `node_modules/qr-code-styling/lib/qr-code-styling.js` to `public/qr/vendor/qr-code-styling.js`, then manually verify PNG and SVG downloads.

## Manual release checks

- Scan every payload type using Android and iOS devices.
- Test default and custom colors, with and without a logo.
- Scan both PNG and SVG exports at intended print size.
- Check layout widths of 320, 375, 425, 768, 1024, and 1440 pixels.
